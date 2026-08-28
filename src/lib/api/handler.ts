import { ApiError, handleError } from "@/lib/api/response";
import { intParam, ok, readJson, searchParams } from "@/lib/api/response";

export { intParam, ok, readJson, searchParams };
import { requireAdmin } from "@/lib/auth/session";
import type { SessionPayload } from "@/types/session";

/** Envolve handlers públicos com tratamento global de erros. */
export function publicRoute(handler: () => Promise<Response>): Promise<Response> {
  return handler().catch(handleError);
}

/** Envolve handlers administrativos: exige sessão válida (401 caso contrário). */
export function adminRoute(handler: (session: SessionPayload) => Promise<Response>): Promise<Response> {
  return (async () => {
    const session = await requireAdmin();
    return handler(session);
  })().catch(handleError);
}

export function requireInt(value: string, message = "Identificador inválido."): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new ApiError(message, 400);
  return parsed;
}
