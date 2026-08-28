import { ok, publicRoute, readJson, searchParams } from "@/lib/api/handler";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";
import { availabilitySchema } from "@/lib/validations/schemas";
import { getAvailability } from "@/services/availability.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return publicRoute(async () => {
    rateLimit(clientKey(request, "availability"), 120, 60_000);
    const params = searchParams(request);
    const input = availabilitySchema.parse({
      service_id: params.get("service_id") ?? "",
      barber_id: params.get("barber_id") || null,
      date: params.get("date") ?? "",
    });
    return ok(await getAvailability({ serviceId: input.service_id, barberId: input.barber_id ?? null, date: input.date }));
  });
}

export async function POST(request: Request) {
  return publicRoute(async () => {
    rateLimit(clientKey(request, "availability"), 120, 60_000);
    const input = availabilitySchema.parse(await readJson(request));
    return ok(await getAvailability({ serviceId: input.service_id, barberId: input.barber_id ?? null, date: input.date }));
  });
}
