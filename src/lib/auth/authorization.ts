import { ApiError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/types/session";

export const BARBER_ALLOWED_PATHS = [
  "/admin/agendamentos",
  "/admin/calendario",
  "/admin/clientes",
  "/admin/produtos",
  "/admin/comissoes",
  "/admin/horarios",
  "/admin/bloqueios",
] as const;

export function isOwner(
  session: SessionPayload,
): boolean {
  return session.role === "OWNER";
}

export function isBarber(
  session: SessionPayload,
): boolean {
  return session.role === "BARBER";
}

/**
 * Exige que o usuário esteja autenticado.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    throw new ApiError(
      "Acesso não autorizado.",
      401,
    );
  }

  return session;
}

/**
 * Exige OWNER.
 */
export async function requireOwner(): Promise<SessionPayload> {
  const session = await requireSession();

  if (!isOwner(session)) {
    throw new ApiError(
      "Acesso não autorizado.",
      403,
    );
  }

  return session;
}

/**
 * Permite OWNER ou BARBER.
 */
export async function requireStaff(): Promise<SessionPayload> {
  const session = await requireSession();

  if (
    session.role !== "OWNER" &&
    session.role !== "BARBER"
  ) {
    throw new ApiError(
      "Acesso não autorizado.",
      403,
    );
  }

  return session;
}

/**
 * Permite somente as áreas destinadas aos barbeiros
 * quando o usuário não for OWNER.
 */
export function canBarberAccessPath(
  pathname: string,
): boolean {
  return BARBER_ALLOWED_PATHS.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(`${path}/`),
  );
}