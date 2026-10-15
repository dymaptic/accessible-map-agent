#!/bin/bash
# Database Migration Script for Azure PostgreSQL Flexible Server
# AUTO-GENERATED - Do not edit directly. Run: node scripts/generate-migration-script.js
#
# This script is designed to run from a jump box VM in the same VNet as the database.
# It installs Node.js, creates the Prisma schema, and runs migrations.
#
# Usage:
#   1. SSH into your jump box VM
#   2. Copy this entire script and paste it into a file: nano run-migrations.sh
#   3. Make executable: chmod +x run-migrations.sh
#   4. Run: ./run-migrations.sh "postgresql://user:pass@host:5432/dbname?sslmode=require"
#
# Options:
#   --accept-data-loss    Allow destructive schema changes (drops columns/tables)

set -e

# Check for DATABASE_URL argument
if [ -z "$1" ]; then
    echo "Usage: $0 <DATABASE_URL> [--accept-data-loss]"
    echo ""
    echo "Example:"
    echo "  $0 \"postgresql://user:password@server.postgres.database.azure.com:5432/dbname?sslmode=require\""
    echo ""
    echo "Options:"
    echo "  --accept-data-loss    Allow destructive schema changes"
    exit 1
fi

DATABASE_URL="$1"
ACCEPT_DATA_LOSS=""

# Check for --accept-data-loss flag
if [ "$2" = "--accept-data-loss" ]; then
    ACCEPT_DATA_LOSS="--accept-data-loss"
    echo "WARNING: --accept-data-loss is enabled. Destructive changes will be applied."
fi

echo "=== Accessible Map Agent - Database Migration ==="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "Node.js installed: $(node --version)"
else
    echo "Node.js found: $(node --version)"
fi

# Create temp directory
WORK_DIR=$(mktemp -d)
echo "Working directory: $WORK_DIR"
cd "$WORK_DIR"

# Create prisma directory and schema
mkdir -p prisma

echo "Creating Prisma schema..."
cat > prisma/schema.prisma << 'SCHEMA_EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =============================================================================
// ENUMS
// =============================================================================

enum PlanTier {
  FREE         // 3 lifetime maps, 7-day history
  STARTER      // 25/period, 90-day history, $49/mo or $499/yr
  PROFESSIONAL // 150/period, 365-day history, $199/mo or $1,999/yr
  ENTERPRISE   // Configurable/unlimited, unlimited history, custom pricing
}

enum BillingFrequency {
  MONTHLY
  ANNUAL
}

enum SubscriptionStatus {
  ACTIVE       // Normal operation, can generate
  GRACE_PERIOD // Subscription expired, can view but not generate
  EXPIRED      // Grace period ended, reverted to FREE
}

enum RequestStatus {
  PENDING   // Submitted, awaiting invoice
  INVOICED  // Invoice sent, awaiting payment
  PAID      // Payment received, awaiting activation
  ACTIVATED // Subscription activated
  CANCELLED // Request cancelled
}

enum PaymentMethod {
  ACH
  CHECK
  PAYMENT_LINK
}

enum SubscriptionRequestType {
  NEW           // New subscription from FREE tier
  UPGRADE       // Upgrade to higher tier
  DOWNGRADE     // Downgrade to lower tier
  CANCELLATION  // Cancel subscription entirely
}

// =============================================================================
// CORE MODELS
// =============================================================================

model Organization {
  id                      String   @id @default(cuid())
  arcgisOrgId             String   @unique
  name                    String
  sharingOptIn            Boolean  @default(false)
  totalGenerationsAllTime Int      @default(0) // Cumulative count, never decremented
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  // === Subscription Fields ===
  tier                  PlanTier           @default(FREE)
  billingFrequency      BillingFrequency?  // null for FREE tier
  status                SubscriptionStatus @default(ACTIVE)

  // Quota tracking
  monthlyQuota          Int?               // null = unlimited (Enterprise), otherwise tier-based
  mapsUsedThisPeriod    Int                @default(0)

  // Billing period (anniversary-based)
  subscriptionStartDate DateTime?          // Anniversary anchor date
  periodStartDate       DateTime?          // Current period start
  periodEndDate         DateTime?          // Current period end (when quota resets)
  subscriptionEndDate   DateTime?          // When subscription expires (for annual/prepaid)

  // History retention
  historyRetentionDays  Int?               // null = unlimited, otherwise tier-based

  // === Billing Contact ===
  billingContactName    String?
  billingContactEmail   String?
  billingAddress        String?  @db.Text
  billingPoNumber       String?

  // === Admin Notes ===
  adminNotes            String?  @db.Text

  // === Scheduled Downgrade ===
  // When set, the org will be downgraded to this tier on the scheduled date
  scheduledDowngradeTier  PlanTier?
  scheduledDowngradeDate  DateTime?

  // === Email Notification Tracking ===
  // These flags prevent duplicate emails and reset with each billing period
  usageWarning80Sent      Boolean @default(false)
  quotaExhaustedNotified  Boolean @default(false)
  fullyAtLimitNotified    Boolean @default(false)

  // === Access Control (Enterprise) ===
  // When enabled, only users in specified ArcGIS groups can access the app
  accessRestrictionEnabled  Boolean @default(false)
  accessGroups              Json?   // Array of {id: string, name: string}

  // Relations
  users                 User[]
  generations           Generation[]
  bonusCredits          BonusCredit[]
  subscriptionRequests  SubscriptionRequest[]
  subscriptionHistory   SubscriptionHistory[]

  @@index([tier])
  @@index([status])
}

// Singleton table for app-wide statistics
model AppStats {
  id                      String @id @default("singleton")
  totalGenerationsAllTime Int    @default(0) // Cumulative count across all orgs, never decremented
}

model User {
  id             String   @id @default(cuid())
  arcgisUsername String   @unique
  email          String?
  displayName    String?
  thumbnailUrl   String?
  isOrgAdmin     Boolean  @default(false)

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  generations    Generation[]
  sessions       Session[]
  subscriptionRequests SubscriptionRequest[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  lastLoginAt DateTime @default(now())

  @@index([organizationId])
}

model Generation {
  id          String    @id @default(cuid())
  mapTitle    String
  mapId       String?
  description String    @db.Text

  // Credit tracking - stores "free_tier", "monthly_quota", or a BonusCredit.id
  // This is a soft reference (not a foreign key) for flexibility
  creditSource String   @default("monthly_quota")

  userId         String
  user           User         @relation(fields: [userId], references: [id])
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  deletedAt DateTime? // Soft delete
  expiresAt DateTime? // Based on tier history retention, null = never
  createdAt DateTime  @default(now())

  @@index([organizationId, createdAt])
  @@index([userId, createdAt])
  @@index([deletedAt])
  @@index([expiresAt])
  @@index([creditSource])
}

// =============================================================================
// BONUS CREDITS (replaces GenerationAllotment)
// =============================================================================

model BonusCredit {
  id               String   @id @default(cuid())
  organizationId   String
  organization     Organization @relation(fields: [organizationId], references: [id])

  creditsGranted   Int
  creditsRemaining Int
  grantDate        DateTime @default(now())
  expirationDate   DateTime // grantDate + 6 months

  grantReason      String   // "subscription_request", "customer_service", "promotional", "admin_grant"
  grantedBy        String   // "system" or admin username
  notes            String?

  createdAt        DateTime @default(now())

  @@index([organizationId, expirationDate])
  @@index([organizationId, creditsRemaining])
}

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================

model SubscriptionRequest {
  id                   String        @id @default(cuid())
  organizationId       String
  organization         Organization  @relation(fields: [organizationId], references: [id])
  requestingUserId     String
  requestingUser       User          @relation(fields: [requestingUserId], references: [id])

  // Request details
  requestType          SubscriptionRequestType @default(NEW)
  requestedTier        PlanTier
  billingFrequency     BillingFrequency?
  preferredPaymentMethod PaymentMethod @default(ACH)

  // Billing contact (snapshot at time of request)
  billingContactName   String
  billingContactEmail  String
  billingAddress       String        @db.Text
  poNumber             String?
  specialRequirements  String?       @db.Text

  // Workflow status
  status               RequestStatus @default(PENDING)
  bonusCreditsGranted  Int           @default(5)  // Auto-granted on submission

  // Processing tracking
  invoicedAt           DateTime?
  paidAt               DateTime?
  activatedAt          DateTime?
  cancelledAt          DateTime?
  processedBy          String?       // Admin username
  processingNotes      String?       @db.Text

  createdAt            DateTime      @default(now())

  @@index([organizationId])
  @@index([status])
  @@index([createdAt])
}

model SubscriptionHistory {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  action         String       // "created", "activated", "upgraded", "downgraded", "renewed", "expired", "grace_period_started"
  fromTier       PlanTier?
  toTier         PlanTier?
  fromFrequency  BillingFrequency?
  toFrequency    BillingFrequency?
  performedBy    String       // "system" or admin username
  notes          String?      @db.Text

  createdAt      DateTime     @default(now())

  @@index([organizationId])
  @@index([createdAt])
}

// =============================================================================
// WEBHOOKS
// =============================================================================

model WebhookQueue {
  id          String    @id @default(cuid())
  eventType   String    // "new_user_registered", "new_org_created", "subscription_requested", etc.
  payload     String    @db.Text  // JSON
  attempts    Int       @default(0)
  maxAttempts Int       @default(5)
  lastAttempt DateTime?
  nextAttempt DateTime?
  status      String    @default("pending")  // pending, completed, failed
  error       String?   @db.Text

  createdAt   DateTime  @default(now())

  @@index([status, nextAttempt])
  @@index([createdAt])
}

// =============================================================================
// SESSIONS
// =============================================================================

model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  accessToken  String   @db.Text
  refreshToken String?  @db.Text
  tokenExpiry  DateTime
  createdAt    DateTime @default(now())
  expiresAt    DateTime

  // === Access Control ===
  // Set when an admin bypasses group restrictions (for displaying info banner)
  isAdminBypassing      Boolean  @default(false)
  configuredGroupNames  Json?    // Array of group names for banner display

  @@index([userId])
  @@index([expiresAt])
}
SCHEMA_EOF

echo "Schema created."

# Run prisma db push
echo ""
echo "Running database migration..."
echo "This will sync the schema with the database."
echo ""

# Use Prisma 5.x to match the project version (Prisma 7 has breaking changes)
DATABASE_URL="$DATABASE_URL" npx prisma@5 db push $ACCEPT_DATA_LOSS

echo ""
echo "=== Migration complete! ==="

# Cleanup
cd /
rm -rf "$WORK_DIR"
echo "Cleaned up temporary files."
