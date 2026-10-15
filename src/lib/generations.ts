/**
 * Generation management utilities
 *
 * This module handles consuming credits for map generations and tracking
 * credit sources (free tier, monthly quota, or bonus credits).
 */

import { prisma } from "./prisma";
import { getQuotaStatus, PLAN_CONFIG, calculateHistoryExpirationDate } from "./subscriptions";
import { consumeBonusCredit } from "./bonus-credits";

// =============================================================================
// TYPES
// =============================================================================

export type CreditSource = "free_tier" | "monthly_quota" | string; // string = bonus credit ID

export interface ConsumeResult {
  success: boolean;
  creditSource: CreditSource | null;
  expiresAt: Date | null;
  error?: string;
}

// =============================================================================
// CONSUME GENERATION
// =============================================================================

/**
 * Consume a generation credit for an organization
 *
 * Credit consumption priority:
 * 1. FREE tier: Use lifetime free allocation
 * 2. Paid tiers: Use monthly quota
 * 3. Any tier: Fall back to bonus credits (FIFO by expiration)
 *
 * Returns the credit source and expiration date for the generation
 */
export async function consumeGeneration(orgId: string): Promise<ConsumeResult> {
  const quotaStatus = await getQuotaStatus(orgId);

  // Check if generation is allowed
  if (!quotaStatus.canGenerate) {
    return {
      success: false,
      creditSource: null,
      expiresAt: null,
      error: quotaStatus.limitMessage || "No generations remaining",
    };
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    return {
      success: false,
      creditSource: null,
      expiresAt: null,
      error: "Organization not found",
    };
  }

  // Calculate expiration date based on tier
  const expiresAt = calculateHistoryExpirationDate(
    org.tier,
    org.historyRetentionDays
  );

  // Handle FREE tier (lifetime quota)
  if (org.tier === "FREE") {
    // Use totalGenerationsAllTime as the persistent counter for lifetime usage
    // This doesn't decrease when generations expire/are deleted
    const lifetimeUsed = org.totalGenerationsAllTime;

    const freeRemaining = PLAN_CONFIG.FREE.monthlyQuota - lifetimeUsed;

    if (freeRemaining > 0) {
      // Use free tier credit - no need to update org, just track in generation
      return {
        success: true,
        creditSource: "free_tier",
        expiresAt,
      };
    }

    // No free credits left, try bonus credits
    const bonusCreditId = await consumeBonusCredit(orgId);
    if (bonusCreditId) {
      return {
        success: true,
        creditSource: bonusCreditId,
        expiresAt,
      };
    }

    return {
      success: false,
      creditSource: null,
      expiresAt: null,
      error: "No generations remaining",
    };
  }

  // Handle paid tiers
  const monthlyQuota = org.monthlyQuota ?? PLAN_CONFIG[org.tier].monthlyQuota;
  const isUnlimited = monthlyQuota === null;
  const hasMonthlyCredits = isUnlimited || org.mapsUsedThisPeriod < monthlyQuota;

  if (hasMonthlyCredits) {
    // Increment usage counter
    await prisma.organization.update({
      where: { id: orgId },
      data: { mapsUsedThisPeriod: org.mapsUsedThisPeriod + 1 },
    });

    return {
      success: true,
      creditSource: "monthly_quota",
      expiresAt,
    };
  }

  // Monthly quota exhausted, try bonus credits
  const bonusCreditId = await consumeBonusCredit(orgId);
  if (bonusCreditId) {
    return {
      success: true,
      creditSource: bonusCreditId,
      expiresAt,
    };
  }

  return {
    success: false,
    creditSource: null,
    expiresAt: null,
    error: "Monthly quota exhausted. Resets on next billing period.",
  };
}

// =============================================================================
// RECORD GENERATION
// =============================================================================

/**
 * Record a new generation in the database
 *
 * This should be called after consumeGeneration succeeds and the actual
 * generation is complete. It creates the generation record and increments
 * the organization's all-time counter.
 */
export async function recordGeneration(params: {
  orgId: string;
  userId: string;
  mapTitle: string;
  mapId: string | null;
  description: string;
  creditSource: CreditSource;
  expiresAt: Date | null;
}): Promise<string> {
  const { orgId, userId, mapTitle, mapId, description, creditSource, expiresAt } =
    params;

  const [generation] = await prisma.$transaction([
    prisma.generation.create({
      data: {
        organizationId: orgId,
        userId,
        mapTitle,
        mapId,
        description,
        creditSource,
        expiresAt,
      },
    }),
    // Increment all-time counters
    prisma.organization.update({
      where: { id: orgId },
      data: { totalGenerationsAllTime: { increment: 1 } },
    }),
    prisma.appStats.upsert({
      where: { id: "singleton" },
      update: { totalGenerationsAllTime: { increment: 1 } },
      create: { id: "singleton", totalGenerationsAllTime: 1 },
    }),
  ]);

  return generation.id;
}

// =============================================================================
// QUERY GENERATIONS
// =============================================================================

/**
 * Get generations for an organization (respecting soft deletes)
 */
export async function getOrgGenerations(
  orgId: string,
  options?: {
    limit?: number;
    offset?: number;
    includeExpired?: boolean;
  }
) {
  const { limit = 50, offset = 0, includeExpired = false } = options ?? {};

  const baseWhere = {
    organizationId: orgId,
    deletedAt: null,
  };

  const where = includeExpired
    ? baseWhere
    : {
        ...baseWhere,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      };

  return prisma.generation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          arcgisUsername: true,
          displayName: true,
        },
      },
    },
  });
}

/**
 * Get a single generation by ID
 */
export async function getGeneration(generationId: string, orgId?: string) {
  const where = orgId
    ? { id: generationId, deletedAt: null, organizationId: orgId }
    : { id: generationId, deletedAt: null };

  return prisma.generation.findFirst({
    where,
    include: {
      user: {
        select: {
          arcgisUsername: true,
          displayName: true,
        },
      },
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
}

/**
 * Soft delete a generation
 */
export async function deleteGeneration(
  generationId: string,
  orgId: string
): Promise<boolean> {
  const generation = await prisma.generation.findFirst({
    where: {
      id: generationId,
      organizationId: orgId,
      deletedAt: null,
    },
  });

  if (!generation) {
    return false;
  }

  await prisma.generation.update({
    where: { id: generationId },
    data: { deletedAt: new Date() },
  });

  return true;
}

// =============================================================================
// CLEANUP
// =============================================================================

/**
 * Permanently delete expired generations
 * Returns the count of deleted records
 */
export async function cleanupExpiredGenerations(): Promise<number> {
  const result = await prisma.generation.deleteMany({
    where: {
      OR: [
        // Expired based on tier retention
        {
          expiresAt: { lte: new Date() },
        },
        // Soft deleted more than 30 days ago
        {
          deletedAt: {
            lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
  });

  return result.count;
}
