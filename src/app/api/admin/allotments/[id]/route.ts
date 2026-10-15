import { NextRequest, NextResponse } from "next/server";
import { getSession, isAppAdmin } from "@/lib/auth";
import { deleteBonusCredit, adjustBonusCredit } from "@/lib/bonus-credits";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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

  try {
    const credit = await prisma.bonusCredit.findUnique({
      where: { id },
    });

    if (!credit) {
      return NextResponse.json(
        { error: "Bonus credit not found" },
        { status: 404 }
      );
    }

    await deleteBonusCredit(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bonus credit:", error);
    return NextResponse.json(
      { error: "Failed to delete bonus credit" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

  try {
    const body = await request.json();
    const { creditsRemaining } = body;

    if (typeof creditsRemaining !== "number" || creditsRemaining < 0) {
      return NextResponse.json(
        { error: "creditsRemaining must be a non-negative number" },
        { status: 400 }
      );
    }

    await adjustBonusCredit(id, creditsRemaining, session.user.arcgisUsername);

    const credit = await prisma.bonusCredit.findUnique({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      bonusCredit: credit,
    });
  } catch (error) {
    console.error("Error adjusting bonus credit:", error);
    const message = error instanceof Error ? error.message : "Failed to adjust bonus credit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
