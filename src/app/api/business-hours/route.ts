import { adminRoute, ok, publicRoute, readJson } from "@/lib/api/handler";
import { businessHoursSchema } from "@/lib/validations/schemas";
import { listBusinessHours, updateBusinessHours } from "@/services/schedule.service";

export const dynamic = "force-dynamic";

function normalize(hour: { day_of_week: number; open_time?: string | null; close_time?: string | null; is_closed: boolean }) {
  return {
    day_of_week: hour.day_of_week,
    open_time: hour.open_time ?? null,
    close_time: hour.close_time ?? null,
    is_closed: hour.is_closed,
  };
}

export async function GET() {
  return publicRoute(async () => ok({ hours: await listBusinessHours() }));
}

export async function PUT(request: Request) {
  return adminRoute(async () => {
    const input = businessHoursSchema.parse(await readJson(request));
    return ok({ hours: await updateBusinessHours([normalize(input)]) });
  });
}

export async function POST(request: Request) {
  return adminRoute(async () => {
    const body = (await readJson(request)) as { hours?: unknown };
    const input = businessHoursSchema.array().min(1).parse(body.hours);
    return ok({ hours: await updateBusinessHours(input.map(normalize)) });
  });
}
