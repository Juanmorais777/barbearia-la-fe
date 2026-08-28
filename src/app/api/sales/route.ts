import { adminRoute, ok, searchParams } from "@/lib/api/handler";
import { listSales } from "@/services/products.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return adminRoute(async () => {
    const params = searchParams(request);
    return ok({
      sales: await listSales({
        from: params.get("from"),
        to: params.get("to"),
        product_id: params.get("product_id") ? Number(params.get("product_id")) : null,
      }),
    });
  });
}
