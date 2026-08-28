import { adminRoute, ok, readJson, searchParams } from "@/lib/api/handler";
import { customerSchema } from "@/lib/validations/schemas";
import { createCustomer, listCustomers } from "@/services/customers.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return adminRoute(async () => {
    const params = searchParams(request);
    const active = params.get("active");
    return ok({
      customers: await listCustomers({
        search: params.get("search"),
        active: active === null ? null : active === "1",
      }),
    });
  });
}

export async function POST(request: Request) {
  return adminRoute(async () => {
    const input = customerSchema.parse(await readJson(request));
    return ok({ customer: await createCustomer(input) }, 201);
  });
}
