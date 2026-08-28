import { publicRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { destroySessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  return publicRoute(async () => {
    await destroySessionCookie();
    return ok({ logged_out: true });
  });
}
