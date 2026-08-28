import { db } from "@/lib/database/connection";
import { num } from "@/utils/datetime";

export async function statusSummary(from: string, to: string, barberId?: number | null) {
  const rows = await db.query<Record<string, unknown>>(
    `SELECT status, COUNT(*) AS total, SUM(price) AS amount
       FROM appointments
      WHERE appointment_date >= @from AND appointment_date <= @to
        AND (@barberId = 0 OR barber_id = @barberId)
      GROUP BY status`,
    { from, to, barberId: barberId || 0 },
  );
  const result: Record<string, { total: number; amount: number }> = {};
  for (const row of rows) {
    result[String(row.status)] = { total: num(row.total), amount: num(row.amount) };
  }
  return result;
}

export async function serviceRanking(from: string, to: string, barberId?: number | null) {
  const rows = await db.query<Record<string, unknown>>(
    `SELECT s.name, COUNT(*) AS total, SUM(a.price) AS revenue
       FROM appointments a
       JOIN services s ON s.id = a.service_id
      WHERE a.status = 'CONCLUIDO'
        AND a.appointment_date >= @from AND a.appointment_date <= @to
        AND (@barberId = 0 OR a.barber_id = @barberId)
        AND (@serviceName = '' OR s.name = @serviceName)
      GROUP BY s.name
      ORDER BY COUNT(*) DESC`,
    { from, to, barberId: barberId || 0, serviceName: "" },
  );
  return rows.map((row) => ({ name: String(row.name), count: num(row.total), revenue: num(row.revenue) }));
}

export async function barberRanking(from: string, to: string) {
  const rows = await db.query<Record<string, unknown>>(
    `SELECT b.name, COUNT(*) AS total, SUM(a.price) AS revenue
       FROM appointments a
       JOIN barbers b ON b.id = a.barber_id
      WHERE a.status = 'CONCLUIDO'
        AND a.appointment_date >= @from AND a.appointment_date <= @to
      GROUP BY b.name
      ORDER BY SUM(a.price) DESC`,
    { from, to },
  );
  return rows.map((row) => ({ name: String(row.name), count: num(row.total), revenue: num(row.revenue) }));
}

export async function paymentBreakdown(from: string, to: string) {
  const rows = await db.query<Record<string, unknown>>(
    `SELECT payment_method, SUM(amount) AS amount
       FROM transactions
      WHERE type = 'INCOME'
        AND transaction_date >= @from AND transaction_date <= @to
        AND payment_method IS NOT NULL
      GROUP BY payment_method`,
    { from, to },
  );
  return rows.map((row) => ({ method: String(row.payment_method), amount: num(row.amount) }));
}

export async function expensesByCategory(from: string, to: string) {
  const rows = await db.query<Record<string, unknown>>(
    `SELECT category, SUM(amount) AS amount
       FROM transactions
      WHERE type = 'EXPENSE'
        AND transaction_date >= @from AND transaction_date <= @to
      GROUP BY category
      ORDER BY SUM(amount) DESC`,
    { from, to },
  );
  return rows.map((row) => ({ category: String(row.category), amount: num(row.amount) }));
}

export async function productsSold(from: string, to: string) {
  const rows = await db.query<Record<string, unknown>>(
    `SELECT
        p.name,
        SUM(ps.quantity) AS quantity,
        SUM(ps.total_price) AS revenue
     FROM product_sales ps
     JOIN products p ON p.id = ps.product_id
     WHERE ps.created_at >= @from
       AND ps.created_at <= @to
     GROUP BY p.name
     ORDER BY SUM(ps.total_price) DESC`,
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

export async function customersServed(from: string, to: string) {
  const row = await db.first<{ total: number }>(
    `SELECT COUNT(DISTINCT customer_id) AS total
       FROM appointments
      WHERE status = 'CONCLUIDO'
        AND appointment_date >= @from AND appointment_date <= @to`,
    { from, to },
  );
  return num(row?.total);
}

export async function newCustomers(from: string, to: string) {
  const row = await db.first<{ total: number }>(
    "SELECT COUNT(*) AS total FROM customers WHERE created_at >= @from AND created_at <= @to",
    { from: `${from} 00:00:00`, to: `${to} 23:59:59` },
  );
  return num(row?.total);
}
