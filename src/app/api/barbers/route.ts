import {
  adminRoute,
  ok,
  publicRoute,
  readJson,
  searchParams,
} from "@/lib/api/handler";

import { barberSchema } from "@/lib/validations/schemas";
import * as barbersRepository from "@/repositories/barbers.repository";


export const dynamic = "force-dynamic";


/* =========================================================
   GET — LISTAR BARBEIROS
   ========================================================= */

export async function GET(
  request: Request,
) {
  return publicRoute(async () => {
    const params =
      searchParams(request);

    const activeOnly =
      params.get("active") === "1" ||
      params.get("activeOnly") === "true";

    const barbers =
      await barbersRepository.list(activeOnly);

    const filteredBarbers =
      activeOnly
        ? barbers.filter(
            (barber) =>
              barber.active === true,
          )
        : barbers;

    return ok({
      barbers: filteredBarbers,
    });
  });
}


/* =========================================================
   POST — CADASTRAR BARBEIRO
   ========================================================= */

export async function POST(
  request: Request,
) {
  return adminRoute(async () => {
    const body =
      await readJson(request);

    /*
     * A página envia:
     *
     * commission_percent
     *
     * O banco utiliza:
     *
     * commission_percentage
     */

    const commissionValue =
      body?.commission_percent;

    if (
      commissionValue === undefined ||
      commissionValue === null ||
      commissionValue === ""
    ) {
      throw new Error(
        "Informe a comissão do profissional.",
      );
    }

    const commission =
      Number(commissionValue);

    if (
      !Number.isFinite(commission)
    ) {
      throw new Error(
        "A comissão informada é inválida.",
      );
    }

    if (
      commission < 0 ||
      commission > 100
    ) {
      throw new Error(
        "A comissão deve estar entre 0% e 100%.",
      );
    }

    /*
     * Validação dos dados recebidos.
     */

    const input =
      barberSchema.parse({
        ...body,
        commission_percent:
          commission,
      });

    const {
      commission_percent,
      ...barberInput
    } = input;

   
    const barberId =
  await barbersRepository.create({
    ...barberInput,
    commission_percent,
  });

  const barber =
  await barbersRepository.findById(
    barberId,
  );

    return ok(
      {
        barber,
      },
      201,
    );
  });
}