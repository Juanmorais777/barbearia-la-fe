import { adminRoute, ok, readJson, requireInt } from "@/lib/api/handler";
import { blockedTimeUpdateSchema } from "@/lib/validations/schemas";
import { affectedAppointments, deleteBlockedTime, listBlockedTimes, updateBlockedTime } from "@/services/schedule.service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    const blockId = requireInt(id);
    const blocks = await listBlockedTimes({ activeOnly: false });
    const block = blocks.find((item) => item.id === blockId);
    return ok({ block, affected_appointments: await affectedAppointments(blockId) });
  });
}

/** Editar/desativar reflete imediatamente na disponibilidade. */
export async function PUT(request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    const input = blockedTimeUpdateSchema.parse(await readJson(request));
    return ok({ block: await updateBlockedTime(requireInt(id), input) });
  });
}

export async function DELETE(_request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    return ok(await deleteBlockedTime(requireInt(id)));
  });
}
