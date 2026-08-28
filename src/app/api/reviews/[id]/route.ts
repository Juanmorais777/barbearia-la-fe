import { adminRoute, ok, readJson, requireInt } from "@/lib/api/handler";
import { reviewUpdateSchema } from "@/lib/validations/schemas";
import { moderateReview } from "@/services/reviews.service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    const input = reviewUpdateSchema.parse(await readJson(request));
    return ok({ review: await moderateReview(requireInt(id), input) });
  });
}
