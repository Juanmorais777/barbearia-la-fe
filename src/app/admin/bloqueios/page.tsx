"use client";

import { useState } from "react";
import { apiFetch, dateBR, money, todayISO, useApi } from "@/hooks/useApi";
import { Badge, Card, Empty, ErrorBox, Loading, Stat, btnGhost, btnPrimary, inputClass, labelClass } from "@/components/ui";
import { BLOCKED_TYPE_LABELS } from "@/lib/constants";
import type { Appointment, Barber, BlockedTime } from "@/types";

export default function BlockedTimesPage() {
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState("");
  const [form, setForm] = useState({
    type: "HORARIO",
    date: todayISO(),
    barber_id: "",
    start_time: "12:00",
    end_time: "13:30",
    reason: "",
  });
  const [editing, setEditing] = useState<BlockedTime | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [affected, setAffected] = useState<{ block: BlockedTime; affected: Appointment[] } | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, reload } = useApi<{ blocks: BlockedTime[] }>(`/api/blocked-times?from=${from}${to ? `&to=${to}` : ""}`);
  const { data: barberData } = useApi<{ barbers: Barber[] }>("/api/barbers");

  const blocks = data?.blocks ?? [];

  async function loadAffected(block: BlockedTime) {
    try {
      const payload = await apiFetch<{ block: BlockedTime; affected_appointments: Appointment[] }>(`/api/blocked-times/${block.id}`);
      setAffected({ block, affected: payload.affected_appointments });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os agendamentos afetados.");
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const result = await apiFetch<{ block: BlockedTime; affected_appointments: number }>("/api/blocked-times", {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          date: form.date,
          barber_id: form.barber_id ? Number(form.barber_id) : null,
          start_time: form.type === "DIA_INTEIRO" ? null : form.start_time,
          end_time: form.type === "DIA_INTEIRO" ? null : form.end_time,
          reason: form.reason,
        }),
      });
      setInfo(
        result.affected_appointments > 0
          ? `Bloqueio criado. ${result.affected_appointments} agendamento(s) já existente(s) neste período — decida o que fazer com eles em "Agendamentos".`
          : "Bloqueio criado. Os horários já não aparecem mais como disponíveis.",
      );
      setForm({ ...form, reason: "" });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o bloqueio.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(block: BlockedTime) {
    setError(null);
    try {
      await apiFetch(`/api/blocked-times/${block.id}`, { method: "PUT", body: JSON.stringify({ active: !block.active }) });
      setInfo(block.active ? "Bloqueio desativado — os horários voltam a ficar disponíveis." : "Bloqueio reativado.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o bloqueio.");
    }
  }

  async function remove(block: BlockedTime) {
    if (!window.confirm(`Excluir o bloqueio "${block.reason}"?`)) return;
    setError(null);
    try {
      await apiFetch(`/api/blocked-times/${block.id}`, { method: "DELETE" });
      setInfo("Bloqueio excluído.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir o bloqueio.");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Disponibilidade</p>
        <h1 className="font-display mt-1 text-3xl">Bloqueios</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Bloqueios listados" value={blocks.length} hint="Período filtrado abaixo" />
        <Stat label="Ativos" value={blocks.filter((block) => block.active).length} hint="Bloqueios interferindo na agenda" />
      </div>

      {info ? <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{info}</div> : null}
      {error ? <ErrorBox message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="font-display mb-3 text-xl">{editing ? "Editar bloqueio" : "Novo bloqueio"}</h2>
          <form onSubmit={create} className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="block-type">Tipo</label>
              <select
                id="block-type"
                className={inputClass}
                value={editing ? editing.type : form.type}
                onChange={(e) => (editing ? setEditing({ ...editing, type: e.target.value as BlockedTime["type"] }) : setForm({ ...form, type: e.target.value }))}
              >
                {Object.entries(BLOCKED_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="block-date">Data</label>
              <input
                id="block-date"
                type="date"
                className={inputClass}
                value={editing ? editing.date : form.date}
                onChange={(e) => (editing ? setEditing({ ...editing, date: e.target.value }) : setForm({ ...form, date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="block-barber">Profissional (opcional)</label>
              <select
                id="block-barber"
                className={inputClass}
                value={editing ? (editing.barber_id ? String(editing.barber_id) : "") : form.barber_id}
                onChange={(e) =>
                  editing
                    ? setEditing({ ...editing, barber_id: e.target.value ? Number(e.target.value) : null })
                    : setForm({ ...form, barber_id: e.target.value })
                }
              >
                <option value="">Toda a barbearia</option>
                {(barberData?.barbers ?? []).map((barber) => (
                  <option key={barber.id} value={barber.id}>{barber.name}</option>
                ))}
              </select>
            </div>
            {(editing ? editing.type !== "DIA_INTEIRO" : form.type !== "DIA_INTEIRO") ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="block-start">Início</label>
                  <input
                    id="block-start"
                    type="time"
                    className={inputClass}
                    value={editing ? editing.start_time || "" : form.start_time}
                    onChange={(e) => (editing ? setEditing({ ...editing, start_time: e.target.value }) : setForm({ ...form, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="block-end">Fim</label>
                  <input
                    id="block-end"
                    type="time"
                    className={inputClass}
                    value={editing ? editing.end_time || "" : form.end_time}
                    onChange={(e) => (editing ? setEditing({ ...editing, end_time: e.target.value }) : setForm({ ...form, end_time: e.target.value }))}
                  />
                </div>
              </div>
            ) : null}
            <div>
              <label className={labelClass} htmlFor="block-reason">Motivo</label>
              <input
                id="block-reason"
                className={inputClass}
                placeholder="Ex: Almoço, Manutenção, Emergência"
                value={editing ? editing.reason : form.reason}
                onChange={(e) => (editing ? setEditing({ ...editing, reason: e.target.value }) : setForm({ ...form, reason: e.target.value }))}
                required
                minLength={3}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {editing ? (
                <>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await apiFetch(`/api/blocked-times/${editing.id}`, {
                          method: "PUT",
                          body: JSON.stringify({
                            type: editing.type,
                            date: editing.date,
                            barber_id: editing.barber_id,
                            start_time: editing.type === "DIA_INTEIRO" ? null : editing.start_time,
                            end_time: editing.type === "DIA_INTEIRO" ? null : editing.end_time,
                            reason: editing.reason,
                          }),
                        });
                        setInfo("Bloqueio atualizado. A disponibilidade foi recalculada.");
                        setEditing(null);
                        await reload();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Não foi possível atualizar.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Salvar alterações
                  </button>
                  <button type="button" className={btnGhost} onClick={() => setEditing(null)}>Cancelar</button>
                </>
              ) : (
                <button type="submit" className={btnPrimary} disabled={saving}>Criar bloqueio</button>
              )}
            </div>
          </form>
        </Card>

        <div className="space-y-3 lg:col-span-2">
          <Card className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="block-from">De</label>
              <input id="block-from" type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="block-to">Até</label>
              <input id="block-to" type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </Card>

          {loading ? <Loading /> : null}
          {!loading && blocks.length === 0 ? <Empty title="Nenhum bloqueio no período." /> : null}

          {blocks.map((block) => (
            <Card key={block.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={block.active ? "border-rose-500/40 text-rose-300" : "border-zinc-500/40 text-zinc-400"}>
                    {BLOCKED_TYPE_LABELS[block.type] || block.type}
                  </Badge>
                  <span className="text-sm text-white">{dateBR(block.date)}</span>
                  {block.type !== "DIA_INTEIRO" ? (
                    <span className="text-sm text-zinc-300">
                      {block.start_time} - {block.end_time}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-zinc-500">
                  {block.reason} · {block.barber_name || "toda a barbearia"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnGhost} onClick={() => loadAffected(block)}>Afetados</button>
                <button type="button" className={btnGhost} onClick={() => setEditing(block)}>Editar</button>
                <button type="button" className={btnGhost} onClick={() => toggleActive(block)}>
                  {block.active ? "Desativar" : "Ativar"}
                </button>
                <button type="button" className={btnGhost} onClick={() => remove(block)}>Excluir</button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {affected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-2xl space-y-4 p-6">
            <h2 className="font-display text-2xl">Agendamentos afetados</h2>
            <p className="text-sm text-zinc-400">
              {dateBR(affected.block.date)}
              {affected.block.type === "DIA_INTEIRO" ? " · dia inteiro" : ` · ${affected.block.start_time} - ${affected.block.end_time}`}
            </p>
            {affected.affected.length ? (
              <ul className="max-h-64 divide-y divide-line overflow-auto text-sm">
                {affected.affected.map((appointment) => (
                  <li key={appointment.id} className="flex justify-between gap-2 py-2">
                    <span className="text-zinc-300">
                      {appointment.start_time} · {appointment.customer_name} · {appointment.service_name}
                    </span>
                    <span className="text-zinc-500">{money(appointment.price)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">Nenhum agendamento neste período.</p>
            )}
            <p className="text-xs text-zinc-500">
              O sistema nunca exclui agendamentos automaticamente. Cancele ou remarque manualmente em
              &ldquo;Agendamentos&rdquo;.
            </p>
            <button type="button" className={btnGhost} onClick={() => setAffected(null)}>Fechar</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
