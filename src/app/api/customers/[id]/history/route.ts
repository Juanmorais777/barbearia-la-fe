import { adminRoute, ok, requireInt } from "@/lib/api/handler";
import { customerHistory } from "@/services/customers.service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    return ok(await customerHistory(requireInt(id)));
  });
}
