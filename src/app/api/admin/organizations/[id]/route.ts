import { NextRequest, NextResponse } from "next/server";
import { getSession, isAppAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuotaStatus, PLAN_CONFIG } from "@/lib/subscriptions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAppAdmin(session.user.arcgisUsername)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const organization = await prisma.organization.findUnique({
    where: { id },
    select: {
      id: true,
      arcgisOrgId: true,
      name: true,
      tier: true,
      status: true,
      billingFrequency: true,
      monthlyQuota: true,
      mapsUsedThisPeriod: true,
      subscriptionStartDate: true,
      periodStartDate: true,
      periodEndDate: true,
      subscriptionEndDate: true,
      historyRetentionDays: true,
      scheduledDowngradeTier: true,
      scheduledDowngradeDate: true,
      billingContactName: true,
      billingContactEmail: true,
      billingAddress: true,
      billingPoNumber: true,
      adminNotes: true,
      totalGenerationsAllTime: true,
      createdAt: true,
      users: {
        select: {
          id: true,
          arcgisUsername: true,
          displayName: true,
          email: true,
          isOrgAdmin: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { lastLoginAt: "desc" },
      },
      bonusCredits: {
        where: {
          expirationDate: { gt: new Date() },
          creditsRemaining: { gt: 0 },
        },
        orderBy: { expirationDate: "asc" },
      },
      subscriptionRequests: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      subscriptionHistory: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const quotaStatus = await getQuotaStatus(organization.id);
  const planConfig = PLAN_CONFIG[organization.tier];

  // Get recent generations count
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentGenerationsCount = await prisma.generation.count({
    where: {
      organizationId: organization.id,
      createdAt: { gte: thirtyDaysAgo },
      deletedAt: null,
    },
  });

  return NextResponse.json({
    id: organization.id,
    arcgisOrgId: organization.arcgisOrgId,
    name: organization.name,
    tier: organization.tier,
    tierDisplayName: planConfig.displayName,
    status: organization.status,
    billingFrequency: organization.billingFrequency,
    monthlyQuota: organization.monthlyQuota,
    mapsUsedThisPeriod: organization.mapsUsedThisPeriod,
    subscriptionStartDate: organization.subscriptionStartDate,
    periodStartDate: organization.periodStartDate,
    periodEndDate: organization.periodEndDate,
    subscriptionEndDate: organization.subscriptionEndDate,
    historyRetentionDays: organization.historyRetentionDays,
    scheduledDowngradeTier: organization.scheduledDowngradeTier,
    scheduledDowngradeDate: organization.scheduledDowngradeDate,
    billingContact: {
      name: organization.billingContactName,
      email: organization.billingContactEmail,
      address: organization.billingAddress,
      poNumber: organization.billingPoNumber,
    },
    adminNotes: organization.adminNotes,
    createdAt: organization.createdAt,
    users: organization.users,
    bonusCredits: organization.bonusCredits.map((c) => ({
      id: c.id,
      creditsGranted: c.creditsGranted,
      creditsRemaining: c.creditsRemaining,
      grantDate: c.grantDate,
      expirationDate: c.expirationDate,
      grantReason: c.grantReason,
      grantedBy: c.grantedBy,
      notes: c.notes,
    })),
    subscriptionRequests: organization.subscriptionRequests,
    subscriptionHistory: organization.subscriptionHistory,
    quotaStatus: {
      mapsUsedThisPeriod: quotaStatus.mapsUsedThisPeriod,
      mapsRemainingThisPeriod: quotaStatus.mapsRemainingThisPeriod,
      bonusCreditsAvailable: quotaStatus.bonusCreditsAvailable,
      totalMapsAvailable: quotaStatus.totalMapsAvailable,
      canGenerate: quotaStatus.canGenerate,
      isAtLimit: quotaStatus.isAtLimit,
      isApproachingLimit: quotaStatus.isApproachingLimit,
      limitMessage: quotaStatus.limitMessage,
    },
    stats: {
      recentGenerationsCount,
      totalGenerationsAllTime: organization.totalGenerationsAllTime,
    },
  });
}
