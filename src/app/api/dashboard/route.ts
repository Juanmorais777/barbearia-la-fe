import { adminRoute, ok, searchParams } from "@/lib/api/handler";
import { dashboard } from "@/services/analytics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  return adminRoute(async () => ok(await dashboard()));
}
