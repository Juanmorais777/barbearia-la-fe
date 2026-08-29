import { ApiError } from "@/lib/api/response";
import type { SessionPayload } from "@/types/session";

export type BarberPermission =
  | "appointments"
  | "calendar"
  | "customers"
  | "products"
  | "commissions"
  | "hours"
  | "blocked_times";

const BARBER_PERMISSIONS: Record<BarberPermission, boolean> = {
  appointments: true,
  calendar: true,
  customers: true,
  products: true,
  commissions: true,
  hours: true,
  blocked_times: true,
};

/**
 * Verifica se o usuário pode acessar determinada área.
 *
 * OWNER:
 * - acesso completo
 *
 * BARBER:
 * - somente áreas permitidas
 */
export function canAccess(
  session: SessionPayload,
  permission: BarberPermission,
): boolean {
  if (session.role === "OWNER") {
    return true;
  }

  if (session.role !== "BARBER") {
    return false;
  }

  return BARBER_PERMISSIONS[permission] === true;
}

/**
 * Exige que o usuário tenha determinada permissão.
 *
 * Caso contrário:
 * 403 — Acesso não autorizado.
 */
export function requirePermission(
  session: SessionPayload,
  permission: BarberPermission,
): void {
  if (!canAccess(session, permission)) {
    throw new ApiError(
      "Acesso não autorizado.",
      403,
    );
  }
}

/**
 * Exige que o usuário seja OWNER.
 */
export function requireOwner(
  session: SessionPayload,
): void {
  if (session.role !== "OWNER") {
    throw new ApiError(
      "Acesso não autorizado.",
      403,
    );
  }
}