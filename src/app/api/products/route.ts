import { adminRoute, ok, publicRoute, readJson, searchParams } from "@/lib/api/handler";
import { productSchema } from "@/lib/validations/schemas";
import { createProduct, listProducts } from "@/services/products.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return publicRoute(async () => {
    const params = searchParams(request);
    return ok({
      products: await listProducts({
        activeOnly: params.get("active") === "1",
        search: params.get("search"),
        lowStock: params.get("lowStock") === "1",
      }),
    });
  });
}

export async function POST(request: Request) {
  return adminRoute(async () => {
    const input = productSchema.parse(await readJson(request));
    return ok({ product: await createProduct(input) }, 201);
  });
}
