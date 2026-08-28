import { db } from "@/lib/database/connection";
import { bool, num, toDateTime } from "@/utils/datetime";
import { notFound } from "@/lib/api/response";
import type { Review } from "@/types";

function map(row: Record<string, unknown>): Review {
  return {
    id: Number(row.id),
    customer_name: String(row.customer_name),
    rating: num(row.rating),
    comment: row.comment ? String(row.comment) : null,
    approved: bool(row.approved),
    active: bool(row.active),
    created_at: toDateTime(row.created_at),
  };
}

export async function listPublic(limit = 30): Promise<Review[]> {
  const rows = await db.query<Record<string, unknown>>(
    "SELECT * FROM reviews WHERE approved = 1 AND active = 1 ORDER BY created_at DESC",
  );
  return rows.slice(0, limit).map(map);
}

export async function listAll(): Promise<Review[]> {
  const rows = await db.query<Record<string, unknown>>("SELECT * FROM reviews ORDER BY created_at DESC");
  return rows.map(map);
}

export async function create(data: {
  customer_name: string;
  rating: number;
  comment: string | null;
  appointment_id: number | null;
  customer_id: number | null;
  approved: boolean;
}): Promise<number> {
  return db.insert("reviews", {
    customer_name: data.customer_name,
    rating: data.rating,
    comment: data.comment,
    appointment_id: data.appointment_id,
    customer_id: data.customer_id,
    approved: data.approved ? 1 : 0,
    active: 1,
  });
}

export async function update(id: number, data: { approved?: boolean; active?: boolean }): Promise<void> {
  const fields: string[] = [];
  const params: Record<string, unknown> = { id };
  if (data.approved !== undefined) { fields.push("approved = @approved"); params.approved = data.approved ? 1 : 0; }
  if (data.active !== undefined) { fields.push("active = @active"); params.active = data.active ? 1 : 0; }
  if (!fields.length) return;
  const result = await db.execute(`UPDATE reviews SET ${fields.join(", ")} WHERE id = @id`, params);
  if (!result) throw notFound("Avaliação não encontrada.");
}

export async function averageRating(): Promise<number> {
  const row = await db.first<{ average: number | null }>(
    "SELECT AVG(CAST(rating AS DECIMAL(5,2))) AS average FROM reviews WHERE approved = 1 AND active = 1",
  );
  return row?.average ? Number(row.average) : 0;
}
