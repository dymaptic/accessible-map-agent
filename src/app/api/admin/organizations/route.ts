import { NextRequest, NextResponse } from "next/server";
import { getSession, isAppAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuotaStatus, PLAN_CONFIG } from "@/lib/subscriptions";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAppAdmin(session.user.arcgisUsername)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { arcgisOrgId: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
      include: {
        _count: {
          select: { users: true },
        },
      },
    }),
    prisma.organization.count({ where }),
  ]);

  // Get quota status for each organization
  const orgsWithStats = await Promise.all(
    organizations.map(async (org) => {
      const quotaStatus = await getQuotaStatus(org.id);
      const planConfig = PLAN_CONFIG[org.tier];
      return {
        id: org.id,
        arcgisOrgId: org.arcgisOrgId,
        name: org.name,
        tier: org.tier,
        tierDisplayName: planConfig.displayName,
        status: org.status,
        userCount: org._count.users,
        mapsUsedThisPeriod: quotaStatus.mapsUsedThisPeriod,
        mapsRemainingThisPeriod: quotaStatus.mapsRemainingThisPeriod,
        bonusCreditsAvailable: quotaStatus.bonusCreditsAvailable,
        totalMapsAvailable: quotaStatus.totalMapsAvailable,
        canGenerate: quotaStatus.canGenerate,
        createdAt: org.createdAt,
      };
    })
  );

  return NextResponse.json({
    organizations: orgsWithStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
