import { conflict } from "@/lib/api/response";
import * as scheduleRepo from "@/repositories/schedule.repository";
import * as appointmentsRepo from "@/repositories/appointments.repository";
import { toMinutes } from "@/utils/datetime";
import type { BlockedTime, BusinessHour } from "@/types";

export async function listBusinessHours(): Promise<BusinessHour[]> {
  const hours = await scheduleRepo.getBusinessHours();
  if (hours.length === 7) return hours;
  const complete = new Map(hours.map((hour) => [hour.day_of_week, hour]));
  return Array.from({ length: 7 }, (_value, day) => {
    const found = complete.get(day);
    return (
      found || {
        id: -1 - day,
        day_of_week: day,
        open_time: null,
        close_time: null,
        is_closed: true,
      }
    );
  });
}

export async function updateBusinessHours(
  rows: { day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean }[],
): Promise<BusinessHour[]> {
  for (const row of rows) {
    if (!row.is_closed) {
      if (!row.open_time || !row.close_time) throw conflict("Informe a hora de abertura e fechamento.");
      if (toMinutes(row.open_time) >= toMinutes(row.close_time)) {
        throw conflict("A hora de fechamento deve ser maior que a de abertura.");
      }
    }
    await scheduleRepo.upsertBusinessHour(row);
  }
  return listBusinessHours();
}

export async function listBlockedTimes(filters: {
  from?: string | null;
  to?: string | null;
  barber_id?: number | null;
  activeOnly?: boolean;
}): Promise<BlockedTime[]> {
  return scheduleRepo.getBlockedTimes(filters);
}

/** Cria o bloqueio e informa os agendamentos afetados (nunca apaga automaticamente). */
export async function createBlockedTime(input: {
  type: string;
  date: string;
  barber_id?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  reason: string;
  active?: boolean;
}): Promise<{ block: BlockedTime; affected_appointments: number }> {
  const type = input.type === "DIA_INTEIRO" ? "DIA_INTEIRO" : input.type;
  const isFullDay = type === "DIA_INTEIRO";
  const start = isFullDay ? null : input.start_time || null;
  const end = isFullDay ? null : input.end_time || null;

  if (!isFullDay && (!start || !end)) throw conflict("Informe o horário inicial e final do bloqueio.");
  if (!isFullDay && start && end && toMinutes(start) >= toMinutes(end)) {
    throw conflict("O horário final deve ser maior que o inicial.");
  }

  const existing = await scheduleRepo.getBlockedTimes({
    from: input.date,
    to: input.date,
    barber_id: input.barber_id ?? null,
    activeOnly: true,
  });

  const overlaps = existing.some((block) => {
    if (isFullDay || block.type === "DIA_INTEIRO") return true;
    if (!start || !end || !block.start_time || !block.end_time) return false;
    return toMinutes(start) < toMinutes(block.end_time) && toMinutes(end) > toMinutes(block.start_time);
  });
  if (overlaps) throw conflict("Já existe um bloqueio ativo nesse período para este escopo.");

  const id = await scheduleRepo.createBlockedTime({
    barber_id: input.barber_id ?? null,
    date: input.date,
    start_time: start,
    end_time: end,
    reason: input.reason,
    type,
    active: input.active ?? true,
  });

  const affected = await appointmentsRepo.affectedByBlock(input.date, input.barber_id ?? null);
  return { block: await scheduleRepo.getBlockedById(id), affected_appointments: affected.length };
}

export async function updateBlockedTime(
  id: number,
  input: Partial<{
    type: string;
    date: string;
    barber_id: number | null;
    start_time: string | null;
    end_time: string | null;
    reason: string;
    active: boolean;
  }>,
) {
  await scheduleRepo.getBlockedById(id);
  const current = await scheduleRepo.getBlockedById(id);
  const type = input.type || current.type;
  const isFullDay = type === "DIA_INTEIRO";
  await scheduleRepo.updateBlockedTime(id, {
    ...input,
    type,
    start_time: isFullDay ? null : (input.start_time ?? current.start_time),
    end_time: isFullDay ? null : (input.end_time ?? current.end_time),
  });
  return scheduleRepo.getBlockedById(id);
}

export async function deleteBlockedTime(id: number) {
  await scheduleRepo.getBlockedById(id);
  await scheduleRepo.deleteBlockedTime(id);
  return { deleted: true };
}

export async function affectedAppointments(blockId: number) {
  const block = await scheduleRepo.getBlockedById(blockId);
  return appointmentsRepo.affectedByBlock(block.date, block.barber_id);
}

export async function listSettings() {
  return scheduleRepo.getSettings();
}

export async function updateSettings(settings: { key: string; value: string }[]) {
  for (const item of settings) await scheduleRepo.setSetting(item.key, item.value);
  return scheduleRepo.getSettings();
}
