import { NextRequest, NextResponse } from "next/server";
import { getSession, isAppAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activateSubscription } from "@/lib/subscriptions";

/**
 * GET /api/admin/subscription-requests/[id]
 * Get a single subscription request
 */
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

  try {
    const request = await prisma.subscriptionRequest.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            arcgisOrgId: true,
            tier: true,
            status: true,
            billingContactName: true,
            billingContactEmail: true,
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
    });

    if (!request) {
      return NextResponse.json(
        { error: "Subscription request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("Error fetching subscription request:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription request" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/subscription-requests/[id]
 * Update subscription request status
 *
 * Actions:
 * - mark_invoiced: PENDING -> INVOICED
 * - mark_paid: INVOICED -> PAID
 * - activate: PAID -> ACTIVATED (also activates the subscription)
 * - cancel: Any -> CANCELLED
 */
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
    const { action, notes } = body;

    const subscriptionRequest = await prisma.subscriptionRequest.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });

    if (!subscriptionRequest) {
      return NextResponse.json(
        { error: "Subscription request not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const adminUsername = session.user.arcgisUsername;

    switch (action) {
      case "mark_invoiced": {
        if (subscriptionRequest.status !== "PENDING") {
          return NextResponse.json(
            { error: "Can only mark pending requests as invoiced" },
            { status: 400 }
          );
        }

        await prisma.subscriptionRequest.update({
          where: { id },
          data: {
            status: "INVOICED",
            invoicedAt: now,
            processedBy: adminUsername,
            processingNotes: notes || null,
          },
        });

        break;
      }

      case "mark_paid": {
        if (subscriptionRequest.status !== "INVOICED") {
          return NextResponse.json(
            { error: "Can only mark invoiced requests as paid" },
            { status: 400 }
          );
        }

        await prisma.subscriptionRequest.update({
          where: { id },
          data: {
            status: "PAID",
            paidAt: now,
            processedBy: adminUsername,
            processingNotes: notes
              ? `${subscriptionRequest.processingNotes || ""}\n${notes}`.trim()
              : subscriptionRequest.processingNotes,
          },
        });

        break;
      }

      case "activate": {
        if (subscriptionRequest.status !== "PAID") {
          return NextResponse.json(
            { error: "Can only activate paid requests" },
            { status: 400 }
          );
        }

        // Cannot activate cancellation requests
        if (subscriptionRequest.requestType === "CANCELLATION" || !subscriptionRequest.billingFrequency) {
          return NextResponse.json(
            { error: "Cannot activate a cancellation request" },
            { status: 400 }
          );
        }

        // Activate the subscription
        await activateSubscription(
          subscriptionRequest.organizationId,
          subscriptionRequest.requestedTier,
          subscriptionRequest.billingFrequency,
          adminUsername,
          { notes: `Activated from subscription request ${id}` }
        );

        // Update the request status
        await prisma.subscriptionRequest.update({
          where: { id },
          data: {
            status: "ACTIVATED",
            activatedAt: now,
            processedBy: adminUsername,
            processingNotes: notes
              ? `${subscriptionRequest.processingNotes || ""}\n${notes}`.trim()
              : subscriptionRequest.processingNotes,
          },
        });

        break;
      }

      case "cancel": {
        if (subscriptionRequest.status === "ACTIVATED") {
          return NextResponse.json(
            { error: "Cannot cancel an already activated request" },
            { status: 400 }
          );
        }

        await prisma.subscriptionRequest.update({
          where: { id },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
            processedBy: adminUsername,
            processingNotes: notes
              ? `${subscriptionRequest.processingNotes || ""}\nCancelled: ${notes}`.trim()
              : subscriptionRequest.processingNotes,
          },
        });

        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Valid actions: mark_invoiced, mark_paid, activate, cancel" },
          { status: 400 }
        );
    }

    // Fetch updated request
    const updatedRequest = await prisma.subscriptionRequest.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            tier: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating subscription request:", error);
    return NextResponse.json(
      { error: "Failed to update subscription request" },
      { status: 500 }
    );
  }
}
