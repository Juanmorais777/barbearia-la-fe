import BookingWizard from "@/components/site/BookingWizard";
import { SectionTitle } from "@/components/ui";

export const metadata = { title: "Agendamento | Barbearia La Fé" };

export default function BookingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <SectionTitle
        eyebrow="Agendamento online"
        title="Reserve sua cadeira"
        subtitle="Escolha o serviço, o profissional e o horário. Confirmamos pelo WhatsApp."
      />
      <BookingWizard />
    </div>
  );
}
