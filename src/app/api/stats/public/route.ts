import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cache the stats for 5 minutes (300 seconds)
// This prevents database hammering on high-traffic landing page
let cachedStats: { count: number; cachedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const now = Date.now();

  // Return cached value if still fresh
  if (cachedStats && now - cachedStats.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json(
      { totalMapsAccessible: cachedStats.count },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  }

  // Fetch fresh stats
  try {
    const stats = await prisma.appStats.findUnique({
      where: { id: "singleton" },
      select: { totalGenerationsAllTime: true },
    });

    const count = stats?.totalGenerationsAllTime ?? 0;

    // Update cache
    cachedStats = { count, cachedAt: now };

    return NextResponse.json(
      { totalMapsAccessible: count },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch public stats:", error);

    // Return cached value even if stale, or 0 if no cache
    return NextResponse.json(
      { totalMapsAccessible: cachedStats?.count ?? 0 },
      { status: 200 }
    );
  }
}
