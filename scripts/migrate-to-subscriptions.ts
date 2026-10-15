/**
 * Migration script: Migrate from old schema to new subscription system
 *
 * This script:
 * 1. Sets all existing orgs to FREE tier with fresh 3 free maps
 * 2. Migrates GenerationAllotment records to BonusCredit
 * 3. Updates Generation.creditSource based on usedFreeGeneration
 *
 * Run with: npx ts-node scripts/migrate-to-subscriptions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting subscription migration...\n");

  // 1. Update all organizations to FREE tier
  console.log("1. Setting all organizations to FREE tier...");
  const orgUpdateResult = await prisma.organization.updateMany({
    data: {
      tier: "FREE",
      status: "ACTIVE",
      billingFrequency: null,
      monthlyQuota: null,
      mapsUsedThisPeriod: 0,
      subscriptionStartDate: null,
      periodStartDate: null,
      periodEndDate: null,
      subscriptionEndDate: null,
      historyRetentionDays: 7, // FREE tier retention
    },
  });
  console.log(`   Updated ${orgUpdateResult.count} organizations\n`);

  // 2. Migrate GenerationAllotment to BonusCredit
  console.log("2. Migrating GenerationAllotment to BonusCredit...");

  // First, check if GenerationAllotment table exists and has data
  // We need to use raw query since the model is removed from schema
  try {
    const allotments = await prisma.$queryRaw<
      Array<{
        id: string;
        amount: number;
        remaining: number;
        purchasedAt: Date;
        expiresAt: Date;
        notes: string | null;
        grantedBy: string | null;
        organizationId: string;
      }>
    >`SELECT * FROM "GenerationAllotment"`;

    console.log(`   Found ${allotments.length} allotments to migrate`);

    for (const allotment of allotments) {
      await prisma.bonusCredit.create({
        data: {
          organizationId: allotment.organizationId,
          creditsGranted: allotment.amount,
          creditsRemaining: allotment.remaining,
          grantDate: allotment.purchasedAt,
          expirationDate: allotment.expiresAt,
          grantReason: "migration",
          grantedBy: allotment.grantedBy || "system",
          notes: allotment.notes
            ? `Migrated: ${allotment.notes}`
            : `Migrated from allotment ${allotment.id}`,
        },
      });
    }
    console.log(`   Migrated ${allotments.length} allotments to bonus credits\n`);
  } catch (error) {
    console.log("   No GenerationAllotment table found or empty, skipping...\n");
  }

  // 3. Update Generation.creditSource based on usedFreeGeneration
  console.log("3. Updating Generation.creditSource...");

  // Check if usedFreeGeneration column exists
  try {
    // Update generations that used free tier
    const freeGenResult = await prisma.$executeRaw`
      UPDATE "Generation"
      SET "creditSource" = 'legacy_free'
      WHERE "usedFreeGeneration" = true
    `;
    console.log(`   Marked ${freeGenResult} generations as legacy_free`);

    // Update generations that used paid credits
    const paidGenResult = await prisma.$executeRaw`
      UPDATE "Generation"
      SET "creditSource" = 'monthly_quota'
      WHERE "usedFreeGeneration" = false OR "usedFreeGeneration" IS NULL
    `;
    console.log(`   Marked ${paidGenResult} generations as monthly_quota\n`);
  } catch (error) {
    console.log("   usedFreeGeneration column not found, setting all to monthly_quota\n");
    await prisma.generation.updateMany({
      data: { creditSource: "monthly_quota" },
    });
  }

  // 4. Create initial subscription history for all orgs
  console.log("4. Creating subscription history records...");
  const orgs = await prisma.organization.findMany({
    select: { id: true },
  });

  for (const org of orgs) {
    // Check if history already exists
    const existingHistory = await prisma.subscriptionHistory.findFirst({
      where: { organizationId: org.id },
    });

    if (!existingHistory) {
      await prisma.subscriptionHistory.create({
        data: {
          organizationId: org.id,
          action: "created",
          toTier: "FREE",
          performedBy: "system",
          notes: "Organization created (migrated from legacy system)",
        },
      });
    }
  }
  console.log(`   Created history for ${orgs.length} organizations\n`);

  console.log("Migration complete!");
  console.log("\nNext steps:");
  console.log("1. Drop the GenerationAllotment table (if exists)");
  console.log("2. Drop the usedFreeGeneration column from Generation table");
  console.log("3. Run 'npx prisma generate' to update the client");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
