import { checkDatabase } from "@/lib/database/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await checkDatabase();

  if (!health.connected) {
    return Response.json(
      {
        success: false,
        message: health.message,
        database: health.database,
      },
      { status: 503 },
    );
  }

  return Response.json({
    success: true,
    message: "API funcionando",
    database: health.database,
    latency_ms: health.latencyMs,
  });
}