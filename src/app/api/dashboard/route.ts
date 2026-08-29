import {
  adminRoute,
  ok,
} from "@/lib/api/handler";

import {
  ApiError,
} from "@/lib/api/response";

import {
  dashboard,
} from "@/services/analytics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  return adminRoute(async (session) => {
    /**
     * Dashboard completo é exclusivo do OWNER.
     *
     * Franklin = OWNER
     * Daniel/Danrley/Jose = BARBER
     */
    if (session.role !== "OWNER") {
      throw new ApiError(
        "Acesso não autorizado.",
        403,
      );
    }

    return ok(
      await dashboard(),
    );
  });
}

