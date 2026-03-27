import { NextResponse } from "next/server";

import { db } from "@rankforge/db";

import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const checks = {
    database: false,
    queue: env.QUEUE_DRIVER === "inline" ? true : Boolean(env.REDIS_URL)
  };

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        checks,
        error: error instanceof Error ? error.message : "Database healthcheck failed."
      },
      { status: 503 }
    );
  }

  const ok = checks.database && checks.queue;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      checks
    },
    { status: ok ? 200 : 503 }
  );
}
