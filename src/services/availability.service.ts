import { ApiError, badRequest } from "@/lib/api/response";
import { selectForUpdate, withTransaction } from "@/lib/database/connection";
import * as blockedRepo from "@/repositories/schedule.repository";
import * as barbersRepo from "@/repositories/barbers.repository";
import * as servicesRepo from "@/repositories/services.repository";
import * as appointmentsRepo from "@/repositories/appointments.repository";
import {
  addDays,
  dayOfWeek,
  fromMinutes,
  todayISO,
  toMinutes,
} from "@/utils/datetime";
import type { AvailabilityResult, BlockedTime, Service } from "@/types";

type Range = { start: number; end: number; reason: string };

function dayBlocks(blocks: BlockedTime[], barberId: number): BlockedTime[] {
  return blocks.filter((block) => block.barber_id === null || block.barber_id === barberId);
}

function toRanges(blocks: BlockedTime[]): Range[] {
  return blocks
    .filter((block) => block.start_time && block.end_time)
    .map((block) => ({
      start: toMinutes(block.start_time as string),
      end: toMinutes(block.end_time as string),
      reason: block.reason,
    }));
}

async function stepMinutes(): Promise<number> {
  const value = await blockedRepo.getSetting("slot_step_minutes");
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 5 ? parsed : 30;
}

async function bookingWindow(): Promise<number> {
  const value = await blockedRepo.getSetting("booking_window_days");
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
}

export type AvailabilityInput = {
  serviceId: number;
  barberId?: number | null;
  date: string;
};

/**
 * Motor de disponibilidade: calcula os horários realmente livres.
 * Nenhum horário é gerado apenas "no papel": cada slot é testado contra
 * horário da barbearia, horário do barbeiro, bloqueios e agendamentos.
 */
export async function getAvailability(input: AvailabilityInput): Promise<AvailabilityResult> {
  const service = await servicesRepo.findById(input.serviceId);
  if (!service.active) throw badRequest("Serviço indisponível.");

  const today = todayISO();
  if (input.date < today) throw badRequest("Não é possível consultar horários em datas passadas.");
  if (input.date > addDays(today, await bookingWindow())) {
    throw badRequest(`Agendamentos são liberados com até ${await bookingWindow()} dias de antecedência.`);
  }

  const weekday = dayOfWeek(input.date);
  const business = await blockedRepo.getBusinessHourByDay(weekday);
  const result: AvailabilityResult = {
    date: input.date,
    weekday,
    open: false,
    blocked: false,
    message: null,
    business_hours: business
      ? { open_time: business.open_time, close_time: business.close_time }
      : null,
    barbers: [],
    slots: [],
  };

  if (!business || business.is_closed || !business.open_time || !business.close_time) {
    result.message = "A barbearia está fechada nesta data.";
    return result;
  }

  const candidates = await resolveBarbers(service, input.barberId ?? null);
  if (!candidates.length) {
    result.message = "Nenhum profissional disponível para este serviço.";
    return result;
  }

  const barberIds = candidates.map((barber) => barber.id);
  const blocks = await blockedRepo.getBlockedForDate(input.date, barberIds);
  const shopBlocks = blocks.filter((block) => block.barber_id === null);

  const shopAllDayBlock = shopBlocks.find(
  (block) =>
    block.active &&
    block.start_time === null &&
    block.end_time === null
);

if (shopAllDayBlock) {
  result.blocked = true;
  result.message = `Não há horários disponíveis nesta data (${shopAllDayBlock.reason || "bloqueio"}).`;
  return result;
}
  const shopRanges = toRanges(shopBlocks);
  const appointments = (await appointmentsRepo.list({ date: input.date })).filter((appointment) =>
    barberIds.includes(appointment.barber_id),
  );

  const openMinutes = toMinutes(business.open_time);
  const closeMinutes = toMinutes(business.close_time);
  const step = await stepMinutes();
  const duration = service.duration_minutes;
  const nowMinutes = input.date === today
    ? new Date().getHours() * 60 + new Date().getMinutes()
    : -1;

  const slotMap = new Map<string, number[]>();

  for (const barber of candidates) {
    const ownHours = (await barbersRepo.listHoursForDay([barber.id], weekday)).find((h) => h.barber_id === barber.id);
    if (ownHours && ownHours.is_closed) continue;

    const barberBlocks = dayBlocks(blocks.filter((block) => block.barber_id === barber.id), barber.id);
    if (
  barberBlocks.some(
    (block) =>
      block.active &&
      block.start_time === null &&
      block.end_time === null
  )
) {
  continue;
}

    const ownStart = ownHours?.start_time ? toMinutes(ownHours.start_time) : null;
    const ownEnd = ownHours?.end_time ? toMinutes(ownHours.end_time) : null;
    const start = Math.max(openMinutes, ownStart ?? openMinutes);
    const end = Math.min(closeMinutes, ownEnd ?? closeMinutes);
    if (end - start < duration) continue;

    const busy: Range[] = [
      ...shopRanges,
      ...toRanges(barberBlocks),
      ...appointments
        .filter((appointment) => appointment.barber_id === barber.id)
        .map((appointment) => ({
          start: toMinutes(appointment.start_time),
          end: toMinutes(appointment.end_time),
          reason: "agendamento",
        })),
    ];

    const barberSlots: string[] = [];
    for (let minute = start; minute + duration <= end; minute += step) {
      if (nowMinutes >= 0 && minute < nowMinutes) continue;
      const overlaps = busy.some((range) => minute < range.end && minute + duration > range.start);
      if (overlaps) continue;
      const label = fromMinutes(minute);
      barberSlots.push(label);
      const list = slotMap.get(label) || [];
      list.push(barber.id);
      slotMap.set(label, list);
    }

    if (barberSlots.length) {
      result.barbers.push({ barber_id: barber.id, barber_name: barber.name, slots: barberSlots });
    }
  }

  result.open = true;
  result.slots = Array.from(slotMap.entries())
    .sort((a, b) => toMinutes(a[0]) - toMinutes(b[0]))
    .map(([time, ids]) => ({ time, barber_ids: ids }));

  if (!result.slots.length) {
    result.message = "Não há horários disponíveis nesta data.";
  }

  return result;
}

async function resolveBarbers(service: Service, barberId: number | null) {
  const all = await barbersRepo.list(true);
  const offering = all.filter((barber) => service.barber_ids.includes(barber.id));
  if (!barberId) return offering;
  const selected = offering.find((barber) => barber.id === barberId);
  if (!selected) {
    const exists = all.find((barber) => barber.id === barberId);
    if (!exists) throw badRequest("Este barbeiro não está disponível.");
    throw badRequest("Este barbeiro não realiza este serviço.");
  }
  return [selected];
}

/** Validação final (executada no momento da gravação, dentro de transação). */
export type SlotValidation = { start: string; end: string; duration: number; price: number };

export async function validateSlot(
  tx: Parameters<Parameters<typeof withTransaction>[0]>[0],
  params: {
  serviceId: number;
  barberId: number;
  date: string;
  time: string;
  ignoreAppointmentId?: number;
}): Promise<SlotValidation> {
  const service = await servicesRepo.findById(params.serviceId);
  if (!service.active) throw badRequest("Serviço indisponível.");
  const barber = await barbersRepo.findById(params.barberId);
  if (!barber.active) throw badRequest("Este barbeiro não está disponível.");
  if (!service.barber_ids.includes(barber.id)) throw badRequest("Este barbeiro não realiza este serviço.");

  const today = todayISO();
  if (params.date < today) throw new ApiError("Não é possível agendar para datas passadas.", 409);

  const weekday = dayOfWeek(params.date);
  const business = await blockedRepo.getBusinessHourByDay(weekday);
  if (!business || business.is_closed || !business.open_time || !business.close_time) {
    throw new ApiError("A barbearia está fechada nesta data.", 409);
  }

  const start = toMinutes(params.time);
  const end = start + service.duration_minutes;
  const open = toMinutes(business.open_time);
  const close = toMinutes(business.close_time);

  const ownHours = (await barbersRepo.listHoursForDay([barber.id], weekday)).find((h) => h.barber_id === barber.id);
  if (ownHours?.is_closed) throw new ApiError("Este barbeiro não atende nesta data.", 409);
  const barberStart = ownHours?.start_time ? toMinutes(ownHours.start_time) : open;
  const barberEnd = ownHours?.end_time ? toMinutes(ownHours.end_time) : close;

  if (start < open || end > close) {
    throw new ApiError("Horário fora do expediente da barbearia.", 409);
  }
  if (start < barberStart || end > barberEnd) {
    throw new ApiError("Este barbeiro não atende neste horário.", 409);
  }

  if (params.date === today && start <= new Date().getHours() * 60 + new Date().getMinutes()) {
    throw new ApiError("Este horário já passou. Escolha um horário futuro.", 409);
  }

  const blocks = await blockedRepo.getBlockedForDate(params.date, [barber.id]);
  const allDayBlock = blocks.find(
  (block) =>
    block.active &&
    block.start_time === null &&
    block.end_time === null
);

if (allDayBlock) {
  throw new ApiError(
    `Este dia está bloqueado${allDayBlock.reason ? ` (${allDayBlock.reason})` : ""}.`,
    409
  );
}
  const ranges = toRanges(blocks);
  const conflictBlock = ranges.find((range) => start < range.end && end > range.start);
  if (conflictBlock) {
    throw new ApiError(`Este horário está bloqueado (${conflictBlock.reason}).`, 409);
  }

  // Lock do barbeiro serializa reservas concorrentes para o mesmo profissional.
  await tx.query(selectForUpdate("barbers", "id = @id", "id"), { id: barber.id });
  const existing = await appointmentsRepo.lockedActiveForDate(tx, barber.id, params.date);

  const conflict = existing.find(
    (appointment) =>
      appointment.id !== params.ignoreAppointmentId &&
      start < toMinutes(appointment.end_time) &&
      end > toMinutes(appointment.start_time),
  );
  if (conflict) {
    throw new ApiError("Este horário acabou de ser reservado. Escolha outro horário.", 409);
  }

  return { start: params.time, end: fromMinutes(end), duration: service.duration_minutes, price: service.price };
}

/** Validação isolada (abre a própria transação). */
export async function assertSlotAvailable(params: {
  serviceId: number;
  barberId: number;
  date: string;
  time: string;
  ignoreAppointmentId?: number;
}): Promise<SlotValidation> {
  return withTransaction((tx) => validateSlot(tx, params));
}
