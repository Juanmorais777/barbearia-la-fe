"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, dateBR, money } from "@/hooks/useApi";
import { Badge, ErrorBox, Loading, btnGhost, btnPrimary, inputClass, labelClass } from "@/components/ui";
import { STATUS_LABELS } from "@/lib/constants";
import type { AvailabilityResult, Barber, Service } from "@/types";

type CreatedAppointment = {
  appointment: {
    id: number;
    service_name: string;
    barber_name: string;
    date: string;
    start_time: string;
    price: number;
    status: string;
    customer_name: string;
  };
  whatsapp: { customer_url: string; message: string };
};

const STEPS = ["Serviço", "Profissional", "Data", "Horário", "Seus dados", "Resumo"];

function addDaysISO(days: number) {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function BookingWizard() {
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingBase, setLoadingBase] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [serviceId, setServiceId] = useState<number | null>(null);
  const [barberId, setBarberId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [resolvedBarber, setResolvedBarber] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedAppointment | null>(null);

  const service = useMemo(() => services.find((item) => item.id === serviceId) || null, [services, serviceId]);
  const barber = useMemo(() => barbers.find((item) => item.id === barberId) || null, [barbers, barberId]);
  const eligibleBarbers = useMemo(
    () => (service ? barbers.filter((item) => service.barber_ids.includes(item.id)) : barbers),
    [barbers, service],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [serviceData, barberData] = await Promise.all([
          apiFetch<{ services: Service[] }>("/api/services?active=1"),
          apiFetch<{ barbers: Barber[] }>("/api/barbers?active=1"),
        ]);
        if (!active) return;
        setServices(serviceData.services);
        setBarbers(barberData.barbers);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Não foi possível carregar os dados.");
      } finally {
        if (active) setLoadingBase(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const loadAvailability = useCallback(async () => {
    if (!serviceId || !date) return;
    setLoadingAvailability(true);
    setError(null);
    setAvailability(null);
    try {
      const params = new URLSearchParams({ service_id: String(serviceId), date });
      if (barberId) params.set("barber_id", String(barberId));
      setAvailability(await apiFetch<AvailabilityResult>(`/api/appointments/availability?${params.toString()}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os horários.");
    } finally {
      setLoadingAvailability(false);
    }
  }, [serviceId, barberId, date]);

  useEffect(() => {
    if (step === 3) void loadAvailability();
  }, [step, loadAvailability]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function goTo(next: number) {
    setError(null);
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
  }

  function canAdvance() {
    if (step === 0) return Boolean(serviceId);
    if (step === 1) return true; // profissional é opcional
    if (step === 2) return /^\d{4}-\d{2}-\d{2}$/.test(date);
    if (step === 3) return Boolean(time);
    if (step === 4) return name.trim().length >= 3 && phone.replace(/\D/g, "").length >= 10;
    return true;
  }

  async function confirm() {
    if (!serviceId || !date || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch<CreatedAppointment>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          service_id: serviceId,
          barber_id: resolvedBarber ?? barberId,
          date,
          time,
          customer_name: name,
          customer_phone: phone,
          customer_email: email || null,
          notes: notes || null,
        }),
      });
      setCreated(response);
      setStep(STEPS.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir o agendamento.");
      if (step === 3) void loadAvailability();
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setCreated(null);
    setServiceId(null);
    setBarberId(null);
    setDate("");
    setTime("");
    setResolvedBarber(null);
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setAvailability(null);
    setStep(0);
  }

  if (created) {
    const appointment = created.appointment;
    return (
      <div className="card space-y-4 p-6 text-center">
        <p className="text-4xl">✅</p>
        <h2 className="font-display text-3xl">Agendamento realizado com sucesso!</h2>
        <p className="text-sm text-zinc-400">
          Protocolo <strong className="text-gold">#{appointment.id}</strong> · status {STATUS_LABELS[appointment.status]}
        </p>
        <div className="mx-auto grid max-w-md gap-2 rounded-xl border border-line bg-ink-3/50 p-4 text-left text-sm">
          <p className="flex justify-between"><span className="text-zinc-500">Serviço</span><span>{appointment.service_name}</span></p>
          <p className="flex justify-between"><span className="text-zinc-500">Profissional</span><span>{appointment.barber_name}</span></p>
          <p className="flex justify-between"><span className="text-zinc-500">Data</span><span>{dateBR(appointment.date)}</span></p>
          <p className="flex justify-between"><span className="text-zinc-500">Horário</span><span>{appointment.start_time}</span></p>
          <p className="flex justify-between"><span className="text-zinc-500">Valor</span><span>{money(appointment.price)}</span></p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={created.whatsapp.customer_url} target="_blank" rel="noreferrer" className={btnPrimary}>
            Enviar confirmação pelo WhatsApp
          </a>
          <button type="button" className={btnGhost} onClick={reset}>
            Fazer novo agendamento
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          Sua solicitação está <strong>PENDENTE</strong>. A barbearia confirma e você recebe a mensagem pronta acima.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em]">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={`rounded-full border px-3 py-1 ${
              index === step
                ? "border-gold/60 bg-gold/10 text-gold"
                : index < step
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-line text-zinc-500"
            }`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {error ? <ErrorBox message={error} /> : null}
      {loadingBase ? <Loading label="Carregando serviços e profissionais..." /> : null}

      {step === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setServiceId(item.id);
                setBarberId(null);
                setTime("");
                goTo(1);
              }}
              className={`card card-hover p-4 text-left ${serviceId === item.id ? "border-gold/60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg">{item.name}</h3>
                <Badge className="border-gold/40 text-gold">{money(item.price)}</Badge>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{item.description}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">{item.duration_minutes} minutos</p>
            </button>
          ))}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setBarberId(null);
              goTo(2);
            }}
            className={`card card-hover p-4 text-left ${barberId === null ? "border-gold/60" : ""}`}
          >
            <h3 className="font-display text-lg">Sem preferência</h3>
            <p className="mt-1 text-sm text-zinc-400">Mostramos os horários de todos os profissionais do serviço.</p>
          </button>
          {eligibleBarbers.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setBarberId(item.id);
                setTime("");
                goTo(2);
              }}
              className={`card card-hover p-4 text-left ${barberId === item.id ? "border-gold/60" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 font-display text-lg text-gold">
                  {item.name.slice(0, 1)}
                </span>
                <div>
                  <h3 className="font-display text-lg">{item.name}</h3>
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{item.specialty}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{item.bio}</p>
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="card space-y-4 p-5">
          <div>
            <label className={labelClass} htmlFor="booking-date">
              Escolha a data
            </label>
            <input
              id="booking-date"
              type="date"
              className={inputClass}
              min={addDaysISO(0)}
              max={addDaysISO(60)}
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setTime("");
              }}
            />
          </div>
          <p className="text-xs text-zinc-500">
            Horários são calculados considerando expediente da barbearia, expediente do profissional, bloqueios e
            agendamentos existentes.
          </p>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-sm text-zinc-300">
              {service?.name} · {barber ? barber.name : "Sem preferência"} · {date ? dateBR(date) : ""}
            </p>
            <button type="button" className="mt-2 text-xs text-gold hover:underline" onClick={() => void loadAvailability()}>
              Atualizar horários
            </button>
          </div>

          {loadingAvailability ? <Loading label="Consultando horários disponíveis..." /> : null}

          {!loadingAvailability && availability ? (
            availability.slots.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
                {availability.slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => {
                      setTime(slot.time);
                      setResolvedBarber(slot.barber_ids[0] ?? null);
                      goTo(4);
                    }}
                    className={`rounded-lg border px-2 py-3 text-sm transition ${
                      time === slot.time ? "border-gold bg-gold/15 text-gold" : "border-line text-zinc-200 hover:border-gold/60"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-zinc-400">
                {availability.message || "Não há horários disponíveis nesta data."}
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="card space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="booking-name">
                Nome completo *
              </label>
              <input id="booking-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João da Silva" />
            </div>
            <div>
              <label className={labelClass} htmlFor="booking-phone">
                WhatsApp *
              </label>
              <input
                id="booking-phone"
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(82) 98888-7777"
                inputMode="tel"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="booking-email">
                E-mail (opcional)
              </label>
              <input id="booking-email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
            </div>
            <div>
              <label className={labelClass} htmlFor="booking-notes">
                Observação (opcional)
              </label>
              <input id="booking-notes" className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: máquina 2 nas laterais" />
            </div>
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="card space-y-3 p-5">
          <h3 className="font-display text-2xl">Confirme seu agendamento</h3>
          <dl className="grid gap-2 text-sm">
            {[
              ["Serviço", `${service?.name} · ${money(service?.price || 0)}`],
              ["Profissional", barber ? barber.name : "Sem preferência (definido pelo horário)"],
              ["Data", dateBR(date)],
              ["Horário", time],
              ["Duração", `${service?.duration_minutes} minutos`],
              ["Cliente", `${name} · ${phone}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-line pb-1">
                <dt className="text-zinc-500">{label}</dt>
                <dd className="text-right text-zinc-100">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button type="button" className={btnGhost} onClick={() => goTo(step - 1)} disabled={step === 0}>
          Voltar
        </button>
        {step === 5 ? (
          <button type="button" className={btnPrimary} onClick={confirm} disabled={!canAdvance() || submitting}>
            {submitting ? "Confirmando..." : "Confirmar agendamento"}
          </button>
        ) : (
          <button type="button" className={btnPrimary} onClick={() => goTo(step + 1)} disabled={!canAdvance()}>
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}
