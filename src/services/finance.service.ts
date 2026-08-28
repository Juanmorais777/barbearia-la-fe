import { conflict } from "@/lib/api/response";
import { withTransaction } from "@/lib/database/connection";
import * as financeRepo from "@/repositories/finance.repository";
import * as analyticsRepo from "@/repositories/analytics.repository";
import * as productsRepo from "@/repositories/products.repository";
import { addDays, todayISO } from "@/utils/datetime";
import type { Commission, PaymentMethod, Transaction } from "@/types";

export async function listTransactions(filters: {
  from?: string | null;
  to?: string | null;
  type?: string | null;
  payment_method?: string | null;
  category?: string | null;
}): Promise<Transaction[]> {
  return financeRepo.listTransactions(filters);
}

/** Lançamento manual (receita ou despesa) feito pelo administrador. */
export async function createTransaction(
  input: {
    type: "INCOME" | "EXPENSE";
    category: string;
    description: string;
    amount: number;
    payment_method: PaymentMethod;
    transaction_date?: string;
  },
  adminId?: number | null,
): Promise<Transaction> {
  const date = input.transaction_date || todayISO();
  const id = await withTransaction(async (tx) =>
    financeRepo.createTransaction(tx, {
      type: input.type,
      category: input.category,
      description: input.description,
      amount: input.amount,
      payment_method: input.payment_method,
      transaction_date: date,
      created_by: adminId ?? null,
    }),
  );
  const rows = await financeRepo.listTransactions({ from: date, to: date });
  const created = rows.find((item) => item.id === Number(id));
  if (!created) throw conflict("Não foi possível localizar o lançamento criado.");
  return created;
}

export async function financeSummary(filters: { from?: string | null; to?: string | null } = {}) {
  const today = todayISO();
  const from = filters.from || addDays(today, -30);
  const to = filters.to || today;
  const weekStart = addDays(today, -6);
  const monthStart = `${today.slice(0, 7)}-01`;

  const [period, day, week, month, byPayment, expenses] = await Promise.all([
    financeRepo.listTransactions({ from, to }),
    financeRepo.listTransactions({ from: today, to: today }),
    financeRepo.listTransactions({ from: weekStart, to: today }),
    financeRepo.listTransactions({ from: monthStart, to: today }),
    financeRepo.listTransactions({ from, to }),
    analyticsRepo.expensesByCategory(from, to),
  ]);

  const sum = (rows: Transaction[], type: "INCOME" | "EXPENSE") =>
    rows.filter((row) => row.type === type).reduce((total, row) => total + row.amount, 0);

  const daily = Array.from(
    period.reduce((map, row) => {
      const key = row.transaction_date.slice(0, 10);
      const current = map.get(key) ?? { date: key, income: 0, expense: 0 };
      if (row.type === "INCOME") current.income += row.amount;
      if (row.type === "EXPENSE") current.expense += row.amount;
      map.set(key, current);
      return map;
    }, new Map<string, { date: string; income: number; expense: number }>()),
  ).map(([, value]) => value);

  const income = sum(period, "INCOME");
  const expense = sum(period, "EXPENSE");

  const paymentMap = new Map<string, number>();
  for (const row of byPayment) {
    if (row.type !== "INCOME" || !row.payment_method) continue;
    paymentMap.set(row.payment_method, (paymentMap.get(row.payment_method) || 0) + row.amount);
  }

  const barberRevenue = new Map<string, number>();
  for (const row of period) {
    if (row.type !== "INCOME" || row.category !== "SERVICO") continue;
    barberRevenue.set(row.category, (barberRevenue.get(row.category) || 0) + row.amount);
  }

  return {
    period: { from, to },
    income,
    expense,
    profit: income - expense,
    income_day: sum(day, "INCOME"),
    expense_day: sum(day, "EXPENSE"),
    income_week: sum(week, "INCOME"),
    income_month: sum(month, "INCOME"),
    expense_month: sum(month, "EXPENSE"),
    by_payment: Array.from(paymentMap.entries()).map(([method, amount]) => ({ method, amount })),
    by_expense_category: expenses,
    daily,
    transactions: period.slice(0, 200),
  };
}

export async function listCommissions(filters: {
  from?: string | null;
  to?: string | null;
  barber_id?: number | null;
  status?: string | null;
}): Promise<Commission[]> {
  return financeRepo.listCommissions(filters);
}

export async function commissionsSummary(filters: { from?: string | null; to?: string | null; barber_id?: number | null }) {
  return financeRepo.commissionSummary(filters);
}

export async function payCommission(id: number, notes: string | null, adminId?: number | null) {
  const commission = await financeRepo.findCommissionById(id);
  if (commission.status === "PAGA") throw conflict("Esta comissão já foi paga.");
  await withTransaction(async (tx) => {
    await financeRepo.payCommission(tx, {
      commissionId: id,
      barberId: commission.barber_id,
      amount: commission.amount,
      notes: notes,
      paidBy: adminId ?? null,
    });
    await financeRepo.createTransaction(tx, {
      type: "EXPENSE",
      category: "COMISSAO",
      description: `Comissão ${commission.barber_name} - atendimento #${commission.appointment_id}`,
      amount: commission.amount,
      payment_method: "DINHEIRO",
      reference_type: "COMMISSION",
      reference_id: id,
      transaction_date: todayISO(),
      created_by: adminId ?? null,
    });
  });
  return financeRepo.findCommissionById(id);
}

export async function productSalesReport(from: string, to: string) {
  return productsRepo.listSales({ from, to });
}
