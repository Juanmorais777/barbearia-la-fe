"use client";

import { useState } from "react";
import { apiFetch, dateBR, money, useApi } from "@/hooks/useApi";
import { Card, Empty, ErrorBox, Loading, btnGhost, btnPrimary, inputClass, labelClass } from "@/components/ui";
import type { Customer } from "@/types";

type HistoryPayload = { customer: Customer; history: { id: number; date: string; start_time: string; status: string; price: number; barber_name: string; service_name: string; payment_method: string | null }[] };

const emptyForm = { name: "", phone: "", email: "", notes: "" };

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryPayload | null>(null);

  const { data, loading, reload } = useApi<{ customers: Customer[] }>(
    `/api/customers?search=${encodeURIComponent(search)}`,
  );

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    try {
      if (editing) {
        await apiFetch(`/api/customers/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...form, email: form.email || null, notes: form.notes || null }),
        });
        setInfo("Cliente atualizado.");
      } else {
        await apiFetch("/api/customers", {
          method: "POST",
          body: JSON.stringify({ ...form, email: form.email || null, notes: form.notes || null }),
        });
        setInfo("Cliente cadastrado.");
      }
      setForm(emptyForm);
      setEditing(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o cliente.");
    }
  }

  async function deactivate(customer: Customer) {
    if (!window.confirm(`Desativar o cliente ${customer.name}? O histórico é preservado.`)) return;
    try {
      await apiFetch(`/api/customers/${customer.id}`, { method: "DELETE" });
      setInfo("Cliente desativado.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível desativar.");
    }
  }

  async function openHistory(customer: Customer) {
    try {
      setHistory(await apiFetch<HistoryPayload>(`/api/customers/${customer.id}/history`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o histórico.");
    }
  }

  const customers = data?.customers ?? [];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Cadastro</p>
        <h1 className="font-display mt-1 text-3xl">Clientes</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="font-display mb-3 text-xl">{editing ? "Editar cliente" : "Novo cliente"}</h2>
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="customer-name">Nome</label>
              <input id="customer-name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={3} />
            </div>
            <div>
              <label className={labelClass} htmlFor="customer-phone">Telefone / WhatsApp</label>
              <input id="customer-phone" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(82) 98888-7777" required />
            </div>
            <div>
              <label className={labelClass} htmlFor="customer-email">E-mail (opcional)</label>
              <input id="customer-email" type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className={labelClass} htmlFor="customer-notes">Observações</label>
              <textarea id="customer-notes" rows={3} className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}>{editing ? "Salvar" : "Cadastrar"}</button>
              {editing ? (
                <button type="button" className={btnGhost} onClick={() => { setEditing(null); setForm(emptyForm); }}>
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </Card>

        <div className="space-y-3 lg:col-span-2">
          <Card>
            <label className={labelClass} htmlFor="customer-search">Pesquisar</label>
            <input
              id="customer-search"
              className={inputClass}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="nome ou telefone"
            />
          </Card>

          {info ? <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{info}</div> : null}
          {error ? <ErrorBox message={error} /> : null}
          {loading ? <Loading /> : null}

          {!loading && customers.length === 0 ? <Empty title="Nenhum cliente encontrado." /> : null}

          <div className="space-y-2">
            {customers.map((customer) => (
              <Card key={customer.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white">
                    {customer.name}{" "}
                    {!customer.active ? <span className="text-xs text-rose-300">(inativo)</span> : null}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {customer.phone}
                    {customer.email ? ` · ${customer.email}` : ""}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {customer.appointments_count ?? 0} agendamento(s)
                    {customer.last_appointment ? ` · último: ${dateBR(customer.last_appointment)}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={btnGhost} onClick={() => openHistory(customer)}>Histórico</button>
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => {
                      setEditing(customer);
                      setForm({ name: customer.name, phone: customer.phone, email: customer.email || "", notes: customer.notes || "" });
                    }}
                  >
                    Editar
                  </button>
                  <button type="button" className={btnGhost} onClick={() => deactivate(customer)}>Desativar</button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {history ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-2xl space-y-4 p-6">
            <h2 className="font-display text-2xl">Histórico · {history.customer.name}</h2>
            {history.history.length ? (
              <ul className="max-h-72 divide-y divide-line overflow-auto text-sm">
                {history.history.map((item) => (
                  <li key={item.id} className="flex justify-between gap-2 py-2">
                    <span className="text-zinc-300">
                      {dateBR(item.date)} {item.start_time} · {item.service_name}
                    </span>
                    <span className="text-zinc-500">
                      {money(item.price)} · {item.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">Este cliente ainda não possui atendimentos.</p>
            )}
            <button type="button" className={btnGhost} onClick={() => setHistory(null)}>Fechar</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
