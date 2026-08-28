#!/usr/bin/env node
/**
 * npm run db:test
 * Testa a conexão com o banco configurado no .env.
 * Banco oficial: SQL Server 2019 (mssql). Adaptador local: postgres.
 */
import "dotenv/config";

const dialect = (process.env.DB_CLIENT || (process.env.DATABASE_URL ? "postgres" : "mssql")).toLowerCase();

async function testPostgres() {
  const { Client } = await import("pg");
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
  });
  await client.connect();
  const result = await client.query("SELECT 1 AS connected");
  await client.end();
  return result.rowCount === 1;
}

async function testMssql() {
    const mssqlModule = await import("mssql");
    const mssql = mssqlModule.default || mssqlModule;
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
  const result = await pool.request().query("SELECT 1 AS connected");
  await pool.close();
  return result.recordset.length === 1;
}

try {
  const ok = dialect === "mssql" ? await testMssql() : await testPostgres();
  if (!ok) throw new Error("Consulta de teste não retornou resultado.");
  console.log(`SQL Server conectado com sucesso. (dialect: ${dialect}, banco: ${process.env.DB_DATABASE || "la fe"})`);
  process.exit(0);
} catch (error) {
  console.error("Falha na conexão com o banco:", error.message);
  process.exit(1);
}
