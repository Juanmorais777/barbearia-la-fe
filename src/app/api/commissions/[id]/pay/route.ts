import { adminRoute, ok, readJson, requireInt } from "@/lib/api/handler";
import { commissionPaySchema } from "@/lib/validations/schemas";
import { payCommission } from "@/services/finance.service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  return adminRoute(async (session) => {
    const { id } = await context.params;
    const input = commissionPaySchema.parse(await readJson(request));
    return ok({ commission: await payCommission(requireInt(id), input.note ?? null, session.sub) });
  });
}

export async function POST(request: Request, context: Context) {
  return PUT(request, context);
}
