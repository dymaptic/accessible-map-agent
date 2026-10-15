import { NextRequest, NextResponse } from "next/server";
import { getSession, isAppAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/subscription-requests
 * List all subscription requests (super admins only)
 */
export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAppAdmin(session.user.arcgisUsername)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  const where = status ? { status: status as "PENDING" | "INVOICED" | "PAID" | "ACTIVATED" | "CANCELLED" } : {};

  try {
    const [requests, total] = await Promise.all([
      prisma.subscriptionRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              arcgisOrgId: true,
              tier: true,
              status: true,
            },
          },
          requestingUser: {
            select: {
              arcgisUsername: true,
              displayName: true,
              email: true,
            },
          },
        },
      }),
      prisma.subscriptionRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        organization: r.organization,
        requestingUser: r.requestingUser,
        requestType: r.requestType,
        requestedTier: r.requestedTier,
        billingFrequency: r.billingFrequency,
        billingContactName: r.billingContactName,
        billingContactEmail: r.billingContactEmail,
        billingAddress: r.billingAddress,
        poNumber: r.poNumber,
        specialRequirements: r.specialRequirements,
        status: r.status,
        bonusCreditsGranted: r.bonusCreditsGranted,
        invoicedAt: r.invoicedAt,
        paidAt: r.paidAt,
        activatedAt: r.activatedAt,
        cancelledAt: r.cancelledAt,
        processedBy: r.processedBy,
        processingNotes: r.processingNotes,
        createdAt: r.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching subscription requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription requests" },
      { status: 500 }
    );
  }
}
