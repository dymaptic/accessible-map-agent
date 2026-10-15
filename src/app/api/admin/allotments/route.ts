import { NextRequest, NextResponse } from "next/server";
import { getSession, isAppAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { grantBonusCredits, BonusCreditReason } from "@/lib/bonus-credits";

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAppAdmin(session.user.arcgisUsername)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { organizationId, amount, notes, reason } = body;

    if (!organizationId || !amount) {
      return NextResponse.json(
        { error: "organizationId and amount are required" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount < 1) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Validate reason if provided
    const validReasons: BonusCreditReason[] = [
      "subscription_request",
      "customer_service",
      "promotional",
      "admin_grant",
      "migration",
    ];
    const grantReason: BonusCreditReason = validReasons.includes(reason)
      ? reason
      : "admin_grant";

    // Grant bonus credits (expires in 6 months by default)
    const creditId = await grantBonusCredits({
      organizationId,
      amount,
      reason: grantReason,
      grantedBy: session.user.arcgisUsername,
      notes: notes || undefined,
    });

    // Fetch the created credit to return its details
    const credit = await prisma.bonusCredit.findUnique({
      where: { id: creditId },
    });

    return NextResponse.json({
      success: true,
      bonusCredit: {
        id: credit!.id,
        creditsGranted: credit!.creditsGranted,
        creditsRemaining: credit!.creditsRemaining,
        grantDate: credit!.grantDate,
        expirationDate: credit!.expirationDate,
        grantReason: credit!.grantReason,
        grantedBy: credit!.grantedBy,
        notes: credit!.notes,
      },
    });
  } catch (error) {
    console.error("Error creating bonus credit:", error);
    return NextResponse.json(
      { error: "Failed to create bonus credit" },
      { status: 500 }
    );
  }
}
