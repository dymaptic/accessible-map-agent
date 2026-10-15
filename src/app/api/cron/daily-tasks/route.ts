/**
 * Daily Tasks Cron Endpoint
 *
 * This endpoint runs daily via Azure WebJob or external cron service.
 * It handles:
 * 1. Reset monthly quotas for orgs past their period end
 * 2. Handle subscription expirations and grace periods
 * 3. Process scheduled downgrades
 * 4. Clean up expired generations (history retention)
 * 5. Clean up expired bonus credits
 * 6. Clean up old webhooks
 * 7. Send renewal reminder emails (30-day and 7-day)
 *
 * Note: Webhook queue processing is handled by hourly-tasks endpoint
 *
 * Authentication: Bearer token via CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLAN_CONFIG, calculateCurrentPeriod, getPrice, applyScheduledDowngrade } from "@/lib/subscriptions";
import { cleanupExpiredBonusCredits } from "@/lib/bonus-credits";
import { cleanupExpiredGenerations } from "@/lib/generations";
import { cleanupOldWebhooks } from "@/lib/webhooks";
import {
  sendRenewalReminderEmail,
  sendGracePeriodStartedEmail,
  sendSubscriptionExpiredEmail,
  notifyAdminsSubscriptionExpiring,
} from "@/lib/email";
import { verifyCronAuth, TaskResult } from "@/lib/cron-auth";

export async function POST(request: NextRequest) {
  // Verify authentication
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: TaskResult[] = [];
  const startTime = Date.now();

  console.log("[Cron] Starting daily tasks...");

  // 1. Reset monthly quotas
  try {
    const quotaResets = await resetMonthlyQuotas();
    results.push({
      task: "reset_monthly_quotas",
      success: true,
      details: { orgsReset: quotaResets },
    });
  } catch (error) {
    results.push({
      task: "reset_monthly_quotas",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 2. Process subscription expirations
  try {
    const expirations = await processSubscriptionExpirations();
    results.push({
      task: "process_subscription_expirations",
      success: true,
      details: expirations,
    });
  } catch (error) {
    results.push({
      task: "process_subscription_expirations",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 2.5. Process scheduled downgrades
  try {
    const downgrades = await processScheduledDowngrades();
    results.push({
      task: "process_scheduled_downgrades",
      success: true,
      details: { downgraded: downgrades },
    });
  } catch (error) {
    results.push({
      task: "process_scheduled_downgrades",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 3. Clean up expired generations
  try {
    const deletedGenerations = await cleanupExpiredGenerations();
    results.push({
      task: "cleanup_expired_generations",
      success: true,
      details: { deleted: deletedGenerations },
    });
  } catch (error) {
    results.push({
      task: "cleanup_expired_generations",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 4. Clean up expired bonus credits
  try {
    const deletedCredits = await cleanupExpiredBonusCredits();
    results.push({
      task: "cleanup_expired_bonus_credits",
      success: true,
      details: { deleted: deletedCredits },
    });
  } catch (error) {
    results.push({
      task: "cleanup_expired_bonus_credits",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 5. Clean up old webhooks
  try {
    const cleanedWebhooks = await cleanupOldWebhooks(30);
    results.push({
      task: "cleanup_old_webhooks",
      success: true,
      details: { deleted: cleanedWebhooks },
    });
  } catch (error) {
    results.push({
      task: "cleanup_old_webhooks",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 6. Send renewal reminders
  try {
    const remindersSent = await sendRenewalReminders();
    results.push({
      task: "send_renewal_reminders",
      success: true,
      details: remindersSent,
    });
  } catch (error) {
    results.push({
      task: "send_renewal_reminders",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const duration = Date.now() - startTime;
  const allSucceeded = results.every((r) => r.success);

  console.log(
    `[Cron] Daily tasks completed in ${duration}ms. ${results.filter((r) => r.success).length}/${results.length} tasks succeeded.`
  );

  return NextResponse.json({
    success: allSucceeded,
    duration: `${duration}ms`,
    results,
  });
}

// Also support GET for manual trigger during development
export async function GET(request: NextRequest) {
  // In development, allow GET without auth
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Use POST with Bearer token in production" },
      { status: 405 }
    );
  }

  // Simulate POST request
  return POST(request);
}

// =============================================================================
// TASK IMPLEMENTATIONS
// =============================================================================

/**
 * Reset monthly quotas for organizations that have passed their period end date
 */
async function resetMonthlyQuotas(): Promise<number> {
  const now = new Date();

  // Find orgs with active paid subscriptions past their period end
  const orgsToReset = await prisma.organization.findMany({
    where: {
      tier: { not: "FREE" },
      status: "ACTIVE",
      periodEndDate: { lte: now },
      subscriptionStartDate: { not: null },
    },
  });

  let resetCount = 0;

  for (const org of orgsToReset) {
    if (!org.subscriptionStartDate) continue;

    const { periodStart, periodEnd } = calculateCurrentPeriod(
      org.subscriptionStartDate
    );

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        mapsUsedThisPeriod: 0,
        periodStartDate: periodStart,
        periodEndDate: periodEnd,
      },
    });

    resetCount++;
    console.log(`[Cron] Reset quota for org ${org.name} (${org.id})`);
  }

  return resetCount;
}

/**
 * Process subscription expirations and grace periods
 */
async function processSubscriptionExpirations(): Promise<{
  gracePeriodStarted: number;
  expired: number;
}> {
  const now = new Date();
  let gracePeriodStarted = 0;
  let expired = 0;

  // Find orgs that should enter grace period
  // (subscription ended but still within the billing period)
  const orgsForGracePeriod = await prisma.organization.findMany({
    where: {
      tier: { not: "FREE" },
      status: "ACTIVE",
      subscriptionEndDate: { lte: now },
      periodEndDate: { gt: now }, // Still within period
    },
  });

  for (const org of orgsForGracePeriod) {
    await prisma.$transaction([
      prisma.organization.update({
        where: { id: org.id },
        data: { status: "GRACE_PERIOD" },
      }),
      prisma.subscriptionHistory.create({
        data: {
          organizationId: org.id,
          action: "grace_period_started",
          fromTier: org.tier,
          performedBy: "system",
        },
      }),
    ]);

    // Send grace period email
    if (org.billingContactEmail) {
      await sendGracePeriodStartedEmail(org.billingContactEmail, {
        orgName: org.name,
        tier: PLAN_CONFIG[org.tier].displayName,
        graceEndDate: org.periodEndDate?.toLocaleDateString() || "N/A",
      });
    }

    gracePeriodStarted++;
    console.log(`[Cron] Started grace period for org ${org.name} (${org.id})`);
  }

  // Find orgs that should expire (grace period ended)
  const orgsToExpire = await prisma.organization.findMany({
    where: {
      status: "GRACE_PERIOD",
      periodEndDate: { lte: now },
    },
  });

  for (const org of orgsToExpire) {
    const previousTier = org.tier;

    await prisma.$transaction([
      prisma.organization.update({
        where: { id: org.id },
        data: {
          tier: "FREE",
          status: "EXPIRED",
          billingFrequency: null,
          monthlyQuota: null,
          mapsUsedThisPeriod: 0,
          subscriptionStartDate: null,
          periodStartDate: null,
          periodEndDate: null,
          subscriptionEndDate: null,
          historyRetentionDays: PLAN_CONFIG.FREE.historyRetentionDays,
        },
      }),
      prisma.subscriptionHistory.create({
        data: {
          organizationId: org.id,
          action: "expired",
          fromTier: previousTier,
          toTier: "FREE",
          performedBy: "system",
        },
      }),
    ]);

    // Send expired email
    if (org.billingContactEmail) {
      await sendSubscriptionExpiredEmail(org.billingContactEmail, {
        orgName: org.name,
        previousTier: PLAN_CONFIG[previousTier].displayName,
        historyRetentionDays: PLAN_CONFIG.FREE.historyRetentionDays,
      });
    }

    expired++;
    console.log(`[Cron] Expired subscription for org ${org.name} (${org.id})`);
  }

  return { gracePeriodStarted, expired };
}

/**
 * Send renewal reminder emails (30-day and 7-day warnings)
 */
async function sendRenewalReminders(): Promise<{
  thirtyDayReminders: number;
  sevenDayReminders: number;
}> {
  const now = new Date();

  // 30 days from now
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const thirtyDaysStart = new Date(thirtyDaysFromNow);
  thirtyDaysStart.setHours(0, 0, 0, 0);
  const thirtyDaysEnd = new Date(thirtyDaysFromNow);
  thirtyDaysEnd.setHours(23, 59, 59, 999);

  // 7 days from now
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysStart = new Date(sevenDaysFromNow);
  sevenDaysStart.setHours(0, 0, 0, 0);
  const sevenDaysEnd = new Date(sevenDaysFromNow);
  sevenDaysEnd.setHours(23, 59, 59, 999);

  let thirtyDayReminders = 0;
  let sevenDayReminders = 0;

  // Find orgs expiring in ~30 days
  const orgsExpiring30 = await prisma.organization.findMany({
    where: {
      tier: { not: "FREE" },
      status: "ACTIVE",
      subscriptionEndDate: {
        gte: thirtyDaysStart,
        lte: thirtyDaysEnd,
      },
    },
  });

  for (const org of orgsExpiring30) {
    if (org.billingContactEmail && org.billingFrequency) {
      const price = getPrice(org.tier, org.billingFrequency);
      await sendRenewalReminderEmail(
        org.billingContactEmail,
        30,
        {
          orgName: org.name,
          tier: PLAN_CONFIG[org.tier].displayName,
          endDate: org.subscriptionEndDate?.toLocaleDateString() || "N/A",
          amount: price ? `$${price}` : "Contact Us",
        }
      );

      // Also notify admins
      await notifyAdminsSubscriptionExpiring({
        orgName: org.name,
        tier: PLAN_CONFIG[org.tier].displayName,
        endDate: org.subscriptionEndDate?.toLocaleDateString() || "N/A",
        daysLeft: 30,
        contactEmail: org.billingContactEmail,
      });

      thirtyDayReminders++;
    }
  }

  // Find orgs expiring in ~7 days
  const orgsExpiring7 = await prisma.organization.findMany({
    where: {
      tier: { not: "FREE" },
      status: "ACTIVE",
      subscriptionEndDate: {
        gte: sevenDaysStart,
        lte: sevenDaysEnd,
      },
    },
  });

  for (const org of orgsExpiring7) {
    if (org.billingContactEmail) {
      await sendRenewalReminderEmail(
        org.billingContactEmail,
        7,
        {
          orgName: org.name,
          tier: PLAN_CONFIG[org.tier].displayName,
          endDate: org.subscriptionEndDate?.toLocaleDateString() || "N/A",
        }
      );

      // Also notify admins
      await notifyAdminsSubscriptionExpiring({
        orgName: org.name,
        tier: PLAN_CONFIG[org.tier].displayName,
        endDate: org.subscriptionEndDate?.toLocaleDateString() || "N/A",
        daysLeft: 7,
        contactEmail: org.billingContactEmail,
      });

      sevenDayReminders++;
    }
  }

  return { thirtyDayReminders, sevenDayReminders };
}

/**
 * Process scheduled downgrades that have reached their effective date
 */
async function processScheduledDowngrades(): Promise<number> {
  const now = new Date();

  // Find orgs with scheduled downgrades that are due
  const orgsWithScheduledDowngrades = await prisma.organization.findMany({
    where: {
      scheduledDowngradeTier: { not: null },
      scheduledDowngradeDate: { lte: now },
    },
  });

  let downgradeCount = 0;

  for (const org of orgsWithScheduledDowngrades) {
    const applied = await applyScheduledDowngrade(org.id);
    if (applied) {
      downgradeCount++;
      console.log(
        `[Cron] Applied scheduled downgrade for org ${org.name} (${org.id}) to ${org.scheduledDowngradeTier}`
      );
    }
  }

  return downgradeCount;
}
