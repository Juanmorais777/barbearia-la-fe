import { publicRoute, readJson } from "@/lib/api/handler";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";
import { ok } from "@/lib/api/response";
import { loginSchema } from "@/lib/validations/schemas";
import { createSessionCookie } from "@/lib/auth/session";
import { login } from "@/services/auth.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return publicRoute(async () => {
    rateLimit(clientKey(request, "login"), 10, 60_000);
    const body = await readJson(request);
    const input = loginSchema.parse(body);
    const session = await login(input.email, input.password);
    await createSessionCookie(session);
    return ok({ admin: session });
  });
}
