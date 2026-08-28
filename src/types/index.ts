export type AppointmentStatus =
  | "PENDENTE"
  | "CONFIRMADO"
  | "EM_ATENDIMENTO"
  | "CONCLUIDO"
  | "CANCELADO"
  | "NAO_COMPARECEU";

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "PENDENTE",
  "CONFIRMADO",
  "EM_ATENDIMENTO",
  "CONCLUIDO",
  "CANCELADO",
  "NAO_COMPARECEU",
];

export const ACTIVE_STATUSES: AppointmentStatus[] = [
  "PENDENTE",
  "CONFIRMADO",
  "EM_ATENDIMENTO",
];

export type PaymentMethod =
  | "DINHEIRO"
  | "CREDITO"
  | "DEBITO"
  | "PIX";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "DINHEIRO",
  "CREDITO",
  "DEBITO",
  "PIX",
];

export type BlockedType =
  | "DIA_INTEIRO"
  | "HORARIO"
  | "ALMOCO"
  | "FOLGA"
  | "REUNIAO"
  | "MANUTENCAO"
  | "OUTRO";

export const BLOCKED_TYPES: BlockedType[] = [
  "DIA_INTEIRO",
  "HORARIO",
  "ALMOCO",
  "FOLGA",
  "REUNIAO",
  "MANUTENCAO",
  "OUTRO",
];

export interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export interface Barber {
  id: number;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  photo: string | null;
  specialty: string | null;
  bio: string | null;
  commission_percent: number;
  active: boolean;
  service_ids: number[];
  created_at: string | null;
}

export interface BarberHour {
  id: number | null;
  barber_id: number;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_closed: boolean;
}

export interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string | null;
  active: boolean;
  barber_ids: number[];
  created_at: string | null;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  active: boolean;
  created_at: string | null;
  appointments_count?: number;
  last_appointment?: string | null;
}

export interface Appointment {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  barber_id: number;
  barber_name: string;
  service_id: number;
  service_name: string;
  service_duration: number;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  price: number;
  payment_method: PaymentMethod | null;
  notes: string | null;
  created_at: string | null;
}

export interface BusinessHour {
  id: number;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export interface BlockedTime {
  id: number;
  barber_id: number | null;
  barber_name: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string;
  type: BlockedType;
  active: boolean;
  created_at: string | null;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  minimum_stock: number;
  category: string | null;
  image: string | null;
  active: boolean;
  low_stock: boolean;
  created_at: string | null;
}

export interface ProductSale {
  id: number;
  product_id: number;
  product_name: string;
  barber_id: number | null;
  quantity: number;
  unit_price: number;
  total: number;
  payment_method: PaymentMethod;
  created_at: string | null;
}

export interface Commission {
  id: number;
  appointment_id: number;
  barber_id: number;
  barber_name: string;
  customer_name: string;
  service_name: string;
  date: string;
  base_amount: number;
  percent: number;
  amount: number;
  status: "PENDENTE" | "PAGA";
  paid_at: string | null;
  created_at: string | null;
}

export interface Transaction {
  id: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  amount: number;
  payment_method: PaymentMethod | null;
  reference_type: string | null;
  reference_id: number | null;
  transaction_date: string;
  created_at: string | null;
}

export interface Review {
  id: number;
  customer_name: string;
  rating: number;
  comment: string | null;
  approved: boolean;
  active: boolean;
  created_at: string | null;
}

export interface Setting {
  key: string;
  value: string | null;
}

export interface AvailabilitySlot {
  time: string;
  barber_ids: number[];
}

export interface AvailabilityBarber {
  barber_id: number;
  barber_name: string;
  slots: string[];
}

export interface AvailabilityResult {
  date: string;
  weekday: number;
  open: boolean;
  blocked: boolean;
  message: string | null;
  business_hours: {
    open_time: string | null;
    close_time: string | null;
  } | null;
  barbers: AvailabilityBarber[];
  slots: AvailabilitySlot[];
}

export interface DashboardData {
  today: string;

  counters: {
    today_appointments: number;
    pending: number;
    confirmed: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };

  revenue: {
    day: number;
    month: number;
    expenses_month: number;
    profit_month: number;
  };

  commissions: {
    pending: number;
    paid: number;
  };

  next_appointments: Appointment[];

  top_services: {
    name: string;
    count: number;
    revenue: number;
  }[];

  barber_performance: {
    name: string;
    count: number;
    revenue: number;
  }[];

  low_stock: {
    id: number;
    name: string;
    stock: number;
    minimum_stock: number;
  }[];

  upcoming_blocks: BlockedTime[];

  month_summary?: Record<
    string,
    {
      total: number;
      amount: number;
    }
  >;
}