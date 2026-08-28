"use client";

import { useMemo, useState } from "react";
import { apiFetch, dateBR, money, todayISO, useApi } from "@/hooks/useApi";
import { Badge, Card, Empty, ErrorBox, Loading, btnGhost, btnPrimary, inputClass, labelClass } from "@/components/ui";
import { PAYMENT_LABELS, STATUS_LABELS, STATUS_STYLES } from "@/lib/constants";
import type { Appointment, Barber } from "@/types";

type ListPayload = { appointments: Appointment[] };
type DetailPayload = { appointment: Appointment; whatsapp: { customer_url: string; shop_url: string; message: string } };

export default function AdminAppointmentsPage() {
  const [date, setDate] = useState(todayISO());
  const [status, setStatus] = useState("");
  const [barberId, setBarberId] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [rescheduleFor, setRescheduleFor] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState(todayISO());
  const [newTime, setNewTime] = useState("");
  const [payFor, setPayFor] = useState<Appointment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("DINHEIRO");
  const [whatsapp, setWhatsapp] = useState<DetailPayload | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (status) params.set("status", status);
    if (barberId) params.set("barber_id", barberId);
    if (search) params.set("search", search);
    return params.toString();
  }, [date, status, barberId, search]);

  const { data, loading, reload } = useApi<ListPayload>(`/api/appointments?${query}`);
  const { data: barberData } = useApi<{ barbers: Barber[] }>("/api/barbers");

  const appointments = data?.appointments ?? [];

  async function updateStatus(appointment: Appointment, body: Record<string, unknown>, message: string) {
    setBusy(appointment.id);
    setError(null);
    setInfo(null);
    try {
      await apiFetch(`/api/appointments/${appointment.id}`, { method: "PUT", body: JSON.stringify(body) });
      setInfo(message);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o agendamento.");
    } finally {
      setBusy(null);
    }
  }

  async function openWhatsapp(appointment: Appointment) {
    setError(null);
    try {
      setWhatsapp(await apiFetch<DetailPayload>(`/api/appointments/${appointment.id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar a mensagem.");
    }
  }

  async function saveReschedule() {
    if (!rescheduleFor || !newDate || !newTime) return;
    await updateStatus(rescheduleFor, { date: newDate, time: newTime }, "Agendamento remarcado.");
    setRescheduleFor(null);
    setNewTime("");
  }

  async function complete() {
    if (!payFor) return;
    await updateStatus(payFor, { status: "CONCLUIDO", payment_method: paymentMethod }, "Atendimento concluído — receita e comissão registradas.");
    setPayFor(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Agenda</p>
          <h1 className="font-display mt-1 text-3xl">Agendamentos</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
          <button type="button" className={btnGhost} onClick={() => setDate(todayISO())}>
            Hoje
          </button>
          <button type="button" className={btnGhost} onClick={() => { setDate(""); setStatus(""); setBarberId(""); setSearch(""); }}>
            Limpar filtros
          </button>
        </div>
      </header>

      <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelClass} htmlFor="filter-date">Data</label>
          <input id="filter-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="filter-status">Status</label>
          <select id="filter-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="filter-barber">Profissional</label>
          <select id="filter-barber" className={inputClass} value={barberId} onChange={(e) => setBarberId(e.target.value)}>
            <option value="">Todos</option>
            {(barberData?.barbers ?? []).map((barber) => (
              <option key={barber.id} value={barber.id}>{barber.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="filter-search">Buscar</label>
          <input id="filter-search" className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="cliente, telefone ou serviço" />
        </div>
      </Card>

      {info ? <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{info}</div> : null}
      {error ? <ErrorBox message={error} /> : null}
      {loading ? <Loading /> : null}

      {!loading && appointments.length === 0 ? (
        <Empty title="Nenhum agendamento encontrado." description="Ajuste os filtros ou aguarde novas reservas." />
      ) : null}

      <div className="space-y-3">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-lg">{appointment.start_time} - {appointment.end_time}</span>
                <Badge className={STATUS_STYLES[appointment.status]}>{STATUS_LABELS[appointment.status]}</Badge>
                <span className="text-xs text-zinc-500">#{appointment.id}</span>
              </div>
              <p className="mt-1 text-sm text-white">
                {appointment.customer_name} · {appointment.customer_phone}
              </p>
              <p className="text-xs text-zinc-500">
                {appointment.service_name} · {appointment.barber_name} · {dateBR(appointment.date)} ·{" "}
                {money(appointment.price)}
                {appointment.payment_method ? ` · ${PAYMENT_LABELS[appointment.payment_method]}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {appointment.status === "PENDENTE" ? (
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={busy === appointment.id}
                  onClick={() => updateStatus(appointment, { status: "CONFIRMADO" }, "Agendamento confirmado.")}
                >
                  Confirmar
                </button>
              ) : null}
              {appointment.status === "CONFIRMADO" ? (
                <button
                  type="button"
                  className={btnGhost}
                  disabled={busy === appointment.id}
                  onClick={() => updateStatus(appointment, { status: "EM_ATENDIMENTO" }, "Cliente em atendimento.")}
                >
                  Iniciar
                </button>
              ) : null}
              {["PENDENTE", "CONFIRMADO", "EM_ATENDIMENTO"].includes(appointment.status) ? (
                <button type="button" className={btnPrimary} onClick={() => setPayFor(appointment)}>
                  Concluir
                </button>
              ) : null}
              <button type="button" className={btnGhost} onClick={() => openWhatsapp(appointment)}>
                WhatsApp
              </button>
              <button
                type="button"
                className={btnGhost}
                onClick={() => {
                  setRescheduleFor(appointment);
                  setNewDate(appointment.date);
                  setNewTime(appointment.start_time);
                }}
              >
                Remarcar
              </button>
              {!["CANCELADO", "CONCLUIDO"].includes(appointment.status) ? (
                <>
                  <button
                    type="button"
                    className={btnGhost}
                    disabled={busy === appointment.id}
                    onClick={() => updateStatus(appointment, { status: "CANCELADO" }, "Agendamento cancelado.")}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={btnGhost}
                    disabled={busy === appointment.id}
                    onClick={() => updateStatus(appointment, { status: "NAO_COMPARECEU" }, "Registrado como não comparecimento.")}
                  >
                    Não compareceu
                  </button>
                </>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      {payFor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-md space-y-4 p-6">
            <h2 className="font-display text-2xl">Concluir atendimento</h2>
            <p className="text-sm text-zinc-400">
              {payFor.service_name} · {payFor.customer_name} · {money(payFor.price)}
            </p>
            <div>
              <label className={labelClass} htmlFor="payment">Forma de pagamento</label>
              <select id="payment" className={inputClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-zinc-500">
              Ao concluir, o sistema registra a receita e gera a comissão do profissional em uma única transação SQL.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setPayFor(null)}>Cancelar</button>
              <button type="button" className={btnPrimary} onClick={complete}>Concluir</button>
            </div>
          </div>
        </div>
      ) : null}

      {rescheduleFor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-md space-y-4 p-6">
            <h2 className="font-display text-2xl">Remarcar</h2>
            <p className="text-sm text-zinc-400">{rescheduleFor.customer_name}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="new-date">Nova data</label>
                <input id="new-date" type="date" className={inputClass} value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="new-time">Novo horário</label>
                <input id="new-time" type="time" className={inputClass} value={newTime} onChange={(e) => setNewTime(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setRescheduleFor(null)}>Cancelar</button>
              <button type="button" className={btnPrimary} onClick={saveReschedule} disabled={!newTime}>Salvar</button>
            </div>
          </div>
        </div>
      ) : null}

      {whatsapp ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-lg space-y-4 p-6">
            <h2 className="font-display text-2xl">Enviar confirmação pelo WhatsApp</h2>
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-ink-3/60 p-3 text-xs text-zinc-300">
              {whatsapp.whatsapp.message}
            </pre>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setWhatsapp(null)}>Fechar</button>
              <a className={btnGhost} href={whatsapp.whatsapp.shop_url} target="_blank" rel="noreferrer">
                WhatsApp da barbearia
              </a>
              <a className={btnPrimary} href={whatsapp.whatsapp.customer_url} target="_blank" rel="noreferrer">
                Abrir WhatsApp do cliente
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
