import { cookies } from "next/headers";
import { unauthorized } from "@/lib/api/response";
import { expiresInMs, signToken, verifyToken, type SessionPayload } from "@/lib/auth/jwt";

export const COOKIE_NAME = "lafe_session";

export async function createSessionCookie(payload: SessionPayload): Promise<void> {
  const token = signToken(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(expiresInMs() / 1000),
  });
}

export async function destroySessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Guarda de rotas de API: 401 quando não autenticado. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw unauthorized();
  return session;
}
