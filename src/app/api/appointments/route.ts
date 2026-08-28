import { adminRoute, ok, publicRoute, readJson, searchParams } from "@/lib/api/handler";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";
import { appointmentSchema } from "@/lib/validations/schemas";
import { bookingLinks, createAppointment, listAppointments } from "@/services/appointments.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return adminRoute(async () => {
    const params = searchParams(request);
    return ok({
      appointments: await listAppointments({
        date: params.get("date"),
        from: params.get("from"),
        to: params.get("to"),
        barber_id: params.get("barber_id") ? Number(params.get("barber_id")) : null,
        status: params.get("status"),
        customer_id: params.get("customer_id") ? Number(params.get("customer_id")) : null,
        search: params.get("search"),
        upcoming: params.get("upcoming") === "1",
      }),
    });
  });
}

/** Agendamento público: o backend valida tudo novamente antes de gravar. */
export async function POST(request: Request) {
  return publicRoute(async () => {
    rateLimit(clientKey(request, "appointment"), 12, 60_000);
    const input = appointmentSchema.parse(await readJson(request));
    const appointment = await createAppointment(input);
    return ok({ appointment, whatsapp: bookingLinks(appointment) }, 201);
  });
}
