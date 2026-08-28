import * as analyticsRepo from "@/repositories/analytics.repository";
import * as appointmentsRepo from "@/repositories/appointments.repository";
import * as productsRepo from "@/repositories/products.repository";
import * as scheduleRepo from "@/repositories/schedule.repository";
import * as financeRepo from "@/repositories/finance.repository";
import { addDays, todayISO } from "@/utils/datetime";
import type { AppointmentStatus, DashboardData } from "@/types";

function monthRange(date: string) {
  const start = `${date.slice(0, 7)}-01`;
  const [year, month] = date.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { start, end: `${date.slice(0, 7)}-${String(lastDay).padStart(2, "0")}` };
}

async function revenueByDay(from: string, to: string) {
  const repository = analyticsRepo as typeof analyticsRepo & {
    revenueByDay?: (from: string, to: string) => Promise<{ income: number; expense: number }[]>;
  };

  return repository.revenueByDay?.(from, to) ?? [];
}

export async function dashboard(): Promise<DashboardData> {
  const today = todayISO();
  const month = monthRange(today);

  const [todaySummary, monthSummary, revenueDay, revenueMonth, commissions, upcoming, topServices, barberPerformance, lowStock, blocks] =
    await Promise.all([
      analyticsRepo.statusSummary(today, today),
      analyticsRepo.statusSummary(month.start, month.end),
      revenueByDay(today, today),
      revenueByDay(month.start, month.end),
      financeRepo.commissionSummary({ from: month.start, to: month.end }),
      appointmentsRepo.list({ from: today, upcoming: true }, 8),
      analyticsRepo.serviceRanking(month.start, month.end),
      analyticsRepo.barberRanking(month.start, month.end),
      productsRepo.list({ activeOnly: true, lowStock: true }),
      scheduleRepo.getBlockedTimes({ from: today, to: addDays(today, 15), activeOnly: true }),
    ]);

  const revenueDayIncome = (revenueDay as { income: number }[]).reduce((total, row) => total + row.income, 0);
  const revenueMonthIncome = (revenueMonth as { income: number }[]).reduce((total, row) => total + row.income, 0);
  const revenueMonthExpense = (revenueMonth as { expense: number }[]).reduce((total, row) => total + row.expense, 0);
  const statusCount = (summary: Record<string, { total: number; amount: number }>, status: AppointmentStatus) =>
    summary[status]?.total ?? 0;
  const get = (status: AppointmentStatus) => statusCount(todaySummary, status);

  return {
    today,
    counters: {
      today_appointments: (Object.values(todaySummary) as { total: number }[]).reduce((total, item) => total + item.total, 0),
      pending: get("PENDENTE"),
      confirmed: get("CONFIRMADO"),
      in_progress: get("EM_ATENDIMENTO"),
      completed: get("CONCLUIDO"),
      cancelled: get("CANCELADO"),
    },
    revenue: {
      day: revenueDayIncome,
      month: revenueMonthIncome,
      expenses_month: revenueMonthExpense,
      profit_month: revenueMonthIncome - revenueMonthExpense,
    },
    commissions: {
      pending: commissions.pending,
      paid: commissions.paid,
    },
    next_appointments: upcoming,
    top_services: topServices.slice(0, 5),
    barber_performance: barberPerformance,
    low_stock: lowStock.map((product: (typeof lowStock)[number]) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      minimum_stock: product.minimum_stock,
    })),
    upcoming_blocks: blocks.slice(0, 8),
    month_summary: monthSummary,
  };
}

export async function reports(filters: { from?: string | null; to?: string | null; barber_id?: number | null }) {
  const today = todayISO();
  const from = filters.from || addDays(today, -30);
  const to = filters.to || today;
  const barberId = filters.barber_id || null;

  const [daily, services, barbers, payments, expenses, products, customers, statuses] = await Promise.all([
    revenueByDay(from, to),
    analyticsRepo.serviceRanking(from, to, barberId),
    analyticsRepo.barberRanking(from, to),
    analyticsRepo.paymentBreakdown(from, to),
    analyticsRepo.expensesByCategory(from, to),
    analyticsRepo.productsSold(from, to),
    analyticsRepo.customersServed(from, to),
    analyticsRepo.statusSummary(from, to, barberId),
  ]);

  const income = daily.reduce((total: number, row: { income: number }) => total + row.income, 0);
  const expense = daily.reduce((total: number, row: { expense: number }) => total + row.expense, 0);

  return {
    period: { from, to },
    income,
    expense,
    profit: income - expense,
    customers_served: customers,
    daily,
    services,
    barbers,
    payments,
    expenses,
    products,
    statuses,
  };
}
