import { adminRoute, ok, readJson, requireInt } from "@/lib/api/handler";
import { businessHoursSchema } from "@/lib/validations/schemas";
import { updateBusinessHours } from "@/services/schedule.service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/** PUT /api/business-hours/:id  — o id é o dia da semana (0 = Domingo ... 6 = Sábado). */
export async function PUT(request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    const day = requireInt(id, "Dia da semana inválido.");
    const input = businessHoursSchema.parse({ ...(await readJson(request)), day_of_week: day });
    return ok({
      hours: await updateBusinessHours([
        {
          day_of_week: day,
          open_time: input.open_time ?? null,
          close_time: input.close_time ?? null,
          is_closed: input.is_closed,
        },
      ]),
    });
  });
}
