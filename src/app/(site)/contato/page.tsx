import { Card, SectionTitle } from "@/components/ui";
import { SHOP } from "@/lib/constants";

export const metadata = { title: "Contato | Barbearia La Fé" };

export default function ContactPage() {
  const message = encodeURIComponent("Olá! Gostaria de falar com a Barbearia La Fé.");

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <SectionTitle eyebrow="Fale com a gente" title="Contato" subtitle="Estamos na Jatiúca, prontos para te atender." />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Endereço</p>
          <p className="mt-2 text-sm text-zinc-200">{SHOP.address}</p>
          <p className="text-sm text-zinc-200">{SHOP.city}</p>
          <a href={SHOP.mapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-gold hover:underline">
            Ver no mapa →
          </a>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Telefone / WhatsApp</p>
          <p className="mt-2 text-sm text-zinc-200">{SHOP.phone}</p>
          <a
            href={`https://wa.me/${SHOP.whatsapp}?text=${message}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block rounded-full border border-emerald-500/40 px-4 py-2 text-xs uppercase tracking-[0.14em] text-emerald-300 hover:bg-emerald-500/10"
          >
            Abrir WhatsApp
          </a>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Redes sociais</p>
          <p className="mt-2 text-sm text-zinc-200">@{SHOP.instagram}</p>
          <a href={SHOP.instagramUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-gold hover:underline">
            Seguir no Instagram →
          </a>
        </Card>
      </div>

      <Card className="mt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Horário de funcionamento</p>
        <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          <li className="flex justify-between border-b border-line py-1">
            <span className="text-zinc-400">Segunda</span> <span>09:00 - 21:00</span>
          </li>
          <li className="flex justify-between border-b border-line py-1">
            <span className="text-zinc-400">Terça</span> <span>09:00 - 17:00</span>
          </li>
          <li className="flex justify-between border-b border-line py-1">
            <span className="text-zinc-400">Quarta</span> <span>09:00 - 17:00</span>
          </li>
          <li className="flex justify-between border-b border-line py-1">
            <span className="text-zinc-400">Quinta</span> <span>09:00 - 17:00</span>
          </li>
          <li className="flex justify-between border-b border-line py-1">
            <span className="text-zinc-400">Sexta</span> <span>09:00 - 17:00</span>
          </li>
          <li className="flex justify-between border-b border-line py-1">
            <span className="text-zinc-400">Sábado</span> <span>09:00 - 17:00</span>
          </li>
          <li className="flex justify-between py-1">
            <span className="text-zinc-400">Domingo</span> <span className="text-zinc-500">Fechado</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
