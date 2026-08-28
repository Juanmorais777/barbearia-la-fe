"use client";

import { useState } from "react";
import { apiFetch, money, useApi } from "@/hooks/useApi";
import { Badge, Card, Empty, ErrorBox, Loading, btnGhost, btnPrimary, inputClass, labelClass } from "@/components/ui";
import type { Barber, Service } from "@/types";

type FormState = {
  name: string;
  description: string;
  price: string;
  duration_minutes: string;
  category: string;
  barber_ids: number[];
};

const emptyForm: FormState = { name: "", description: "", price: "", duration_minutes: "30", category: "Cabelo", barber_ids: [] };

export default function ServicesPage() {
  const { data, loading, reload } = useApi<{ services: Service[] }>("/api/services");
  const { data: barberData } = useApi<{ barbers: Barber[] }>("/api/barbers?active=1");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const services = data?.services ?? [];
  const barbers = barberData?.barbers ?? [];

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    const payload = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      duration_minutes: Number(form.duration_minutes),
      category: form.category || null,
      barber_ids: form.barber_ids,
    };
    try {
      if (editing) await apiFetch(`/api/services/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      else await apiFetch("/api/services", { method: "POST", body: JSON.stringify(payload) });
      setInfo(editing ? "Serviço atualizado." : "Serviço cadastrado.");
      setForm(emptyForm);
      setEditing(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o serviço.");
    }
  }

  async function toggleActive(service: Service) {
    try {
      await apiFetch(`/api/services/${service.id}`, { method: "PUT", body: JSON.stringify({ active: !service.active }) });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar.");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Catálogo</p>
        <h1 className="font-display mt-1 text-3xl">Serviços</h1>
      </header>

      {info ? <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{info}</div> : null}
      {error ? <ErrorBox message={error} /> : null}
      {loading ? <Loading /> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="font-display mb-3 text-xl">{editing ? "Editar serviço" : "Novo serviço"}</h2>
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="service-name">Nome</label>
              <input id="service-name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={3} />
            </div>
            <div>
              <label className={labelClass} htmlFor="service-description">Descrição</label>
              <textarea id="service-description" rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="service-price">Preço (R$)</label>
                <input id="service-price" type="number" min={0} step={0.01} className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div>
                <label className={labelClass} htmlFor="service-duration">Duração (min)</label>
                <input id="service-duration" type="number" min={5} step={5} className={inputClass} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="service-category">Categoria</label>
              <input id="service-category" className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <span className={labelClass}>Profissionais que realizam</span>
              <div className="max-h-40 space-y-1 overflow-auto rounded-lg border border-line p-2">
                {barbers.map((barber) => (
                  <label key={barber.id} className="flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={form.barber_ids.includes(barber.id)}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          barber_ids: event.target.checked
                            ? [...form.barber_ids, barber.id]
                            : form.barber_ids.filter((id) => id !== barber.id),
                        })
                      }
                    />
                    {barber.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}>{editing ? "Salvar" : "Cadastrar"}</button>
              {editing ? (
                <button type="button" className={btnGhost} onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancelar</button>
              ) : null}
            </div>
          </form>
        </Card>

        <div className="space-y-2 lg:col-span-2">
          {!loading && services.length === 0 ? <Empty title="Nenhum serviço cadastrado." /> : null}
          {services.map((service) => (
            <Card key={service.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white">{service.name}</p>
                  <Badge className={service.active ? "border-emerald-500/40 text-emerald-300" : "border-rose-500/40 text-rose-300"}>
                    {service.active ? "ativo" : "inativo"}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500">{service.description}</p>
                <p className="text-xs text-zinc-500">
                  {service.category} · {service.duration_minutes} min · {service.barber_ids.length} profissional(is)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-xl text-gold">{money(service.price)}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => {
                      setEditing(service);
                      setForm({
                        name: service.name,
                        description: service.description || "",
                        price: String(service.price),
                        duration_minutes: String(service.duration_minutes),
                        category: service.category || "",
                        barber_ids: service.barber_ids,
                      });
                    }}
                  >
                    Editar
                  </button>
                  <button type="button" className={btnGhost} onClick={() => toggleActive(service)}>
                    {service.active ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
