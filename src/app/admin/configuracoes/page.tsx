"use client";

import { useEffect, useState } from "react";
import { apiFetch, dateBR, useApi } from "@/hooks/useApi";
import { Badge, Card, ErrorBox, Loading, btnGhost, btnPrimary, inputClass, labelClass } from "@/components/ui";
import type { Review, Setting } from "@/types";

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "business_name", label: "Nome da barbearia" },
  { key: "business_phone", label: "Telefone" },
  { key: "business_whatsapp", label: "WhatsApp (55 + número)", hint: "Ex: 5582981883520" },
  { key: "business_address", label: "Endereço" },
  { key: "business_instagram", label: "Instagram (sem @)" },
  { key: "business_rating", label: "Nota exibida" },
  { key: "slot_step_minutes", label: "Intervalo entre horários (min)", hint: "Padrão 30" },
  { key: "booking_window_days", label: "Janela de agendamento (dias)", hint: "Padrão 60" },
];

export default function SettingsPage() {
  const { data, loading, reload } = useApi<{ settings: Setting[] }>("/api/settings");
  const { data: reviewData, reload: reloadReviews } = useApi<{ reviews: Review[] }>("/api/reviews?all=1");
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data?.settings) return;
    const next: Record<string, string> = {};
    data.settings.forEach((setting) => {
      next[setting.key] = setting.value || "";
    });
    setValues(next);
  }, [data]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      await apiFetch("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ settings: FIELDS.map((field) => ({ key: field.key, value: values[field.key] || "" })) }),
      });
      setInfo("Configurações salvas.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  }

  async function moderate(review: Review, body: { approved?: boolean; active?: boolean }) {
    setError(null);
    try {
      await apiFetch(`/api/reviews/${review.id}`, { method: "PUT", body: JSON.stringify(body) });
      await reloadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a avaliação.");
    }
  }

  const reviews = reviewData?.reviews ?? [];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Sistema</p>
        <h1 className="font-display mt-1 text-3xl">Configurações</h1>
      </header>

      {info ? <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{info}</div> : null}
      {error ? <ErrorBox message={error} /> : null}
      {loading ? <Loading /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display mb-3 text-xl">Informações da barbearia</h2>
          <form onSubmit={save} className="space-y-3">
            {FIELDS.map((field) => (
              <div key={field.key}>
                <label className={labelClass} htmlFor={`setting-${field.key}`}>{field.label}</label>
                <input
                  id={`setting-${field.key}`}
                  className={inputClass}
                  value={values[field.key] ?? ""}
                  onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
                />
                {field.hint ? <p className="mt-1 text-xs text-zinc-600">{field.hint}</p> : null}
              </div>
            ))}
            <button type="submit" className={btnPrimary} disabled={saving}>Salvar</button>
          </form>
        </Card>

        <Card>
          <h2 className="font-display mb-3 text-xl">Avaliações (moderação)</h2>
          {reviews.length ? (
            <ul className="max-h-96 divide-y divide-line overflow-auto text-sm">
              {reviews.map((review) => (
                <li key={review.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-zinc-200">{review.customer_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gold">{"★".repeat(review.rating)}</span>
                      <Badge className={review.approved ? "border-emerald-500/40 text-emerald-300" : "border-amber-500/40 text-amber-300"}>
                        {review.approved ? "publicada" : "pendente"}
                      </Badge>
                      <span className="text-xs text-zinc-600">{dateBR(review.created_at)}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-zinc-400">{review.comment}</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className={btnGhost} onClick={() => moderate(review, { approved: !review.approved })}>
                      {review.approved ? "Ocultar" : "Aprovar"}
                    </button>
                    <button type="button" className={btnGhost} onClick={() => moderate(review, { active: !review.active })}>
                      {review.active ? "Desativar" : "Reativar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Nenhuma avaliação recebida ainda.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
