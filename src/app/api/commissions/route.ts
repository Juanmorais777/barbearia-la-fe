import { adminRoute, ok, searchParams } from "@/lib/api/handler";
import { listCommissions, commissionsSummary } from "@/services/finance.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return adminRoute(async () => {
    const params = searchParams(request);
    const filters = {
      from: params.get("from"),
      to: params.get("to"),
      barber_id: params.get("barber_id") ? Number(params.get("barber_id")) : null,
      status: params.get("status"),
    };
    const [commissions, summary] = await Promise.all([listCommissions(filters), commissionsSummary(filters)]);
    return ok({ commissions, summary });
  });
}
