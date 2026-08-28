import { db } from "@/lib/database/connection";
import type { Barber, BarberHour } from "@/types";

/* =========================================================
   TIPOS INTERNOS
   ========================================================= */

type TransactionClient = {
  execute(
    sql: string,
    params?: Record<string, unknown>,
  ): Promise<unknown>;
};

type BarberRow = Record<string, unknown>;

/* =========================================================
   MAPEAR BARBEIRO
   ========================================================= */

function mapBarber(
  row: BarberRow,
  serviceIds: number[] = [],
): Barber {
  return {
    id: Number(row.id),

    name: String(row.name ?? ""),

    phone:
      row.phone != null
        ? String(row.phone)
        : null,

    email:
      row.email != null
        ? String(row.email)
        : null,

    photo:
      row.photo != null
        ? String(row.photo)
        : null,

    specialty:
      row.specialty != null
        ? String(row.specialty)
        : null,

    bio:
      row.bio != null
        ? String(row.bio)
        : null,

    commission_percent: Number(
      row.commission_percent ?? 0,
    ),

    active:
      row.active === true ||
      row.active === 1 ||
      row.active === "1",

    service_ids: serviceIds,

    created_at:
      row.created_at != null
        ? String(row.created_at)
        : null,
  };
}
/* =========================================================
   SERVIÇOS DOS BARBEIROS
   ========================================================= */

async function listServicesOfBarbers(): Promise<
  Map<number, number[]>
> {
  const rows = await db.query<{
    barber_id: number;
    service_id: number;
  }>(
    `
      SELECT
        barber_id,
        service_id
      FROM service_barbers
    `,
  );

  const result =
    new Map<number, number[]>();

  for (const row of rows) {
    const barberId =
      Number(row.barber_id);

    const serviceId =
      Number(row.service_id);

    const services =
      result.get(barberId) ?? [];

    if (
      !services.includes(serviceId)
    ) {
      services.push(serviceId);
    }

    result.set(
      barberId,
      services,
    );
  }

  return result;
}

/* =========================================================
   LISTAR BARBEIROS
   ========================================================= */

export async function list(
  activeOnly = false,
): Promise<Barber[]> {
  const rows =
    await db.query<BarberRow>(
      `
        SELECT
          id,
          name,
          phone,
          email,
          photo,
          specialty,
          commission_percent,
          active,
          created_at,
          updated_at,
          bio
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

  const services =
    await listServicesOfBarbers();

  return rows.map((row) =>
    mapBarber(
      row,
      services.get(
        Number(row.id),
      ) ?? [],
    ),
  );
}

/* =========================================================
   BUSCAR BARBEIRO POR ID
   ========================================================= */

export async function findById(
  id: number,
): Promise<Barber> {
  const row =
    await db.first<BarberRow>(
      `
        SELECT
          id,
          name,
          phone,
          email,
          photo,
          specialty,
          commission_percent,
          active,
          created_at,
          updated_at,
          bio
        FROM barbers
        WHERE id = @id
      `,
      {
        id,
      },
    );

  if (!row) {
    throw new Error(
      "Profissional não encontrado.",
    );
  }

  const serviceRows =
    await db.query<{
      service_id: number;
    }>(
      `
        SELECT
          service_id
        FROM service_barbers
        WHERE barber_id = @id
      `,
      {
        id,
      },
    );

  return mapBarber(
    row,
    serviceRows.map(
      (item) => Number(item.service_id),
    ),
  );
}

/* =========================================================
   CRIAR BARBEIRO
   ========================================================= */

export async function create(
  data: {
    name: string;
    phone?: string | null;
    email?: string | null;
    photo?: string | null;
    specialty?: string | null;
    bio?: string | null;
    commission_percent: number;
  },
): Promise<number> {
  const commission =
    Number(
      data.commission_percent,
    );

  if (
    !Number.isFinite(
      commission,
    )
  ) {
    throw new Error(
      "Comissão inválida.",
    );
  }

  if (
    commission < 0 ||
    commission > 100
  ) {
    throw new Error(
      "A comissão deve estar entre 0% e 100%.",
    );
  }

  if (
    !data.name.trim()
  ) {
    throw new Error(
      "O nome do profissional é obrigatório.",
    );
  }

  return db.insert(
    "barbers",
    {
      name:
        data.name.trim(),

      phone:
        data.phone?.trim() ||
        null,

      email:
        data.email?.trim() ||
        null,

      photo:
        data.photo?.trim() ||
        null,

      specialty:
        data.specialty?.trim() ||
        null,

      bio:
        data.bio?.trim() ||
        null,

      /*
       * NOME EXATO DA COLUNA
       * NO SQL SERVER
       */
      commission_percent:
        commission,

      active: 1,
    },
  );
}

/* =========================================================
   ATUALIZAR BARBEIRO
   ========================================================= */

export async function update(
  id: number,
  data: Partial<{
    name: string;
    phone: string | null;
    email: string | null;
    photo: string | null;
    specialty: string | null;
    bio: string | null;
    commission_percent: number;
    active: boolean;
  }>,
): Promise<void> {
  const fields: string[] =
    [];

  const params: Record<
    string,
    unknown
  > = {
    id,
  };

  if (
    data.name !== undefined
  ) {
    fields.push(
      "name = @name",
    );

    params.name =
      data.name.trim();
  }

  if (
    data.phone !== undefined
  ) {
    fields.push(
      "phone = @phone",
    );

    params.phone =
      data.phone?.trim() ||
      null;
  }

  if (
    data.email !== undefined
  ) {
    fields.push(
      "email = @email",
    );

    params.email =
      data.email?.trim() ||
      null;
  }

  if (
    data.photo !== undefined
  ) {
    fields.push(
      "photo = @photo",
    );

    params.photo =
      data.photo?.trim() ||
      null;
  }

  if (
    data.specialty !==
    undefined
  ) {
    fields.push(
      "specialty = @specialty",
    );

    params.specialty =
      data.specialty?.trim() ||
      null;
  }

  if (
    data.bio !== undefined
  ) {
    fields.push(
      "bio = @bio",
    );

    params.bio =
      data.bio?.trim() ||
      null;
  }

  if (
    data.commission_percent !==
    undefined
  ) {
    const commission =
      Number(
        data.commission_percent,
      );

    if (
      !Number.isFinite(
        commission,
      )
    ) {
      throw new Error(
        "Comissão inválida.",
      );
    }

    if (
      commission < 0 ||
      commission > 100
    ) {
      throw new Error(
        "A comissão deve estar entre 0% e 100%.",
      );
    }

    fields.push(
      "commission_percent = @commission",
    );

    params.commission =
      commission;
  }

  if (
    data.active !== undefined
  ) {
    fields.push(
      "active = @active",
    );

    params.active =
      data.active ? 1 : 0;
  }

  if (
    fields.length === 0
  ) {
    return;
  }

  await db.execute(
    `
      UPDATE barbers
      SET
        ${fields.join(", ")}
      WHERE id = @id
    `,
    params,
  );
}

/* =========================================================
   SERVIÇOS DO BARBEIRO
   ========================================================= */

export async function setServices(
  barberId: number,
  serviceIds: number[],
): Promise<void> {
  const uniqueIds = [
    ...new Set(
      serviceIds
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0,
        ),
    ),
  ];

  await db.transaction(
    async (
      tx: TransactionClient,
    ) => {
      /*
       * Remove os serviços antigos
       */
      await tx.execute(
        `
          DELETE FROM service_barbers
          WHERE barber_id = @barberId
        `,
        {
          barberId,
        },
      );

      /*
       * Insere os novos
       */
      for (
        const serviceId
        of uniqueIds
      ) {
        await tx.execute(
          `
            INSERT INTO service_barbers
            (
              barber_id,
              service_id
            )
            VALUES
            (
              @barberId,
              @serviceId
            )
          `,
          {
            barberId,
            serviceId,
          },
        );
      }
    },
  );
}

/* =========================================================
   VERIFICAR SE BARBEIRO FAZ SERVIÇO
   ========================================================= */

export async function barberOffersService(
  barberId: number,
  serviceId: number,
): Promise<boolean> {
  const row =
    await db.first<{
      service_id: number;
    }>(
      `
        SELECT
          sb.service_id
        FROM service_barbers sb

        INNER JOIN barbers b
          ON b.id = sb.barber_id

        INNER JOIN services s
          ON s.id = sb.service_id

        WHERE
          sb.barber_id = @barberId
          AND sb.service_id = @serviceId
          AND b.active = 1
          AND s.active = 1
      `,
      {
        barberId,
        serviceId,
      },
    );

  return Boolean(row);
}

/* =========================================================
   LISTAR HORÁRIOS DO BARBEIRO
   ========================================================= */

export async function listHours(
  barberId: number,
): Promise<BarberHour[]> {
  const rows = await db.query<BarberRow>(
    `
      SELECT
        id,
        barber_id,
        day_of_week,
        open_time AS start_time,
        close_time AS end_time,
        closed AS is_closed
      FROM barber_hours
      WHERE barber_id = @barberId
      ORDER BY day_of_week ASC
    `,
    {
      barberId,
    },
  );

  return rows.map((row) => ({
    id:
      row.id != null
        ? Number(row.id)
        : null,

    barber_id: Number(row.barber_id),

    day_of_week: Number(row.day_of_week),

    start_time:
      row.start_time != null
        ? String(row.start_time).slice(0, 5)
        : null,

    end_time:
      row.end_time != null
        ? String(row.end_time).slice(0, 5)
        : null,

    is_closed:
      row.is_closed === true ||
      row.is_closed === 1 ||
      row.is_closed === "1",
  }));
}

/* =========================================================
   LISTAR HORÁRIOS POR DIA
   ========================================================= */

export async function listHoursForDay(
  barberIds: number[],
  dayOfWeek: number,
): Promise<BarberHour[]> {
  const ids = [
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

  if (ids.length === 0) {
    return [];
  }

  const placeholders = ids
    .map((_, index) => `@barberId${index}`)
    .join(", ");

  const params: Record<string, unknown> = {
    dayOfWeek,
  };

  ids.forEach((id, index) => {
    params[`barberId${index}`] = id;
  });

  const rows =
    await db.query<BarberRow>(
      `
        SELECT
          bh.id,
          bh.barber_id,
          bh.day_of_week,
          bh.open_time AS start_time,
          bh.close_time AS end_time,
          bh.closed AS is_closed

        FROM barber_hours bh

        INNER JOIN barbers b
          ON b.id = bh.barber_id

        WHERE
          bh.day_of_week = @dayOfWeek
          AND b.active = 1
          AND bh.barber_id IN (${placeholders})

        ORDER BY
          bh.barber_id ASC
      `,
      params,
    );

  return rows.map((row) => ({
    id:
      row.id != null
        ? Number(row.id)
        : null,

    barber_id:
      Number(row.barber_id),

    day_of_week:
      Number(row.day_of_week),

    start_time:
      row.start_time != null
        ? String(row.start_time).slice(0, 5)
        : null,

    end_time:
      row.end_time != null
        ? String(row.end_time).slice(0, 5)
        : null,

    is_closed:
      row.is_closed === true ||
      row.is_closed === 1 ||
      row.is_closed === "1",
  }));
}
/* =========================================================
   CRIAR / ATUALIZAR HORÁRIOS
   ========================================================= */

export async function upsertHours(
  barberId: number,
  hours: {
    day_of_week: number;
    start_time: string | null;
    end_time: string | null;
    is_closed: boolean;
  }[],
): Promise<void> {
  await db.transaction(async (tx: TransactionClient) => {
    for (const hour of hours) {
      const day = Number(hour.day_of_week);

      if (
        !Number.isInteger(day) ||
        day < 0 ||
        day > 6
      ) {
        throw new Error(
          "Dia da semana inválido.",
        );
      }

      const isClosed = Boolean(
        hour.is_closed,
      );

      let startTime =
        hour.start_time;

      let endTime =
        hour.end_time;

      /*
       * Se estiver fechado, não precisamos
       * armazenar horário.
       */
      if (isClosed) {
        startTime = null;
        endTime = null;
      }

      /*
       * Se estiver aberto, os dois horários
       * são obrigatórios.
       */
      if (
        !isClosed &&
        (!startTime || !endTime)
      ) {
        throw new Error(
          "Informe o horário inicial e final.",
        );
      }

      /*
       * Verifica se o final é maior que o início.
       */
      if (
        !isClosed &&
        startTime &&
        endTime &&
        startTime >= endTime
      ) {
        throw new Error(
          "O horário final deve ser maior que o horário inicial.",
        );
      }

      /*
       * Procura o registro existente.
       */
      const result = await tx.execute(
        `
          SELECT id
          FROM barber_hours
          WHERE
            barber_id = @barberId
            AND day_of_week = @dayOfWeek
        `,
        {
          barberId,
          dayOfWeek: day,
        },
      );

      const queryResult =
        result as {
          recordset?: Array<{
            id: number;
          }>;
        };

      const existing =
        queryResult.recordset?.[0];

      /*
       * IMPORTANTE:
       * SQL Server usa:
       *
       * open_time
       * close_time
       * closed
       */

      if (existing) {
        await tx.execute(
          `
            UPDATE barber_hours
            SET
              open_time = @openTime,
              close_time = @closeTime,
              closed = @closed
            WHERE id = @id
          `,
          {
            id: Number(existing.id),
            openTime: startTime,
            closeTime: endTime,
            closed: isClosed ? 1 : 0,
          },
        );
      } else {
        await tx.execute(
          `
            INSERT INTO barber_hours
            (
              barber_id,
              day_of_week,
              open_time,
              close_time,
              closed
            )
            VALUES
            (
              @barberId,
              @dayOfWeek,
              @openTime,
              @closeTime,
              @closed
            )
          `,
          {
            barberId,
            dayOfWeek: day,
            openTime: startTime,
            closeTime: endTime,
            closed: isClosed ? 1 : 0,
          },
        );
      }
    }
  });
}