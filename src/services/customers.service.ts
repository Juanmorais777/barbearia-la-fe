import * as customersRepo from "@/repositories/customers.repository";
import { badRequest, notFound } from "@/lib/api/response";
import type { Customer } from "@/types";

export async function listCustomers(filters: { search?: string | null; active?: boolean | null } = {}) {
  return customersRepo.list(filters);
}

export async function getCustomer(id: number) {
  return customersRepo.findById(id);
}

export async function createCustomer(input: {
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}): Promise<Customer> {
  const existing = await customersRepo.findByPhone(input.phone);
  if (existing) throw badRequest("Já existe um cliente cadastrado com este telefone.");
  const id = await customersRepo.create(input);
  return customersRepo.findById(id);
}

export async function updateCustomer(
  id: number,
  input: { name?: string; phone?: string; email?: string | null; notes?: string | null; active?: boolean },
) {
  await customersRepo.findById(id);
  await customersRepo.update(id, input);
  return customersRepo.findById(id);
}

export async function deactivateCustomer(id: number) {
  await customersRepo.update(id, { active: false });
  return customersRepo.findById(id);
}

export async function customerHistory(id: number) {
  const customer = await customersRepo.findById(id);
  const history = await customersRepo.history(id);
  return { customer, history };
}

/** Usado pelo agendamento público: localiza pelo telefone ou cria um novo cliente. */
export async function findOrCreateCustomer(input: {
  name: string;
  phone: string;
  email?: string | null;
}): Promise<number> {
  const existing = await customersRepo.findByPhone(input.phone);
  if (existing) {
    if (!existing.active) throw badRequest("Este cadastro está desativado. Fale com a barbearia.");
    return existing.id;
  }
  return customersRepo.create({
    name: input.name,
    phone: input.phone,
    email: input.email ?? null,
  });
}

export async function requireCustomer(id: number): Promise<Customer> {
  const customer = await customersRepo.findById(id);
  if (!customer) throw notFound("Cliente não encontrado.");
  return customer;
}
