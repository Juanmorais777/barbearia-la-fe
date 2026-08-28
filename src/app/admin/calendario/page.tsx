"use client";

import { useMemo, useState } from "react";
import { apiFetch, dateBR, money, todayISO, useApi } from "@/hooks/useApi";
import { Badge, Card, Empty, ErrorBox, Loading, btnGhost } from "@/components/ui";
import { BLOCKED_TYPE_LABELS, STATUS_LABELS, STATUS_STYLES } from "@/lib/constants";
import type { Appointment, Barber, BlockedTime } from "@/types";

type View = "dia" | "semana" | "mes";

function iso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shift(isoDate: string, amount: number) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return iso(date);
}

function weekStart(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() - date.getDay());
  return iso(date);
}

export default function CalendarPage() {
  const [view, setView] = useState<View>("semana");
  const [anchor, setAnchor] = useState(todayISO());
  const [selected, setSelected] = useState(todayISO());

  const range = useMemo(() => {
    if (view === "dia") return { from: anchor, to: anchor };
    if (view === "semana") {
      const start = weekStart(anchor);
      return { from: start, to: shift(start, 6) };
    }
    const [year, month] = anchor.split("-").map(Number);
    const start = iso(new Date(year, month - 1, 1));
    const end = iso(new Date(year, month, 0));
    return { from: start, to: end };
  }, [view, anchor]);

  const { data, loading, error, reload } = useApi<{ appointments: Appointment[] }>(
    `/api/appointments?from=${range.from}&to=${range.to}`,
  );
  const { data: blockData } = useApi<{ blocks: BlockedTime[] }>(`/api/blocked-times?from=${range.from}&to=${range.to}`);
  const { data: barberData } = useApi<{ barbers: Barber[] }>("/api/barbers?active=1");

  const appointments = data?.appointments ?? [];
  const blocks = blockData?.blocks ?? [];

  const days = useMemo(() => {
    const list: string[] = [];
    let cursor = range.from;
    let guard = 0;
    while (cursor <= range.to && guard < 62) {
      list.push(cursor);
      cursor = shift(cursor, 1);
      guard += 1;
    }
    return list;
  }, [range]);

  async function quickBlock(day: string) {
    const reason = window.prompt(`Motivo do bloqueio de ${dateBR(day)}:`, "Emergência");
    if (!reason) return;
    try {
      await apiFetch("/api/blocked-times", {
        method: "POST",
        body: JSON.stringify({ type: "DIA_INTEIRO", date: day, reason }),
      });
      await reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Não foi possível criar o bloqueio.");
    }
  }

  const dayAppointments = appointments.filter((appointment) => appointment.date === selected);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Agenda visual</p>
          <h1 className="font-display mt-1 text-3xl">Calendário</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btnGhost} onClick={() => setAnchor(shift(anchor, view === "mes" ? -30 : view === "semana" ? -7 : -1))}>
            ←
          </button>
          <span className="min-w-40 text-center text-sm text-zinc-300">
            {view === "mes" ? anchor.slice(0, 7) : `${dateBR(range.from)} → ${dateBR(range.to)}`}
          </span>
          <button type="button" className={btnGhost} onClick={() => setAnchor(shift(anchor, view === "mes" ? 30 : view === "semana" ? 7 : 1))}>
            →
          </button>
          <button type="button" className={btnGhost} onClick={() => setAnchor(todayISO())}>Hoje</button>
          {(["dia", "semana", "mes"] as View[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className={view === option ? "btn-gold rounded-full px-4 py-2 text-xs uppercase" : btnGhost}
            >
              {option}
            </button>
          ))}
        </div>
      </header>

      {error ? <ErrorBox message={error} /> : null}
      {loading ? <Loading /> : null}

      <div className="grid gap-2 sm:grid-cols-7">
        {days.map((day) => {
          const items = appointments.filter((appointment) => appointment.date === day);
          const dayBlocks = blocks.filter((block) => block.date === day && block.type === "DIA_INTEIRO");
          const isClosed = dayBlocks.length > 0;
          return (
            <button
              key={day}
              type="button"
              onClick={() => {
                setSelected(day);
                setAnchor(day);
              }}
              className={`card p-3 text-left transition ${selected === day ? "border-gold/70" : ""} ${isClosed ? "opacity-60" : ""}`}
            >
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                {new Date(`${day}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" })}
              </p>
              <p className="font-display text-lg">{day.slice(8)}</p>
              <div className="mt-1 space-y-1">
                {isClosed ? <Badge className="border-rose-500/40 text-rose-300">bloqueado</Badge> : null}
                {items.slice(0, 3).map((item) => (
                  <p key={item.id} className="truncate text-[11px] text-zinc-300">
                    {item.start_time} {item.customer_name.split(" ")[0]}
                  </p>
                ))}
                {items.length > 3 ? <p className="text-[11px] text-gold">+{items.length - 3}</p> : null}
              </div>
            </button>
          );
        })}
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl">{dateBR(selected)}</h2>
          <button type="button" className={btnGhost} onClick={() => quickBlock(selected)}>
            Bloquear dia inteiro
          </button>
        </div>

        {dayAppointments.length ? (
          <ul className="divide-y divide-line">
            {dayAppointments.map((appointment) => (
              <li key={appointment.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm text-white">
                    {appointment.start_time} - {appointment.end_time} · {appointment.customer_name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {appointment.service_name} · {appointment.barber_name}
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
          <Empty title="Sem agendamentos neste dia." />
        )}

        {blocks.filter((block) => block.date === selected).length ? (
          <div className="mt-4">
            <h3 className="text-sm uppercase tracking-[0.14em] text-rose-300">Bloqueios</h3>
            <ul className="mt-2 space-y-1 text-sm text-zinc-300">
              {blocks
                .filter((block) => block.date === selected)
                .map((block) => (
                  <li key={block.id} className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2">
                    {block.type === "DIA_INTEIRO"
                      ? "Dia inteiro"
                      : `${block.start_time} - ${block.end_time}`}{" "}
                    · {BLOCKED_TYPE_LABELS[block.type] || block.type} · {block.reason} ·{" "}
                    {block.barber_name || "toda a barbearia"}
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className="font-display mb-3 text-xl">Profissionais ativos</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {(barberData?.barbers ?? []).map((barber) => (
            <span key={barber.id} className="rounded-full border border-line px-3 py-1 text-zinc-300">
              {barber.name} · {barber.commission_percent}%
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
