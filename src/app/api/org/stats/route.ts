import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getQuotaStatus } from "@/lib/subscriptions";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quotaStatus = await getQuotaStatus(session.user.organizationId);

  // Return quota status in a format compatible with the frontend
  return NextResponse.json({
    tier: quotaStatus.tier,
    status: quotaStatus.status,
    monthlyQuota: quotaStatus.monthlyQuota,
    mapsUsedThisPeriod: quotaStatus.mapsUsedThisPeriod,
    mapsRemainingThisPeriod: quotaStatus.mapsRemainingThisPeriod,
    bonusCreditsAvailable: quotaStatus.bonusCreditsAvailable,
    totalMapsAvailable: quotaStatus.totalMapsAvailable,
    canGenerate: quotaStatus.canGenerate,
    isAtLimit: quotaStatus.isAtLimit,
    isApproachingLimit: quotaStatus.isApproachingLimit,
    limitMessage: quotaStatus.limitMessage,
    periodEndDate: quotaStatus.periodEndDate,
  });
}
