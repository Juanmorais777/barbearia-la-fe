import { adminRoute } from "@/lib/api/handler";
import { ok, unauthorized } from "@/lib/api/response";
import { currentAdmin } from "@/services/auth.service";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  return adminRoute(async (session) => {
    const admin = await currentAdmin(session.sub);
    if (!admin) throw unauthorized("Sessão inválida.");
    return ok({ admin });
  });
}
