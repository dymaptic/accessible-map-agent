import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancer probes
 *
 * Returns:
 * - 200 OK: App is healthy, database is connected
 * - 503 Service Unavailable: Database connection failed
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity with a simple query
    await prisma.$queryRaw`SELECT 1`;

    const duration = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {
        database: "connected",
      },
      duration: `${duration}ms`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error("[Health] Database check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        checks: {
          database: "disconnected",
        },
        error: error instanceof Error ? error.message : "Database connection failed",
        duration: `${duration}ms`,
      },
      { status: 503 }
    );
  }
}
