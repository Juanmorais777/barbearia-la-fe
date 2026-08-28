import { adminRoute, ok, searchParams } from "@/lib/api/handler";
import { commissionsSummary, productSalesReport } from "@/services/finance.service";
import { todayISO, addDays } from "@/utils/datetime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return adminRoute(async () => {
    const params = searchParams(request);
    const from = params.get("from") || `${todayISO().slice(0, 7)}-01`;
    const to = params.get("to") || todayISO();
    const summary = await commissionsSummary({
      from,
      to,
      barber_id: params.get("barber_id") ? Number(params.get("barber_id")) : null,
    });
    if (params.get("include") === "sales") {
      return ok({ summary, sales: await productSalesReport(addDays(from, 0), to) });
    }
    return ok({ summary });
  });
}
