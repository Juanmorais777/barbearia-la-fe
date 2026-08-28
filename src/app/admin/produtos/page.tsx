"use client";

import { useState } from "react";
import { apiFetch, money, useApi } from "@/hooks/useApi";
import { Badge, Card, Empty, ErrorBox, Loading, btnGhost, btnPrimary, inputClass, labelClass } from "@/components/ui";
import { PAYMENT_LABELS } from "@/lib/constants";
import type { Barber, Product, ProductSale } from "@/types";

type FormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  minimum_stock: string;
  category: string;
};

const emptyForm: FormState = { name: "", description: "", price: "", stock: "0", minimum_stock: "2", category: "Cabelo" };

export default function ProductsPage() {
  const { data, loading, reload } = useApi<{ products: Product[] }>("/api/products");
  const { data: saleData, reload: reloadSales } = useApi<{ sales: ProductSale[] }>("/api/sales");
  const { data: barberData } = useApi<{ barbers: Barber[] }>("/api/barbers?active=1");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Product | null>(null);
  const [selling, setSelling] = useState<Product | null>(null);
  const [sale, setSale] = useState({ quantity: "1", payment_method: "DINHEIRO", barber_id: "" });
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const products = data?.products ?? [];
  const sales = saleData?.sales ?? [];

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    const payload = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      stock: Number(form.stock),
      minimum_stock: Number(form.minimum_stock),
      category: form.category || null,
    };
    try {
      if (editing) await apiFetch(`/api/products/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      else await apiFetch("/api/products", { method: "POST", body: JSON.stringify(payload) });
      setInfo(editing ? "Produto atualizado." : "Produto cadastrado.");
      setForm(emptyForm);
      setEditing(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o produto.");
    }
  }

  async function confirmSale() {
    if (!selling) return;
    setError(null);
    try {
      const result = await apiFetch<{ total: number }>(`/api/products/${selling.id}/sell`, {
        method: "POST",
        body: JSON.stringify({
          quantity: Number(sale.quantity),
          payment_method: sale.payment_method,
          barber_id: sale.barber_id ? Number(sale.barber_id) : null,
        }),
      });
      setInfo(`Venda registrada: ${money(result.total)}. Estoque atualizado e receita lançada.`);
      setSelling(null);
      setSale({ quantity: "1", payment_method: "DINHEIRO", barber_id: "" });
      await Promise.all([reload(), reloadSales()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar a venda.");
    }
  }

  async function toggleActive(product: Product) {
    try {
      await apiFetch(`/api/products/${product.id}`, { method: "PUT", body: JSON.stringify({ active: !product.active }) });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar.");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Loja</p>
        <h1 className="font-display mt-1 text-3xl">Produtos e estoque</h1>
      </header>

      {info ? <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{info}</div> : null}
      {error ? <ErrorBox message={error} /> : null}
      {loading ? <Loading /> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="font-display mb-3 text-xl">{editing ? "Editar produto" : "Novo produto"}</h2>
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="product-name">Nome</label>
              <input id="product-name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={3} />
            </div>
            <div>
              <label className={labelClass} htmlFor="product-description">Descrição</label>
              <textarea id="product-description" rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="product-price">Preço (R$)</label>
                <input id="product-price" type="number" min={0} step={0.01} className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div>
                <label className={labelClass} htmlFor="product-category">Categoria</label>
                <input id="product-category" className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label className={labelClass} htmlFor="product-stock">Estoque</label>
                <input id="product-stock" type="number" min={0} className={inputClass} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
              </div>
              <div>
                <label className={labelClass} htmlFor="product-min">Estoque mínimo</label>
                <input id="product-min" type="number" min={0} className={inputClass} value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} required />
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
          {!loading && products.length === 0 ? <Empty title="Nenhum produto cadastrado." /> : null}
          {products.map((product) => (
            <Card key={product.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-white">{product.name}</p>
                  {product.low_stock ? <Badge className="border-amber-500/40 text-amber-300">estoque baixo</Badge> : null}
                  {!product.active ? <Badge className="border-rose-500/40 text-rose-300">inativo</Badge> : null}
                </div>
                <p className="text-xs text-zinc-500">
                  {product.category} · estoque {product.stock} (mín. {product.minimum_stock})
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-xl text-gold">{money(product.price)}</span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btnPrimary} onClick={() => setSelling(product)}>Vender</button>
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => {
                      setEditing(product);
                      setForm({
                        name: product.name,
                        description: product.description || "",
                        price: String(product.price),
                        stock: String(product.stock),
                        minimum_stock: String(product.minimum_stock),
                        category: product.category || "",
                      });
                    }}
                  >
                    Editar
                  </button>
                  <button type="button" className={btnGhost} onClick={() => toggleActive(product)}>
                    {product.active ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </div>
            </Card>
          ))}

          <Card>
            <h2 className="font-display mb-3 text-xl">Últimas vendas</h2>
            {sales.length ? (
              <ul className="divide-y divide-line text-sm">
                {sales.slice(0, 10).map((item) => (
                  <li key={item.id} className="flex justify-between py-2">
                    <span className="text-zinc-300">
                      {item.quantity}x {item.product_name} · {PAYMENT_LABELS[item.payment_method]}
                    </span>
                    <span className="text-gold">{money(item.total)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">Nenhuma venda registrada ainda.</p>
            )}
          </Card>
        </div>
      </div>

      {selling ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-md space-y-4 p-6">
            <h2 className="font-display text-2xl">Registrar venda</h2>
            <p className="text-sm text-zinc-400">
              {selling.name} · {money(selling.price)} · {selling.stock} em estoque
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="sale-qty">Quantidade</label>
                <input id="sale-qty" type="number" min={1} max={selling.stock} className={inputClass} value={sale.quantity} onChange={(e) => setSale({ ...sale, quantity: e.target.value })} />
              </div>
              <div>
                <label className={labelClass} htmlFor="sale-pay">Pagamento</label>
                <select id="sale-pay" className={inputClass} value={sale.payment_method} onChange={(e) => setSale({ ...sale, payment_method: e.target.value })}>
                  {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="sale-barber">Profissional (opcional)</label>
              <select id="sale-barber" className={inputClass} value={sale.barber_id} onChange={(e) => setSale({ ...sale, barber_id: e.target.value })}>
                <option value="">Nenhum</option>
                {(barberData?.barbers ?? []).map((barber) => (
                  <option key={barber.id} value={barber.id}>{barber.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setSelling(null)}>Cancelar</button>
              <button type="button" className={btnPrimary} onClick={confirmSale}>Confirmar venda</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
