import { db, type DbExecutor } from "@/lib/database/connection";
import { num, toDate, toDateTime } from "@/utils/datetime";
import { notFound } from "@/lib/api/response";
import type { Commission, PaymentMethod, Transaction } from "@/types";

/* -------------------------- TRANSAÇÕES ----------------------------- */

function mapTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: Number(row.id),
    type: String(row.type) as Transaction["type"],
    category: String(row.category),
    description: String(row.description),
    amount: num(row.amount),
    payment_method: row.payment_method
      ? (String(row.payment_method) as PaymentMethod)
      : null,

    // O banco atual não possui reference_type/reference_id
    reference_type: null,
    reference_id: null,

    transaction_date: toDate(row.transaction_date) as string,
    created_at: toDateTime(row.created_at),
  };
}

export async function listTransactions(filters: {
  from?: string | null;
  to?: string | null;
  type?: string | null;
  payment_method?: string | null;
  category?: string | null;
}): Promise<Transaction[]> {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.from) {
    conditions.push("transaction_date >= @from");
    params.from = filters.from;
  }

  if (filters.to) {
    conditions.push("transaction_date <= @to");
    params.to = filters.to;
  }

  if (filters.type) {
    conditions.push("type = @type");
    params.type = filters.type;
  }

  if (filters.payment_method) {
    conditions.push("payment_method = @method");
    params.method = filters.payment_method;
  }

  if (filters.category) {
    conditions.push("category = @category");
    params.category = filters.category;
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const rows = await db.query<Record<string, unknown>>(
    `SELECT * 
       FROM transactions
       ${where}
       ORDER BY transaction_date DESC, id DESC`,
    params,
  );

  return rows.map(mapTransaction);
}

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
    payment_method: data.payment_method,
    transaction_date: data.transaction_date,

    // Relaciona automaticamente com o registro correto,
    // usando as colunas que realmente existem no banco.
    appointment_id:
      data.reference_type === "APPOINTMENT"
        ? data.reference_id ?? null
        : null,

    product_sale_id:
      data.reference_type === "PRODUCT_SALE"
        ? data.reference_id ?? null
        : null,
  });
}

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
  } else if (referenceType === "PRODUCT_SALE") {
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

  const row = await db.first<Record<string, unknown>>(query, params);

  return row ? mapTransaction(row) : null;
}

/* --------------------------- COMISSÕES ----------------------------- */

const COMMISSION_SELECT = `
  SELECT
    cm.id,
    cm.appointment_id,
    cm.barber_id,
    cm.service_id,

    b.name AS barber_name,
    c.name AS customer_name,
    s.name AS service_name,

    a.appointment_date,

    cm.appointment_price,
    cm.commission_percentage,
    cm.commission_amount,

    cm.status,
    cm.created_at

  FROM commissions cm

  JOIN barbers b
    ON b.id = cm.barber_id

  JOIN appointments a
    ON a.id = cm.appointment_id

  JOIN customers c
    ON c.id = a.customer_id

  JOIN services s
    ON s.id = a.service_id
`;

function mapCommission(
  row: Record<string, unknown>,
): Commission {
  return {
    id: Number(row.id),

    appointment_id: Number(row.appointment_id),

    barber_id: Number(row.barber_id),

    barber_name: String(row.barber_name),

    customer_name: String(row.customer_name),

    service_name: String(row.service_name),

    date: toDate(row.appointment_date) as string,

    // Banco:
    // appointment_price
    // commission_percentage
    // commission_amount

    base_amount: num(row.appointment_price),

    percent: num(row.commission_percentage),

    amount: num(row.commission_amount),

    status: String(row.status) as Commission["status"],

    // A tabela atual não possui paid_at.
    paid_at: null,

    created_at: toDateTime(row.created_at),
  };
}

export async function listCommissions(filters: {
  from?: string | null;
  to?: string | null;
  barber_id?: number | null;
  status?: string | null;
}): Promise<Commission[]> {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.from) {
    conditions.push("a.appointment_date >= @from");
    params.from = filters.from;
  }

  if (filters.to) {
    conditions.push("a.appointment_date <= @to");
    params.to = filters.to;
  }

  if (filters.barber_id) {
    conditions.push("cm.barber_id = @barberId");
    params.barberId = filters.barber_id;
  }

  if (filters.status) {
    conditions.push("cm.status = @status");
    params.status = filters.status;
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const rows = await db.query<Record<string, unknown>>(
    `${COMMISSION_SELECT}
     ${where}
     ORDER BY a.appointment_date DESC, cm.id DESC`,
    params,
  );

  return rows.map(mapCommission);
}

export async function findCommissionByAppointment(
  appointmentId: number,
): Promise<Commission | null> {
  const rows = await db.query<Record<string, unknown>>(
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

export async function findCommissionById(
  id: number,
): Promise<Commission> {
  const rows = await db.query<Record<string, unknown>>(
    `${COMMISSION_SELECT}
     WHERE cm.id = @id`,
    {
      id,
    },
  );

  if (!rows.length) {
    throw notFound("Comissão não encontrada.");
  }

  return mapCommission(rows[0]);
}

/* ---------------------- CRIAR COMISSÃO ----------------------------- */

export async function createCommission(
  executor: DbExecutor,
  data: {
    appointment_id: number;
    barber_id: number;
    service_id: number;
    base_amount: number;
    percent: number;
    amount: number;
  },
): Promise<number> {
  return executor.insert("commissions", {
    appointment_id: data.appointment_id,
    barber_id: data.barber_id,
    service_id: data.service_id,

    appointment_price: data.base_amount,
    commission_percentage: data.percent,
    commission_amount: data.amount,

    status: "PENDENTE",
  });
}

/* ---------------------- PAGAR COMISSÃO ----------------------------- */

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
  await executor.insert("commission_payments", {
    barber_id: data.barberId,
    amount: data.amount,
    notes: data.notes,
    paid_by: data.paidBy,
  });

  await executor.execute(
    `UPDATE commissions
      SET status = @status
    WHERE id = @commissionId`,
    {
      status: "PAGO",
      commissionId: data.commissionId,
    },
  );
}

/* ---------------------- RESUMO COMISSÕES --------------------------- */

export async function commissionSummary(filters: {
  from?: string | null;
  to?: string | null;
  barber_id?: number | null;
}) {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.from) {
    conditions.push("a.appointment_date >= @from");
    params.from = filters.from;
  }

  if (filters.to) {
    conditions.push("a.appointment_date <= @to");
    params.to = filters.to;
  }

  if (filters.barber_id) {
    conditions.push("cm.barber_id = @barberId");
    params.barberId = filters.barber_id;
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const rows = await db.query<Record<string, unknown>>(
    `
      SELECT
        cm.status,
        COUNT(*) AS total,
        SUM(cm.commission_amount) AS amount

      FROM commissions cm

      JOIN appointments a
        ON a.id = cm.appointment_id

      ${where}

      GROUP BY cm.status
    `,
    params,
  );

  const summary = {
    pending: 0,
    paid: 0,
  };

  for (const row of rows) {
    if (String(row.status) === "PAGO") {
      summary.paid += num(row.amount);
    } else {
      summary.pending += num(row.amount);
    }
  }

  return summary;
}