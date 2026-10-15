import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  // Get generations for current user (not soft-deleted, not expired)
  const now = new Date();
  const [generations, total] = await Promise.all([
    prisma.generation.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
        OR: [
          { expiresAt: null }, // Never expires (Enterprise)
          { expiresAt: { gt: now } }, // Not yet expired
        ],
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        mapTitle: true,
        mapId: true,
        description: true,
        creditSource: true,
        createdAt: true,
        expiresAt: true,
      },
    }),
    prisma.generation.count({
      where: {
        userId: session.user.id,
        deletedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    }),
  ]);

  // Calculate days remaining for each generation
  const generationsWithExpiry = generations.map((gen) => {
    let daysRemaining: number | null = null;

    if (gen.expiresAt) {
      daysRemaining = Math.max(
        0,
        Math.ceil((gen.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    return {
      id: gen.id,
      mapTitle: gen.mapTitle,
      mapId: gen.mapId,
      description: gen.description,
      creditSource: gen.creditSource,
      createdAt: gen.createdAt.toISOString(),
      expiresAt: gen.expiresAt?.toISOString() ?? null,
      daysRemaining, // null = never expires
    };
  });

  return NextResponse.json({
    generations: generationsWithExpiry,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
