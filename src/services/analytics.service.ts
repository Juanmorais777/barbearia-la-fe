import * as analyticsRepo from "@/repositories/analytics.repository";
import * as appointmentsRepo from "@/repositories/appointments.repository";
import * as productsRepo from "@/repositories/products.repository";
import * as scheduleRepo from "@/repositories/schedule.repository";
import * as financeRepo from "@/repositories/finance.repository";

import { addDays, todayISO } from "@/utils/datetime";

import type {
  AppointmentStatus,
  DashboardData,
} from "@/types";

/* =========================================================
   INTERVALO DO MÊS
   ========================================================= */

function monthRange(date: string) {
  const start = `${date.slice(0, 7)}-01`;

  const [year, month] = date
    .split("-")
    .map(Number);

  const lastDay = new Date(
    year,
    month,
    0,
  ).getDate();

  return {
    start,
    end: `${date.slice(0, 7)}-${String(
      lastDay,
    ).padStart(2, "0")}`,
  };
}

/* =========================================================
   DASHBOARD
   ========================================================= */

export async function dashboard(): Promise<DashboardData> {
  const today = todayISO();

  const month = monthRange(today);

  const [
    todaySummary,
    monthSummary,
    revenueDay,
    revenueMonth,
    commissions,
    upcoming,
    topServices,
    barberPerformance,
    lowStock,
    blocks,
  ] = await Promise.all([
    /* Agendamentos de hoje */
    analyticsRepo.statusSummary(
      today,
      today,
    ),

    /* Resumo do mês */
    analyticsRepo.statusSummary(
      month.start,
      month.end,
    ),

    /* Faturamento de hoje */
    analyticsRepo.revenueByDay(
      today,
      today,
    ),

    /* Faturamento do mês */
    analyticsRepo.revenueByDay(
      month.start,
      month.end,
    ),

    /* Comissões */
    financeRepo.commissionSummary({
      from: month.start,
      to: month.end,
    }),

    /* Próximos agendamentos */
    appointmentsRepo.list(
      {
        from: today,
        upcoming: true,
      },
      8,
    ),

    /* Serviços mais realizados */
    analyticsRepo.serviceRanking(
      month.start,
      month.end,
    ),

    /* Desempenho dos barbeiros */
    analyticsRepo.barberRanking(
      month.start,
      month.end,
    ),

    /* Produtos com estoque baixo */
    productsRepo.list({
      activeOnly: true,
      lowStock: true,
    }),

    /* Bloqueios próximos */
    scheduleRepo.getBlockedTimes({
      from: today,
      to: addDays(today, 15),
      activeOnly: true,
    }),
  ]);

  /* =========================================================
     FATURAMENTO
     ========================================================= */

  const revenueDayIncome =
    revenueDay.reduce(
      (total, row) =>
        total + Number(row.income || 0),
      0,
    );

  const revenueMonthIncome =
    revenueMonth.reduce(
      (total, row) =>
        total + Number(row.income || 0),
      0,
    );

  const revenueMonthExpense =
    revenueMonth.reduce(
      (total, row) =>
        total + Number(row.expense || 0),
      0,
    );

  /* =========================================================
     STATUS
     ========================================================= */

  const statusCount = (
    summary: Record<
      string,
      {
        total: number;
        amount: number;
      }
    >,
    status: AppointmentStatus,
  ) => {
    return Number(
      summary[status]?.total || 0,
    );
  };

  const get = (
    status: AppointmentStatus,
  ) => statusCount(
    todaySummary,
    status,
  );

  /* =========================================================
     RETORNO
     ========================================================= */

  return {
    today,

    counters: {
      today_appointments:
        Object.values(todaySummary)
          .reduce(
            (total, item) =>
              total +
              Number(item.total || 0),
            0,
          ),

      pending: get("PENDENTE"),

      confirmed: get("CONFIRMADO"),

      in_progress:
        get("EM_ATENDIMENTO"),

      completed:
        get("CONCLUIDO"),

      cancelled:
        get("CANCELADO"),
    },

    revenue: {
      day: revenueDayIncome,

      month: revenueMonthIncome,

      expenses_month:
        revenueMonthExpense,

      profit_month:
        revenueMonthIncome -
        revenueMonthExpense,
    },

    commissions: {
      pending:
        Number(commissions.pending || 0),

      paid:
        Number(commissions.paid || 0),
    },

    next_appointments:
      upcoming,

    top_services:
      topServices.slice(0, 5),

    barber_performance:
      barberPerformance,

    low_stock:
      lowStock.map((product) => ({
        id: product.id,

        name: product.name,

        stock: product.stock,

        minimum_stock:
          product.minimum_stock,
      })),

    upcoming_blocks:
      blocks.slice(0, 8),

    month_summary:
      monthSummary,
  };
}

/* =========================================================
   RELATÓRIOS
   ========================================================= */

export async function reports(
  filters: {
    from?: string | null;
    to?: string | null;
    barber_id?: number | null;
  },
) {
  const today = todayISO();

  const from =
    filters.from ||
    addDays(today, -30);

  const to =
    filters.to ||
    today;

  const barberId =
    filters.barber_id || null;

  const [
    daily,
    services,
    barbers,
    payments,
    expenses,
    products,
    customers,
    statuses,
  ] = await Promise.all([
    analyticsRepo.revenueByDay(
      from,
      to,
    ),

    analyticsRepo.serviceRanking(
      from,
      to,
      barberId,
    ),

    analyticsRepo.barberRanking(
      from,
      to,
    ),

    analyticsRepo.paymentBreakdown(
      from,
      to,
    ),

    analyticsRepo.expensesByCategory(
      from,
      to,
    ),

    analyticsRepo.productsSold(
      from,
      to,
    ),

    analyticsRepo.customersServed(
      from,
      to,
    ),

    analyticsRepo.statusSummary(
      from,
      to,
      barberId,
    ),
  ]);

  const income =
    daily.reduce(
      (total, row) =>
        total +
        Number(row.income || 0),
      0,
    );

  const expense =
    daily.reduce(
      (total, row) =>
        total +
        Number(row.expense || 0),
      0,
    );

  return {
    period: {
      from,
      to,
    },

    income,

    expense,

    profit:
      income - expense,

    customers_served:
      customers,

    daily,

    services,

    barbers,

    payments,

    expenses,

    products,

    statuses,
  };
}
