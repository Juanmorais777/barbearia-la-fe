import { db } from "@/lib/database/connection";
import * as adminsRepo from "@/repositories/admins.repository";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { unauthorized } from "@/lib/api/response";
import type { Admin } from "@/types";
import type { SessionPayload } from "@/types/session";

function sanitize(admin: { id: number; name: string; email: string; role: string; active: boolean }): Admin {
  return { id: admin.id, name: admin.name, email: admin.email, role: admin.role, active: admin.active };
}

/** Cria o administrador inicial a partir do .env (idempotente). */
export async function ensureInitialAdmin(): Promise<Admin | null> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Administrador";
  if (!email || !password) {
    console.warn("[La Fé] ADMIN_EMAIL/ADMIN_PASSWORD não configurados no .env.");
    return null;
  }
  const hash = await hashPassword(password);
  const id = await adminsRepo.upsertAdmin(name, email, hash);
  const admin = await adminsRepo.findById(id);
  return admin ? sanitize(admin) : null;
}

export async function login(email: string, password: string): Promise<SessionPayload> {
  let admin = await adminsRepo.findByEmail(email);
  if (!admin) {
    // Garante a existência do administrador inicial definido no .env.
    const anyAdmin = await db.first<{ total: number }>("SELECT COUNT(*) AS total FROM admins");
    if (!anyAdmin || Number(anyAdmin.total) === 0) {
      await ensureInitialAdmin();
      admin = await adminsRepo.findByEmail(email);
    }
  }
  if (!admin) throw unauthorized("E-mail ou senha inválidos.");
  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) throw unauthorized("E-mail ou senha inválidos.");
  return { sub: admin.id, name: admin.name, email: admin.email, role: admin.role };
}

export async function currentAdmin(id: number): Promise<Admin | null> {
  const admin = await adminsRepo.findById(id);
  return admin ? sanitize(admin) : null;
}
