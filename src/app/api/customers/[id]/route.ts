import { adminRoute, ok, readJson, requireInt } from "@/lib/api/handler";
import { customerUpdateSchema } from "@/lib/validations/schemas";
import { deactivateCustomer, getCustomer, updateCustomer } from "@/services/customers.service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    return ok({ customer: await getCustomer(requireInt(id)) });
  });
}

export async function PUT(request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    const input = customerUpdateSchema.parse(await readJson(request));
    return ok({ customer: await updateCustomer(requireInt(id), input) });
  });
}

/** A exclusão é lógica: preserva o histórico de atendimentos. */
export async function DELETE(_request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    return ok({ customer: await deactivateCustomer(requireInt(id)) });
  });
}
