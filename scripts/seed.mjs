#!/usr/bin/env node
/**
 * npm run db:seed
 * 1) Executa os scripts de estrutura/seed do banco configurado.
 * 2) Cria o administrador inicial com hash bcrypt (ADMIN_EMAIL / ADMIN_PASSWORD).
 * Idempotente: pode ser executado várias vezes.
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const dialect = (process.env.DB_CLIENT || (process.env.DATABASE_URL ? "postgres" : "mssql")).toLowerCase();
const root = process.cwd();

function readSql(file) {
  const full = path.join(root, file);
  if (!existsSync(full)) return null;
  return readFileSync(full, "utf8");
}

function splitTsql(sql) {
  return sql
    .split(/^\s*GO\s*$/gim)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function splitPg(sql) {
  return sql
    .split(/;\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => (chunk.endsWith(";") ? chunk : `${chunk};`));
}

async function withClient(run) {
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
    try {
      return await run(async (statement) => {
        await pool.request().query(statement);
      });
    } finally {
      await pool.close();
    }
  }

  const { Client } = await import("pg");
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
  });
  await client.connect();
  try {
    return await run(async (statement) => {
      await client.query(statement);
    });
  } finally {
    await client.end();
  }
}

const files =
  dialect === "mssql"
    ? ["database/02-create-tables.sql", "database/03-seed-data.sql", "database/04-indexes.sql"]
    : ["database/postgres/01-schema.sql", "database/postgres/02-seed.sql"];

await withClient(async (execute) => {
  for (const file of files) {
    const sql = readSql(file);
    if (!sql) {
      console.warn(`Arquivo não encontrado: ${file}`);
      continue;
    }
    const statements = dialect === "mssql" ? splitTsql(sql) : splitPg(sql);
    for (const statement of statements) {
      try {
        await execute(statement);
      } catch (error) {
        // Objetos já existentes não interrompem o seed.
        if (/already exists|There is already|existe/i.test(error.message)) continue;
        throw error;
      }
    }
    console.log(`✔ ${file}`);
  }
});

// Administrador inicial (bcrypt)
const { default: bcrypt } = await import("bcryptjs");
const email = (process.env.ADMIN_EMAIL || "").toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "Administrador";

if (!email || !password) {
  console.warn("⚠ ADMIN_EMAIL/ADMIN_PASSWORD não definidos no .env — administrador não criado.");
  process.exit(0);
}

const hash = await bcrypt.hash(password, 10);
await withClient(async (execute) => {
  const check =
    dialect === "mssql"
      ? `SELECT id FROM admins WHERE email = N'${email.replace(/'/g, "''")}'`
      : `SELECT id FROM admins WHERE email = '${email.replace(/'/g, "''")}'`;
  const existing = await execute(check);
  const command = existing
    ? `UPDATE admins SET password_hash = '${hash}', name = '${name.replace(/'/g, "''")}', updated_at = CURRENT_TIMESTAMP WHERE email = '${email.replace(/'/g, "''")}'`
    : `INSERT INTO admins (name, email, password_hash, role, active) VALUES ('${name.replace(/'/g, "''")}', '${email.replace(/'/g, "''")}', '${hash}', 'OWNER', 1)`;
  await execute(command);
});

console.log("✔ Administrador inicial garantido.");
console.log(`SQL Server (dialect ${dialect}) semeado com sucesso. Login: ${email}`);
