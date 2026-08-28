import {
  adminRoute,
  ok,
  publicRoute,
  readJson,
  requireInt,
} from "@/lib/api/handler";

import * as barbersRepository from "@/repositories/barbers.repository";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

type HourInput = {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  closed: boolean;
};

function normalizeTime(value: unknown): string | null {
  if (value == null || value === "") {
    return null;
  }

  const text = String(value);

  // Aceita HH:mm
  const match = text.match(
    /^([01]\d|2[0-3]):([0-5]\d)/,
  );

  if (!match) {
    throw new Error(
      `Horário inválido: ${text}`,
    );
  }

  return `${match[1]}:${match[2]}`;
}

/* =========================================================
   GET
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
   PUT
   ========================================================= */

export async function PUT(
  request: Request,
  context: Context,
) {
  return adminRoute(async () => {
    const { id } = await context.params;

    const barberId = requireInt(id);

    const body = await readJson(request);

    if (
      !body ||
      !Array.isArray(body.hours)
    ) {
      throw new Error(
        "Informe os horários do profissional.",
      );
    }

    const hours: HourInput[] =
      body.hours.map(
        (hour: Record<string, unknown>) => {
          const day = Number(
            hour.day_of_week,
          );

          if (
            !Number.isInteger(day) ||
            day < 0 ||
            day > 6
          ) {
            throw new Error(
              "Dia da semana inválido.",
            );
          }

          const closed =
            Boolean(hour.closed);

          return {
            day_of_week: day,

            open_time: closed
              ? null
              : normalizeTime(
                  hour.open_time,
                ),

            close_time: closed
              ? null
              : normalizeTime(
                  hour.close_time,
                ),

            closed,
          };
        },
      );

    await barbersRepository.upsertHours(
      barberId,
      hours,
    );

    const saved =
      await barbersRepository.listHours(
        barberId,
      );

    return ok({
      hours: saved,
    });
  });
}