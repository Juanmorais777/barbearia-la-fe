"use client";

import { useState } from "react";

import {
  apiFetch,
  useApi,
} from "@/hooks/useApi";

import {
  Card,
  Empty,
  ErrorBox,
  Loading,
  btnGhost,
  btnPrimary,
  inputClass,
  labelClass,
} from "@/components/ui";

import { WEEKDAYS } from "@/lib/constants";

import type {
  Barber,
  BarberHour,
  Service,
} from "@/types";

/* =========================================================
   FORMULÁRIO
   ========================================================= */

type FormState = {
  name: string;
  phone: string;
  email: string;
  specialty: string;
  bio: string;
  commission_percent: string;
  service_ids: number[];
};

/* =========================================================
   FORMULÁRIO VAZIO
   ========================================================= */

const emptyForm: FormState = {
  name: "",
  phone: "",
  email: "",
  specialty: "",
  bio: "",
  commission_percent: "40",
  service_ids: [],
};

/* =========================================================
   PÁGINA
   ========================================================= */

export default function BarbersPage() {
  const {
    data,
    loading,
    reload,
  } =
    useApi<{
      barbers: Barber[];
    }>("/api/barbers");

  const {
    data: serviceData,
  } =
    useApi<{
      services: Service[];
    }>("/api/services");

  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      emptyForm,
    );

  const [
    editing,
    setEditing,
  ] =
    useState<Barber | null>(
      null,
    );

  const [
    hoursFor,
    setHoursFor,
  ] =
    useState<Barber | null>(
      null,
    );

  const [
    hours,
    setHours,
  ] =
    useState<
      Record<
        number,
        {
          start_time: string;
          end_time: string;
          is_closed: boolean;
        }
      >
    >({});

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    info,
    setInfo,
  ] =
    useState<string | null>(
      null,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const barbers =
    data?.barbers ?? [];

  const services =
    serviceData?.services ?? [];

  /* =========================================================
     SALVAR BARBEIRO
     ========================================================= */

  async function save(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setError(null);
    setInfo(null);

    /*
     * Converte a comissão para número.
     */
    const commission =
      Number(
        form.commission_percent,
      );

    /*
     * Proteção contra NaN.
     */
    if (
      !Number.isFinite(
        commission,
      )
    ) {
      setError(
        "Informe uma comissão válida.",
      );

      setSaving(false);

      return;
    }

    /*
     * Proteção contra valores
     * fora do intervalo.
     */
    if (
      commission < 0 ||
      commission > 100
    ) {
      setError(
        "A comissão deve estar entre 0% e 100%.",
      );

      setSaving(false);

      return;
    }

    /*
     * Payload enviado para a API.
     *
     * IMPORTANTE:
     * usa commission_percent.
     */
    const payload = {
      name: form.name.trim(),

      phone:
        form.phone.trim() ||
        null,

      email:
        form.email.trim() ||
        null,

      specialty:
        form.specialty.trim() ||
        null,

      bio:
        form.bio.trim() ||
        null,

      commission_percent:
        commission,

      service_ids:
        form.service_ids,
    };

    try {
      if (editing) {
        await apiFetch(
          `/api/barbers/${editing.id}`,
          {
            method: "PUT",

            body:
              JSON.stringify(
                payload,
              ),
          },
        );
      } else {
        await apiFetch(
          "/api/barbers",
          {
            method: "POST",

            body:
              JSON.stringify(
                payload,
              ),
          },
        );
      }

      setInfo(
        editing
          ? "Profissional atualizado."
          : "Profissional cadastrado.",
      );

      setForm(
        emptyForm,
      );

      setEditing(null);

      await reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     ABRIR HORÁRIOS
     ========================================================= */

  async function openHours(
    barber: Barber,
  ) {
    setHoursFor(barber);
    setError(null);

    try {
      const data =
        await apiFetch<{
          hours: BarberHour[];
        }>(
          `/api/barbers/${barber.id}/hours`,
        );

      const next: typeof hours =
        {};

      WEEKDAYS.forEach(
        (weekday) => {
          const found =
            data.hours.find(
              (hour) =>
                hour.day_of_week ===
                weekday.day_of_week,
            );

          next[
            weekday.day_of_week
          ] = {
            start_time:
              found?.start_time ||
              "09:00",

            end_time:
              found?.end_time ||
              "17:00",

            is_closed: found
              ? found.is_closed
              : true,
          };
        },
      );

      setHours(next);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os horários.",
      );

      setHoursFor(null);
    }
  }

  /* =========================================================
     SALVAR HORÁRIOS
     ========================================================= */

  async function saveHours() {
    if (!hoursFor) {
      return;
    }

    setSaving(true);
    setError(null);
    setInfo(null);

    try {
      await apiFetch(
        `/api/barbers/${hoursFor.id}/hours`,
        {
          method: "PUT",

          body: JSON.stringify({
            hours:
              WEEKDAYS.map(
                (weekday) => ({
                  day_of_week:
                    weekday.day_of_week,

                  start_time:
                    hours[
                      weekday.day_of_week
                    ]?.start_time ||
                    null,

                  end_time:
                    hours[
                      weekday.day_of_week
                    ]?.end_time ||
                    null,

                  is_closed:
                    hours[
                      weekday.day_of_week
                    ]?.is_closed ??
                    true,
                }),
              ),
          }),
        },
      );

      setInfo(
        "Horários do profissional atualizados.",
      );

      setHoursFor(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar os horários.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     ATIVAR / DESATIVAR
     ========================================================= */

  async function toggleActive(
    barber: Barber,
  ) {
    setError(null);
    setInfo(null);

    try {
      await apiFetch(
        `/api/barbers/${barber.id}`,
        {
          method: "PUT",

          body:
            JSON.stringify({
              active:
                !barber.active,
            }),
        },
      );

      await reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar.",
      );
    }
  }

  /* =========================================================
     CANCELAR EDIÇÃO
     ========================================================= */

  function cancelEditing() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
  }

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="space-y-6">
      {/* =====================================================
          CABEÇALHO
          ===================================================== */}

      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">
          Equipe
        </p>

        <h1 className="font-display mt-1 text-3xl">
          Profissionais
        </h1>
      </header>

      {/* =====================================================
          MENSAGENS
          ===================================================== */}

      {info ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {info}
        </div>
      ) : null}

      {error ? (
        <ErrorBox
          message={error}
        />
      ) : null}

      {loading ? (
        <Loading />
      ) : null}

      {/* =====================================================
          CONTEÚDO
          ===================================================== */}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ===================================================
            FORMULÁRIO
            =================================================== */}

        <Card>
          <h2 className="font-display mb-3 text-xl">
            {editing
              ? "Editar profissional"
              : "Novo profissional"}
          </h2>

          <form
            onSubmit={save}
            className="space-y-3"
          >
            {/* NOME */}

            <div>
              <label
                className={labelClass}
                htmlFor="barber-name"
              >
                Nome
              </label>

              <input
                id="barber-name"
                className={inputClass}
                value={
                  form.name
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    name:
                      e.target.value,
                  })
                }
                required
                minLength={3}
              />
            </div>

            {/* TELEFONE */}

            <div>
              <label
                className={labelClass}
                htmlFor="barber-phone"
              >
                Telefone
              </label>

              <input
                id="barber-phone"
                className={inputClass}
                value={
                  form.phone
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone:
                      e.target.value,
                  })
                }
              />
            </div>

            {/* EMAIL */}

            <div>
              <label
                className={labelClass}
                htmlFor="barber-email"
              >
                E-mail
              </label>

              <input
                id="barber-email"
                type="email"
                className={inputClass}
                value={
                  form.email
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    email:
                      e.target.value,
                  })
                }
              />
            </div>

            {/* ESPECIALIDADE */}

            <div>
              <label
                className={labelClass}
                htmlFor="barber-specialty"
              >
                Especialidade
              </label>

              <input
                id="barber-specialty"
                className={inputClass}
                value={
                  form.specialty
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    specialty:
                      e.target.value,
                  })
                }
              />
            </div>

            {/* BIO */}

            <div>
              <label
                className={labelClass}
                htmlFor="barber-bio"
              >
                Bio
              </label>

              <textarea
                id="barber-bio"
                rows={3}
                className={inputClass}
                value={
                  form.bio
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    bio:
                      e.target.value,
                  })
                }
              />
            </div>

            {/* COMISSÃO */}

            <div>
              <label
                className={labelClass}
                htmlFor="barber-commission"
              >
                Comissão (%)
              </label>

              <input
                id="barber-commission"
                type="number"
                min={0}
                max={100}
                step={0.5}
                className={inputClass}
                value={
                  form.commission_percent
                }
                onChange={(e) =>
                  setForm({
                    ...form,

                    commission_percent:
                      e.target.value,
                  })
                }
                required
              />
            </div>

            {/* SERVIÇOS */}

            <div>
              <span
                className={
                  labelClass
                }
              >
                Serviços realizados
              </span>

              <div className="max-h-40 space-y-1 overflow-auto rounded-lg border border-line p-2">
                {services.map(
                  (service) => (
                    <label
                      key={
                        service.id
                      }
                      className="flex items-center gap-2 text-sm text-zinc-300"
                    >
                      <input
                        type="checkbox"
                        checked={form.service_ids.includes(
                          service.id,
                        )}
                        onChange={(
                          event,
                        ) =>
                          setForm({
                            ...form,

                            service_ids:
                              event
                                .target
                                .checked
                                ? [
                                    ...form.service_ids,
                                    service.id,
                                  ]
                                : form.service_ids.filter(
                                    (
                                      id,
                                    ) =>
                                      id !==
                                      service.id,
                                  ),
                          })
                        }
                      />

                      {service.name}
                    </label>
                  ),
                )}
              </div>
            </div>

            {/* BOTÕES */}

            <div className="flex gap-2">
              <button
                type="submit"
                className={
                  btnPrimary
                }
                disabled={
                  saving
                }
              >
                {editing
                  ? "Salvar"
                  : "Cadastrar"}
              </button>

              {editing ? (
                <button
                  type="button"
                  className={
                    btnGhost
                  }
                  onClick={
                    cancelEditing
                  }
                  disabled={
                    saving
                  }
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </Card>

        {/* ===================================================
            LISTA DE BARBEIROS
            =================================================== */}

        <div className="space-y-2 lg:col-span-2">
          {!loading &&
          barbers.length ===
            0 ? (
            <Empty
              title="Nenhum profissional cadastrado."
            />
          ) : null}

          {barbers.map(
            (barber) => (
              <Card
                key={
                  barber.id
                }
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm text-white">
                    {barber.name}{" "}

                    {!barber.active ? (
                      <span className="text-xs text-rose-300">
                        (inativo)
                      </span>
                    ) : null}
                  </p>

                  <p className="text-xs text-zinc-500">
                    Comissão{" "}
                    {
                      barber.commission_percent
                    }
                    % ·{" "}
                    {barber.specialty ||
                      "sem especialidade"}
                  </p>

                  <p className="text-xs text-zinc-500">
                    {barber.phone || "sem telefone"} ·{" "}
                    {(barber.service_ids ?? []).length} serviço(s)
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* HORÁRIOS */}

                  <button
                    type="button"
                    className={
                      btnGhost
                    }
                    onClick={() =>
                      openHours(
                        barber,
                      )
                    }
                  >
                    Horários
                  </button>

                  {/* EDITAR */}

                  <button
                    type="button"
                    className={
                      btnGhost
                    }
                    onClick={() => {
                      setEditing(
                        barber,
                      );

                      setForm({
                        name:
                          barber.name,

                        phone:
                          barber.phone ||
                          "",

                        email:
                          barber.email ||
                          "",

                        specialty:
                          barber.specialty ||
                          "",

                        bio:
                          barber.bio ||
                          "",

                        /*
                         * CORRETO:
                         * commission_percent
                         */
                        commission_percent:
                          String(
                            barber.commission_percent,
                          ),

                        service_ids:
                            barber.service_ids ?? [],
                      });

                      setError(
                        null,
                      );

                      setInfo(
                        null,
                      );
                    }}
                  >
                    Editar
                  </button>

                  {/* ATIVAR / DESATIVAR */}

                  <button
                    type="button"
                    className={
                      btnGhost
                    }
                    onClick={() =>
                      toggleActive(
                        barber,
                      )
                    }
                  >
                    {barber.active
                      ? "Desativar"
                      : "Ativar"}
                  </button>
                </div>
              </Card>
            ),
          )}
        </div>
      </div>

      {/* =====================================================
          MODAL DE HORÁRIOS
          ===================================================== */}

      {hoursFor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/70 p-4">
          <div className="card w-full max-w-lg space-y-3 p-6">
            <h2 className="font-display text-2xl">
              Horários ·{" "}
              {
                hoursFor.name
              }
            </h2>

            {WEEKDAYS.map(
              (weekday) => (
                <div
                  key={
                    weekday.day_of_week
                  }
                  className="grid grid-cols-4 items-center gap-2"
                >
                  <span className="text-xs text-zinc-400">
                    {
                      weekday.label
                    }
                  </span>

                  {/* INÍCIO */}

                  <input
                    type="time"
                    className={
                      inputClass
                    }
                    disabled={
                      hours[
                        weekday
                          .day_of_week
                      ]
                        ?.is_closed
                    }
                    value={
                      hours[
                        weekday
                          .day_of_week
                      ]
                        ?.start_time ||
                      ""
                    }
                    onChange={(
                      e,
                    ) =>
                      setHours({
                        ...hours,

                        [weekday.day_of_week]:
                          {
                            ...hours[
                              weekday
                                .day_of_week
                            ],

                            start_time:
                              e.target
                                .value,
                          },
                      })
                    }
                  />

                  {/* FIM */}

                  <input
                    type="time"
                    className={
                      inputClass
                    }
                    disabled={
                      hours[
                        weekday
                          .day_of_week
                      ]
                        ?.is_closed
                    }
                    value={
                      hours[
                        weekday
                          .day_of_week
                      ]
                        ?.end_time ||
                      ""
                    }
                    onChange={(
                      e,
                    ) =>
                      setHours({
                        ...hours,

                        [weekday.day_of_week]:
                          {
                            ...hours[
                              weekday
                                .day_of_week
                            ],

                            end_time:
                              e.target
                                .value,
                          },
                      })
                    }
                  />

                  {/* FECHADO */}

                  <label className="flex items-center gap-1 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={
                        hours[
                          weekday
                            .day_of_week
                        ]
                          ?.is_closed ??
                        true
                      }
                      onChange={(
                        e,
                      ) =>
                        setHours({
                          ...hours,

                          [weekday.day_of_week]:
                            {
                              ...hours[
                                weekday
                                  .day_of_week
                              ],

                              is_closed:
                                e.target
                                  .checked,
                            },
                        })
                      }
                    />

                    Fechado
                  </label>
                </div>
              ),
            )}

            {/* BOTÕES DO MODAL */}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={
                  btnGhost
                }
                onClick={() =>
                  setHoursFor(
                    null,
                  )
                }
                disabled={
                  saving
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className={
                  btnPrimary
                }
                onClick={
                  saveHours
                }
                disabled={
                  saving
                }
              >
                {saving
                  ? "Salvando..."
                  : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}