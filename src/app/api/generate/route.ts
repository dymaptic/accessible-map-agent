import { getSession } from "@/lib/auth";
import { getAnthropic } from "@/lib/anthropic";
import { reverseGeocode } from "@/lib/arcgis";
import { consumeGeneration, recordGeneration } from "@/lib/generations";
import { getQuotaStatus } from "@/lib/subscriptions";
import { ACCESSIBILITY_AGENT_PROMPT } from "@/lib/prompts/accessibility-agent";
import type { MapMetadata } from "@/lib/map-utils";
import { prisma } from "@/lib/prisma";
import {
  sendUsageWarningEmail,
  sendQuotaExhaustedEmail,
  sendFullyAtLimitEmail,
  notifyAdminsProfessionalAtLimit,
} from "@/lib/email";
import { webhookMapsDepleted, webhookProfessionalAtLimit } from "@/lib/webhooks";

interface GeocodeResult {
  address: string;
  city?: string;
  region?: string;
  country?: string;
}

/**
 * Build the user prompt with map metadata and geocode result
 */
function buildPrompt(mapData: MapMetadata, geocodeResult: GeocodeResult): string {
  const locationStr = [
    geocodeResult.city,
    geocodeResult.region,
    geocodeResult.country,
  ]
    .filter(Boolean)
    .join(", ");

  return `Please generate an accessible description for this map.

## Map Metadata

**Map Title**: ${mapData.mapTitle}
${mapData.mapDescription ? `**Description**: ${mapData.mapDescription}` : ""}

**Geographic Center**: ${locationStr || "Unknown location"}
- Latitude: ${mapData.scaleInfo.center.latitude.toFixed(4)}
- Longitude: ${mapData.scaleInfo.center.longitude.toFixed(4)}

**Scale Information**:
- Scale: 1:${mapData.scaleInfo.scale.toLocaleString()}
- Zoom Level: ${mapData.scaleInfo.zoom}
- Scale Category: ${mapData.scaleInfo.category}

**Layers**:
${JSON.stringify(mapData.layers, null, 2)}

Please analyze the screenshot image and use this metadata to generate a comprehensive, ADA-compliant description following the format specified in your instructions.`;
}

export async function POST(request: Request) {
  // 1. Authenticate
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Check quota
  const quotaStatus = await getQuotaStatus(session.user.organizationId);
  if (!quotaStatus.canGenerate) {
    return new Response(
      JSON.stringify({
        error: quotaStatus.limitMessage || "No generations remaining",
        quotaStatus,
      }),
      {
        status: 402,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 3. Parse form data
  let mapData: MapMetadata;
  let screenshotBase64: string;

  try {
    const formData = await request.formData();
    const screenshot = formData.get("screenshot") as File;
    const mapDataStr = formData.get("mapData") as string;

    if (!screenshot || !mapDataStr) {
      return new Response(
        JSON.stringify({ error: "Missing screenshot or mapData" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    mapData = JSON.parse(mapDataStr);

    // Convert screenshot to base64
    const screenshotBuffer = await screenshot.arrayBuffer();
    screenshotBase64 = Buffer.from(screenshotBuffer).toString("base64");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid form data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Reverse geocode center point
  let geocodeResult: GeocodeResult = { address: "" };
  try {
    geocodeResult = await reverseGeocode(
      mapData.scaleInfo.center.longitude,
      mapData.scaleInfo.center.latitude
    );
  } catch (err) {
    console.error("Geocoding failed:", err);
    // Continue without geocode - not critical
  }

  // 5. Build prompt
  const userPrompt = buildPrompt(mapData, geocodeResult);

  // 6. Create streaming response
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start Claude streaming in background
  (async () => {
    let fullDescription = "";

    try {
      const response = await getAnthropic().messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 8192,
        system: ACCESSIBILITY_AGENT_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: screenshotBase64,
                },
              },
              {
                type: "text",
                text: userPrompt,
              },
            ],
          },
        ],
      });

      // Stream handling
      for await (const event of response) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          const text = event.delta.text;
          fullDescription += text;

          await writer.write(
            encoder.encode(
              JSON.stringify({ type: "delta", content: text }) + "\n"
            )
          );
        }
      }

      // 7. Consume generation credit
      const consumption = await consumeGeneration(session.user.organizationId);

      if (!consumption.success) {
        await writer.write(
          encoder.encode(
            JSON.stringify({
              type: "error",
              message: consumption.error || "Failed to consume generation credit",
            }) + "\n"
          )
        );
        return;
      }

      // 8. Save to database and increment cumulative counters
      const generationId = await recordGeneration({
        orgId: session.user.organizationId,
        userId: session.user.id,
        mapTitle: mapData.mapTitle || "Untitled Map",
        mapId: mapData.mapId || null,
        description: fullDescription,
        creditSource: consumption.creditSource!,
        expiresAt: consumption.expiresAt,
      });

      // Send completion message
      await writer.write(
        encoder.encode(
          JSON.stringify({
            type: "done",
            generationId,
            wordCount: fullDescription.split(/\s+/).length,
            creditSource: consumption.creditSource,
          }) + "\n"
        )
      );

      // Check usage levels and send appropriate emails (async, don't block response)
      checkUsageAndNotify(session.user.organizationId).catch((err) => {
        console.error("Failed to check usage notifications:", err);
      });
    } catch (error) {
      console.error("Generation error:", error);
      await writer.write(
        encoder.encode(
          JSON.stringify({
            type: "error",
            message:
              error instanceof Error ? error.message : "Generation failed",
          }) + "\n"
        )
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * Check usage levels after a generation and send appropriate notification emails
 */
async function checkUsageAndNotify(orgId: string): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      name: true,
      tier: true,
      monthlyQuota: true,
      mapsUsedThisPeriod: true,
      periodEndDate: true,
      billingContactEmail: true,
      usageWarning80Sent: true,
      quotaExhaustedNotified: true,
      fullyAtLimitNotified: true,
    },
  });

  if (!org || !org.billingContactEmail || org.tier === "FREE") return;
  if (!org.monthlyQuota) return; // Enterprise unlimited

  // Get total remaining bonus credits (sum of creditsRemaining for non-expired credits)
  const bonusCreditsResult = await prisma.bonusCredit.aggregate({
    where: {
      organizationId: orgId,
      expirationDate: { gt: new Date() },
      creditsRemaining: { gt: 0 },
    },
    _sum: { creditsRemaining: true },
  });

  const used = org.mapsUsedThisPeriod;
  const quota = org.monthlyQuota;
  const bonusCredits = bonusCreditsResult._sum.creditsRemaining || 0;
  const percentUsed = (used / quota) * 100;
  const periodEnd = org.periodEndDate?.toLocaleDateString() || "N/A";

  // Check if at 80% usage (and haven't notified yet)
  if (percentUsed >= 80 && percentUsed < 100 && !org.usageWarning80Sent) {
    await sendUsageWarningEmail(org.billingContactEmail, {
      orgName: org.name,
      used,
      quota,
      periodEnd,
      bonusCredits,
    });
    await prisma.organization.update({
      where: { id: orgId },
      data: { usageWarning80Sent: true },
    });
  }

  // Check if monthly quota exhausted (now using bonus credits)
  if (used >= quota && bonusCredits > 0 && !org.quotaExhaustedNotified) {
    await sendQuotaExhaustedEmail(org.billingContactEmail, {
      orgName: org.name,
      bonusCredits,
      periodEnd,
    });
    await prisma.organization.update({
      where: { id: orgId },
      data: { quotaExhaustedNotified: true },
    });
  }

  // Check if fully at limit (quota + bonus exhausted)
  if (used >= quota && bonusCredits === 0 && !org.fullyAtLimitNotified) {
    await sendFullyAtLimitEmail(org.billingContactEmail, {
      orgName: org.name,
      periodEnd,
      tier: org.tier,
    });
    await prisma.organization.update({
      where: { id: orgId },
      data: { fullyAtLimitNotified: true },
    });

    // Also notify admins for Professional tier (upsell opportunity)
    if (org.tier === "PROFESSIONAL") {
      await notifyAdminsProfessionalAtLimit({
        orgName: org.name,
        mapsUsed: used,
        contactEmail: org.billingContactEmail,
      });

      // Queue webhook for external systems
      await webhookProfessionalAtLimit({
        organizationId: orgId,
        organizationName: org.name,
        mapsUsed: used,
        billingContactEmail: org.billingContactEmail,
      });
    }

    // Queue webhook for maps depleted (any tier)
    await webhookMapsDepleted({
      organizationId: orgId,
      organizationName: org.name,
      tier: org.tier,
      mapsUsedThisPeriod: used,
      periodEndDate: periodEnd,
    });
  }
}
