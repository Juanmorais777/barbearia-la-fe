"use client";

import { useMemo, useState } from "react";
import { apiFetch, useApi } from "@/hooks/useApi";
import { Card, ErrorBox, Loading, btnGhost, btnPrimary, inputClass, labelClass } from "@/components/ui";
import { WEEKDAYS } from "@/lib/constants";
import type { Barber, BarberHour, BusinessHour } from "@/types";

type HourState = { open_time: string; close_time: string; is_closed: boolean };

function defaultHours(): Record<number, HourState> {
  return WEEKDAYS.reduce((acc, weekday) => {
    acc[weekday.day_of_week] = { open_time: "09:00", close_time: "17:00", is_closed: weekday.day_of_week === 0 };
    return acc;
  }, {} as Record<number, HourState>);
}

export default function BusinessHoursPage() {
  const { data, loading, reload } = useApi<{ hours: BusinessHour[] }>("/api/business-hours");
  const { data: barberData } = useApi<{ barbers: Barber[] }>("/api/barbers?active=1");
  const [shopDraft, setShopDraft] = useState<Record<number, HourState> | null>(null);
  const [barberId, setBarberId] = useState("");
  const [barberHours, setBarberHours] = useState<Record<number, HourState>>(defaultHours());
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const serverShop = useMemo(() => {
    const next = defaultHours();
    data?.hours.forEach((hour) => {
      next[hour.day_of_week] = {
        open_time: hour.open_time || "09:00",
        close_time: hour.close_time || "17:00",
        is_closed: hour.is_closed,
      };
    });
    return next;
  }, [data]);
  const shop = shopDraft ?? serverShop;

  async function loadBarberHours(id: string) {
    setBarberId(id);
    if (!id) return;
    const payload = await apiFetch<{ hours: BarberHour[] }>(`/api/barbers/${id}/hours`);
    const next = defaultHours();
    payload.hours.forEach((hour) => {
      next[hour.day_of_week] = {
        open_time: hour.start_time || "09:00",
        close_time: hour.end_time || "17:00",
        is_closed: hour.is_closed,
      };
    });
    setBarberHours(next);
  }

  async function saveShop() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/business-hours", {
        method: "POST",
        body: JSON.stringify({
          hours: WEEKDAYS.map((weekday) => ({
            day_of_week: weekday.day_of_week,
            open_time: shop[weekday.day_of_week].open_time,
            close_time: shop[weekday.day_of_week].close_time,
            is_closed: shop[weekday.day_of_week].is_closed,
          })),
        }),
      });
      setInfo("Horários da barbearia atualizados.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar os horários.");
    } finally {
      setSaving(false);
    }
  }

  async function saveBarber() {
    if (!barberId) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/barbers/${barberId}/hours`, {
        method: "PUT",
        body: JSON.stringify({
          hours: WEEKDAYS.map((weekday) => ({
            day_of_week: weekday.day_of_week,
            start_time: barberHours[weekday.day_of_week].open_time,
            end_time: barberHours[weekday.day_of_week].close_time,
            is_closed: barberHours[weekday.day_of_week].is_closed,
          })),
        }),
      });
      setInfo("Horários individuais atualizados.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar os horários.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Expediente</p>
        <h1 className="font-display mt-1 text-3xl">Horários</h1>
      </header>

      {info ? <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{info}</div> : null}
      {error ? <ErrorBox message={error} /> : null}
      {loading ? <Loading /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display mb-3 text-xl">Horários da barbearia</h2>
          <div className="space-y-2">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday.day_of_week} className="grid grid-cols-4 items-center gap-2">
                <span className="text-xs text-zinc-400">{weekday.label}</span>
                <input
                  type="time"
                  className={inputClass}
                  disabled={shop[weekday.day_of_week].is_closed}
                  value={shop[weekday.day_of_week].open_time}
                  onChange={(e) => setShopDraft({ ...shop, [weekday.day_of_week]: { ...shop[weekday.day_of_week], open_time: e.target.value } })}
                />
                <input
                  type="time"
                  className={inputClass}
                  disabled={shop[weekday.day_of_week].is_closed}
                  value={shop[weekday.day_of_week].close_time}
                  onChange={(e) => setShopDraft({ ...shop, [weekday.day_of_week]: { ...shop[weekday.day_of_week], close_time: e.target.value } })}
                />
                <label className="flex items-center gap-1 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={shop[weekday.day_of_week].is_closed}
                    onChange={(e) => setShopDraft({ ...shop, [weekday.day_of_week]: { ...shop[weekday.day_of_week], is_closed: e.target.checked } })}
                  />
                  Fechado
                </label>
              </div>
            ))}
          </div>
          <button type="button" className={`${btnPrimary} mt-4`} onClick={saveShop} disabled={saving}>
            Salvar horários
          </button>
        </Card>

        <Card>
          <h2 className="font-display mb-3 text-xl">Horários individuais</h2>
          <div>
            <label className={labelClass} htmlFor="hours-barber">Profissional</label>
            <select id="hours-barber" className={inputClass} value={barberId} onChange={(e) => void loadBarberHours(e.target.value)}>
              <option value="">Selecione</option>
              {(barberData?.barbers ?? []).map((barber) => (
                <option key={barber.id} value={barber.id}>{barber.name}</option>
              ))}
            </select>
          </div>

          {barberId ? (
            <>
              <div className="mt-4 space-y-2">
                {WEEKDAYS.map((weekday) => (
                  <div key={weekday.day_of_week} className="grid grid-cols-4 items-center gap-2">
                    <span className="text-xs text-zinc-400">{weekday.label}</span>
                    <input
                      type="time"
                      className={inputClass}
                      disabled={barberHours[weekday.day_of_week].is_closed}
                      value={barberHours[weekday.day_of_week].open_time}
                      onChange={(e) =>
                        setBarberHours({ ...barberHours, [weekday.day_of_week]: { ...barberHours[weekday.day_of_week], open_time: e.target.value } })
                      }
                    />
                    <input
                      type="time"
                      className={inputClass}
                      disabled={barberHours[weekday.day_of_week].is_closed}
                      value={barberHours[weekday.day_of_week].close_time}
                      onChange={(e) =>
                        setBarberHours({ ...barberHours, [weekday.day_of_week]: { ...barberHours[weekday.day_of_week], close_time: e.target.value } })
                      }
                    />
                    <label className="flex items-center gap-1 text-xs text-zinc-400">
                      <input
                        type="checkbox"
                        checked={barberHours[weekday.day_of_week].is_closed}
                        onChange={(e) =>
                          setBarberHours({ ...barberHours, [weekday.day_of_week]: { ...barberHours[weekday.day_of_week], is_closed: e.target.checked } })
                        }
                      />
                      Folga
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" className={btnPrimary} onClick={saveBarber} disabled={saving}>Salvar</button>
                <button type="button" className={btnGhost} onClick={() => setBarberId("")}>Fechar</button>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Se o profissional não tiver horário próprio, vale o horário da barbearia. Fora do expediente dele,
                nenhum horário é oferecido.
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">Selecione um profissional para configurar o expediente individual.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
