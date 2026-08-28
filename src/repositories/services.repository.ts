import { db } from "@/lib/database/connection";
import { bool, nowStamp, num, toDate } from "@/utils/datetime";
import { notFound } from "@/lib/api/response";
import type { Service } from "@/types";

function map(
  row: Record<string, unknown>,
  barberIds: number[] = [],
): Service {
  return {
    id: Number(row.id),

    name: String(row.name),

    description:
      row.description !== null &&
      row.description !== undefined
        ? String(row.description)
        : null,

    price: num(row.price),

    duration_minutes: num(
      row.duration_minutes,
    ),

    category:
      row.category !== null &&
      row.category !== undefined
        ? String(row.category)
        : null,

    active: bool(row.active),

    barber_ids: barberIds,

    created_at: toDate(row.created_at),
  };
}

/* =========================================================
   RELACIONAMENTOS SERVIÇO -> BARBEIROS
   ========================================================= */

async function linksByService(): Promise<
  Map<number, number[]>
> {
  const rows = await db.query<{
    service_id: number;
    barber_id: number;
  }>(
    `
      SELECT
        service_id,
        barber_id
      FROM service_barbers
    `,
  );

  const result = new Map<number, number[]>();

  for (const row of rows) {
    const serviceId = Number(row.service_id);
    const barberId = Number(row.barber_id);

    const list =
      result.get(serviceId) ?? [];

    list.push(barberId);

    result.set(serviceId, list);
  }

  return result;
}

/* =========================================================
   LISTAR SERVIÇOS
   ========================================================= */

export async function list(
  activeOnly = false,
): Promise<Service[]> {
  const rows =
    await db.query<Record<string, unknown>>(
      `
        SELECT
          id,
          name,
          description,
          price,
          duration_minutes,
          category,
          active,
          created_at,
          updated_at
        FROM services
        WHERE (@activeOnly = 0 OR active = 1)
        ORDER BY category ASC, name ASC
      `,
      {
        activeOnly: activeOnly ? 1 : 0,
      },
    );

  const links = await linksByService();

  return rows.map((row) =>
    map(
      row,
      links.get(Number(row.id)) ?? [],
    ),
  );
}

/* =========================================================
   BUSCAR SERVIÇO
   ========================================================= */

export async function findById(
  id: number,
): Promise<Service> {
  const row =
    await db.first<Record<string, unknown>>(
      `
        SELECT
          id,
          name,
          description,
          price,
          duration_minutes,
          category,
          active,
          created_at,
          updated_at
        FROM services
        WHERE id = @id
      `,
      {
        id,
      },
    );

  if (!row) {
    throw notFound(
      "Serviço não encontrado.",
    );
  }

  const links =
    await db.query<{
      barber_id: number;
    }>(
      `
        SELECT
          barber_id
        FROM service_barbers
        WHERE service_id = @id
      `,
      {
        id,
      },
    );

  return map(
    row,
    links.map((item) =>
      Number(item.barber_id),
    ),
  );
}

/* =========================================================
   CRIAR SERVIÇO
   ========================================================= */

export async function create(data: {
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
  category?: string | null;
}): Promise<number> {
  return db.insert("services", {
    name: data.name,

    description:
      data.description ?? null,

    price: data.price,

    duration_minutes:
      data.duration_minutes,

    category:
      data.category ?? null,

    active: 1,
  });
}

/* =========================================================
   ATUALIZAR SERVIÇO
   ========================================================= */

export async function update(
  id: number,
  data: Partial<{
    name: string;
    description: string | null;
    price: number;
    duration_minutes: number;
    category: string | null;
    active: boolean;
  }>,
): Promise<void> {
  const fields: string[] = [];

  const params: Record<string, unknown> = {
    id,
    now: nowStamp(),
  };

  if (data.name !== undefined) {
    fields.push("name = @name");
    params.name = data.name;
  }

  if (data.description !== undefined) {
    fields.push(
      "description = @description",
    );

    params.description =
      data.description;
  }

  if (data.price !== undefined) {
    fields.push("price = @price");
    params.price = data.price;
  }

  if (
    data.duration_minutes !== undefined
  ) {
    fields.push(
      "duration_minutes = @duration",
    );

    params.duration =
      data.duration_minutes;
  }

  if (data.category !== undefined) {
    fields.push("category = @category");
    params.category =
      data.category;
  }

  if (data.active !== undefined) {
    fields.push("active = @active");
    params.active =
      data.active ? 1 : 0;
  }

  if (!fields.length) {
    return;
  }

  await db.execute(
    `
      UPDATE services
      SET
        ${fields.join(", ")},
        updated_at = @now
      WHERE id = @id
    `,
    params,
  );
}

/* =========================================================
   BARBEIROS DO SERVIÇO
   ========================================================= */

export async function setBarbers(
  serviceId: number,
  barberIds: number[],
): Promise<void> {
  await db.execute(
    `
      DELETE FROM service_barbers
      WHERE service_id = @serviceId
    `,
    {
      serviceId,
    },
  );

  const uniqueBarberIds = [
    ...new Set(
      barberIds
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0,
        ),
    ),
  ];

  for (const barberId of uniqueBarberIds) {
    await db.insert("service_barbers", {
      service_id: serviceId,
      barber_id: barberId,
    });
  }
}