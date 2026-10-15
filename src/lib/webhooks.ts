// src/lib/webhooks.ts
// Webhook service for sending notifications to external systems

import crypto from "crypto";
import { prisma } from "./prisma";

export type WebhookEventType =
  | "new_user_registered"
  | "new_org_created"
  | "subscription_requested"
  | "subscription_activated"
  | "maps_depleted"
  | "professional_at_limit";

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Sign a webhook payload for verification by the receiver
 */
export function signWebhookPayload(payload: string): string {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("WEBHOOK_SECRET not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
}

/**
 * Queue a webhook event for delivery
 */
export async function queueWebhook(
  eventType: WebhookEventType,
  data: Record<string, unknown>
): Promise<string | null> {
  // Skip if no webhook URL configured
  if (!process.env.WEBHOOK_URL) {
    console.log(`[Webhook] No WEBHOOK_URL configured, skipping ${eventType}`);
    return null;
  }

  const payload: WebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data,
  };

  const webhook = await prisma.webhookQueue.create({
    data: {
      eventType,
      payload: JSON.stringify(payload),
      nextAttempt: new Date(),
    },
  });

  console.log(`[Webhook] Queued ${eventType} webhook: ${webhook.id}`);
  return webhook.id;
}

/**
 * Process pending webhooks from the queue
 */
export async function processWebhookQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const pending = await prisma.webhookQueue.findMany({
    where: {
      status: "pending",
      nextAttempt: { lte: new Date() },
    },
    take: 10, // Small batch to avoid overwhelming Zapier
    orderBy: { createdAt: "asc" },
  });

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const webhook = pending[i];

    // Add delay between webhooks to avoid rate limiting (skip delay for first one)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
    try {
      const signature = signWebhookPayload(webhook.payload);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": webhook.eventType,
        },
        body: webhook.payload,
      });

      if (response.ok) {
        await prisma.webhookQueue.update({
          where: { id: webhook.id },
          data: {
            status: "completed",
            lastAttempt: new Date(),
          },
        });
        succeeded++;
        console.log(`[Webhook] Successfully delivered ${webhook.eventType}: ${webhook.id}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const attempts = webhook.attempts + 1;
      // Exponential backoff: 2^attempts minutes (2, 4, 8, 16, 32 min)
      const nextAttemptMs = Math.pow(2, attempts) * 60000;
      const nextAttempt = new Date(Date.now() + nextAttemptMs);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      const isFinalAttempt = attempts >= webhook.maxAttempts;

      await prisma.webhookQueue.update({
        where: { id: webhook.id },
        data: {
          attempts,
          lastAttempt: new Date(),
          nextAttempt: isFinalAttempt ? null : nextAttempt,
          error: errorMessage,
          status: isFinalAttempt ? "failed" : "pending",
        },
      });

      if (isFinalAttempt) {
        failed++;
        console.error(
          `[Webhook] Failed permanently after ${attempts} attempts: ${webhook.id}`,
          errorMessage
        );
      } else {
        console.warn(
          `[Webhook] Attempt ${attempts} failed for ${webhook.id}, next attempt at ${nextAttempt.toISOString()}:`,
          errorMessage
        );
      }
    }
  }

  return { processed: pending.length, succeeded, failed };
}

/**
 * Clean up old completed/failed webhooks
 */
export async function cleanupOldWebhooks(daysOld: number = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  const result = await prisma.webhookQueue.deleteMany({
    where: {
      status: { in: ["completed", "failed"] },
      createdAt: { lt: cutoff },
    },
  });

  if (result.count > 0) {
    console.log(`[Webhook] Cleaned up ${result.count} old webhooks`);
  }

  return result.count;
}

// === Webhook Event Helpers ===

/**
 * Queue webhook for new user registration
 */
export async function webhookNewUserRegistered(data: {
  userId: string;
  username: string;
  email?: string;
  displayName?: string;
  organizationId: string;
  organizationName: string;
  isNewOrg: boolean;
  isOrgAdmin: boolean;
}): Promise<void> {
  await queueWebhook("new_user_registered", data);
}

/**
 * Queue webhook for new organization created
 */
export async function webhookNewOrgCreated(data: {
  organizationId: string;
  organizationName: string;
  arcgisOrgId: string;
  creatingUserId: string;
  creatingUsername: string;
}): Promise<void> {
  await queueWebhook("new_org_created", data);
}

/**
 * Queue webhook for subscription request submitted
 */
export async function webhookSubscriptionRequested(data: {
  requestId: string;
  organizationId: string;
  organizationName: string;
  requestedTier: string;
  billingFrequency: string;
  contactName: string;
  contactEmail: string;
}): Promise<void> {
  await queueWebhook("subscription_requested", data);
}

/**
 * Queue webhook for subscription activated
 */
export async function webhookSubscriptionActivated(data: {
  organizationId: string;
  organizationName: string;
  tier: string;
  billingFrequency: string;
  monthlyQuota: number | null;
  periodEndDate: string;
}): Promise<void> {
  await queueWebhook("subscription_activated", data);
}

/**
 * Queue webhook when org is fully at limit (no monthly quota or bonus credits left)
 */
export async function webhookMapsDepleted(data: {
  organizationId: string;
  organizationName: string;
  tier: string;
  mapsUsedThisPeriod: number;
  periodEndDate: string;
}): Promise<void> {
  await queueWebhook("maps_depleted", data);
}

/**
 * Queue webhook when Professional tier org hits their limit (upsell opportunity)
 */
export async function webhookProfessionalAtLimit(data: {
  organizationId: string;
  organizationName: string;
  mapsUsed: number;
  billingContactEmail?: string;
}): Promise<void> {
  await queueWebhook("professional_at_limit", data);
}
