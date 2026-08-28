import { Card, LinkButton, SectionTitle } from "@/components/ui";
import { listBarbers, listServices } from "@/services/catalog.service";

export const dynamic = "force-dynamic";

export const metadata = { title: "Serviços | Barbearia La Fé" };

export default async function ServicesPage() {
  const services = await listServices(true);
  const barbers = await listBarbers(true);
  const categories = Array.from(new Set(services.map((service) => service.category || "Outros")));

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <SectionTitle
        eyebrow="Tabela de serviços"
        title="Serviços e valores"
        subtitle="Todos os preços são gerenciados pelo painel da barbearia. A duração é usada para calcular os horários disponíveis."
      />

      {categories.map((category) => (
        <div key={category} className="mb-10">
          <h3 className="font-display mb-4 text-2xl text-gold">{category}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {services
              .filter((service) => (service.category || "Outros") === category)
              .map((service) => (
                <Card key={service.id} className="card-hover">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-display text-xl">{service.name}</h4>
                      <p className="mt-1 text-sm text-zinc-400">{service.description}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
                        {service.duration_minutes} min ·{" "}
                        {service.barber_ids.length} profissional(is)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl text-gold">
                        R$ {service.price.toFixed(2).replace(".", ",")}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {barbers.filter((b) => service.barber_ids.includes(b.id)).length} disponível(is)
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ))}

      <div className="card stripe mt-6 flex flex-col items-center gap-3 p-8 text-center">
        <p className="font-display text-2xl">Pronto para agendar?</p>
        <LinkButton href="/agendamento">Escolher serviço e horário</LinkButton>
      </div>
    </div>
  );
}
