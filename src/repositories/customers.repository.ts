import { db } from "@/lib/database/connection";
import { bool, num, toDate, toDateTime } from "@/utils/datetime";
import { notFound } from "@/lib/api/response";
import type { Customer } from "@/types";

function map(row: Record<string, unknown>): Customer {
  return {
    id: Number(row.id),
    name: String(row.name),
    phone: String(row.phone),
    email: row.email ? String(row.email) : null,
    notes: row.notes ? String(row.notes) : null,
    active: bool(row.active),
    created_at: toDateTime(row.created_at),
    appointments_count: row.appointments_count !== undefined ? num(row.appointments_count) : undefined,
    last_appointment: row.last_appointment !== undefined ? toDate(row.last_appointment) : undefined,
  };
}

export async function list(filters: { search?: string | null; active?: boolean | null }): Promise<Customer[]> {
  const search = (filters.search || "").trim().toLowerCase();
  const pattern = `%${search}%`;
  const rows = await db.query<Record<string, unknown>>(
    `SELECT c.*,
            (SELECT COUNT(*) FROM appointments a
              WHERE a.customer_id = c.id AND a.status <> 'CANCELADO') AS appointments_count,
            (SELECT MAX(a.appointment_date) FROM appointments a
              WHERE a.customer_id = c.id AND a.status = 'CONCLUIDO') AS last_appointment
       FROM customers c
      WHERE (@search = '' OR LOWER(c.name) LIKE @pattern OR LOWER(c.phone) LIKE @pattern)
        AND (@activeFilter = 0 OR c.active = @activeValue)
      ORDER BY c.name ASC`,
    {
      search,
      pattern,
      activeFilter: filters.active === null || filters.active === undefined ? 0 : 1,
      activeValue: filters.active === false ? 0 : 1,
    },
  );
  return rows.map(map);
}

export async function findById(id: number): Promise<Customer> {
  const row = await db.first<Record<string, unknown>>("SELECT * FROM customers WHERE id = @id", { id });
  if (!row) throw notFound("Cliente não encontrado.");
  return map(row);
}

export async function findByPhone(phone: string): Promise<Customer | null> {
  const row = await db.first<Record<string, unknown>>("SELECT * FROM customers WHERE phone = @phone", { phone });
  return row ? map(row) : null;
}

export async function create(data: {
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}): Promise<number> {
  return db.insert("customers", { name: data.name, phone: data.phone, email: data.email ?? null, notes: data.notes ?? null, active: 1 });
}

export async function update(
  id: number,
  data: { name?: string; phone?: string; email?: string | null; notes?: string | null; active?: boolean },
): Promise<void> {
  const fields: string[] = [];
  const params: Record<string, unknown> = { id, now: new Date().toISOString().slice(0, 19).replace("T", " ") };
  if (data.name !== undefined) { fields.push("name = @name"); params.name = data.name; }
  if (data.phone !== undefined) { fields.push("phone = @phone"); params.phone = data.phone; }
  if (data.email !== undefined) { fields.push("email = @email"); params.email = data.email; }
  if (data.notes !== undefined) { fields.push("notes = @notes"); params.notes = data.notes; }
  if (data.active !== undefined) { fields.push("active = @active"); params.active = data.active ? 1 : 0; }
  if (!fields.length) return;
  await db.execute(`UPDATE customers SET ${fields.join(", ")}, updated_at = @now WHERE id = @id`, params);
}

export async function history(id: number) {
  const rows = await db.query<Record<string, unknown>>(
    `SELECT a.*, b.name AS barber_name, s.name AS service_name
       FROM appointments a
       JOIN barbers b ON b.id = a.barber_id
       JOIN services s ON s.id = a.service_id
      WHERE a.customer_id = @id
      ORDER BY a.appointment_date DESC, a.start_time DESC`,
    { id },
  );
  return rows.map((row) => ({
    id: Number(row.id),
    date: toDate(row.appointment_date),
    start_time: String(row.start_time).slice(0, 5),
    status: String(row.status),
    price: num(row.price),
    barber_name: String(row.barber_name),
    service_name: String(row.service_name),
    payment_method: row.payment_method ? String(row.payment_method) : null,
  }));
}
