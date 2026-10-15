/**
 * Bonus credit management utilities
 *
 * Bonus credits are additional map generations granted outside the monthly quota.
 * They provide flexibility for customer goodwill, bridging payment delays, and
 * handling edge cases without changing tier structures.
 */

import { prisma } from "./prisma";
import { BONUS_CREDIT_CONFIG } from "./subscriptions";

// =============================================================================
// TYPES
// =============================================================================

export type BonusCreditReason =
  | "subscription_request"
  | "customer_service"
  | "promotional"
  | "admin_grant"
  | "migration";

export interface BonusCreditGrant {
  organizationId: string;
  amount: number;
  reason: BonusCreditReason;
  grantedBy: string; // "system" or admin username
  notes?: string;
  expirationDate?: Date; // Optional custom expiration
}

export interface BonusCreditSummary {
  totalAvailable: number;
  credits: {
    id: string;
    remaining: number;
    expiresAt: Date;
    reason: string;
  }[];
}

// =============================================================================
// GRANT CREDITS
// =============================================================================

/**
 * Grant bonus credits to an organization
 */
export async function grantBonusCredits(
  grant: BonusCreditGrant
): Promise<string> {
  const grantDate = new Date();
  const expirationDate =
    grant.expirationDate ?? calculateExpirationDate(grantDate);

  const credit = await prisma.bonusCredit.create({
    data: {
      organizationId: grant.organizationId,
      creditsGranted: grant.amount,
      creditsRemaining: grant.amount,
      grantDate,
      expirationDate,
      grantReason: grant.reason,
      grantedBy: grant.grantedBy,
      notes: grant.notes,
    },
  });

  return credit.id;
}

/**
 * Calculate expiration date (6 months from grant)
 */
function calculateExpirationDate(grantDate: Date): Date {
  const expiration = new Date(grantDate);
  expiration.setMonth(expiration.getMonth() + BONUS_CREDIT_CONFIG.EXPIRY_MONTHS);
  return expiration;
}

/**
 * Grant the standard bonus credits for subscription request
 */
export async function grantSubscriptionRequestBonus(
  organizationId: string
): Promise<string> {
  return grantBonusCredits({
    organizationId,
    amount: BONUS_CREDIT_CONFIG.SUBSCRIPTION_REQUEST_BONUS,
    reason: "subscription_request",
    grantedBy: "system",
    notes: "Auto-granted for subscription request submission",
  });
}

// =============================================================================
// CONSUME CREDITS
// =============================================================================

/**
 * Consume one bonus credit from an organization (FIFO by expiration)
 * Returns the credit ID if successful, null if no credits available
 */
export async function consumeBonusCredit(
  orgId: string
): Promise<string | null> {
  // Find oldest non-expired credit with remaining balance
  const credit = await prisma.bonusCredit.findFirst({
    where: {
      organizationId: orgId,
      expirationDate: { gt: new Date() },
      creditsRemaining: { gt: 0 },
    },
    orderBy: { expirationDate: "asc" },
  });

  if (!credit) {
    return null;
  }

  await prisma.bonusCredit.update({
    where: { id: credit.id },
    data: { creditsRemaining: credit.creditsRemaining - 1 },
  });

  return credit.id;
}

// =============================================================================
// QUERY CREDITS
// =============================================================================

/**
 * Get bonus credit summary for an organization
 */
export async function getBonusCreditSummary(
  orgId: string
): Promise<BonusCreditSummary> {
  const credits = await prisma.bonusCredit.findMany({
    where: {
      organizationId: orgId,
      expirationDate: { gt: new Date() },
      creditsRemaining: { gt: 0 },
    },
    orderBy: { expirationDate: "asc" },
  });

  const totalAvailable = credits.reduce((sum, c) => sum + c.creditsRemaining, 0);

  return {
    totalAvailable,
    credits: credits.map((c) => ({
      id: c.id,
      remaining: c.creditsRemaining,
      expiresAt: c.expirationDate,
      reason: c.grantReason,
    })),
  };
}

/**
 * Get total available bonus credits for an organization
 */
export async function getTotalBonusCredits(orgId: string): Promise<number> {
  const result = await prisma.bonusCredit.aggregate({
    where: {
      organizationId: orgId,
      expirationDate: { gt: new Date() },
      creditsRemaining: { gt: 0 },
    },
    _sum: {
      creditsRemaining: true,
    },
  });

  return result._sum.creditsRemaining ?? 0;
}

/**
 * Get all bonus credits for an organization (including expired/used)
 */
export async function getAllBonusCredits(orgId: string) {
  return prisma.bonusCredit.findMany({
    where: { organizationId: orgId },
    orderBy: { grantDate: "desc" },
  });
}

// =============================================================================
// CLEANUP
// =============================================================================

/**
 * Delete expired bonus credits with no remaining balance
 * Returns the count of deleted records
 */
export async function cleanupExpiredBonusCredits(): Promise<number> {
  const result = await prisma.bonusCredit.deleteMany({
    where: {
      OR: [
        // Expired credits
        { expirationDate: { lte: new Date() } },
        // Fully consumed credits (older than 30 days)
        {
          creditsRemaining: 0,
          grantDate: {
            lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
  });

  return result.count;
}

// =============================================================================
// ADMIN OPERATIONS
// =============================================================================

/**
 * Adjust credits remaining for a specific bonus credit (admin only)
 */
export async function adjustBonusCredit(
  creditId: string,
  newRemaining: number,
  adminUsername: string
): Promise<void> {
  const credit = await prisma.bonusCredit.findUnique({
    where: { id: creditId },
  });

  if (!credit) {
    throw new Error("Bonus credit not found");
  }

  if (newRemaining < 0 || newRemaining > credit.creditsGranted) {
    throw new Error(
      `Credits remaining must be between 0 and ${credit.creditsGranted}`
    );
  }

  await prisma.bonusCredit.update({
    where: { id: creditId },
    data: {
      creditsRemaining: newRemaining,
      notes: `${credit.notes || ""}\n[${new Date().toISOString()}] Adjusted to ${newRemaining} by ${adminUsername}`.trim(),
    },
  });
}

/**
 * Delete a bonus credit (admin only)
 */
export async function deleteBonusCredit(creditId: string): Promise<void> {
  await prisma.bonusCredit.delete({
    where: { id: creditId },
  });
}
