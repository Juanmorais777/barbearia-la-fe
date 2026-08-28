import { Card, LinkButton, SectionTitle } from "@/components/ui";
import { DIFFERENTIALS, SHOP } from "@/lib/constants";

export const metadata = { title: "Sobre | Barbearia La Fé" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <SectionTitle eyebrow="Nossa história" title="Barbearia La Fé" subtitle="Tradição, técnica e atenção em cada detalhe." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div
          className="h-64 rounded-2xl border border-line bg-cover bg-center lg:h-full"
          style={{ backgroundImage: "url(/images/hero.jpg)" }}
        />
        <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
          <p>
            A <strong className="text-white">Barbearia La Fé</strong> nasceu na Jatiúca, em Maceió, com uma ideia
            simples: devolver ao homem o ritual de cuidar de si. Aqui cada atendimento é personalizado — do
            diagnóstico do fio ao acabamento na navalha.
          </p>
          <p>
            Nossa equipe é treinada nas técnicas clássicas e nas tendências atuais: degradê na régua, barba terapia,
            platinado e tratamentos capilares. Trabalhamos com agendamento para que ninguém fique esperando em pé.
          </p>
          <p>
            Café passado, ambiente climatizado, música boa e conversa franca. É o nosso jeito de dizer: sinta-se em
            casa.
          </p>
          <div className="card p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Onde estamos</p>
            <p className="mt-1 text-sm text-zinc-200">{SHOP.address}</p>
            <p className="text-sm text-zinc-200">{SHOP.city}</p>
            <a href={SHOP.mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-gold hover:underline">
              Abrir no Google Maps →
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="font-display mb-4 text-2xl">Nossos diferenciais</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {DIFFERENTIALS.map((item) => (
            <Card key={item.label} className="flex flex-col items-center gap-2 p-4 text-center">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs text-zinc-300">{item.label}</span>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-12 flex justify-center">
        <LinkButton href="/agendamento">Agendar meu horário</LinkButton>
      </div>
    </div>
  );
}
