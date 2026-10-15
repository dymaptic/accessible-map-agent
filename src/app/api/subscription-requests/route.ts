import { NextRequest, NextResponse } from "next/server";
import { getSession, isOrgAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { grantSubscriptionRequestBonus } from "@/lib/bonus-credits";
import { PlanTier, BillingFrequency, PaymentMethod } from "@prisma/client";
import {
  sendSubscriptionRequestConfirmation,
  notifyAdminsNewSubscriptionRequest,
} from "@/lib/email";
import { webhookSubscriptionRequested } from "@/lib/webhooks";

/**
 * POST /api/subscription-requests
 * Submit a new subscription request (org admins only)
 */
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only org admins can request subscriptions
  if (!isOrgAdmin(session.user)) {
    return NextResponse.json(
      { error: "Only organization administrators can request subscriptions" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      requestedTier,
      billingFrequency,
      preferredPaymentMethod,
      billingContactName,
      billingContactEmail,
      billingAddress,
      poNumber,
      specialRequirements,
    } = body;

    // Validate required fields
    if (!requestedTier || !billingFrequency || !billingContactName || !billingContactEmail || !billingAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate tier and frequency
    const validTiers: PlanTier[] = ["STARTER", "PROFESSIONAL", "ENTERPRISE"];
    const validFrequencies: BillingFrequency[] = ["MONTHLY", "ANNUAL"];

    if (!validTiers.includes(requestedTier)) {
      return NextResponse.json(
        { error: "Invalid tier requested" },
        { status: 400 }
      );
    }

    if (!validFrequencies.includes(billingFrequency)) {
      return NextResponse.json(
        { error: "Invalid billing frequency" },
        { status: 400 }
      );
    }

    // Validate payment method if provided
    const validPaymentMethods: PaymentMethod[] = ["ACH", "CHECK", "PAYMENT_LINK"];
    if (preferredPaymentMethod && !validPaymentMethods.includes(preferredPaymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const orgId = session.user.organizationId;

    // Check for existing pending request
    const existingRequest = await prisma.subscriptionRequest.findFirst({
      where: {
        organizationId: orgId,
        status: { in: ["PENDING", "INVOICED"] },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending subscription request" },
        { status: 409 }
      );
    }

    // Create subscription request and grant bonus credits in a transaction
    const [subscriptionRequest, bonusCreditId] = await prisma.$transaction(async (tx) => {
      // Create the subscription request
      const request = await tx.subscriptionRequest.create({
        data: {
          organizationId: orgId,
          requestingUserId: session.user.id,
          requestedTier,
          billingFrequency,
          preferredPaymentMethod: preferredPaymentMethod || "ACH",
          billingContactName,
          billingContactEmail,
          billingAddress,
          poNumber: poNumber || null,
          specialRequirements: specialRequirements || null,
          bonusCreditsGranted: 5, // Standard bonus for submission
        },
      });

      // Update org's billing contact info
      await tx.organization.update({
        where: { id: orgId },
        data: {
          billingContactName,
          billingContactEmail,
          billingAddress,
          billingPoNumber: poNumber || null,
        },
      });

      return [request, null as string | null];
    });

    // Grant bonus credits outside transaction (separate operation)
    let creditId: string | null = null;
    try {
      creditId = await grantSubscriptionRequestBonus(orgId);
    } catch (error) {
      console.error("Failed to grant bonus credits:", error);
      // Don't fail the request - the subscription request is still valid
    }

    // Get org name for emails
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    });

    // Send confirmation email to the requester
    try {
      await sendSubscriptionRequestConfirmation(
        billingContactEmail,
        billingContactName,
        {
          orgName: org?.name || "Your organization",
          tier: requestedTier,
          frequency: billingFrequency,
          bonusCredits: 5,
          contactName: billingContactName,
          billingAddress,
          paymentMethod: preferredPaymentMethod || "ACH",
          poNumber: poNumber || undefined,
          specialRequirements: specialRequirements || undefined,
        }
      );
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
    }

    // Notify admins about the new request
    try {
      await notifyAdminsNewSubscriptionRequest({
        orgName: org?.name || "Unknown",
        tier: requestedTier,
        frequency: billingFrequency,
        contactName: billingContactName,
        contactEmail: billingContactEmail,
        billingAddress,
        paymentMethod: preferredPaymentMethod || "ACH",
        poNumber: poNumber || undefined,
        specialRequirements: specialRequirements || undefined,
      });
    } catch (error) {
      console.error("Failed to send admin notification:", error);
    }

    // Queue webhook for external systems (e.g., Zapier -> HubSpot)
    try {
      await webhookSubscriptionRequested({
        requestId: subscriptionRequest.id,
        organizationId: orgId,
        organizationName: org?.name || "Unknown",
        requestedTier,
        billingFrequency,
        contactName: billingContactName,
        contactEmail: billingContactEmail,
      });
    } catch (error) {
      console.error("Failed to queue webhook:", error);
    }

    return NextResponse.json({
      success: true,
      subscriptionRequest: {
        id: subscriptionRequest.id,
        requestedTier: subscriptionRequest.requestedTier,
        billingFrequency: subscriptionRequest.billingFrequency,
        status: subscriptionRequest.status,
        bonusCreditsGranted: subscriptionRequest.bonusCreditsGranted,
        createdAt: subscriptionRequest.createdAt,
      },
      bonusCreditId: creditId,
    });
  } catch (error) {
    console.error("Error creating subscription request:", error);
    return NextResponse.json(
      { error: "Failed to create subscription request" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subscription-requests
 * Get subscription requests for the current org (org admins only)
 */
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only org admins can view subscription requests
  if (!isOrgAdmin(session.user)) {
    return NextResponse.json(
      { error: "Only organization administrators can view subscription requests" },
      { status: 403 }
    );
  }

  try {
    const requests = await prisma.subscriptionRequest.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        requestingUser: {
          select: {
            arcgisUsername: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        requestType: r.requestType,
        requestedTier: r.requestedTier,
        billingFrequency: r.billingFrequency,
        status: r.status,
        billingContactName: r.billingContactName,
        billingContactEmail: r.billingContactEmail,
        bonusCreditsGranted: r.bonusCreditsGranted,
        requestingUser: r.requestingUser,
        invoicedAt: r.invoicedAt,
        paidAt: r.paidAt,
        activatedAt: r.activatedAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching subscription requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription requests" },
      { status: 500 }
    );
  }
}
