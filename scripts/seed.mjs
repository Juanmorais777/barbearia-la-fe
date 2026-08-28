
/**
 * BARBEARIA LA FÉ
 *
 * Seed oficial para Neon PostgreSQL.
 *
 * Executa:
 * 1. database/postgres/01-schema.sql
 * 2. database/postgres/02-seed.sql
 * 3. cria/atualiza o administrador inicial
 *
 * Idempotente: pode ser executado várias vezes.
 */

import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está definida.");
  process.exit(1);
}

/* =========================================================
   LER ARQUIVO SQL
   ========================================================= */

function readSql(file) {
  const full = path.join(root, file);

  if (!existsSync(full)) {
    throw new Error(`Arquivo não encontrado: ${file}`);
  }

  return readFileSync(full, "utf8");
}

/* =========================================================
   DIVIDIR SQL POSTGRES
   ========================================================= */

function splitPg(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => `${chunk};`);
}

/* =========================================================
   CONECTAR NEON
   ========================================================= */

async function withClient(run) {
  const { Client } = await import("pg");

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await client.connect();

  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

/* =========================================================
   EXECUTAR SCHEMA + SEED
   ========================================================= */

await withClient(async (client) => {
  const files = [
    "database/postgres/01-schema.sql",
    "database/postgres/02-seed.sql",
  ];

  for (const file of files) {
    console.log(`\n📄 Executando ${file}...`);

    const sql = readSql(file);
    const statements = splitPg(sql);

    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);

        /*
         * Alguns objetos podem já existir.
         * Como os arquivos usam IF NOT EXISTS,
         * normalmente não haverá erro aqui.
         */
        if (/already exists/i.test(message)) {
          console.warn(`⚠️ Objeto já existe: ${message}`);
          continue;
        }

        console.error(`❌ Erro em ${file}:`);
        console.error(message);
        throw error;
      }
    }

    console.log(`✅ ${file} concluído.`);
  }
});

/* =========================================================
   ADMINISTRADOR
   ========================================================= */

const { default: bcrypt } = await import("bcryptjs");

const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name =
  (process.env.ADMIN_NAME || "Administrador").trim();

if (!email || !password) {
  console.warn(
    "\n⚠️ ADMIN_EMAIL ou ADMIN_PASSWORD não estão definidos."
  );

  console.log(
    "O banco foi preparado, mas o administrador não foi criado."
  );

  process.exit(0);
}

const hash = await bcrypt.hash(password, 10);

await withClient(async (client) => {
  const result = await client.query(
    `
      SELECT id
      FROM admins
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  if (result.rows.length > 0) {
    await client.query(
      `
        UPDATE admins
        SET
          name = $1,
          password_hash = $2,
          role = 'OWNER',
          active = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `,
      [name, hash, result.rows[0].id]
    );

    console.log(
      `\n✅ Administrador atualizado: ${email}`
    );
  } else {
    await client.query(
      `
        INSERT INTO admins
          (
            name,
            email,
            password_hash,
            role,
            active
          )
        VALUES
          (
            $1,
            $2,
            $3,
            'OWNER',
            1
          )
      `,
      [name, email, hash]
    );

    console.log(
      `\n✅ Administrador criado: ${email}`
    );
  }
});

console.log("\n========================================");
console.log("✅ SEED CONCLUÍDO COM SUCESSO");
console.log("========================================");
console.log("Banco: Neon PostgreSQL");
console.log("Schema: criado/verificado");
console.log("Dados: criado/verificado");
console.log("Administrador: criado/atualizado");
console.log("========================================\n");

