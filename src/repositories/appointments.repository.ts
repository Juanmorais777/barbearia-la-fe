import { db, selectForUpdate } from "@/lib/database/connection";
import { num, toDate, toDateTime, toTime } from "@/utils/datetime";
import { notFound } from "@/lib/api/response";
import type { Appointment, AppointmentStatus, PaymentMethod } from "@/types";

const SELECT = `SELECT a.id, a.customer_id, c.name AS customer_name, c.phone AS customer_phone,
       a.barber_id, b.name AS barber_name, a.service_id, s.name AS service_name,
       s.duration_minutes AS service_duration, a.appointment_date, a.start_time, a.end_time,
       a.status, a.price, a.payment_method, a.notes, a.created_at
  FROM appointments a
  JOIN customers c ON c.id = a.customer_id
  JOIN barbers b ON b.id = a.barber_id
  JOIN services s ON s.id = a.service_id`;

function map(row: Record<string, unknown>): Appointment {
  return {
    id: Number(row.id),
    customer_id: Number(row.customer_id),
    customer_name: String(row.customer_name),
    customer_phone: String(row.customer_phone),
    barber_id: Number(row.barber_id),
    barber_name: String(row.barber_name),
    service_id: Number(row.service_id),
    service_name: String(row.service_name),
    service_duration: num(row.service_duration),
    date: toDate(row.appointment_date) as string,
    start_time: toTime(row.start_time) as string,
    end_time: toTime(row.end_time) as string,
    status: String(row.status) as AppointmentStatus,
    price: num(row.price),
    payment_method: row.payment_method ? (String(row.payment_method) as PaymentMethod) : null,
    notes: row.notes ? String(row.notes) : null,
    created_at: toDateTime(row.created_at),
  };
}

export type AppointmentFilters = {
  date?: string | null;
  from?: string | null;
  to?: string | null;
  barber_id?: number | null;
  status?: string | null;
  customer_id?: number | null;
  search?: string | null;
  upcoming?: boolean;
};

export async function list(filters: AppointmentFilters, limit = 500): Promise<Appointment[]> {
  const conditions: string[] = ["1 = 1"];
  const params: Record<string, unknown> = {};
  if (filters.date) { conditions.push("a.appointment_date = @date"); params.date = filters.date; }
  if (filters.from) { conditions.push("a.appointment_date >= @from"); params.from = filters.from; }
  if (filters.to) { conditions.push("a.appointment_date <= @to"); params.to = filters.to; }
  if (filters.barber_id) { conditions.push("a.barber_id = @barberId"); params.barberId = filters.barber_id; }
  if (filters.status) { conditions.push("a.status = @status"); params.status = filters.status; }
  if (filters.customer_id) { conditions.push("a.customer_id = @customerId"); params.customerId = filters.customer_id; }
  if (filters.upcoming) {
    conditions.push("a.appointment_date >= @today");
    conditions.push("a.status NOT IN ('CANCELADO','CONCLUIDO','NAO_COMPARECEU')");
    params.today = new Date().toISOString().slice(0, 10);
  }
  const search = (filters.search || "").trim().toLowerCase();
  if (search) {
    conditions.push("(LOWER(c.name) LIKE @pattern OR c.phone LIKE @pattern OR LOWER(s.name) LIKE @pattern)");
    params.pattern = `%${search}%`;
  }
  const rows = await db.query<Record<string, unknown>>(
    `${SELECT} WHERE ${conditions.join(" AND ")}
      ORDER BY a.appointment_date DESC, a.start_time ASC`,
    params,
  );
  return rows.slice(0, limit).map(map);
}

export async function findById(id: number): Promise<Appointment> {
  const rows = await db.query<Record<string, unknown>>(`${SELECT} WHERE a.id = @id`, { id });
  if (!rows.length) throw notFound("Agendamento não encontrado.");
  return map(rows[0]);
}

export async function activeForDate(barberId: number, date: string) {
  const rows = await db.query<Record<string, unknown>>(
    `SELECT id, start_time, end_time, status FROM appointments
      WHERE barber_id = @barberId AND appointment_date = @date
        AND status NOT IN ('CANCELADO','NAO_COMPARECEU')`,
    { barberId, date },
  );
  return rows.map((row) => ({
    id: Number(row.id),
    start_time: toTime(row.start_time) as string,
    end_time: toTime(row.end_time) as string,
  }));
}

/** Consulta usada dentro da transação de criação, com lock para evitar reserva dupla. */
export async function lockedActiveForDate(
  tx: { query: <T = Record<string, unknown>>(text: string, params?: Record<string, unknown>) => Promise<T[]> },
  barberId: number,
  date: string,
) {
  const rows = await tx.query<Record<string, unknown>>(
    selectForUpdate(
      "appointments",
      "barber_id = @barberId AND appointment_date = @date AND status NOT IN ('CANCELADO','NAO_COMPARECEU')",
      "id, start_time, end_time, status",
    ),
    { barberId, date },
  );
  return rows.map((row) => ({
    id: Number(row.id),
    start_time: toTime(row.start_time) as string,
    end_time: toTime(row.end_time) as string,
  }));
}

export async function create(data: {
  customer_id: number;
  barber_id: number;
  service_id: number;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  notes?: string | null;
}): Promise<number> {
  return db.insert("appointments", {
    customer_id: data.customer_id,
    barber_id: data.barber_id,
    service_id: data.service_id,
    appointment_date: data.date,
    start_time: data.start_time,
    end_time: data.end_time,
    status: "PENDENTE",
    price: data.price,
    payment_method: null,
    notes: data.notes ?? null,
  });
}

export async function updateStatus(
  id: number,
  status: AppointmentStatus,
  paymentMethod?: PaymentMethod | null,
): Promise<void> {
  await db.execute(
    `UPDATE appointments SET status = @status, payment_method = COALESCE(@paymentMethod, payment_method), updated_at = @now WHERE id = @id`,
    { status, paymentMethod: paymentMethod ?? null, now: new Date().toISOString().slice(0, 19).replace("T", " "), id },
  );
}

export async function reschedule(id: number, date: string, startTime: string, endTime: string): Promise<void> {
  await db.execute(
    `UPDATE appointments SET appointment_date = @date, start_time = @startTime, end_time = @endTime, updated_at = @now WHERE id = @id`,
    { date, startTime, endTime, now: new Date().toISOString().slice(0, 19).replace("T", " "), id },
  );
}

export async function remove(id: number): Promise<void> {
  await db.execute("DELETE FROM appointments WHERE id = @id", { id });
}

export async function affectedByBlock(date: string, barberId: number | null) {
  const conditions = ["a.appointment_date = @date", "a.status NOT IN ('CANCELADO')"];
  const params: Record<string, unknown> = { date };
  if (barberId) {
    conditions.push("a.barber_id = @barberId");
    params.barberId = barberId;
  }
  const rows = await db.query<Record<string, unknown>>(
    `${SELECT} WHERE ${conditions.join(" AND ")} ORDER BY a.start_time ASC`,
    params,
  );
  return rows.map(map);
}
