import { NextRequest, NextResponse } from "next/server";
import { getSession, isAppAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  activateSubscription,
  downgradeSubscription,
  cancelSubscription,
  extendSubscription,
  resetMonthlyQuota,
  scheduleDowngrade,
  cancelScheduledDowngrade,
} from "@/lib/subscriptions";
import { PlanTier, BillingFrequency } from "@prisma/client";
import {
  sendSubscriptionActivatedEmail,
  sendGracePeriodStartedEmail,
  sendSubscriptionExpiredEmail,
  sendCancellationProcessedEmail,
} from "@/lib/email";
import { PLAN_CONFIG } from "@/lib/subscriptions";
import { webhookSubscriptionActivated } from "@/lib/webhooks";

/**
 * PATCH /api/admin/organizations/[id]/subscription
 * Manage organization subscription (super admins only)
 *
 * Actions:
 * - activate: Activate or upgrade subscription
 * - downgrade: Downgrade subscription
 * - cancel: Cancel subscription (revert to FREE)
 * - extend: Extend subscription end date
 * - reset_quota: Reset monthly quota
 * - update_notes: Update admin notes
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
  const adminUsername = session.user.arcgisUsername;

  try {
    const body = await request.json();
    const { action } = body;

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "activate": {
        const { tier, billingFrequency, customMonthlyQuota, subscriptionEndDate, notes } = body;

        const validTiers: PlanTier[] = ["STARTER", "PROFESSIONAL", "ENTERPRISE"];
        const validFrequencies: BillingFrequency[] = ["MONTHLY", "ANNUAL"];

        if (!validTiers.includes(tier)) {
          return NextResponse.json(
            { error: "Invalid tier" },
            { status: 400 }
          );
        }

        if (!validFrequencies.includes(billingFrequency)) {
          return NextResponse.json(
            { error: "Invalid billing frequency" },
            { status: 400 }
          );
        }

        await activateSubscription(id, tier, billingFrequency, adminUsername, {
          customMonthlyQuota,
          subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : undefined,
          notes,
        });

        // Send activation email to billing contact
        const updatedOrgForEmail = await prisma.organization.findUnique({
          where: { id },
          select: { periodEndDate: true, monthlyQuota: true },
        });

        if (organization.billingContactEmail) {
          try {
            await sendSubscriptionActivatedEmail(
              organization.billingContactEmail,
              organization.billingContactName || undefined,
              {
                orgName: organization.name,
                tier,
                quota: updatedOrgForEmail?.monthlyQuota ?? null,
                periodEnd: updatedOrgForEmail?.periodEndDate?.toLocaleDateString() || "N/A",
              }
            );
          } catch (error) {
            console.error("Failed to send activation email:", error);
          }
        }

        // Queue webhook for external systems (e.g., Zapier -> HubSpot)
        try {
          await webhookSubscriptionActivated({
            organizationId: id,
            organizationName: organization.name,
            tier,
            billingFrequency,
            monthlyQuota: updatedOrgForEmail?.monthlyQuota ?? null,
            periodEndDate: updatedOrgForEmail?.periodEndDate?.toLocaleDateString() || "N/A",
          });
        } catch (error) {
          console.error("Failed to queue webhook:", error);
        }

        break;
      }

      case "downgrade": {
        const { tier, billingFrequency, notes } = body;

        const validTiers: PlanTier[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];
        const validFrequencies: BillingFrequency[] = ["MONTHLY", "ANNUAL"];

        if (!validTiers.includes(tier)) {
          return NextResponse.json(
            { error: "Invalid tier" },
            { status: 400 }
          );
        }

        if (tier !== "FREE" && !validFrequencies.includes(billingFrequency)) {
          return NextResponse.json(
            { error: "Invalid billing frequency" },
            { status: 400 }
          );
        }

        await downgradeSubscription(id, tier, billingFrequency || "MONTHLY", adminUsername, notes);

        // If downgrading to FREE, send cancellation processed email to billing contact
        if (tier === "FREE") {
          // Send cancellation processed email to billing contact
          if (organization.billingContactEmail && organization.tier !== "FREE") {
            try {
              await sendCancellationProcessedEmail(
                organization.billingContactEmail,
                {
                  orgName: organization.name,
                  previousTier: organization.tier,
                  historyRetentionDays: PLAN_CONFIG.FREE.historyRetentionDays,
                }
              );
            } catch (error) {
              console.error("Failed to send cancellation processed email:", error);
            }
          }
        }

        break;
      }

      case "cancel": {
        const { notes } = body;
        const previousTier = organization.tier;
        await cancelSubscription(id, adminUsername, notes);

        // Send cancellation processed email to billing contact
        if (organization.billingContactEmail && previousTier !== "FREE") {
          try {
            await sendCancellationProcessedEmail(
              organization.billingContactEmail,
              {
                orgName: organization.name,
                previousTier,
                historyRetentionDays: PLAN_CONFIG.FREE.historyRetentionDays,
              }
            );
          } catch (error) {
            console.error("Failed to send cancellation processed email:", error);
          }
        }

        break;
      }

      case "extend": {
        const { newEndDate, notes } = body;

        if (!newEndDate) {
          return NextResponse.json(
            { error: "newEndDate is required" },
            { status: 400 }
          );
        }

        await extendSubscription(id, new Date(newEndDate), adminUsername, notes);
        break;
      }

      case "reset_quota": {
        await resetMonthlyQuota(id);

        // Log the action
        await prisma.subscriptionHistory.create({
          data: {
            organizationId: id,
            action: "quota_reset",
            fromTier: organization.tier,
            toTier: organization.tier,
            performedBy: adminUsername,
            notes: body.notes || "Manual quota reset",
          },
        });

        break;
      }

      case "update_notes": {
        const { adminNotes } = body;

        await prisma.organization.update({
          where: { id },
          data: { adminNotes },
        });

        break;
      }

      case "update_billing_contact": {
        const { billingContactName, billingContactEmail, billingAddress, billingPoNumber } = body;

        await prisma.organization.update({
          where: { id },
          data: {
            billingContactName,
            billingContactEmail,
            billingAddress,
            billingPoNumber,
          },
        });

        break;
      }

      case "set_grace_period": {
        await prisma.$transaction([
          prisma.organization.update({
            where: { id },
            data: { status: "GRACE_PERIOD" },
          }),
          prisma.subscriptionHistory.create({
            data: {
              organizationId: id,
              action: "grace_period_started",
              fromTier: organization.tier,
              toTier: organization.tier,
              performedBy: adminUsername,
              notes: body.notes || "Manual grace period",
            },
          }),
        ]);

        // Send grace period email to billing contact
        if (organization.billingContactEmail) {
          const graceEndDate = new Date();
          graceEndDate.setDate(graceEndDate.getDate() + 14); // 14-day grace period
          try {
            await sendGracePeriodStartedEmail(
              organization.billingContactEmail,
              {
                orgName: organization.name,
                tier: organization.tier,
                graceEndDate: graceEndDate.toLocaleDateString(),
              }
            );
          } catch (error) {
            console.error("Failed to send grace period email:", error);
          }
        }

        break;
      }

      case "set_expired": {
        await prisma.$transaction([
          prisma.organization.update({
            where: { id },
            data: { status: "EXPIRED" },
          }),
          prisma.subscriptionHistory.create({
            data: {
              organizationId: id,
              action: "expired",
              fromTier: organization.tier,
              toTier: organization.tier,
              performedBy: adminUsername,
              notes: body.notes || "Manual expiration",
            },
          }),
        ]);

        // Send expired email to billing contact
        if (organization.billingContactEmail) {
          try {
            await sendSubscriptionExpiredEmail(
              organization.billingContactEmail,
              {
                orgName: organization.name,
                previousTier: organization.tier,
                historyRetentionDays: 7, // FREE tier retention
              }
            );
          } catch (error) {
            console.error("Failed to send expired email:", error);
          }
        }

        break;
      }

      case "schedule_downgrade": {
        const { tier, notes, downgradeDate } = body;

        const validTiers: PlanTier[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];
        if (!validTiers.includes(tier)) {
          return NextResponse.json(
            { error: "Invalid tier" },
            { status: 400 }
          );
        }

        // Can only downgrade to a lower tier
        const tierOrder = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];
        const currentIndex = tierOrder.indexOf(organization.tier);
        const targetIndex = tierOrder.indexOf(tier);
        if (targetIndex >= currentIndex) {
          return NextResponse.json(
            { error: "Can only schedule downgrade to a lower tier" },
            { status: 400 }
          );
        }

        // Use provided date, or default to subscription end > period end > now
        const effectiveDate = downgradeDate
          ? new Date(downgradeDate)
          : organization.subscriptionEndDate || organization.periodEndDate || new Date();

        await scheduleDowngrade(id, tier, effectiveDate, adminUsername, notes);

        break;
      }

      case "cancel_scheduled_downgrade": {
        const { notes } = body;

        if (!organization.scheduledDowngradeTier) {
          return NextResponse.json(
            { error: "No scheduled downgrade to cancel" },
            { status: 400 }
          );
        }

        await cancelScheduledDowngrade(id, adminUsername, notes);
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Mark ALL pending subscription requests for this org as processed
    // This handles cases where the admin processes a request differently than requested
    // (e.g., user requested cancellation but admin downgrades to a paid tier instead)
    if (action !== "update_notes" && action !== "update_billing_contact") {
      await prisma.subscriptionRequest.updateMany({
        where: {
          organizationId: id,
          status: { in: ["PENDING", "INVOICED", "PAID"] },
        },
        data: {
          status: "ACTIVATED",
          activatedAt: new Date(),
          processedBy: adminUsername,
          processingNotes: body.notes || `Processed via ${action} by ${adminUsername}`,
        },
      });
    }

    // Fetch updated organization
    const updatedOrg = await prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        tier: true,
        status: true,
        billingFrequency: true,
        monthlyQuota: true,
        mapsUsedThisPeriod: true,
        periodEndDate: true,
        subscriptionEndDate: true,
        scheduledDowngradeTier: true,
        scheduledDowngradeDate: true,
      },
    });

    return NextResponse.json({
      success: true,
      organization: updatedOrg,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
