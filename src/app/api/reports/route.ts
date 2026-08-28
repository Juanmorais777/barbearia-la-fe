import { adminRoute, ok, searchParams } from "@/lib/api/handler";
import { reports } from "@/services/analytics.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return adminRoute(async () => {
    const params = searchParams(request);
    return ok(
      await reports({
        from: params.get("from"),
        to: params.get("to"),
        barber_id: params.get("barber_id") ? Number(params.get("barber_id")) : null,
      }),
    );
  });
}
