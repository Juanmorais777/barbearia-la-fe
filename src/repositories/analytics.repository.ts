
import { db } from "@/lib/database/connection";
import { num } from "@/utils/datetime";

/**
 * Resumo dos agendamentos por status.
 */
export async function statusSummary(
  from: string,
  to: string,
  barberId?: number | null,
) {
  const rows = await db.query<Record<string, unknown>>(
    `
      SELECT
        status,
        COUNT(*) AS total,
        COALESCE(SUM(price), 0) AS amount
      FROM appointments
      WHERE appointment_date >= @from
        AND appointment_date <= @to
        AND (@barberId = 0 OR barber_id = @barberId)
      GROUP BY status
    `,
    {
      from,
      to,
      barberId: barberId || 0,
    },
  );

  const result: Record<
    string,
    { total: number; amount: number }
  > = {};

  for (const row of rows) {
    result[String(row.status)] = {
      total: num(row.total),
      amount: num(row.amount),
    };
  }

  return result;
}

/**
 * Serviços mais realizados.
 */
export async function serviceRanking(
  from: string,
  to: string,
  barberId?: number | null,
) {
  const rows = await db.query<Record<string, unknown>>(
    `
      SELECT
        s.name,
        COUNT(*) AS total,
        COALESCE(SUM(a.price), 0) AS revenue
      FROM appointments a
      INNER JOIN services s
        ON s.id = a.service_id
      WHERE a.status = 'CONCLUIDO'
        AND a.appointment_date >= @from
        AND a.appointment_date <= @to
        AND (@barberId = 0 OR a.barber_id = @barberId)
      GROUP BY s.name
      ORDER BY COUNT(*) DESC
    `,
    {
      from,
      to,
      barberId: barberId || 0,
    },
  );

  return rows.map((row) => ({
    name: String(row.name),
    count: num(row.total),
    revenue: num(row.revenue),
  }));
}

/**
 * Desempenho dos barbeiros.
 */
export async function barberRanking(
  from: string,
  to: string,
) {
  const rows = await db.query<Record<string, unknown>>(
    `
      SELECT
        b.name,
        COUNT(*) AS total,
        COALESCE(SUM(a.price), 0) AS revenue
      FROM appointments a
      INNER JOIN barbers b
        ON b.id = a.barber_id
      WHERE a.status = 'CONCLUIDO'
        AND a.appointment_date >= @from
        AND a.appointment_date <= @to
      GROUP BY b.name
      ORDER BY COALESCE(SUM(a.price), 0) DESC
    `,
    {
      from,
      to,
    },
  );

  return rows.map((row) => ({
    name: String(row.name),
    count: num(row.total),
    revenue: num(row.revenue),
  }));
}

/**
 * Faturamento por dia.
 *
 * Compatível com PostgreSQL / Neon.
 *
 * Receitas:
 *   appointments concluídos
 *
 * Despesas:
 *   transactions com type = EXPENSE
 */
export async function revenueByDay(
  from: string,
  to: string,
) {
  const rows = await db.query<Record<string, unknown>>(
    `
      SELECT
        d.date_value,
        COALESCE(
          (
            SELECT SUM(a.price)
            FROM appointments a
            WHERE a.appointment_date = d.date_value
              AND a.status = 'CONCLUIDO'
          ),
          0
        ) AS income,
        COALESCE(
          (
            SELECT SUM(t.amount)
            FROM transactions t
            WHERE t.transaction_date = d.date_value
              AND t.type = 'EXPENSE'
          ),
          0
        ) AS expense
      FROM (
        SELECT DISTINCT appointment_date AS date_value
        FROM appointments
        WHERE appointment_date >= @from
          AND appointment_date <= @to

        UNION

        SELECT DISTINCT transaction_date AS date_value
        FROM transactions
        WHERE transaction_date >= @from
          AND transaction_date <= @to
      ) d
      ORDER BY d.date_value ASC
    `,
    {
      from,
      to,
    },
  );

  return rows.map((row) => ({
    date: String(row.date_value),
    income: num(row.income),
    expense: num(row.expense),
  }));
}

/**
 * Formas de pagamento utilizadas nas receitas.
 */
export async function paymentBreakdown(
  from: string,
  to: string,
) {
  const rows = await db.query<Record<string, unknown>>(
    `
      SELECT
        payment_method,
        COALESCE(SUM(amount), 0) AS amount
      FROM transactions
      WHERE type = 'INCOME'
        AND transaction_date >= @from
        AND transaction_date <= @to
        AND payment_method IS NOT NULL
      GROUP BY payment_method
      ORDER BY COALESCE(SUM(amount), 0) DESC
    `,
    {
      from,
      to,
    },
  );

  return rows.map((row) => ({
    method: String(row.payment_method),
    amount: num(row.amount),
  }));
}

/**
 * Despesas agrupadas por categoria.
 */
export async function expensesByCategory(
  from: string,
  to: string,
) {
  const rows = await db.query<Record<string, unknown>>(
    `
      SELECT
        category,
        COALESCE(SUM(amount), 0) AS amount
      FROM transactions
      WHERE type = 'EXPENSE'
        AND transaction_date >= @from
        AND transaction_date <= @to
      GROUP BY category
      ORDER BY COALESCE(SUM(amount), 0) DESC
    `,
    {
      from,
      to,
    },
  );

  return rows.map((row) => ({
    category: String(row.category),
    amount: num(row.amount),
  }));
}

/**
 * Produtos vendidos.
 *
 * A tabela product_sales usa total_price.
 */
export async function productsSold(
  from: string,
  to: string,
) {
  const rows = await db.query<Record<string, unknown>>(
    `
      SELECT
        p.name,
        COALESCE(SUM(ps.quantity), 0) AS quantity,
        COALESCE(SUM(ps.total_price), 0) AS revenue
      FROM product_sales ps
      INNER JOIN products p
        ON p.id = ps.product_id
      WHERE ps.created_at >= @from
        AND ps.created_at <= @to
      GROUP BY p.name
      ORDER BY COALESCE(SUM(ps.total_price), 0) DESC
    `,
    {
      from: `${from} 00:00:00`,
      to: `${to} 23:59:59`,
    },
  );

  return rows.map((row) => ({
    name: String(row.name),
    quantity: num(row.quantity),
    revenue: num(row.revenue),
  }));
}

/**
 * Quantidade de clientes atendidos.
 */
export async function customersServed(
  from: string,
  to: string,
) {
  const row = await db.first<{ total: number }>(
    `
      SELECT
        COUNT(DISTINCT customer_id) AS total
      FROM appointments
      WHERE status = 'CONCLUIDO'
        AND appointment_date >= @from
        AND appointment_date <= @to
    `,
    {
      from,
      to,
    },
  );

  return num(row?.total);
}

/**
 * Novos clientes cadastrados.
 */
export async function newCustomers(
  from: string,
  to: string,
) {
  const row = await db.first<{ total: number }>(
    `
      SELECT
        COUNT(*) AS total
      FROM customers
      WHERE created_at >= @from
        AND created_at <= @to
    `,
    {
      from: `${from} 00:00:00`,
      to: `${to} 23:59:59`,
    },
  );

  return num(row?.total);
}

