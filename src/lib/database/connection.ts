/**
 * Barbearia La Fé — conexão central com o banco
 *
 * Banco oficial: Microsoft SQL Server
 *
 * A aplicação utiliza:
 * - query()
 * - first()
 * - execute()
 * - insert()
 * - transaction()
 * - withTransaction()
 */

import { Pool, PoolClient, types as pgTypes } from "pg";

export type Dialect = "mssql" | "postgres";

export type Params = Record<string, unknown>;

/* =========================================================
   DIALECT
   ========================================================= */

export function getDialect(): Dialect {
  const explicit = (
    process.env.DB_CLIENT || ""
  ).toLowerCase();

  if (
    explicit === "mssql" ||
    explicit === "postgres"
  ) {
    return explicit;
  }

  if (process.env.DATABASE_URL) {
    return "postgres";
  }

  return "mssql";
}

export const dialect: Dialect = getDialect();

/* =========================================================
   IDENTIFICADORES
   ========================================================= */

export function ident(name: string): string {
  return dialect === "mssql"
    ? `[${name}]`
    : `"${name}"`;
}

/* =========================================================
   LOCK DE CONCORRÊNCIA
   ========================================================= */

export function selectForUpdate(
  table: string,
  where: string,
  columns = "*",
): string {
  if (dialect === "mssql") {
    return `
      SELECT ${columns}
      FROM ${ident(table)} WITH (
        UPDLOCK,
        ROWLOCK,
        HOLDLOCK
      )
      WHERE ${where}
    `;
  }

  return `
    SELECT ${columns}
    FROM ${ident(table)}
    WHERE ${where}
    FOR UPDATE
  `;
}

/* =========================================================
   COMPILAR SQL
   ========================================================= */

export function compile(
  text: string,
  params: Params,
): {
  text: string;
  values: unknown[];
} {
  const order: string[] = [];

  const sqlText = text.replace(
    /@([a-zA-Z_][a-zA-Z0-9_]*)/g,
    (_match, name: string) => {
      if (!(name in params)) {
        throw new Error(
          `Parâmetro @${name} não informado na consulta.`,
        );
      }

      const existingIndex =
        order.indexOf(name);

      if (existingIndex === -1) {
        order.push(name);

        if (dialect === "mssql") {
          return `@${name}`;
        }

        return `$${order.length}`;
      }

      return dialect === "mssql"
        ? `@${name}`
        : `$${existingIndex + 1}`;
    },
  );

  if (dialect === "mssql") {
    return {
      text,
      values: [],
    };
  }

  return {
    text: sqlText,
    values: order.map(
      (name) => params[name],
    ),
  };
}

/* =========================================================
   SQL SERVER
   ========================================================= */

type MsRequest = {
  query: (
    text: string,
  ) => Promise<{
    recordset?: Record<string, unknown>[];
    rowsAffected?: number[];
  }>;

  input: (
    name: string,
    value: unknown,
  ) => void;
};

type MsTransaction = {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  request(): MsRequest;
};

type MsPool = {
  connect(): Promise<void>;
  request(): MsRequest;
  transaction(): MsTransaction;
  close(): Promise<void>;
};

let msPool: MsPool | null = null;

let msPoolPromise:
  | Promise<void>
  | null = null;

/* =========================================================
   POSTGRES
   ========================================================= */

let pgPool: Pool | null = null;

/* =========================================================
   CONEXÃO POSTGRES
   ========================================================= */

function pgConnection(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const {
    DB_USER,
    DB_PASSWORD,
    DB_SERVER,
    DB_PORT,
    DB_DATABASE,
  } = process.env;

  return `postgresql://${encodeURIComponent(
    DB_USER || "postgres",
  )}:${encodeURIComponent(
    DB_PASSWORD || "postgres",
  )}@${DB_SERVER || "localhost"}:${
    DB_PORT || "5432"
  }/${encodeURIComponent(
    DB_DATABASE || "la fe",
  )}`;
}

/* =========================================================
   CONEXÃO SQL SERVER
   ========================================================= */

async function getMsPool(): Promise<MsPool> {
  if (msPool) {
    return msPool;
  }

  if (!msPoolPromise) {
    msPoolPromise = (async () => {
      const mssqlModule =
        await import("mssql");

      const mssql =
        mssqlModule.default ||
        mssqlModule;

      const port = Number(
        process.env.DB_PORT || 1433,
      );

      const config = {
        server:
          process.env.DB_SERVER ||
          "localhost",

        port,

        database:
          process.env.DB_DATABASE ||
          "la fe",

        user:
          process.env.DB_USER,

        password:
          process.env.DB_PASSWORD,

        requestTimeout: 30000,

        connectionTimeout: 30000,

        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },

        options: {
          encrypt:
            String(
              process.env.DB_ENCRYPT ||
                "false",
            ) === "true",

          trustServerCertificate:
            String(
              process.env
                .DB_TRUST_SERVER_CERTIFICATE ||
                "true",
            ) === "true",

          enableArithAbort: true,
        },
      };

      const pool =
        new mssql.ConnectionPool(
          config,
        ) as unknown as MsPool;

      await pool.connect();

      msPool = pool;
    })();
  }

  await msPoolPromise;

  return msPool!;
}

/* =========================================================
   CONEXÃO POSTGRES
   ========================================================= */

function getPgPool(): Pool {
  if (!pgPool) {
    pgTypes.setTypeParser(
      20,
      (value) =>
        value === null
          ? null
          : parseInt(value, 10),
    );

    pgTypes.setTypeParser(
      1082,
      (value) => value,
    );

    pgTypes.setTypeParser(
      1083,
      (value) => value,
    );

    pgTypes.setTypeParser(
      1266,
      (value) => value,
    );

    pgTypes.setTypeParser(
      1114,
      (value) => value,
    );

    pgTypes.setTypeParser(
      1700,
      (value) =>
        value === null
          ? null
          : parseFloat(value),
    );

    pgPool = new Pool({
      connectionString:
        pgConnection(),

      max: 10,

      idleTimeoutMillis: 30000,

      connectionTimeoutMillis: 15000,
    });
  }

  return pgPool;
}

/* =========================================================
   FECHAR POOLS
   ========================================================= */

export async function closePool(): Promise<void> {
  if (pgPool) {
    await pgPool.end();
  }

  if (msPool) {
    await msPool.close();
  }

  pgPool = null;
  msPool = null;
  msPoolPromise = null;
}

/* =========================================================
   EXECUTOR
   ========================================================= */

export interface DbExecutor {
  query<T = Record<string, unknown>>(
    text: string,
    params?: Params,
  ): Promise<T[]>;

  first<T = Record<string, unknown>>(
    text: string,
    params?: Params,
  ): Promise<T | null>;

  execute(
    text: string,
    params?: Params,
  ): Promise<number>;

  insert(
    table: string,
    data: Params,
  ): Promise<number>;

  transaction<T>(
    fn: (
      tx: DbExecutor,
    ) => Promise<T>,
  ): Promise<T>;
}

/* =========================================================
   EXECUTAR SQL SERVER
   ========================================================= */

async function runMs(
  request: MsRequest,
  text: string,
  params: Params,
) {
  for (
    const [key, value] of Object.entries(
      params,
    )
  ) {
    request.input(
      key,
      value === undefined
        ? null
        : value,
    );
  }

  return request.query(text);
}

/* =========================================================
   QUERY SQL SERVER
   ========================================================= */

async function msQuery<T>(
  text: string,
  params: Params,
): Promise<T[]> {
  const pool =
    await getMsPool();

  const result = await runMs(
    pool.request(),
    text,
    params,
  );

  return (result.recordset ||
    []) as T[];
}

/* =========================================================
   QUERY POSTGRES
   ========================================================= */

async function pgQuery<T>(
  client: PoolClient,
  text: string,
  params: Params,
): Promise<T[]> {
  const compiled =
    compile(text, params);

  const result =
    await client.query(
      compiled.text,
      compiled.values,
    );

  return result.rows as T[];
}

/* =========================================================
   INSERT INTERNO
   ========================================================= */

async function insertOn(
  tx: DbExecutor,
  table: string,
  data: Params,
): Promise<number> {
  const keys =
    Object.keys(data);

  if (!keys.length) {
    throw new Error(
      "Nenhum dado informado para inserção.",
    );
  }

  const params: Params = {};

  keys.forEach(
    (key, index) => {
      params[`p${index}`] =
        data[key] === undefined
          ? null
          : data[key];
    },
  );

  const columns = keys
    .map((key) => ident(key))
    .join(", ");

  const values = keys
    .map(
      (_key, index) =>
        `@p${index}`,
    )
    .join(", ");

  const sql =
    dialect === "mssql"
      ? `
        INSERT INTO ${ident(table)}
          (${columns})
        OUTPUT INSERTED.id AS id
        VALUES (${values})
      `
      : `
        INSERT INTO ${ident(table)}
          (${columns})
        VALUES (${values})
        RETURNING id AS id
      `;

  const row =
    await tx.first<{
      id: number;
    }>(
      sql,
      params,
    );

  return Number(row?.id);
}

/* =========================================================
   TRANSAÇÃO
   ========================================================= */

export async function withTransaction<T>(
  fn: (
    tx: DbExecutor,
  ) => Promise<T>,
): Promise<T> {
  /* -------------------------------------------------------
     SQL SERVER
     ------------------------------------------------------- */

  if (dialect === "mssql") {
    const pool =
      await getMsPool();

    const transaction =
      pool.transaction();

    await transaction.begin();

    const tx: DbExecutor = {
      query: async <K>(
        text: string,
        params: Params = {},
      ): Promise<K[]> => {
        const result =
          await runMs(
            transaction.request(),
            text,
            params,
          );

        return (result.recordset ||
          []) as K[];
      },

      first: async <K>(
        text: string,
        params: Params = {},
      ): Promise<K | null> => {
        const rows =
          await tx.query<K>(
            text,
            params,
          );

        return rows.length
          ? rows[0]
          : null;
      },

      execute: async (
        text: string,
        params: Params = {},
      ): Promise<number> => {
        const result =
          await runMs(
            transaction.request(),
            text,
            params,
          );

        return (
          result.rowsAffected?.[0] ??
          0
        );
      },

      insert: (
        table: string,
        data: Params,
      ) =>
        insertOn(
          tx,
          table,
          data,
        ),

      transaction: async <K>(
        callback: (
          nestedTx: DbExecutor,
        ) => Promise<K>,
      ): Promise<K> => {
        return callback(tx);
      },
    };

    try {
      const result =
        await fn(tx);

      await transaction.commit();

      return result;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // rollback já realizado
      }

      throw error;
    }
  }

  /* -------------------------------------------------------
     POSTGRES
     ------------------------------------------------------- */

  const client =
    await getPgPool().connect();

  await client.query("BEGIN");

  const tx: DbExecutor = {
    query: <K>(
      text: string,
      params: Params = {},
    ): Promise<K[]> =>
      pgQuery<K>(
        client,
        text,
        params,
      ),

    first: async <K>(
      text: string,
      params: Params = {},
    ): Promise<K | null> => {
      const rows =
        await pgQuery<K>(
          client,
          text,
          params,
        );

      return rows.length
        ? rows[0]
        : null;
    },

    execute: async (
      text: string,
      params: Params = {},
    ): Promise<number> => {
      const compiled =
        compile(
          text,
          params,
        );

      const result =
        await client.query(
          compiled.text,
          compiled.values,
        );

      return (
        result.rowCount ?? 0
      );
    },

    insert: (
      table: string,
      data: Params,
    ) =>
      insertOn(
        tx,
        table,
        data,
      ),

    transaction: async <K>(
      callback: (
        nestedTx: DbExecutor,
      ) => Promise<K>,
    ): Promise<K> => {
      return callback(tx);
    },
  };

  try {
    const result =
      await fn(tx);

    await client.query(
      "COMMIT",
    );

    return result;
  } catch (error) {
    try {
      await client.query(
        "ROLLBACK",
      );
    } catch {
      // rollback já realizado
    }

    throw error;
  } finally {
    client.release();
  }
}

/* =========================================================
   DB PRINCIPAL
   ========================================================= */

export const db: DbExecutor = {
  async query<T>(
    text: string,
    params: Params = {},
  ): Promise<T[]> {
    if (dialect === "mssql") {
      return msQuery<T>(
        text,
        params,
      );
    }

    const client =
      await getPgPool().connect();

    try {
      return await pgQuery<T>(
        client,
        text,
        params,
      );
    } finally {
      client.release();
    }
  },

  async first<T>(
    text: string,
    params: Params = {},
  ): Promise<T | null> {
    const rows =
      await db.query<T>(
        text,
        params,
      );

    return rows.length
      ? rows[0]
      : null;
  },

  async execute(
    text: string,
    params: Params = {},
  ): Promise<number> {
    if (dialect === "mssql") {
      const pool =
        await getMsPool();

      const result =
        await runMs(
          pool.request(),
          text,
          params,
        );

      return (
        result.rowsAffected?.[0] ??
        0
      );
    }

    const client =
      await getPgPool().connect();

    try {
      const compiled =
        compile(
          text,
          params,
        );

      const result =
        await client.query(
          compiled.text,
          compiled.values,
        );

      return (
        result.rowCount ?? 0
      );
    } finally {
      client.release();
    }
  },

  async insert(
    table: string,
    data: Params,
  ): Promise<number> {
    return insertOn(
      db,
      table,
      data,
    );
  },

  async transaction<T>(
    fn: (
      tx: DbExecutor,
    ) => Promise<T>,
  ): Promise<T> {
    return withTransaction(fn);
  },
};