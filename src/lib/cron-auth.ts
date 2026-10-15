/**
 * Shared utilities for cron job endpoints
 */

import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

/**
 * Verify cron authentication using Bearer token
 */
export function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn("[Cron] CRON_SECRET not configured");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = Buffer.from(authHeader.slice(7));
  const expected = Buffer.from(cronSecret);
  return token.length === expected.length && timingSafeEqual(token, expected);
}

/**
 * Result of a cron task execution
 */
export interface TaskResult {
  task: string;
  success: boolean;
  details?: Record<string, unknown>;
  error?: string;
}
