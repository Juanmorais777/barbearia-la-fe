import { badRequest, ok } from "@/lib/api/response";
import { adminRoute, ok as okResponse, readJson, requireInt } from "@/lib/api/handler";
import { appointmentUpdateSchema } from "@/lib/validations/schemas";
import { bookingLinks, cancelAppointment, deleteAppointment, getAppointment, changeStatus, rescheduleAppointment } from "@/services/appointments.service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    const appointment = await getAppointment(requireInt(id));
    return ok({ appointment, whatsapp: bookingLinks(appointment) });
  });
}

export async function PUT(request: Request, context: Context) {
  return adminRoute(async (session) => {
    const { id } = await context.params;
    const appointmentId = requireInt(id);
    const input = appointmentUpdateSchema.parse(await readJson(request));

    let appointment = await getAppointment(appointmentId);
    if (input.date && input.time) {
      appointment = await rescheduleAppointment(appointmentId, {
        date: input.date,
        time: input.time,
      });
    }
    if (input.status) {
      appointment = await changeStatus(appointmentId, input.status, {
        payment_method: input.payment_method ?? null,
        adminId: session.sub,
      });
    } else if (input.notes !== undefined) {
      appointment = await getAppointment(appointmentId);
    }
    return ok({ appointment, whatsapp: bookingLinks(appointment) });
  });
}

/** Cancelamento preferencial (preserva histórico). */
export async function PATCH(_request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    const appointment = await cancelAppointment(requireInt(id));
    return ok({ appointment, whatsapp: bookingLinks(appointment) });
  });
}

/** Exclusão física somente para agendamentos já cancelados. */
export async function DELETE(_request: Request, context: Context) {
  return adminRoute(async () => {
    const { id } = await context.params;
    const appointmentId = requireInt(id);
    const appointment = await getAppointment(appointmentId);
    if (appointment.status !== "CANCELADO") {
      throw badRequest("Cancele o agendamento antes de excluir — assim o histórico é preservado.");
    }
    await deleteAppointment(appointmentId);
    return okResponse({ deleted: true });
  });
}
