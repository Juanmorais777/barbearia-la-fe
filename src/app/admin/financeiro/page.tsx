"use client";

import { useState } from "react";
import { apiFetch, dateBR, money, todayISO, useApi } from "@/hooks/useApi";
import { Badge, Card, Empty, ErrorBox, Loading, Stat, btnGhost, btnPrimary, inputClass, labelClass } from "@/components/ui";
import { PAYMENT_LABELS } from "@/lib/constants";
import type { Transaction } from "@/types";

type Summary = {
  income: number;
  expense: number;
  profit: number;
  income_day: number;
  expense_day: number;
  income_week: number;
  income_month: number;
  expense_month: number;
  by_payment: { method: string; amount: number }[];
  by_expense_category: { category: string; amount: number }[];
  daily: { date: string; income: number; expense: number }[];
  transactions: Transaction[];
  period: { from: string; to: string };
};

export default function FinancePage() {
  const [from, setFrom] = useState(`${todayISO().slice(0, 7)}-01`);
  const [to, setTo] = useState(todayISO());
  const [form, setForm] = useState({ type: "EXPENSE", category: "INSUMO", description: "", amount: "", payment_method: "DINHEIRO", transaction_date: todayISO() });
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const { data, loading, reload } = useApi<Summary>(`/api/finance?view=summary&from=${from}&to=${to}`);

  async function launch(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await apiFetch("/api/finance", {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          category: form.category,
          description: form.description,
          amount: Number(form.amount),
          payment_method: form.payment_method,
          transaction_date: form.transaction_date,
        }),
      });
      setInfo("Lançamento registrado.");
      setForm({ ...form, description: "", amount: "" });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar o lançamento.");
    }
  }

  const summary = data;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Caixa</p>
          <h1 className="font-display mt-1 text-3xl">Financeiro</h1>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className={labelClass} htmlFor="fin-from">De</label>
            <input id="fin-from" type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="fin-to">Até</label>
            <input id="fin-to" type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </header>

      {error ? <ErrorBox message={error} /> : null}
      {loading || !summary ? <Loading label="Carregando movimentações..." /> : null}

      {summary ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Receita do dia" value={money(summary.income_day)} hint={`Despesas: ${money(summary.expense_day)}`} />
            <Stat label="Receita da semana" value={money(summary.income_week)} />
            <Stat label="Receita do mês" value={money(summary.income_month)} hint={`Despesas: ${money(summary.expense_month)}`} />
            <Stat label="Lucro no período" value={money(summary.profit)} hint={`${dateBR(summary.period.from)} → ${dateBR(summary.period.to)}`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <h2 className="font-display mb-3 text-xl">Receita por pagamento</h2>
              {summary.by_payment.length ? (
                <ul className="space-y-1 text-sm">
                  {summary.by_payment.map((item) => (
                    <li key={item.method} className="flex justify-between">
                      <span className="text-zinc-300">{PAYMENT_LABELS[item.method] || item.method}</span>
                      <span className="text-gold">{money(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">Sem receitas no período.</p>
              )}
            </Card>

            <Card>
              <h2 className="font-display mb-3 text-xl">Despesas por categoria</h2>
              {summary.by_expense_category.length ? (
                <ul className="space-y-1 text-sm">
                  {summary.by_expense_category.map((item) => (
                    <li key={item.category} className="flex justify-between">
                      <span className="text-zinc-300">{item.category}</span>
                      <span className="text-rose-300">{money(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">Sem despesas no período.</p>
              )}
            </Card>

            <Card>
              <h2 className="font-display mb-3 text-xl">Lançamento manual</h2>
              <form onSubmit={launch} className="space-y-3">
                <div>
                  <label className={labelClass} htmlFor="tx-type">Tipo</label>
                  <select id="tx-type" className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="EXPENSE">Despesa</option>
                    <option value="INCOME">Receita</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="tx-category">Categoria</label>
                  <input id="tx-category" className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
                </div>
                <div>
                  <label className={labelClass} htmlFor="tx-description">Descrição</label>
                  <input id="tx-description" className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required minLength={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="tx-amount">Valor</label>
                    <input id="tx-amount" type="number" min={0.01} step={0.01} className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="tx-date">Data</label>
                    <input id="tx-date" type="date" className={inputClass} value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className={labelClass} htmlFor="tx-method">Pagamento</label>
                  <select id="tx-method" className={inputClass} value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                    {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className={btnPrimary}>Registrar</button>
              </form>
            </Card>
          </div>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl">Movimentações</h2>
              <button type="button" className={btnGhost} onClick={() => reload()}>Atualizar</button>
            </div>
            {summary.transactions.length ? (
              <ul className="divide-y divide-line text-sm">
                {summary.transactions.slice(0, 60).map((transaction) => (
                  <li key={transaction.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="text-zinc-200">{transaction.description}</p>
                      <p className="text-xs text-zinc-500">
                        {dateBR(transaction.transaction_date)} · {transaction.category}
                        {transaction.payment_method ? ` · ${PAYMENT_LABELS[transaction.payment_method]}` : ""}
                        {transaction.reference_type ? ` · ${transaction.reference_type} #${transaction.reference_id}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={transaction.type === "INCOME" ? "border-emerald-500/40 text-emerald-300" : "border-rose-500/40 text-rose-300"}>
                        {transaction.type === "INCOME" ? "Receita" : "Despesa"}
                      </Badge>
                      <span className={transaction.type === "INCOME" ? "text-emerald-300" : "text-rose-300"}>
                        {money(transaction.amount)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="Nenhuma movimentação no período." description="Receitas aparecem quando atendimentos são concluídos ou produtos vendidos." />
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
