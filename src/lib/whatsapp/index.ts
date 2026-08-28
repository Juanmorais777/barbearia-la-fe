import { onlyDigits } from "@/utils/datetime";

export type BookingMessage = {
  customerName: string;
  serviceName: string;
  barberName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  price: number;
  status?: string;
};

/** Normaliza o telefone para o formato internacional usado pelo wa.me (55 + DDD). */
export function toWhatsappNumber(phone: string): string {
  const digits = onlyDigits(phone);
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${toWhatsappNumber(phone)}?text=${encodeURIComponent(message)}`;
}

function formatDateBR(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

/** Mensagem de confirmação enviada ao cliente. */
export function buildBookingMessage(data: BookingMessage): string {
  const lines = [
    `Olá, ${data.customerName}! Seu agendamento na Barbearia La Fé foi ${data.status || "confirmado"}.`,
    "",
    `Serviço: ${data.serviceName}`,
    `Barbeiro: ${data.barberName}`,
    `Data: ${formatDateBR(data.date)}`,
    `Horário: ${data.time}`,
    `Valor: R$${data.price.toFixed(2).replace(".", ",")}`,
    "",
    "Obrigado pela preferência!",
  ];
  return lines.join("\n");
}

/** Mensagem enviada para a barbearia quando o cliente agenda. */
export function buildBarbershopAlertMessage(data: BookingMessage): string {
  return [
    "Novo agendamento recebido no site:",
    "",
    `Cliente: ${data.customerName}`,
    `Serviço: ${data.serviceName}`,
    `Barbeiro: ${data.barberName}`,
    `Data: ${formatDateBR(data.date)}`,
    `Horário: ${data.time}`,
    `Valor: R$${data.price.toFixed(2).replace(".", ",")}`,
  ].join("\n");
}

export const SHOP_WHATSAPP = process.env.NEXT_PUBLIC_SHOP_WHATSAPP || "5582981883520";
