import { NextRequest, NextResponse } from "next/server";
import { getSession, isOrgAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAdminNotification, sendCancellationRequestReceivedEmail } from "@/lib/email";

/**
 * POST /api/subscription-requests/cancellation
 * Submit a cancellation request (org admins only, must have paid subscription)
 */
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only org admins can request cancellation
  if (!isOrgAdmin(session.user)) {
    return NextResponse.json(
      { error: "Only organization administrators can request cancellation" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { contactName, contactEmail, reason, feedback } = body;

    // Validate required fields
    if (!contactName || !contactEmail || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const orgId = session.user.organizationId;

    // Get current org to verify they have a paid subscription
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (org.tier === "FREE") {
      return NextResponse.json(
        { error: "You don't have an active paid subscription to cancel" },
        { status: 400 }
      );
    }

    // Check for existing pending cancellation request
    const existingRequest = await prisma.subscriptionRequest.findFirst({
      where: {
        organizationId: orgId,
        requestType: "CANCELLATION",
        status: { in: ["PENDING", "INVOICED"] },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending cancellation request" },
        { status: 409 }
      );
    }

    // Create cancellation request
    const cancellationRequest = await prisma.subscriptionRequest.create({
      data: {
        organizationId: orgId,
        requestingUserId: session.user.id,
        requestType: "CANCELLATION",
        requestedTier: "FREE", // Cancellation means going to FREE
        billingFrequency: null,
        billingContactName: contactName,
        billingContactEmail: contactEmail,
        billingAddress: "", // Not needed for cancellation
        specialRequirements: feedback
          ? `Reason: ${reason}\n\nFeedback: ${feedback}`
          : `Reason: ${reason}`,
        bonusCreditsGranted: 0, // No bonus for cancellation
      },
    });

    // Send confirmation email to user
    try {
      await sendCancellationRequestReceivedEmail(contactEmail, contactName, {
        orgName: org.name,
        tier: org.tier,
        contactName,
        reason,
      });
    } catch (error) {
      console.error("Failed to send cancellation confirmation email:", error);
    }

    // Send notification email to admins about cancellation request
    try {
      await sendAdminNotification(
        `Cancellation Request: ${org.name}`,
        `
          <h1>Cancellation Request</h1>
          <p><strong>Organization:</strong> ${org.name}</p>
          <p><strong>Current Plan:</strong> ${org.tier}</p>
          <p><strong>Contact:</strong> ${contactName} (${contactEmail})</p>
          <p><strong>Reason:</strong> ${reason}</p>
          ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ""}
          <p>Review this request in the admin panel.</p>
        `
      );
    } catch (error) {
      console.error("Failed to send cancellation admin notification:", error);
    }

    return NextResponse.json({
      success: true,
      cancellationRequest: {
        id: cancellationRequest.id,
        status: cancellationRequest.status,
        createdAt: cancellationRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating cancellation request:", error);
    return NextResponse.json(
      { error: "Failed to create cancellation request" },
      { status: 500 }
    );
  }
}
