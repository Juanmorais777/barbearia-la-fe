"use client";

import { useState } from "react";
import { apiFetch, dateBR, money, useApi } from "@/hooks/useApi";
import { Badge, Card, Empty, ErrorBox, Loading, Stat, btnGhost, btnPrimary, inputClass, labelClass } from "@/components/ui";
import type { Barber, Commission } from "@/types";

export default function CommissionsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [barberId, setBarberId] = useState("");
  const [status, setStatus] = useState("");
  const [paying, setPaying] = useState<Commission | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (barberId) params.set("barber_id", barberId);
  if (status) params.set("status", status);

  const { data, loading, reload } = useApi<{ commissions: Commission[]; summary: { pending: number; paid: number } }>(
    `/api/commissions?${params.toString()}`,
  );
  const { data: barberData } = useApi<{ barbers: Barber[] }>("/api/barbers");

  const commissions = data?.commissions ?? [];
  const summary = data?.summary ?? { pending: 0, paid: 0 };

  async function confirmPayment() {
    if (!paying) return;
    setError(null);
    try {
      await apiFetch(`/api/commissions/${paying.id}/pay`, { method: "PUT", body: JSON.stringify({ note: note || null }) });
      setInfo(`Pagamento de ${money(paying.amount)} registrado para ${paying.barber_name}.`);
      setPaying(null);
      setNote("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar o pagamento.");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Repasse</p>
        <h1 className="font-display mt-1 text-3xl">Comissões</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Pendentes" value={money(summary.pending)} hint="Geradas quando o atendimento é concluído" />
        <Stat label="Pagas" value={money(summary.paid)} hint="Valor total já repassado no período" />
      </div>

      <Card className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className={labelClass} htmlFor="comm-from">De</label>
          <input id="comm-from" type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="comm-to">Até</label>
          <input id="comm-to" type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="comm-barber">Profissional</label>
          <select id="comm-barber" className={inputClass} value={barberId} onChange={(e) => setBarberId(e.target.value)}>
            <option value="">Todos</option>
            {(barberData?.barbers ?? []).map((barber) => (
              <option key={barber.id} value={barber.id}>{barber.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="comm-status">Status</label>
          <select id="comm-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="PAGA">Pagas</option>
          </select>
        </div>
      </Card>

      {info ? <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{info}</div> : null}
      {error ? <ErrorBox message={error} /> : null}
      {loading ? <Loading /> : null}
      {!loading && commissions.length === 0 ? (
        <Empty title="Nenhuma comissão no período." description="Comissões são criadas apenas quando o atendimento fica CONCLUÍDO." />
      ) : null}

      <div className="space-y-2">
        {commissions.map((commission) => (
          <Card key={commission.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white">
                #{commission.appointment_id} · {commission.customer_name} · {commission.service_name}
              </p>
              <p className="text-xs text-zinc-500">
                {commission.barber_name} · {dateBR(commission.date)} · base {money(commission.base_amount)} ·{" "}
                {commission.percent}%
              </p>
              {commission.paid_at ? <p className="text-xs text-zinc-600">pago em {dateBR(commission.paid_at)}</p> : null}
            </div>
            <div className="flex items-center gap-3">
              <Badge className={commission.status === "PAGA" ? "border-emerald-500/40 text-emerald-300" : "border-amber-500/40 text-amber-300"}>
                {commission.status === "PAGA" ? "Paga" : "Pendente"}
              </Badge>
              <span className="font-display text-xl text-gold">{money(commission.amount)}</span>
              {commission.status === "PENDENTE" ? (
                <button type="button" className={btnPrimary} onClick={() => setPaying(commission)}>Registrar pagamento</button>
              ) : (
                <button type="button" className={btnGhost} disabled>Valor repassado</button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {paying ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-md space-y-4 p-6">
            <h2 className="font-display text-2xl">Pagar comissão</h2>
            <p className="text-sm text-zinc-400">
              {paying.barber_name} · {money(paying.amount)}
            </p>
            <div>
              <label className={labelClass} htmlFor="pay-note">Observação</label>
              <input id="pay-note" className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: pago em dinheiro" />
            </div>
            <p className="text-xs text-zinc-500">A despesa de comissão é lançada automaticamente no financeiro.</p>
            <div className="flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setPaying(null)}>Cancelar</button>
              <button type="button" className={btnPrimary} onClick={confirmPayment}>Confirmar pagamento</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
