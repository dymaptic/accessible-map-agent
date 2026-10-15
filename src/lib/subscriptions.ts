/**
 * Subscription management utilities
 *
 * This module contains plan configuration, quota logic, and tier management functions.
 */

import { PlanTier, BillingFrequency, SubscriptionStatus } from "@prisma/client";
import { prisma } from "./prisma";

// =============================================================================
// PLAN CONFIGURATION
// =============================================================================

export const PLAN_CONFIG = {
  FREE: {
    displayName: "Free",
    monthlyQuota: 3, // Lifetime total, not per period
    isLifetimeQuota: true, // Special handling - doesn't reset
    historyRetentionDays: 7,
    monthlyPrice: 0,
    annualPrice: null,
    description: "Perfect for evaluation",
  },
  STARTER: {
    displayName: "Starter",
    monthlyQuota: 25,
    isLifetimeQuota: false,
    historyRetentionDays: 90,
    monthlyPrice: 49,
    annualPrice: 499, // ~15% discount
    description: "For small cities and counties",
  },
  PROFESSIONAL: {
    displayName: "Professional",
    monthlyQuota: 150,
    isLifetimeQuota: false,
    historyRetentionDays: 365,
    monthlyPrice: 199,
    annualPrice: 1999, // ~16% discount
    description: "For mid-size agencies",
  },
  ENTERPRISE: {
    displayName: "Enterprise",
    monthlyQuota: null, // Configurable per-org, null = unlimited
    isLifetimeQuota: false,
    historyRetentionDays: null, // Unlimited
    monthlyPrice: null, // Custom
    annualPrice: null, // Custom
    description: "For large organizations with ArcGIS Enterprise",
  },
} as const;

export const BONUS_CREDIT_CONFIG = {
  EXPIRY_MONTHS: 6,
  SUBSCRIPTION_REQUEST_BONUS: 5,
} as const;

export type PlanConfig = (typeof PLAN_CONFIG)[PlanTier];

// =============================================================================
// QUOTA STATUS
// =============================================================================

export interface QuotaStatus {
  tier: PlanTier;
  status: SubscriptionStatus;
  billingFrequency: BillingFrequency | null;

  // Monthly quota
  monthlyQuota: number | null; // null = unlimited
  mapsUsedThisPeriod: number;
  mapsRemainingThisPeriod: number | null; // null = unlimited
  periodEndDate: Date | null;

  // Bonus credits
  bonusCreditsAvailable: number;
  bonusCreditsExpiringSoon: { amount: number; expiresAt: Date }[];

  // Totals
  totalMapsAvailable: number | null; // null = unlimited
  canGenerate: boolean;
  isAtLimit: boolean;
  isApproachingLimit: boolean; // >= 80%
  limitMessage: string | null;
}

export async function getQuotaStatus(orgId: string): Promise<QuotaStatus> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      bonusCredits: {
        where: {
          expirationDate: { gt: new Date() },
          creditsRemaining: { gt: 0 },
        },
        orderBy: { expirationDate: "asc" },
      },
    },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  const bonusCreditsAvailable = org.bonusCredits.reduce(
    (sum, c) => sum + c.creditsRemaining,
    0
  );

  const bonusCreditsExpiringSoon = org.bonusCredits.slice(0, 3).map((c) => ({
    amount: c.creditsRemaining,
    expiresAt: c.expirationDate,
  }));

  // Handle FREE tier (lifetime limit)
  if (org.tier === "FREE") {
    // Use totalGenerationsAllTime as the persistent counter for lifetime usage
    // This doesn't decrease when generations expire/are deleted
    const lifetimeUsed = org.totalGenerationsAllTime;

    const freeRemaining = Math.max(
      0,
      PLAN_CONFIG.FREE.monthlyQuota - lifetimeUsed
    );
    const canGenerate =
      org.status === "ACTIVE" &&
      (freeRemaining > 0 || bonusCreditsAvailable > 0);
    const totalAvailable = freeRemaining + bonusCreditsAvailable;

    return {
      tier: "FREE",
      status: org.status,
      billingFrequency: null,
      monthlyQuota: PLAN_CONFIG.FREE.monthlyQuota,
      mapsUsedThisPeriod: lifetimeUsed,
      mapsRemainingThisPeriod: freeRemaining,
      periodEndDate: null, // No reset for FREE
      bonusCreditsAvailable,
      bonusCreditsExpiringSoon,
      totalMapsAvailable: totalAvailable,
      canGenerate,
      isAtLimit: !canGenerate,
      isApproachingLimit: freeRemaining <= 1 && bonusCreditsAvailable === 0,
      limitMessage: canGenerate
        ? null
        : "You've used all 3 free map descriptions.",
    };
  }

  // Handle paid tiers
  const monthlyQuota = org.monthlyQuota ?? PLAN_CONFIG[org.tier].monthlyQuota;
  const isUnlimited = monthlyQuota === null;
  const mapsRemaining = isUnlimited
    ? null
    : Math.max(0, monthlyQuota - org.mapsUsedThisPeriod);

  // Grace period - can view but not generate
  if (org.status === "GRACE_PERIOD") {
    return {
      tier: org.tier,
      status: org.status,
      billingFrequency: org.billingFrequency,
      monthlyQuota,
      mapsUsedThisPeriod: org.mapsUsedThisPeriod,
      mapsRemainingThisPeriod: mapsRemaining,
      periodEndDate: org.periodEndDate,
      bonusCreditsAvailable,
      bonusCreditsExpiringSoon: [],
      totalMapsAvailable: 0,
      canGenerate: false,
      isAtLimit: true,
      isApproachingLimit: false,
      limitMessage:
        "Your subscription has expired. Renew to continue generating maps.",
    };
  }

  // Expired - same as grace period
  if (org.status === "EXPIRED") {
    return {
      tier: org.tier,
      status: org.status,
      billingFrequency: org.billingFrequency,
      monthlyQuota,
      mapsUsedThisPeriod: org.mapsUsedThisPeriod,
      mapsRemainingThisPeriod: 0,
      periodEndDate: null,
      bonusCreditsAvailable,
      bonusCreditsExpiringSoon: [],
      totalMapsAvailable: bonusCreditsAvailable,
      canGenerate: bonusCreditsAvailable > 0,
      isAtLimit: bonusCreditsAvailable === 0,
      isApproachingLimit: false,
      limitMessage:
        bonusCreditsAvailable > 0
          ? null
          : "Your subscription has expired. Renew to continue generating maps.",
    };
  }

  // Active paid subscription
  const canGenerate =
    isUnlimited || mapsRemaining! > 0 || bonusCreditsAvailable > 0;
  const usagePercent = isUnlimited
    ? 0
    : (org.mapsUsedThisPeriod / monthlyQuota!) * 100;
  const totalAvailable = isUnlimited
    ? null
    : mapsRemaining! + bonusCreditsAvailable;

  return {
    tier: org.tier,
    status: org.status,
    billingFrequency: org.billingFrequency,
    monthlyQuota,
    mapsUsedThisPeriod: org.mapsUsedThisPeriod,
    mapsRemainingThisPeriod: mapsRemaining,
    periodEndDate: org.periodEndDate,
    bonusCreditsAvailable,
    bonusCreditsExpiringSoon,
    totalMapsAvailable: totalAvailable,
    canGenerate,
    isAtLimit: !canGenerate,
    isApproachingLimit: usagePercent >= 80 && bonusCreditsAvailable === 0,
    limitMessage: canGenerate
      ? null
      : `Monthly quota exhausted. ${org.periodEndDate ? `Resets on ${org.periodEndDate.toLocaleDateString()}.` : ""}`,
  };
}

// =============================================================================
// BILLING PERIOD CALCULATIONS
// =============================================================================

/**
 * Calculate the current billing period based on the subscription start date
 */
export function calculateCurrentPeriod(subscriptionStartDate: Date): {
  periodStart: Date;
  periodEnd: Date;
} {
  const now = new Date();
  const dayOfMonth = subscriptionStartDate.getDate();

  // Find current period based on anniversary
  let periodStart = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);

  // If we're before the anniversary day this month, go back one month
  if (now < periodStart) {
    periodStart.setMonth(periodStart.getMonth() - 1);
  }

  // Period end is one month after period start
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return { periodStart, periodEnd };
}

/**
 * Calculate when a subscription should end based on start date and frequency
 */
export function calculateSubscriptionEndDate(
  startDate: Date,
  frequency: BillingFrequency
): Date {
  const endDate = new Date(startDate);
  if (frequency === "ANNUAL") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  return endDate;
}

/**
 * Calculate history expiration date based on tier
 */
export function calculateHistoryExpirationDate(
  tier: PlanTier,
  customRetentionDays?: number | null
): Date | null {
  const retentionDays =
    customRetentionDays ?? PLAN_CONFIG[tier].historyRetentionDays;

  if (retentionDays === null) {
    return null; // Never expires (Enterprise)
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + retentionDays);
  return expiresAt;
}

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================

/**
 * Activate or upgrade a subscription (immediate, generous)
 */
export async function activateSubscription(
  orgId: string,
  newTier: PlanTier,
  newFrequency: BillingFrequency,
  performedBy: string,
  options?: {
    customMonthlyQuota?: number | null;
    subscriptionEndDate?: Date;
    notes?: string;
  }
): Promise<void> {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");

  const now = new Date();
  const { periodStart, periodEnd } = calculateCurrentPeriod(now);
  const subscriptionEnd =
    options?.subscriptionEndDate ??
    calculateSubscriptionEndDate(now, newFrequency);

  const monthlyQuota =
    options?.customMonthlyQuota !== undefined
      ? options.customMonthlyQuota
      : PLAN_CONFIG[newTier].monthlyQuota;

  const historyRetentionDays = PLAN_CONFIG[newTier].historyRetentionDays;

  // Calculate new expiration date for existing generations
  const newExpiresAt =
    historyRetentionDays === null
      ? null // Enterprise = never expires
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + historyRetentionDays);
          return d;
        })();

  await prisma.$transaction([
    // Update organization
    prisma.organization.update({
      where: { id: orgId },
      data: {
        tier: newTier,
        billingFrequency: newFrequency,
        status: "ACTIVE",
        monthlyQuota,
        mapsUsedThisPeriod: 0, // Reset to full allocation
        subscriptionStartDate: now,
        periodStartDate: periodStart,
        periodEndDate: periodEnd,
        subscriptionEndDate: subscriptionEnd,
        historyRetentionDays,
        // Clear any scheduled downgrade since we're activating/upgrading
        scheduledDowngradeTier: null,
        scheduledDowngradeDate: null,
      },
    }),

    // Log history
    prisma.subscriptionHistory.create({
      data: {
        organizationId: orgId,
        action: org.tier === "FREE" ? "activated" : "upgraded",
        fromTier: org.tier,
        toTier: newTier,
        fromFrequency: org.billingFrequency,
        toFrequency: newFrequency,
        performedBy,
        notes: options?.notes,
      },
    }),

    // Reset expiration dates for existing generations to match new tier
    prisma.generation.updateMany({
      where: {
        organizationId: orgId,
        deletedAt: null, // Only non-deleted
      },
      data: {
        expiresAt: newExpiresAt,
      },
    }),
  ]);
}

/**
 * Downgrade a subscription (takes effect at renewal)
 * For now, we just update the tier - actual downgrade happens at renewal
 */
export async function downgradeSubscription(
  orgId: string,
  newTier: PlanTier,
  newFrequency: BillingFrequency,
  performedBy: string,
  notes?: string
): Promise<void> {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");

  // For immediate downgrade (e.g., admin action), apply now
  const monthlyQuota = PLAN_CONFIG[newTier].monthlyQuota;
  const historyRetentionDays = PLAN_CONFIG[newTier].historyRetentionDays;

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: orgId },
      data: {
        tier: newTier,
        billingFrequency: newTier === "FREE" ? null : newFrequency,
        monthlyQuota,
        historyRetentionDays,
        // Keep current period dates - they'll update on next reset
      },
    }),

    prisma.subscriptionHistory.create({
      data: {
        organizationId: orgId,
        action: "downgraded",
        fromTier: org.tier,
        toTier: newTier,
        fromFrequency: org.billingFrequency,
        toFrequency: newTier === "FREE" ? null : newFrequency,
        performedBy,
        notes,
      },
    }),
  ]);
}

/**
 * Cancel a subscription (revert to FREE)
 */
export async function cancelSubscription(
  orgId: string,
  performedBy: string,
  notes?: string
): Promise<void> {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: orgId },
      data: {
        tier: "FREE",
        billingFrequency: null,
        status: "ACTIVE",
        monthlyQuota: null,
        mapsUsedThisPeriod: 0,
        subscriptionStartDate: null,
        periodStartDate: null,
        periodEndDate: null,
        subscriptionEndDate: null,
        historyRetentionDays: PLAN_CONFIG.FREE.historyRetentionDays,
        // Clear any scheduled downgrade since we're cancelling immediately
        scheduledDowngradeTier: null,
        scheduledDowngradeDate: null,
      },
    }),

    prisma.subscriptionHistory.create({
      data: {
        organizationId: orgId,
        action: "cancelled",
        fromTier: org.tier,
        toTier: "FREE",
        fromFrequency: org.billingFrequency,
        toFrequency: null,
        performedBy,
        notes,
      },
    }),
  ]);
}

/**
 * Extend a subscription end date
 */
export async function extendSubscription(
  orgId: string,
  newEndDate: Date,
  performedBy: string,
  notes?: string
): Promise<void> {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionEndDate: newEndDate,
        status: "ACTIVE", // Reactivate if was in grace period
      },
    }),

    prisma.subscriptionHistory.create({
      data: {
        organizationId: orgId,
        action: "renewed",
        fromTier: org.tier,
        toTier: org.tier,
        performedBy,
        notes: notes ?? `Extended to ${newEndDate.toLocaleDateString()}`,
      },
    }),
  ]);
}

/**
 * Reset monthly quota for an organization
 */
export async function resetMonthlyQuota(orgId: string): Promise<void> {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org || !org.subscriptionStartDate) return;

  const { periodStart, periodEnd } = calculateCurrentPeriod(
    org.subscriptionStartDate
  );

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      mapsUsedThisPeriod: 0,
      periodStartDate: periodStart,
      periodEndDate: periodEnd,
    },
  });
}

// =============================================================================
// SCHEDULED DOWNGRADE MANAGEMENT
// =============================================================================

/**
 * Schedule a downgrade to take effect at a future date (typically period end)
 * The org continues on their current tier until the scheduled date
 */
export async function scheduleDowngrade(
  orgId: string,
  targetTier: PlanTier,
  effectiveDate: Date,
  performedBy: string,
  notes?: string
): Promise<void> {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: orgId },
      data: {
        scheduledDowngradeTier: targetTier,
        scheduledDowngradeDate: effectiveDate,
      },
    }),

    prisma.subscriptionHistory.create({
      data: {
        organizationId: orgId,
        action: "downgrade_scheduled",
        fromTier: org.tier,
        toTier: targetTier,
        performedBy,
        notes: notes ?? `Scheduled downgrade to ${targetTier} on ${effectiveDate.toLocaleDateString()}`,
      },
    }),
  ]);
}

/**
 * Cancel a scheduled downgrade
 */
export async function cancelScheduledDowngrade(
  orgId: string,
  performedBy: string,
  notes?: string
): Promise<void> {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");
  if (!org.scheduledDowngradeTier) throw new Error("No scheduled downgrade to cancel");

  const previousTarget = org.scheduledDowngradeTier;

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: orgId },
      data: {
        scheduledDowngradeTier: null,
        scheduledDowngradeDate: null,
      },
    }),

    prisma.subscriptionHistory.create({
      data: {
        organizationId: orgId,
        action: "downgrade_cancelled",
        fromTier: org.tier,
        toTier: org.tier, // Staying on current tier
        performedBy,
        notes: notes ?? `Cancelled scheduled downgrade to ${previousTarget}`,
      },
    }),
  ]);
}

/**
 * Apply a scheduled downgrade (called by cron job)
 * This immediately applies the downgrade if the scheduled date has passed
 */
export async function applyScheduledDowngrade(orgId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return false;
  if (!org.scheduledDowngradeTier || !org.scheduledDowngradeDate) return false;
  if (org.scheduledDowngradeDate > new Date()) return false; // Not yet due

  const targetTier = org.scheduledDowngradeTier;
  const monthlyQuota = PLAN_CONFIG[targetTier].monthlyQuota;
  const historyRetentionDays = PLAN_CONFIG[targetTier].historyRetentionDays;

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: orgId },
      data: {
        tier: targetTier,
        billingFrequency: targetTier === "FREE" ? null : org.billingFrequency,
        monthlyQuota,
        historyRetentionDays,
        // Clear the scheduled downgrade
        scheduledDowngradeTier: null,
        scheduledDowngradeDate: null,
        // Reset period tracking for FREE tier
        ...(targetTier === "FREE" && {
          subscriptionStartDate: null,
          periodStartDate: null,
          periodEndDate: null,
          subscriptionEndDate: null,
        }),
      },
    }),

    prisma.subscriptionHistory.create({
      data: {
        organizationId: orgId,
        action: "downgraded",
        fromTier: org.tier,
        toTier: targetTier,
        fromFrequency: org.billingFrequency,
        toFrequency: targetTier === "FREE" ? null : org.billingFrequency,
        performedBy: "system",
        notes: "Scheduled downgrade applied automatically",
      },
    }),
  ]);

  return true;
}

// =============================================================================
// PRICING HELPERS
// =============================================================================

/**
 * Get the price for a tier and frequency
 */
export function getPrice(
  tier: PlanTier,
  frequency: BillingFrequency
): number | null {
  const config = PLAN_CONFIG[tier];
  if (frequency === "ANNUAL") {
    return config.annualPrice;
  }
  return config.monthlyPrice;
}

/**
 * Format price for display
 */
export function formatPrice(price: number | null): string {
  if (price === null) return "Contact Us";
  return `$${price}`;
}

/**
 * Get annual savings percentage
 */
export function getAnnualSavings(tier: PlanTier): number | null {
  const config = PLAN_CONFIG[tier];
  if (!config.monthlyPrice || !config.annualPrice) return null;

  const yearlyAtMonthly = config.monthlyPrice * 12;
  const savings = ((yearlyAtMonthly - config.annualPrice) / yearlyAtMonthly) * 100;
  return Math.round(savings);
}
