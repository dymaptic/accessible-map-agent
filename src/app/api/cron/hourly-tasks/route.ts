/**
 * Hourly Tasks Cron Endpoint
 *
 * This endpoint runs hourly via Azure WebJob or external cron service.
 * It handles time-sensitive tasks that need frequent processing:
 * 1. Process webhook queue (send queued webhooks to external systems)
 *
 * Authentication: Bearer token via CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth, TaskResult } from "@/lib/cron-auth";
import { processWebhookQueue } from "@/lib/webhooks";

export async function POST(request: NextRequest) {
  // Verify authentication
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: TaskResult[] = [];
  const startTime = Date.now();

  console.log("[Cron] Starting hourly tasks...");

  // 1. Process webhook queue
  try {
    const webhookResults = await processWebhookQueue();
    results.push({
      task: "process_webhook_queue",
      success: true,
      details: webhookResults,
    });
  } catch (error) {
    results.push({
      task: "process_webhook_queue",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const duration = Date.now() - startTime;
  const allSucceeded = results.every((r) => r.success);

  console.log(
    `[Cron] Hourly tasks completed in ${duration}ms. ${results.filter((r) => r.success).length}/${results.length} tasks succeeded.`
  );

  return NextResponse.json({
    success: allSucceeded,
    duration: `${duration}ms`,
    results,
  });
}

// Also support GET for manual trigger during development
export async function GET(request: NextRequest) {
  // In development, allow GET without auth
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Use POST with Bearer token in production" },
      { status: 405 }
    );
  }

  // Simulate POST request
  return POST(request);
}
