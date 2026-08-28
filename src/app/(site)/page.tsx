import Link from "next/link";
import { Card, LinkButton, SectionTitle } from "@/components/ui";
import { DIFFERENTIALS, SHOP } from "@/lib/constants";
import { listBarbers, listServices } from "@/services/catalog.service";
import { listPublicReviews } from "@/services/reviews.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [services, barbers, reviews] = await Promise.all([
    listServices(),
    listBarbers(),
    listPublicReviews(),
  ]);
  const highlights = services.slice(0, 6);

  return (
    <>
      <section className="hero-grid relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "url(/images/hero.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="text-xs uppercase tracking-[0.4em] text-gold">Jatiúca · Maceió · Alagoas</p>
          <h1 className="font-display mt-4 text-5xl font-bold leading-[1.05] sm:text-7xl">
            BARBEARIA <span className="gold-text">LA FÉ</span>
          </h1>
          <p className="font-display mt-3 text-2xl text-zinc-200 sm:text-3xl">{SHOP.tagline}</p>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Corte, barba e atendimento de verdade, no coração da Jatiúca. Escolha seu barbeiro, veja os horários
            reais disponíveis e garanta sua cadeira em menos de um minuto.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton href="/agendamento">Agendar agora</LinkButton>
            <Link
              href="/servicos"
              className="rounded-full border border-line px-6 py-3 text-xs uppercase tracking-[0.16em] text-zinc-200 transition hover:border-gold/60"
            >
              Ver serviços
            </Link>
            <a
              href={`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent("Olá! Quero informações sobre a Barbearia La Fé.")}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-emerald-500/40 px-6 py-3 text-xs uppercase tracking-[0.16em] text-emerald-300 transition hover:bg-emerald-500/10"
            >
              WhatsApp
            </a>
          </div>

          <dl className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Endereço", value: `${SHOP.address}`, hint: SHOP.city },
              { label: "Telefone / WhatsApp", value: SHOP.phone, hint: "Atendimento rápido pelo WhatsApp" },
              { label: "Horário", value: "Seg 09:00-21:00", hint: "Terça a sábado 09:00-17:00" },
            ].map((item) => (
              <div key={item.label} className="card p-4">
                <dt className="text-[11px] uppercase tracking-[0.18em] text-gold">{item.label}</dt>
                <dd className="mt-1 text-sm text-zinc-200">{item.value}</dd>
                <dd className="text-xs text-zinc-500">{item.hint}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionTitle eyebrow="Serviços" title="O que fazemos por você" subtitle="Preços e duração reais, direto do sistema da barbearia." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((service) => (
            <Card key={service.id} className="card-hover">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-xl">{service.name}</h3>
                <span className="rounded-full border border-gold/40 px-2.5 py-1 text-xs text-gold">
                  R$ {service.price.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <p className="mt-2 min-h-[40px] text-sm text-zinc-400">{service.description}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-zinc-500">
                {service.duration_minutes} minutos · {service.category}
              </p>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/servicos" className="text-sm text-gold hover:underline">
            Ver todos os serviços →
          </Link>
        </div>
      </section>

      <section className="border-y border-line bg-ink-2">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionTitle eyebrow="Equipe" title="Profissionais La Fé" subtitle="Escolha com quem quer cuidar do seu estilo." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {barbers.map((barber) => (
              <Card key={barber.id} className="card-hover text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/50 font-display text-2xl text-gold">
                  {barber.name.slice(0, 1)}
                </div>
                <h3 className="font-display mt-3 text-lg">{barber.name}</h3>
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Barbeiro La Fé</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionTitle eyebrow="Diferenciais" title="Mais que um corte" subtitle="Estrutura pensada para você esperar confortável e sair impecável." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {DIFFERENTIALS.map((item) => (
            <div key={item.label} className="card flex flex-col items-center gap-2 p-4 text-center">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs text-zinc-300">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-ink-2">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionTitle eyebrow="Avaliações" title={`⭐ ${reviews.average.toFixed(1)} de nossos clientes`} />
          {reviews.reviews.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.reviews.slice(0, 6).map((review) => (
                <Card key={review.id}>
                  <p className="text-gold">{"★".repeat(review.rating)}</p>
                  <p className="mt-2 text-sm text-zinc-300">{review.comment}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-zinc-500">{review.customer_name}</p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Seja o primeiro a avaliar nosso atendimento.</p>
          )}
          <div className="mt-6">
            <Link href="/avaliacoes" className="text-sm text-gold hover:underline">
              Ver e enviar avaliações →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="card stripe flex flex-col items-center gap-4 p-10 text-center">
          <h2 className="font-display text-3xl sm:text-4xl">
            Sua cadeira está <span className="gold-text">esperando</span>
          </h2>
          <p className="max-w-xl text-sm text-zinc-400">
            Agende online e receba a confirmação pelo WhatsApp. Sem fila de espera, sem ligação.
          </p>
          <LinkButton href="/agendamento">Agendar agora</LinkButton>
        </div>
      </section>
    </>
  );
}

