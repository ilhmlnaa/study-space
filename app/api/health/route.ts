import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Health check endpoint.
 *
 * Returns:
 *   200 if the server is up and the database is reachable
 *   503 if the database query fails
 *
 * Used by Docker `HEALTHCHECK` and external monitors. Keeps the payload
 * small and avoids any auth so probes can hit it without credentials.
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        uptime: process.uptime(),
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/health]", error);

    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Database not reachable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
