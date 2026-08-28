"use client";

import { useState } from "react";
import { dateBR, money, todayISO, useApi } from "@/hooks/useApi";
import {
  Card,
  Empty,
  ErrorBox,
  Loading,
  Stat,
  btnGhost,
  inputClass,
  labelClass,
} from "@/components/ui";
import { PAYMENT_LABELS } from "@/lib/constants";
import type { Barber } from "@/types";

type Report = {
  period: { from: string; to: string };
  income: number;
  expense: number;
  profit: number;
  customers_served: number;
  daily: {
    date: string;
    income: number;
    expense: number;
  }[];
  services: {
    name: string;
    count: number;
    revenue: number;
  }[];
  barbers: {
    name: string;
    count: number;
    revenue: number;
  }[];
  payments: {
    method: string;
    amount: number;
  }[];
  expenses: {
    category: string;
    amount: number;
  }[];
  products: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
};

/**
 * Formata datas vindas diretamente do SQL Server.
 *
 * Exemplo:
 * "2026-08-25" -> "25/08/2026"
 */
function formatReportDate(date: string) {
  if (!date) return "-";

  const cleanDate = String(date).slice(0, 10);
  const parts = cleanDate.split("-");

  if (parts.length !== 3) {
    return cleanDate;
  }

  const [year, month, day] = parts;

  if (!year || !month || !day) {
    return cleanDate;
  }

  return `${day}/${month}/${year}`;
}

export default function ReportsPage() {
  const [from, setFrom] = useState(
    `${todayISO().slice(0, 7)}-01`,
  );

  const [to, setTo] = useState(todayISO());

  const [barberId, setBarberId] = useState("");

  const {
    data,
    loading,
    error,
    reload,
  } = useApi<Report>(
    `/api/reports?from=${from}&to=${to}${
      barberId ? `&barber_id=${barberId}` : ""
    }`,
  );

  const {
    data: barberData,
  } = useApi<{ barbers: Barber[] }>(
    "/api/barbers",
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            Inteligência
          </p>

          <h1 className="font-display mt-1 text-3xl">
            Relatórios
          </h1>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label
              className={labelClass}
              htmlFor="rep-from"
            >
              De
            </label>

            <input
              id="rep-from"
              type="date"
              className={inputClass}
              value={from}
              onChange={(e) =>
                setFrom(e.target.value)
              }
            />
          </div>

          <div>
            <label
              className={labelClass}
              htmlFor="rep-to"
            >
              Até
            </label>

            <input
              id="rep-to"
              type="date"
              className={inputClass}
              value={to}
              onChange={(e) =>
                setTo(e.target.value)
              }
            />
          </div>

          <div>
            <label
              className={labelClass}
              htmlFor="rep-barber"
            >
              Profissional
            </label>

            <select
              id="rep-barber"
              className={inputClass}
              value={barberId}
              onChange={(e) =>
                setBarberId(e.target.value)
              }
            >
              <option value="">
                Todos
              </option>

              {(barberData?.barbers ?? []).map(
                (barber) => (
                  <option
                    key={barber.id}
                    value={barber.id}
                  >
                    {barber.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <button
            type="button"
            className={btnGhost}
            onClick={() => reload()}
          >
            Atualizar
          </button>
        </div>
      </header>

      {error ? (
        <ErrorBox message={error} />
      ) : null}

      {loading || !data ? (
        <Loading label="Calculando indicadores..." />
      ) : null}

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Faturamento"
              value={money(data.income)}
              hint={`${dateBR(data.period.from)} → ${dateBR(data.period.to)}`}
            />

            <Stat
              label="Despesas"
              value={money(data.expense)}
            />

            <Stat
              label="Lucro"
              value={money(data.profit)}
            />

            <Stat
              label="Clientes atendidos"
              value={data.customers_served}
              hint="Atendimentos concluídos"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* FATURAMENTO POR DIA */}

            <Card>
              <h2 className="font-display mb-3 text-xl">
                Faturamento por dia
              </h2>

              {data.daily.length ? (
                <ul className="max-h-64 divide-y divide-line overflow-auto text-sm">
                  {data.daily.map((row) => (
                    <li
                      key={row.date}
                      className="flex justify-between py-2"
                    >
                      <span className="text-zinc-300">
                        {formatReportDate(row.date)}
                      </span>

                      <span className="text-zinc-400">
                        <span className="text-emerald-300">
                          {money(row.income)}
                        </span>

                        {" · "}

                        <span className="text-rose-300">
                          {money(row.expense)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">
                  Sem movimentações no período.
                </p>
              )}
            </Card>

            {/* SERVIÇOS */}

            <Card>
              <h2 className="font-display mb-3 text-xl">
                Serviços mais vendidos
              </h2>

              {data.services.length ? (
                <ul className="space-y-1 text-sm">
                  {data.services.map((service) => (
                    <li
                      key={service.name}
                      className="flex justify-between"
                    >
                      <span className="text-zinc-300">
                        {service.name}
                      </span>

                      <span className="text-zinc-500">
                        {service.count}x ·{" "}
                        <span className="text-gold">
                          {money(service.revenue)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">
                  Sem atendimentos concluídos no período.
                </p>
              )}
            </Card>

            {/* PROFISSIONAIS */}

            <Card>
              <h2 className="font-display mb-3 text-xl">
                Desempenho por profissional
              </h2>

              {data.barbers.length ? (
                <ul className="space-y-1 text-sm">
                  {data.barbers.map((barber) => (
                    <li
                      key={barber.name}
                      className="flex justify-between"
                    >
                      <span className="text-zinc-300">
                        {barber.name}
                      </span>

                      <span className="text-zinc-500">
                        {barber.count}x ·{" "}
                        <span className="text-gold">
                          {money(barber.revenue)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">
                  Sem dados no período.
                </p>
              )}
            </Card>

            {/* PAGAMENTOS */}

            <Card>
              <h2 className="font-display mb-3 text-xl">
                Formas de pagamento
              </h2>

              {data.payments.length ? (
                <ul className="space-y-1 text-sm">
                  {data.payments.map((payment) => (
                    <li
                      key={payment.method}
                      className="flex justify-between"
                    >
                      <span className="text-zinc-300">
                        {PAYMENT_LABELS[payment.method] ||
                          payment.method}
                      </span>

                      <span className="text-gold">
                        {money(payment.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">
                  Sem receitas no período.
                </p>
              )}
            </Card>

            {/* PRODUTOS */}

            <Card>
              <h2 className="font-display mb-3 text-xl">
                Produtos vendidos
              </h2>

              {data.products.length ? (
                <ul className="space-y-1 text-sm">
                  {data.products.map((product) => (
                    <li
                      key={product.name}
                      className="flex justify-between"
                    >
                      <span className="text-zinc-300">
                        {product.name}
                      </span>

                      <span className="text-zinc-500">
                        {product.quantity} un ·{" "}
                        <span className="text-gold">
                          {money(product.revenue)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty title="Nenhuma venda de produto no período." />
              )}
            </Card>

            {/* DESPESAS */}

            <Card>
              <h2 className="font-display mb-3 text-xl">
                Despesas por categoria
              </h2>

              {data.expenses.length ? (
                <ul className="space-y-1 text-sm">
                  {data.expenses.map((expense) => (
                    <li
                      key={expense.category}
                      className="flex justify-between"
                    >
                      <span className="text-zinc-300">
                        {expense.category}
                      </span>

                      <span className="text-rose-300">
                        {money(expense.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">
                  Sem despesas lançadas no período.
                </p>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}