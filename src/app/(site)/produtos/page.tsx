import { Card, Empty, SectionTitle } from "@/components/ui";
import { listProducts } from "@/services/products.service";
import { SHOP } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Produtos | Barbearia La Fé" };

export default async function ProductsPage() {
  const products = await listProducts({ activeOnly: true });

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <SectionTitle
        eyebrow="Loja"
        title="Produtos para o dia a dia"
        subtitle="Finalizadores e tratamentos usados nas nossas cadeiras. Compre na barbearia ou reserve pelo WhatsApp."
      />

      {products.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Card key={product.id} className="card-hover flex flex-col">
              <div className="mb-3 flex h-32 items-center justify-center rounded-lg border border-line bg-gradient-to-br from-ink-3 to-ink text-4xl">
                🧴
              </div>
              <h3 className="font-display text-lg">{product.name}</h3>
              <p className="mt-1 flex-1 text-sm text-zinc-400">{product.description}</p>
              <p className="font-display mt-3 text-2xl text-gold">
                R$ {product.price.toFixed(2).replace(".", ",")}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {product.category} · {product.stock > 0 ? `${product.stock} em estoque` : "sob consulta"}
              </p>
              <a
                href={`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(
                  `Olá! Tenho interesse no produto ${product.name} (R$ ${product.price.toFixed(2)}).`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 rounded-full border border-line px-4 py-2 text-center text-xs uppercase tracking-[0.14em] text-zinc-200 transition hover:border-gold/60"
              >
                Reservar pelo WhatsApp
              </a>
            </Card>
          ))}
        </div>
      ) : (
        <Empty title="Nenhum produto disponível no momento." description="Fale com a barbearia para conhecer nossas opções." />
      )}
    </div>
  );
}
