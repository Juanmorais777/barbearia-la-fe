import { ApiError, badRequest, notFound } from "@/lib/api/response";
import { withTransaction } from "@/lib/database/connection";
import * as appointmentsRepo from "@/repositories/appointments.repository";
import * as barbersRepo from "@/repositories/barbers.repository";
import * as financeRepo from "@/repositories/finance.repository";
import {
  validateSlot,
  getAvailability,
} from "@/services/availability.service";
import { findOrCreateCustomer } from "@/services/customers.service";
import { formatBR } from "@/utils/datetime";
import type {
  Appointment,
  AppointmentStatus,
  PaymentMethod,
} from "@/types";
import type { SlotValidation } from "@/services/availability.service";

export { getAvailability };

export async function listAppointments(
  filters: appointmentsRepo.AppointmentFilters,
) {
  return appointmentsRepo.list(filters);
}

export async function getAppointment(id: number): Promise<Appointment> {
  return appointmentsRepo.findById(id);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Criação do agendamento.
 * Toda a validação e inserção acontecem dentro da mesma transação.
 */
export async function createAppointment(input: {
  service_id: number;
  barber_id: number;
  date: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  notes?: string | null;
}): Promise<Appointment> {
  const customerId = await findOrCreateCustomer({
    name: input.customer_name,
    phone: input.customer_phone,
    email: input.customer_email ?? null,
  });

  const id = await withTransaction(async (tx) => {
    const slot: SlotValidation = await validateSlot(tx, {
      serviceId: input.service_id,
      barberId: input.barber_id,
      date: input.date,
      time: input.time,
    });

    return tx.insert("appointments", {
      customer_id: customerId,
      barber_id: input.barber_id,
      service_id: input.service_id,
      appointment_date: input.date,
      start_time: slot.start,
      end_time: slot.end,
      status: "PENDENTE",
      price: slot.price,
      payment_method: null,
      notes: input.notes ?? null,
    });
  });

  return appointmentsRepo.findById(Number(id));
}

/**
 * Altera o status do agendamento.
 */
export async function changeStatus(
  id: number,
  status: AppointmentStatus,
  options: {
    payment_method?: PaymentMethod | null;
    adminId?: number | null;
  } = {},
): Promise<Appointment> {
  const appointment = await appointmentsRepo.findById(id);

  if (appointment.status === status && status !== "CONCLUIDO") {
    return appointment;
  }

  if (status === "CONCLUIDO") {
    return concludeAppointment(
      id,
      options.payment_method || "DINHEIRO",
      options.adminId,
    );
  }


  if (status === "CANCELADO" || status === "NAO_COMPARECEU") {
    await withTransaction(async (tx) => {
    await tx.execute(
      `DELETE FROM transactions
       WHERE appointment_id = @id`,
      { id },
    );

    await tx.execute(
      `DELETE FROM commissions
       WHERE appointment_id = @id`,
      { id },
    );


      await tx.execute(
        `UPDATE appointments
         SET status = @status,
             updated_at = @now
         WHERE id = @id`,
        {
          id,
          status,
          now: new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
        },
      );
    });

    return appointmentsRepo.findById(id);
  }

  await appointmentsRepo.updateStatus(id, status);

  return appointmentsRepo.findById(id);
}

/**
 * Conclusão do atendimento.
 *
 * Status + comissão + receita são gravados na mesma transação.
 */
export async function concludeAppointment(
  id: number,
  paymentMethod: PaymentMethod = "DINHEIRO",
  adminId?: number | null,
): Promise<Appointment> {
  const existingCommission =
    await financeRepo.findCommissionByAppointment(id);

  if (existingCommission) {
    throw new ApiError(
      "Este atendimento já foi concluído.",
      409,
    );
  }

  const appointment = await appointmentsRepo.findById(id);

  if (appointment.status === "CANCELADO") {
    throw badRequest(
      "Não é possível concluir um agendamento cancelado.",
    );
  }

  if (appointment.status === "CONCLUIDO") {
    throw badRequest(
      "Este atendimento já foi concluído.",
    );
  }

  const barber = await barbersRepo.findById(
    appointment.barber_id,
  );

  const percent = barber.commission_percent;

  const amount = round2(
    (appointment.price * percent) / 100,
  );

  await withTransaction(async (tx) => {
    await tx.execute(
      `UPDATE appointments
       SET status = @status,
           payment_method = @paymentMethod,
           updated_at = @now
       WHERE id = @id`,
      {
        id,
        status: "CONCLUIDO",
        paymentMethod,
        now: new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
      },
    );

    await financeRepo.createCommission(tx, {
      appointment_id: id,
      barber_id: appointment.barber_id,
      base_amount: appointment.price,
      service_id: appointment.service_id,
      percent,
      amount,
    });

    await financeRepo.createTransaction(tx, {
      type: "INCOME",
      category: "SERVICO",
      description: `${appointment.service_name} - ${appointment.customer_name}`,
      amount: appointment.price,
      payment_method: paymentMethod,
      reference_type: "APPOINTMENT",
      reference_id: id,
      transaction_date: appointment.date,
      created_by: adminId ?? null,
    });
  });

  return appointmentsRepo.findById(id);
}

/**
 * Remarcação do agendamento.
 *
 * IMPORTANTE:
 * - valida o novo horário dentro da transação;
 * - ignora o próprio agendamento na verificação;
 * - faz o UPDATE usando a mesma conexão transacional;
 * - evita o problema anterior de db.execute() fora da transação.
 */
export async function rescheduleAppointment(
  id: number,
  input: {
    date: string;
    time: string;
    barber_id?: number;
  },
): Promise<Appointment> {
  const appointment = await appointmentsRepo.findById(id);

  if (appointment.status === "CONCLUIDO") {
    throw badRequest(
      "Atendimento concluído não pode ser remarcado.",
    );
  }

  if (appointment.status === "CANCELADO") {
    throw badRequest(
      "Atendimento cancelado não pode ser remarcado.",
    );
  }

  const barberId =
    input.barber_id ?? appointment.barber_id;

  await withTransaction(async (tx) => {
    const slot = await validateSlot(tx, {
      serviceId: appointment.service_id,
      barberId,
      date: input.date,
      time: input.time,
      ignoreAppointmentId: id,
    });

    await tx.execute(
      `UPDATE appointments
       SET appointment_date = @date,
           barber_id = @barberId,
           start_time = @startTime,
           end_time = @endTime,
           updated_at = @now
       WHERE id = @id`,
      {
        date: input.date,
        barberId,
        startTime: slot.start,
        endTime: slot.end,
        now: new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
        id,
      },
    );
  });

  return appointmentsRepo.findById(id);
}

/**
 * Cancelamento lógico.
 * O registro permanece no banco para preservar histórico.
 */
export async function cancelAppointment(
  id: number,
): Promise<Appointment> {
  const appointment = await appointmentsRepo.findById(id);

  if (appointment.status === "CONCLUIDO") {
    throw badRequest(
      "Atendimento concluído não pode ser cancelado.",
    );
  }

  return changeStatus(id, "CANCELADO");
}

/**
 * Exclusão física.
 * Só deve ser chamada depois do cancelamento.
 */
export async function deleteAppointment(
  id: number,
): Promise<void> {
  await appointmentsRepo.findById(id);

  await withTransaction(async (tx) => {
    await tx.execute(
      `DELETE FROM transactions
       WHERE reference_type = 'APPOINTMENT'
         AND reference_id = @id`,
      { id },
    );

    await tx.execute(
      `DELETE FROM commissions
       WHERE appointment_id = @id`,
      { id },
    );

    await tx.execute(
      `DELETE FROM appointments
       WHERE id = @id`,
      { id },
    );
  });
}

/**
 * Links para confirmação pelo WhatsApp.
 */
export function bookingLinks(
  appointment: Appointment,
) {
  const message = [
    `Olá, ${appointment.customer_name.split(" ")[0]}! Seu agendamento na Barbearia La Fé foi registrado.`,
    "",
    `Serviço: ${appointment.service_name}`,
    `Barbeiro: ${appointment.barber_name}`,
    `Data: ${formatBR(appointment.date)}`,
    `Horário: ${appointment.start_time}`,
    `Valor: R$${appointment.price
      .toFixed(2)
      .replace(".", ",")}`,
    `Status: ${appointment.status}`,
    "",
    "Obrigado pela preferência!",
  ].join("\n");

  return {
    message,

    customer_url:
      `https://wa.me/${digits(
        appointment.customer_phone,
      )}?text=${encodeURIComponent(message)}`,

    shop_url:
      `https://wa.me/${SHOP_FALLBACK}?text=${encodeURIComponent(
        message,
      )}`,

    shop_whatsapp: SHOP_FALLBACK,
  };
}

const SHOP_FALLBACK =
  process.env.NEXT_PUBLIC_SHOP_WHATSAPP ||
  "5582981883520";

function digits(phone: string): string {
  const value = phone.replace(/\D/g, "");

  return value.startsWith("55")
    ? value
    : `55${value}`;
}

export async function requireAppointment(
  id: number,
): Promise<Appointment> {
  return appointmentsRepo.findById(id).catch(() => {
    throw notFound(
      "Agendamento não encontrado.",
    );
  });
}