import { adminRoute, ok, publicRoute, readJson, requireInt, searchParams } from "@/lib/api/handler";
import { productUpdateSchema } from "@/lib/validations/schemas";
import { deactivateProduct, getProduct, listSales, updateProduct } from "@/services/products.service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  return publicRoute(async () => {
    const { id } = await context.params;
    return ok({ product: await getProduct(requireInt(id)) });
  });
}

export async function PUT(request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    const input = productUpdateSchema.parse(await readJson(request));
    return ok({ product: await updateProduct(requireInt(id), input) });
  });
}

export async function DELETE(_request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    return ok({ product: await deactivateProduct(requireInt(id)) });
  });
}

export async function PATCH(request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    const productId = requireInt(id);
    const params = searchParams(request);
    if (params.get("action") === "sales") {
      return ok({ sales: await listSales({ product_id: productId }) });
    }
    const body = await readJson(request);
    return ok({ product: await updateProduct(productId, productUpdateSchema.parse(body)) });
  });
}
