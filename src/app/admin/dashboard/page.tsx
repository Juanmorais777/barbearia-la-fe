"use client";

import Link from "next/link";
import { dateBR, money, useApi } from "@/hooks/useApi";
import { Badge, Card, Empty, ErrorBox, Loading, Stat } from "@/components/ui";
import { BLOCKED_TYPE_LABELS, STATUS_LABELS, STATUS_STYLES } from "@/lib/constants";
import type { BlockedTime, DashboardData } from "@/types";

type Payload = DashboardData & { month_summary: Record<string, { total: number; amount: number }> };

export default function DashboardPage() {
  const { data, loading, error } = useApi<Payload>("/api/dashboard");

  if (loading) return <Loading label="Carregando indicadores..." />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return <Empty title="Sem dados para exibir." />;

  const monthCompleted = data.month_summary?.CONCLUIDO?.total ?? 0;
  const monthAppointments = Object.values(data.month_summary || {}).reduce((total, item) => total + item.total, 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Painel</p>
        <h1 className="font-display mt-1 text-3xl">Dashboard · {dateBR(data.today)}</h1>
      </header>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-[0.16em] text-zinc-400">Hoje</h2>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <Stat label="Agendamentos" value={data.counters.today_appointments} />
          <Stat label="Pendentes" value={data.counters.pending} />
          <Stat label="Confirmados" value={data.counters.confirmed} />
          <Stat label="Em atendimento" value={data.counters.in_progress} />
          <Stat label="Concluídos" value={data.counters.completed} />
          <Stat label="Cancelados" value={data.counters.cancelled} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-[0.16em] text-zinc-400">Financeiro e comissões</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="Receita do dia" value={money(data.revenue.day)} />
          <Stat label="Receita do mês" value={money(data.revenue.month)} />
          <Stat label="Despesas do mês" value={money(data.revenue.expenses_month)} />
          <Stat label="Comissões pendentes" value={money(data.commissions.pending)} />
          <Stat label="Comissões pagas" value={money(data.commissions.paid)} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Próximos atendimentos</h2>
            <Link href="/admin/agendamentos" className="text-xs text-gold hover:underline">
              ver todos
            </Link>
          </div>
          {data.next_appointments.length ? (
            <ul className="divide-y divide-line">
              {data.next_appointments.map((appointment) => (
                <li key={appointment.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm text-white">
                      {appointment.start_time} · {appointment.customer_name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {appointment.service_name} · {appointment.barber_name} · {dateBR(appointment.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_STYLES[appointment.status]}>{STATUS_LABELS[appointment.status]}</Badge>
                    <span className="text-sm text-gold">{money(appointment.price)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Nenhum atendimento à frente." description="Aproveite para organizar a agenda." />
          )}
        </Card>

        <Card>
          <h2 className="font-display mb-4 text-xl">Desempenho do mês</h2>
          <p className="text-xs text-zinc-500">
            {monthAppointments} agendamento(s) no mês · {monthCompleted} concluído(s)
          </p>
          <div className="mt-4 space-y-3">
            {data.barber_performance.length ? (
              data.barber_performance.map((barber) => (
                <div key={barber.name}>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">{barber.name}</span>
                    <span className="text-gold">{money(barber.revenue)}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{barber.count} atendimento(s)</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">Sem atendimentos concluídos neste mês.</p>
            )}
          </div>

          <h3 className="font-display mt-6 text-lg">Serviços mais realizados</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {data.top_services.length ? (
              data.top_services.map((service) => (
                <li key={service.name} className="flex justify-between text-zinc-300">
                  <span>{service.name}</span>
                  <span className="text-zinc-500">{service.count}x</span>
                </li>
              ))
            ) : (
              <li className="text-zinc-500">Sem dados ainda.</li>
            )}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="font-display mb-4 text-xl">Bloqueios próximos</h2>
          {data.upcoming_blocks.length ? (
            <ul className="space-y-2 text-sm">
              {data.upcoming_blocks.map((block: BlockedTime) => (
                <li key={block.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <span>
                    {dateBR(block.date)} · {BLOCKED_TYPE_LABELS[block.type] || block.type}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {block.barber_name || "Toda a barbearia"} · {block.reason}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Nenhum bloqueio nos próximos 15 dias.</p>
          )}
          <Link href="/admin/bloqueios" className="mt-4 inline-block text-xs text-gold hover:underline">
            gerenciar bloqueios
          </Link>
        </Card>

        <Card>
          <h2 className="font-display mb-4 text-xl">Estoque baixo</h2>
          {data.low_stock.length ? (
            <ul className="space-y-2 text-sm">
              {data.low_stock.map((product) => (
                <li key={product.id} className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                  <span className="text-amber-200">{product.name}</span>
                  <span className="text-xs text-amber-100/80">
                    {product.stock} un. (mín. {product.minimum_stock})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Todos os produtos com estoque saudável.</p>
          )}
          <Link href="/admin/produtos" className="mt-4 inline-block text-xs text-gold hover:underline">
            gerenciar produtos
          </Link>
        </Card>
      </div>
    </div>
  );
}
