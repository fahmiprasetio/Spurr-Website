import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown database error";
  }
}

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "connected",
      provider: "postgresql",
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        provider: "postgresql",
        latencyMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString(),
        error: getSafeErrorMessage(error),
      },
      { status: 503 }
    );
  }
}
