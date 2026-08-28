import {
  adminRoute,
  ok,
  publicRoute,
  readJson,
  searchParams,
} from "@/lib/api/handler";

import { serviceSchema } from "@/lib/validations/schemas";

import * as catalogService from "@/services/catalog.service";

export const dynamic = "force-dynamic";

/* =========================================================
   GET — LISTAR SERVIÇOS
   ========================================================= */

export async function GET(request: Request) {
  return publicRoute(async () => {
    const params = searchParams(request);

    const activeOnly =
      params.get("active") === "1" ||
      params.get("activeOnly") === "true";

    const services =
      await catalogService.list(activeOnly);

    return ok({
      services,
    });
  });
}

/* =========================================================
   POST — CADASTRAR SERVIÇO
   ========================================================= */

export async function POST(request: Request) {
  return adminRoute(async () => {
    const input =
      serviceSchema.parse(
        await readJson(request),
      );

    const serviceId =
      await catalogService.create(input);

    const service =
      await catalogService.findById(
        serviceId,
      );

    return ok(
      {
        service,
      },
      201,
    );
  });
}