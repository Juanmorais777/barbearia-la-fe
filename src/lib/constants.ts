export const SHOP = {
  name: "Barbearia La Fé",
  tagline: "Seu estilo. Sua presença.",
  address: "Rua Soldado Eduardo dos Santos, 1201B - Jatiúca",
  city: "Maceió/AL - CEP 57035-735",
  phone: "(82) 98188-3520",
  whatsapp: process.env.NEXT_PUBLIC_SHOP_WHATSAPP || "5582981883520",
  instagram: "barbearia_la_fe",
  instagramUrl: "https://instagram.com/barbearia_la_fe",
  rating: 5.0,
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rua+Soldado+Eduardo+dos+Santos+1201B+Jati%C3%BAca+Macei%C3%B3+AL",
};

export const WEEKDAYS = [
  { day_of_week: 0, label: "Domingo" },
  { day_of_week: 1, label: "Segunda" },
  { day_of_week: 2, label: "Terça" },
  { day_of_week: 3, label: "Quarta" },
  { day_of_week: 4, label: "Quinta" },
  { day_of_week: 5, label: "Sexta" },
  { day_of_week: 6, label: "Sábado" },
];

export const DIFFERENTIALS = [
  { icon: "📶", label: "Wi-Fi disponível" },
  { icon: "🅿️", label: "Estacionamento na rua" },
  { icon: "♿", label: "Acessibilidade" },
  { icon: "👶", label: "Atendimento infantil" },
  { icon: "❄️", label: "Área climatizada" },
  { icon: "☕", label: "Café à vontade" },
  { icon: "🇧🇷", label: "Música em português" },
  { icon: "🇪🇸", label: "Música em espanhol" },
  { icon: "🇺🇸", label: "Música em inglês" },
  { icon: "🤝", label: "Equipe atenciosa" },
];

export const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  CONFIRMADO: "Confirmado",
  EM_ATENDIMENTO: "Em atendimento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  NAO_COMPARECEU: "Não compareceu",
};

export const STATUS_STYLES: Record<string, string> = {
  PENDENTE: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  CONFIRMADO: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  EM_ATENDIMENTO: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  CONCLUIDO: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  CANCELADO: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  NAO_COMPARECEU: "bg-orange-500/15 text-orange-300 border-orange-500/30",
};

export const PAYMENT_LABELS: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  CREDITO: "Crédito",
  DEBITO: "Débito",
  PIX: "PIX",
};

export const BLOCKED_TYPE_LABELS: Record<string, string> = {
  DIA_INTEIRO: "Dia inteiro",
  HORARIO: "Horário",
  ALMOCO: "Almoço",
  FOLGA: "Folga",
  REUNIAO: "Reunião",
  MANUTENCAO: "Manutenção",
  OUTRO: "Outro",
};
