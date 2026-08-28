import { db } from "@/lib/database/connection";
import type { Service } from "@/types";

/* =========================================================
   TIPOS INTERNOS
   ========================================================= */

type ServiceRow = Record<string, unknown>;

/* =========================================================
   AUXILIAR — CONVERTER SERVIÇO
   ========================================================= */

function mapService(
  row: ServiceRow,
  barberIds: number[] = [],
): Service {
  return {
    id: Number(row.id),

    name: String(row.name ?? ""),

    description:
      row.description != null
        ? String(row.description)
        : null,

    price: Number(row.price ?? 0),

    duration_minutes: Number(
      row.duration_minutes ?? 0,
    ),

    category:
      row.category != null
        ? String(row.category)
        : null,

    active:
      row.active === true ||
      row.active === 1,

    barber_ids: barberIds,

    created_at:
      row.created_at != null
        ? String(row.created_at)
        : null,
  };
}

/* =========================================================
   LISTAR BARBEIROS DOS SERVIÇOS
   ========================================================= */

async function listBarbersOfServices(): Promise<
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
    const serviceId = Number(
      row.service_id,
    );

    const barberId = Number(
      row.barber_id,
    );

    const current =
      result.get(serviceId) ?? [];

    if (!current.includes(barberId)) {
      current.push(barberId);
    }

    result.set(
      serviceId,
      current,
    );
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
    await db.query<ServiceRow>(
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
        ${
          activeOnly
            ? "WHERE active = 1"
            : ""
        }
        ORDER BY
          name ASC,
          id ASC
      `,
    );

  const barberLinks =
    await listBarbersOfServices();

  return rows.map((row) =>
    mapService(
      row,
      barberLinks.get(
        Number(row.id),
      ) ?? [],
    ),
  );
}

/* =========================================================
   BUSCAR SERVIÇO POR ID
   ========================================================= */

export async function findById(
  id: number,
): Promise<Service> {
  const rows =
    await db.query<ServiceRow>(
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

  if (rows.length === 0) {
    throw new Error(
      "Serviço não encontrado.",
    );
  }

  const barberRows =
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

  return mapService(
    rows[0],
    barberRows.map((row) =>
      Number(row.barber_id),
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
  active?: boolean;
  barber_ids?: number[];
}): Promise<number> {
  const price = Number(
    data.price,
  );

  const duration = Number(
    data.duration_minutes,
  );

  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {
    throw new Error(
      "Preço do serviço inválido.",
    );
  }

  if (
    !Number.isInteger(duration) ||
    duration < 5
  ) {
    throw new Error(
      "Duração do serviço inválida.",
    );
  }

  const serviceId =
    await db.insert("services", {
      name: data.name,
      description:
        data.description ?? null,
      price,
      duration_minutes: duration,
      category:
        data.category ?? null,
      active:
        data.active === false
          ? 0
          : 1,
    });

  if (
    data.barber_ids &&
    data.barber_ids.length > 0
  ) {
    await setBarbers(
      serviceId,
      data.barber_ids,
    );
  }

  return serviceId;
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
    barber_ids: number[];
  }>,
): Promise<void> {
  const fields: string[] = [];

  const params: Record<
    string,
    unknown
  > = {
    id,
  };

  if (data.name !== undefined) {
    fields.push(
      "name = @name",
    );

    params.name = data.name;
  }

  if (
    data.description !==
    undefined
  ) {
    fields.push(
      "description = @description",
    );

    params.description =
      data.description;
  }

  if (data.price !== undefined) {
    const price = Number(
      data.price,
    );

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      throw new Error(
        "Preço do serviço inválido.",
      );
    }

    fields.push(
      "price = @price",
    );

    params.price = price;
  }

  if (
    data.duration_minutes !==
    undefined
  ) {
    const duration = Number(
      data.duration_minutes,
    );

    if (
      !Number.isInteger(duration) ||
      duration < 5
    ) {
      throw new Error(
        "Duração do serviço inválida.",
      );
    }

    fields.push(
      "duration_minutes = @duration",
    );

    params.duration = duration;
  }

  if (data.category !== undefined) {
    fields.push(
      "category = @category",
    );

    params.category =
      data.category;
  }

  if (data.active !== undefined) {
    fields.push(
      "active = @active",
    );

    params.active =
      data.active ? 1 : 0;
  }

  if (fields.length > 0) {
    await db.execute(
      `
        UPDATE services
        SET
          ${fields.join(", ")}
        WHERE id = @id
      `,
      params,
    );
  }

  if (
    data.barber_ids !==
    undefined
  ) {
    await setBarbers(
      id,
      data.barber_ids,
    );
  }
}

/* =========================================================
   DEFINIR BARBEIROS DO SERVIÇO
   ========================================================= */

export async function setBarbers(
  serviceId: number,
  barberIds: number[],
): Promise<void> {
  const uniqueIds = [
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

  await db.execute(
    `
      DELETE FROM service_barbers
      WHERE service_id = @serviceId
    `,
    {
      serviceId,
    },
  );

  for (const barberId of uniqueIds) {
    await db.execute(
      `
        INSERT INTO service_barbers
          (
            service_id,
            barber_id
          )
        VALUES
          (
            @serviceId,
            @barberId
          )
      `,
      {
        serviceId,
        barberId,
      },
    );
  }
}

/* =========================================================
   VERIFICAR SE EXISTE SERVIÇO
   ========================================================= */

export async function exists(
  id: number,
): Promise<boolean> {
  const row =
    await db.first<{
      id: number;
    }>(
      `
        SELECT
          id
        FROM services
        WHERE id = @id
      `,
      {
        id,
      },
    );

  return Boolean(row);
}

/* =========================================================
   SERVIÇO OFERECIDO POR BARBEIRO
   ========================================================= */

export async function serviceAvailableForBarber(
  serviceId: number,
  barberId: number,
): Promise<boolean> {
  const row =
    await db.first<{
      service_id: number;
    }>(
      `
        SELECT
          sb.service_id
        FROM service_barbers sb
        INNER JOIN services s
          ON s.id = sb.service_id
        INNER JOIN barbers b
          ON b.id = sb.barber_id
        WHERE
          sb.service_id = @serviceId
          AND sb.barber_id = @barberId
          AND s.active = 1
          AND b.active = 1
      `,
      {
        serviceId,
        barberId,
      },
    );

  return Boolean(row);
}

/* =========================================================
   LISTAR SERVIÇOS DE UM BARBEIRO
   ========================================================= */

export async function listByBarber(
  barberId: number,
  activeOnly = true,
): Promise<Service[]> {
  const rows =
    await db.query<ServiceRow>(
      `
        SELECT
          s.id,
          s.name,
          s.description,
          s.price,
          s.duration_minutes,
          s.category,
          s.active,
          s.created_at,
          s.updated_at
        FROM services s
        INNER JOIN service_barbers sb
          ON sb.service_id = s.id
        WHERE
          sb.barber_id = @barberId
          ${
            activeOnly
              ? "AND s.active = 1"
              : ""
          }
        ORDER BY
          s.name ASC,
          s.id ASC
      `,
      {
        barberId,
      },
    );

  return rows.map((row) =>
    mapService(
      row,
      [barberId],
    ),
  );
}

/* =========================================================
   LISTAR BARBEIROS
   ========================================================= */

export async function listBarbers(
  activeOnly = true,
) {
  return db.query<{
    id: number;
    name: string;
    active: boolean | number;
  }>(
    `
      SELECT
        id,
        name,
        active
      FROM barbers
      ${
        activeOnly
          ? "WHERE active = 1"
          : ""
      }
      ORDER BY
        name ASC,
        id ASC
    `,
  );
}

/* =========================================================
   COMPATIBILIDADE — SERVIÇOS
   ========================================================= */

export async function listServices(
  activeOnly = true,
): Promise<Service[]> {
  return list(activeOnly);
}

/* =========================================================
   COMPATIBILIDADE — BUSCAR SERVIÇO
   ========================================================= */

export async function getService(
  id: number,
): Promise<Service> {
  return findById(id);
}

/* =========================================================
   COMPATIBILIDADE — ATUALIZAR SERVIÇO
   ========================================================= */

export async function updateService(
  id: number,
  data: Partial<{
    name: string;
    description: string | null;
    price: number;
    duration_minutes: number;
    category: string | null;
    active: boolean;
    barber_ids: number[];
  }>,
): Promise<Service> {
  await update(id, data);

  return findById(id);
}

/* =========================================================
   COMPATIBILIDADE — DESATIVAR SERVIÇO
   ========================================================= */

export async function deactivateService(
  id: number,
): Promise<Service> {
  await update(id, {
    active: false,
  });

  return findById(id);
}