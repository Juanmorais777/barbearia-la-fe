
import { adminRoute, ok } from "@/lib/api/handler";
import { dashboard } from "@/services/analytics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  return adminRoute(async () => {
    return ok(await dashboard());
  });
}

