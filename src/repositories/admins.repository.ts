import { db } from "@/lib/database/connection";
import { bool, nowStamp, toDateTime } from "@/utils/datetime";
import type { Admin } from "@/types";

export type AdminRow = Admin & { password_hash: string; created_at: unknown };

function map(row: Record<string, unknown>): AdminRow {
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role || "OWNER"),
    active: bool(row.active),
    password_hash: String(row.password_hash || ""),
    created_at: toDateTime(row.created_at),
  };
}

export async function findByEmail(email: string): Promise<AdminRow | null> {
  const row = await db.first<Record<string, unknown>>(
    "SELECT * FROM admins WHERE email = @email AND active = 1",
    { email: email.toLowerCase() },
  );
  return row ? map(row) : null;
}

export async function findById(id: number): Promise<AdminRow | null> {
  const row = await db.first<Record<string, unknown>>("SELECT * FROM admins WHERE id = @id", { id });
  return row ? map(row) : null;
}

/** Cria (ou atualiza a senha de) o administrador inicial definido no .env. */
export async function upsertAdmin(name: string, email: string, passwordHash: string): Promise<number> {
  const existing = await db.first<{ id: number }>("SELECT id FROM admins WHERE email = @email", {
    email: email.toLowerCase(),
  });
  if (existing) {
    await db.execute("UPDATE admins SET password_hash = @hash, name = @name, updated_at = @now WHERE id = @id", {
      hash: passwordHash,
      name,
      now: nowStamp(),
      id: Number(existing.id),
    });
    return Number(existing.id);
  }
  return db.insert("admins", {
    name,
    email: email.toLowerCase(),
    password_hash: passwordHash,
    role: "OWNER",
    active: 1,
  });
}
