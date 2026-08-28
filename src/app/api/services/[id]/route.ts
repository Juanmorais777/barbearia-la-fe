import {
  adminRoute,
  ok,
  publicRoute,
  readJson,
  requireInt,
} from "@/lib/api/handler";

import { serviceUpdateSchema } from "@/lib/validations/schemas";

import * as catalogService from "@/services/catalog.service";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

/* =========================================================
   GET — BUSCAR SERVIÇO
   ========================================================= */

export async function GET(
  _request: Request,
  context: Context,
) {
  return publicRoute(async () => {
    const { id } = await context.params;

    const service =
      await catalogService.findById(
        requireInt(id),
      );

    return ok({
      service,
    });
  });
}

/* =========================================================
   PUT — ATUALIZAR SERVIÇO
   ========================================================= */

export async function PUT(
  request: Request,
  context: Context,
) {
  return adminRoute(async () => {
    const { id } = await context.params;

    const serviceId =
      requireInt(id);

    const input =
      serviceUpdateSchema.parse(
        await readJson(request),
      );

    await catalogService.update(
      serviceId,
      input,
    );

    const service =
      await catalogService.findById(
        serviceId,
      );

    return ok({
      service,
    });
  });
}

/* =========================================================
   DELETE — DESATIVAR SERVIÇO
   ========================================================= */

export async function DELETE(
  _request: Request,
  context: Context,
) {
  return adminRoute(async () => {
    const { id } = await context.params;

    const serviceId =
      requireInt(id);

    await catalogService.update(
      serviceId,
      {
        active: false,
      },
    );

    const service =
      await catalogService.findById(
        serviceId,
      );

    return ok({
      service,
    });
  });
}