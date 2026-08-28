import {
  adminRoute,
  ok,
  publicRoute,
  readJson,
  requireInt,
} from "@/lib/api/handler";

import { barberHoursSchema } from "@/lib/validations/schemas";

import * as barbersRepository from "@/repositories/barbers.repository";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

/* =========================================================
   GET — BUSCAR HORÁRIOS DO BARBEIRO
   ========================================================= */

export async function GET(
  _request: Request,
  context: Context,
) {
  return publicRoute(async () => {
    const { id } = await context.params;

    const barberId = requireInt(id);

    const hours =
      await barbersRepository.listHours(
        barberId,
      );

    return ok({
      hours,
    });
  });
}

/* =========================================================
   PUT — ATUALIZAR HORÁRIOS DO BARBEIRO
   ========================================================= */

export async function PUT(
  request: Request,
  context: Context,
) {
  return adminRoute(async () => {
    const { id } = await context.params;

    const barberId = requireInt(id);

    const input =
      barberHoursSchema.parse(
        await readJson(request),
      );

    await barbersRepository.upsertHours(
      barberId,
      input.hours.map((hour) => ({
        ...hour,
        start_time:
          hour.start_time ?? null,
        end_time:
          hour.end_time ?? null,
      })),
    );

    const hours =
      await barbersRepository.listHours(
        barberId,
      );

    return ok({
      hours,
    });
  });
}