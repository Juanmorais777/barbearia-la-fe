import { adminRoute, ok, publicRoute, readJson } from "@/lib/api/handler";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";
import { reviewSchema } from "@/lib/validations/schemas";
import { createReview, listAllReviews, listPublicReviews } from "@/services/reviews.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return publicRoute(async () => {
    const all = new URL(request.url).searchParams.get("all") === "1";
    if (all) return adminRoute(async () => ok({ reviews: await listAllReviews() }));
    return ok(await listPublicReviews());
  });
}

export async function POST(request: Request) {
  return publicRoute(async () => {
    rateLimit(clientKey(request, "review"), 6, 60_000);
    const input = reviewSchema.parse(await readJson(request));
    return ok({ review: await createReview(input) }, 201);
  });
}
