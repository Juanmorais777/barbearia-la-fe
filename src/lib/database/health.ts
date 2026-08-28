import { db } from "@/lib/database/connection";

export type HealthResult = {
  connected: boolean;
  database: string;
  message: string;
  latencyMs: number;
};

export async function checkDatabase(): Promise<HealthResult> {
  const started = Date.now();
  try {
    const row = await db.first<{ connected: number | boolean }>("SELECT 1 AS connected");
    const connected = row !== null;
    return {
      connected,
      database: process.env.DB_DATABASE || "la fe",
      message: connected ? "SQL Server conectado com sucesso." : "Banco sem resposta.",
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    console.error("[La Fé] Falha ao conectar no banco:", error);
    return {
      connected: false,
      database: process.env.DB_DATABASE || "la fe",
      message: "Banco de dados desconectado",
      latencyMs: Date.now() - started,
    };
  }
}
