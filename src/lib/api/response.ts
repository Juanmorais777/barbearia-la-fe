import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message: string) => new ApiError(message, 400);
export const unauthorized = (message = "Não autenticado.") => new ApiError(message, 401);
export const forbidden = (message = "Acesso negado.") => new ApiError(message, 403);
export const notFound = (message = "Registro não encontrado.") => new ApiError(message, 404);
export const conflict = (message: string) => new ApiError(message, 409);

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400): Response {
  return Response.json({ success: false, message }, { status });
}

/** Tratamento global de erro: nenhuma exceção escapa sem resposta. */
export function handleError(error: unknown): Response {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    const field = first?.path?.join(".");
    return fail(field ? `${first.message} (${field})` : first?.message || "Dados inválidos.", 422);
  }
  if (error instanceof ApiError) return fail(error.message, error.status);
  if ((error as { status?: number })?.status === 429) {
    return fail("Muitas requisições. Aguarde alguns instantes e tente novamente.", 429);
  }

  const message = error instanceof Error ? error.message : "Erro inesperado.";
  const isUnique = /UNIQUE|duplicate key|uq_/i.test(message);
  if (isUnique) return fail("Este registro já existe.", 409);
  const isConnection = /ECONNREFUSED|ETIMEDOUT|ELOGIN|Failed to connect|getaddrinfo|ENOTFOUND/i.test(message);
  if (isConnection) {
    console.error("[La Fé] Falha de conexão com o banco:", message);
    return fail("Banco de dados indisponível no momento.", 503);
  }
  console.error("[La Fé] Erro não tratado:", error);
  return fail(process.env.NODE_ENV === "production" ? "Erro interno do servidor." : message, 500);
}

export function withRoute(handler: () => Promise<Response>): Promise<Response> {
  return handler().catch(handleError);
}

export function searchParams(request: Request): URLSearchParams {
  return new URL(request.url).searchParams;
}

export function intParam(value: string | null, fallback: number | null = null): number | null {
  if (value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw badRequest("Corpo da requisição inválido.");
  }
}
