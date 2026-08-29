import { db, type DbExecutor } from "@/lib/database/connection";
import {
  num,
  toDate,
  toDateTime,
} from "@/utils/datetime";
import { notFound } from "@/lib/api/response";
import type {
  Commission,
  PaymentMethod,
  Transaction,
} from "@/types";

/* =========================================================
   TRANSAÇÕES
   ========================================================= */

function mapTransaction(
  row: Record<string, unknown>,
): Transaction {
  return {
    id: Number(row.id),

    type:
      String(row.type) as Transaction["type"],

    category:
      String(row.category ?? ""),

    description:
      String(row.description ?? ""),

    amount:
      num(row.amount),

    payment_method:
      row.payment_method != null
        ? (String(row.payment_method) as PaymentMethod)
        : null,

    reference_type:
      row.reference_type != null
        ? String(row.reference_type)
        : null,

    reference_id:
      row.reference_id != null
        ? Number(row.reference_id)
        : null,

    transaction_date:
      toDate(row.transaction_date) as string,

    created_at:
      toDateTime(row.created_at),
  };
}

/* =========================================================
   LISTAR TRANSAÇÕES
   ========================================================= */

export async function listTransactions(
  filters: {
    from?: string | null;
    to?: string | null;
    type?: string | null;
    payment_method?: string | null;
    category?: string | null;
  },
): Promise<Transaction[]> {
  const conditions: string[] = [];

  const params: Record<string, unknown> = {};

  if (filters.from) {
    conditions.push(
      "transaction_date >= @from",
    );

    params.from = filters.from;
  }

  if (filters.to) {
    conditions.push(
      "transaction_date <= @to",
    );

    params.to = filters.to;
  }

  if (filters.type) {
    conditions.push(
      "type = @type",
    );

    params.type = filters.type;
  }

  if (filters.payment_method) {
    conditions.push(
      "payment_method = @method",
    );

    params.method =
      filters.payment_method;
  }

  if (filters.category) {
    conditions.push(
      "category = @category",
    );

    params.category =
      filters.category;
  }

  const where =
    conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const rows =
    await db.query<Record<string, unknown>>(
      `SELECT *
       FROM transactions
       ${where}
       ORDER BY
         transaction_date DESC,
         id DESC`,
      params,
    );

  return rows.map(mapTransaction);
}

/* =========================================================
   CRIAR TRANSAÇÃO
   ========================================================= */

export async function createTransaction(
  executor: DbExecutor,
  data: {
    type: "INCOME" | "EXPENSE";
    category: string;
    description: string;
    amount: number;
    payment_method: string | null;
    reference_type?: string | null;
    reference_id?: number | null;
    transaction_date: string;
    created_by?: number | null;
  },
): Promise<number> {
  return executor.insert("transactions", {
    type: data.type,

    category: data.category,

    description: data.description,

    amount: data.amount,

    payment_method:
      data.payment_method,

    reference_type:
      data.reference_type ?? null,

    reference_id:
      data.reference_id ?? null,

    transaction_date:
      data.transaction_date,

    created_by:
      data.created_by ?? null,
  });
}

/* =========================================================
   BUSCAR TRANSAÇÃO POR REFERÊNCIA
   ========================================================= */

export async function findTransactionByReference(
  referenceType: string,
  referenceId: number,
): Promise<Transaction | null> {
  let query = "";

  let params: Record<string, unknown> = {};

  if (referenceType === "APPOINTMENT") {
    query = `
      SELECT *
      FROM transactions
      WHERE appointment_id = @referenceId
    `;

    params = {
      referenceId,
    };
  } else if (
    referenceType === "PRODUCT_SALE"
  ) {
    query = `
      SELECT *
      FROM transactions
      WHERE product_sale_id = @referenceId
    `;

    params = {
      referenceId,
    };
  } else {
    return null;
  }

  const row =
    await db.first<Record<string, unknown>>(
      query,
      params,
    );

  return row
    ? mapTransaction(row)
    : null;
}

/* =========================================================
   COMISSÕES
   =========================================================

   Estrutura do banco:

   commissions
   ├── id
   ├── appointment_id
   ├── barber_id
   ├── base_amount
   ├── percent
   ├── amount
   ├── status
   ├── paid_at
   ├── created_at
   └── updated_at

   commission_payments
   ├── id
   ├── commission_id
   ├── barber_id
   ├── amount
   ├── note
   ├── paid_by
   ├── paid_at
   ├── created_at
   └── notes

   IMPORTANTE:

   commissions NÃO possui service_id.

   O serviço é obtido através de:

   commissions
       ↓ appointment_id
   appointments
       ↓ service_id
   services
   ========================================================= */

const COMMISSION_SELECT = `
  SELECT
    cm.id,
    cm.appointment_id,
    cm.barber_id,

    b.name AS barber_name,

    c.name AS customer_name,

    s.name AS service_name,

    a.appointment_date,

    cm.base_amount,
    cm.percent,
    cm.amount,

    cm.status,
    cm.paid_at,
    cm.created_at,
    cm.updated_at

  FROM commissions cm

  INNER JOIN barbers b
    ON b.id = cm.barber_id

  INNER JOIN appointments a
    ON a.id = cm.appointment_id

  INNER JOIN customers c
    ON c.id = a.customer_id

  INNER JOIN services s
    ON s.id = a.service_id
`;

/* =========================================================
   MAPEAR COMISSÃO
   ========================================================= */

function mapCommission(
  row: Record<string, unknown>,
): Commission {
  return {
    id:
      Number(row.id),

    appointment_id:
      Number(row.appointment_id),

    barber_id:
      Number(row.barber_id),

    barber_name:
      String(row.barber_name ?? ""),

    customer_name:
      String(row.customer_name ?? ""),

    service_name:
      String(row.service_name ?? ""),

    date:
      toDate(
        row.appointment_date,
      ) as string,

    base_amount:
      num(row.base_amount),

    percent:
      num(row.percent),

    amount:
      num(row.amount),

    status:
      String(
        row.status ?? "PENDENTE",
      ) as Commission["status"],

    paid_at:
      row.paid_at != null
        ? toDateTime(row.paid_at)
        : null,

    created_at:
      toDateTime(row.created_at),
  };
}

/* =========================================================
   LISTAR COMISSÕES
   ========================================================= */

export async function listCommissions(
  filters: {
    from?: string | null;
    to?: string | null;
    barber_id?: number | null;
    status?: string | null;
  },
): Promise<Commission[]> {
  const conditions: string[] = [];

  const params: Record<string, unknown> = {};

  if (filters.from) {
    conditions.push(
      "a.appointment_date >= @from",
    );

    params.from =
      filters.from;
  }

  if (filters.to) {
    conditions.push(
      "a.appointment_date <= @to",
    );

    params.to =
      filters.to;
  }

  if (filters.barber_id != null) {
    conditions.push(
      "cm.barber_id = @barberId",
    );

    params.barberId =
      filters.barber_id;
  }

  if (filters.status) {
    conditions.push(
      "cm.status = @status",
    );

    params.status =
      filters.status;
  }

  const where =
    conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const rows =
    await db.query<Record<string, unknown>>(
      `${COMMISSION_SELECT}
       ${where}
       ORDER BY
         a.appointment_date DESC,
         cm.id DESC`,
      params,
    );

  return rows.map(mapCommission);
}

/* =========================================================
   BUSCAR COMISSÃO PELO AGENDAMENTO
   ========================================================= */

export async function findCommissionByAppointment(
  appointmentId: number,
): Promise<Commission | null> {
  const rows =
    await db.query<Record<string, unknown>>(
      `${COMMISSION_SELECT}
       WHERE cm.appointment_id = @appointmentId`,
      {
        appointmentId,
      },
    );

  return rows.length
    ? mapCommission(rows[0])
    : null;
}

/* =========================================================
   BUSCAR COMISSÃO POR ID
   ========================================================= */

export async function findCommissionById(
  id: number,
): Promise<Commission> {
  const rows =
    await db.query<Record<string, unknown>>(
      `${COMMISSION_SELECT}
       WHERE cm.id = @id`,
      {
        id,
      },
    );

  if (!rows.length) {
    throw notFound(
      "Comissão não encontrada.",
    );
  }

  return mapCommission(rows[0]);
}

/* =========================================================
   CRIAR COMISSÃO
   =========================================================

   NÃO enviar service_id.

   O serviço pertence ao appointment.
   ========================================================= */

export async function createCommission(
  executor: DbExecutor,
  data: {
    appointment_id: number;
    barber_id: number;
    base_amount: number;
    percent: number;
    amount: number;
  },
): Promise<number> {
  return executor.insert("commissions", {
    appointment_id:
      data.appointment_id,

    barber_id:
      data.barber_id,

    base_amount:
      data.base_amount,

    percent:
      data.percent,

    amount:
      data.amount,

    status:
      "PENDENTE",
  });
}

/* =========================================================
   PAGAR COMISSÃO
   =========================================================

   IMPORTANTE:

   commission_payments possui commission_id como
   NOT NULL.

   Portanto o pagamento precisa informar:

   commission_id
   barber_id
   amount
   notes
   paid_by
   paid_at
   ========================================================= */

export async function payCommission(
  executor: DbExecutor,
  data: {
    commissionId: number;
    barberId: number;
    amount: number;
    notes: string | null;
    paidBy: number | null;
  },
): Promise<void> {
  /* -------------------------------------------------------
     1. REGISTRAR PAGAMENTO
     ------------------------------------------------------- */

  await executor.insert(
    "commission_payments",
    {
      commission_id:
        data.commissionId,

      barber_id:
        data.barberId,

      amount:
        data.amount,

      notes:
        data.notes,

      paid_by:
        data.paidBy,

      paid_at:
        new Date(),
    },
  );

  /* -------------------------------------------------------
     2. MARCAR COMISSÃO COMO PAGA
     ------------------------------------------------------- */

  await executor.execute(
    `UPDATE commissions
        SET
          status = @status,
          paid_at = @paidAt,
          updated_at = @updatedAt
      WHERE id = @commissionId`,
    {
      status:
        "PAGO",

      paidAt:
        new Date(),

      updatedAt:
        new Date(),

      commissionId:
        data.commissionId,
    },
  );
}

/* =========================================================
   RESUMO DE COMISSÕES
   ========================================================= */

export async function commissionSummary(
  filters: {
    from?: string | null;
    to?: string | null;
    barber_id?: number | null;
  },
) {
  const conditions: string[] = [];

  const params: Record<string, unknown> = {};

  if (filters.from) {
    conditions.push(
      "a.appointment_date >= @from",
    );

    params.from =
      filters.from;
  }

  if (filters.to) {
    conditions.push(
      "a.appointment_date <= @to",
    );

    params.to =
      filters.to;
  }

  if (filters.barber_id != null) {
    conditions.push(
      "cm.barber_id = @barberId",
    );

    params.barberId =
      filters.barber_id;
  }

  const where =
    conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const rows =
    await db.query<Record<string, unknown>>(
      `
        SELECT
          cm.status,
          COUNT(*) AS total,
          SUM(cm.amount) AS amount

        FROM commissions cm

        INNER JOIN appointments a
          ON a.id = cm.appointment_id

        ${where}

        GROUP BY
          cm.status
      `,
      params,
    );

  const summary = {
    pending: 0,
    paid: 0,
  };

  for (const row of rows) {
    if (
      String(row.status) ===
      "PAGO"
    ) {
      summary.paid += num(
        row.amount,
      );
    } else {
      summary.pending += num(
        row.amount,
      );
    }
  }

  return summary;
}

