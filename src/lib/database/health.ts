
import { db, dialect } from "@/lib/database/connection";

export type HealthResult = {
  connected: boolean;
  database: string;
  message: string;
  latencyMs: number;
};

export async function checkDatabase(): Promise<HealthResult> {
  const started = Date.now();

  try {
    const row = await db.first<{ connected: number }>(
      "SELECT 1 AS connected",
    );

    const connected = row !== null;

    const database =
      dialect === "postgres"
        ? "Neon PostgreSQL"
        : process.env.DB_DATABASE || "SQL Server";

    return {
      connected,
      database,
      message: connected
        ? `${database} conectado com sucesso.`
        : "Banco sem resposta.",
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    console.error(
      "[La Fé] Falha ao conectar no banco:",
      error,
    );

    const database =
      dialect === "postgres"
        ? "Neon PostgreSQL"
        : process.env.DB_DATABASE || "SQL Server";

    return {
      connected: false,
      database,
      message: "Banco de dados desconectado",
      latencyMs: Date.now() - started,
    };
  }
}

