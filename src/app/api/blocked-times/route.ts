import { adminRoute, ok, publicRoute, readJson, searchParams } from "@/lib/api/handler";
import { blockedTimeSchema } from "@/lib/validations/schemas";
import { createBlockedTime, listBlockedTimes } from "@/services/schedule.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return publicRoute(async () => {
    const params = searchParams(request);
    return ok({
      blocks: await listBlockedTimes({
        from: params.get("from"),
        to: params.get("to"),
        barber_id: params.get("barber_id") ? Number(params.get("barber_id")) : null,
        activeOnly: params.get("active") === "1",
      }),
    });
  });
}

export async function POST(request: Request) {
  return adminRoute(async () => {
    const input = blockedTimeSchema.parse(await readJson(request));
    return ok(await createBlockedTime(input), 201);
  });
}
