#!/usr/bin/env node
/**
 * npm run db:reset
 * USO EXCLUSIVO EM DESENVOLVIMENTO. Apaga tabelas e dados.
 * Nunca é executado automaticamente pela aplicação.
 */
import "dotenv/config";
import readline from "node:readline/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

const dialect = (process.env.DB_CLIENT || (process.env.DATABASE_URL ? "postgres" : "mssql")).toLowerCase();
const root = process.cwd();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question(
  `ATENÇÃO: isto vai APAGAR todas as tabelas e dados do banco "${process.env.DB_DATABASE || "la fe"}". Digite RESET para confirmar: `,
);
rl.close();

if (answer.trim() !== "RESET") {
  console.log("Operação cancelada.");
  process.exit(0);
}

const file = dialect === "mssql" ? "database/05-reset-database.sql" : "database/postgres/reset.sql";
const sql = readFileSync(path.join(root, file), "utf8");
const statements = (dialect === "mssql" ? sql.split(/^\s*GO\s*$/gim) : sql.split(/;\s*\n/))
  .map((chunk) => chunk.trim())
  .filter(Boolean);

async function run() {
  if (dialect === "mssql") {
    const mssql = await import("mssql");
    const pool = new mssql.ConnectionPool({
      server: process.env.DB_SERVER || "localhost",
      port: Number(process.env.DB_PORT || 1433),
      database: process.env.DB_DATABASE || "la fe",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: String(process.env.DB_ENCRYPT || "false") === "true",
        trustServerCertificate: String(process.env.DB_TRUST_SERVER_CERTIFICATE || "true") === "true",
      },
    });
    await pool.connect();
    for (const statement of statements) await pool.request().query(statement);
    await pool.close();
    return;
  }

  const { Client } = await import("pg");
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
  });
  await client.connect();
  for (const statement of statements) {
    const text = statement.endsWith(";") ? statement : `${statement};`;
    await client.query(text);
  }
  await client.end();
}

try {
  await run();
  console.log("Banco limpo. Execute `npm run db:seed` para recriar a estrutura e o seed.");
} catch (error) {
  console.error("Falha ao limpar o banco:", error.message);
  process.exit(1);
}
