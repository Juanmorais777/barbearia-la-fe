import { checkDatabase } from "@/lib/database/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await checkDatabase();
  if (!health.connected) {
    return Response.json(
      { success: false, message: "Banco de dados desconectado", database: health.database },
      { status: 503 },
    );
  }
  return Response.json({
    success: true,
    message: "API funcionando",
    database: "connected",
    latency_ms: health.latencyMs,
    server: process.env.DB_SERVER || "localhost",
  });
}
