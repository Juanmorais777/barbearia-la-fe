import { adminRoute, ok, searchParams } from "@/lib/api/handler";
import { financeSummary } from "@/services/finance.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return adminRoute(async () => {
    const params = searchParams(request);
    return ok(await financeSummary({ from: params.get("from"), to: params.get("to") }));
  });
}
