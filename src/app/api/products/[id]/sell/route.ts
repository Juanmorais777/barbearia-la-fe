import { adminRoute, ok, readJson, requireInt } from "@/lib/api/handler";
import { productSaleSchema } from "@/lib/validations/schemas";
import { sellProduct } from "@/services/products.service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  return adminRoute(async (session) => {
    const { id } = await context.params;
    const body = (await readJson(request)) as Record<string, unknown>;
    const input = productSaleSchema.parse({ ...body, product_id: Number(id) });
    return ok(await sellProduct(input, session.sub), 201);
  });
}

export async function GET(_request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    const { listSales } = await import("@/services/products.service");
    return ok({ sales: await listSales({ product_id: requireInt(id) }) });
  });
}
