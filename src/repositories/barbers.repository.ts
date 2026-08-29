import { db } from "@/lib/database/connection";
import type { Barber, BarberHour } from "@/types";

/* =========================================================
   TIPOS INTERNOS
   ========================================================= */

type TransactionClient = {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: Record<string, unknown>,
  ): Promise<T[]>;

  first<T = Record<string, unknown>>(
    sql: string,
    params?: Record<string, unknown>,
  ): Promise<T | null>;

  execute(
    sql: string,
    params?: Record<string, unknown>,
  ): Promise<unknown>;

  insert(
    table: string,
    data: Record<string, unknown>,
  ): Promise<number>;
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

    /*
     * Banco:
     * active SMALLINT
     *
     * 1 = ativo
     * 0 = inativo
     */
    active:
      Number(row.active ?? 0) === 1,

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
      ORDER BY barber_id ASC, service_id ASC
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

    if (!services.includes(serviceId)) {
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
  const where = activeOnly
    ? "WHERE active = 1"
    : "";

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
          bio,
          commission_percent,
          active,
          created_at,
          updated_at
        FROM barbers
        ${where}
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
          bio,
          commission_percent,
          active,
          created_at,
          updated_at
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
        ORDER BY service_id ASC
      `,
      {
        id,
      },
    );

  return mapBarber(
    row,
    serviceRows.map(
      (item) =>
        Number(item.service_id),
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
  const name =
    data.name.trim();

  if (!name) {
    throw new Error(
      "O nome do profissional é obrigatório.",
    );
  }

  const commission =
    Number(
      data.commission_percent,
    );

  if (!Number.isFinite(commission)) {
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

  return db.insert(
    "barbers",
    {
      name,

      phone:
        data.phone?.trim() || null,

      email:
        data.email?.trim() || null,

      photo:
        data.photo?.trim() || null,

      specialty:
        data.specialty?.trim() || null,

      bio:
        data.bio?.trim() || null,

      /*
       * Banco:
       * commission_percent NUMERIC
       */
      commission_percent:
        commission,

      /*
       * Banco:
       * active SMALLINT
       */
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
  const fields: string[] = [];

  const params: Record<
    string,
    unknown
  > = {
    id,
  };

  if (data.name !== undefined) {
    const name =
      data.name.trim();

    if (!name) {
      throw new Error(
        "O nome do profissional é obrigatório.",
      );
    }

    fields.push(
      "name = @name",
    );

    params.name = name;
  }

  if (data.phone !== undefined) {
    fields.push(
      "phone = @phone",
    );

    params.phone =
      data.phone?.trim() || null;
  }

  if (data.email !== undefined) {
    fields.push(
      "email = @email",
    );

    params.email =
      data.email?.trim() || null;
  }

  if (data.photo !== undefined) {
    fields.push(
      "photo = @photo",
    );

    params.photo =
      data.photo?.trim() || null;
  }

  if (data.specialty !== undefined) {
    fields.push(
      "specialty = @specialty",
    );

    params.specialty =
      data.specialty?.trim() || null;
  }

  if (data.bio !== undefined) {
    fields.push(
      "bio = @bio",
    );

    params.bio =
      data.bio?.trim() || null;
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
      ) ||
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

  if (data.active !== undefined) {
    fields.push(
      "active = @active",
    );

    /*
     * PostgreSQL:
     * SMALLINT
     */
    params.active =
      data.active ? 1 : 0;
  }

  if (!fields.length) {
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
       * Remove os serviços atuais.
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
       * Adiciona os novos.
       */
      for (
        const serviceId of uniqueIds
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
   VERIFICAR SE BARBEIRO OFERECE SERVIÇO
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

          /*
           * active é SMALLINT
           */
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
   MAPEAR HORÁRIO
   ========================================================= */

function mapBarberHour(
  row: BarberRow,
): BarberHour {
  return {
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
        ? String(
            row.start_time,
          ).slice(0, 5)
        : null,

    end_time:
      row.end_time != null
        ? String(
            row.end_time,
          ).slice(0, 5)
        : null,

    /*
     * Banco:
     * is_closed SMALLINT
     *
     * 1 = fechado
     * 0 = aberto
     */
    is_closed:
      Number(
        row.is_closed ?? 0,
      ) === 1,
  };
}

/* =========================================================
   LISTAR HORÁRIOS DO BARBEIRO
   ========================================================= */

export async function listHours(
  barberId: number,
): Promise<BarberHour[]> {
  const rows =
    await db.query<BarberRow>(
      `
        SELECT
          id,
          barber_id,
          day_of_week,
          start_time,
          end_time,
          is_closed,
          created_at,
          updated_at
        FROM barber_hours
        WHERE barber_id = @barberId
        ORDER BY
          day_of_week ASC
      `,
      {
        barberId,
      },
    );

  return rows.map(
    mapBarberHour,
  );
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

  if (!ids.length) {
    return [];
  }

  const placeholders = ids
    .map(
      (_, index) =>
        `@barberId${index}`,
    )
    .join(", ");

  const params: Record<
    string,
    unknown
  > = {
    dayOfWeek,
  };

  ids.forEach(
    (id, index) => {
      params[
        `barberId${index}`
      ] = id;
    },
  );

  const rows =
    await db.query<BarberRow>(
      `
        SELECT
          bh.id,
          bh.barber_id,
          bh.day_of_week,
          bh.start_time,
          bh.end_time,
          bh.is_closed,
          bh.created_at,
          bh.updated_at

        FROM barber_hours bh

        INNER JOIN barbers b
          ON b.id = bh.barber_id

        WHERE
          bh.day_of_week = @dayOfWeek

          /*
           * active é SMALLINT
           */
          AND b.active = 1

          AND bh.barber_id IN (
            ${placeholders}
          )

        ORDER BY
          bh.barber_id ASC
      `,
      params,
    );

  return rows.map(
    mapBarberHour,
  );
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
  await db.transaction(
    async (
      tx: TransactionClient,
    ) => {
      for (const hour of hours) {
        const day =
          Number(
            hour.day_of_week,
          );

        if (
          !Number.isInteger(day) ||
          day < 0 ||
          day > 6
        ) {
          throw new Error(
            "Dia da semana inválido.",
          );
        }

        const isClosed =
          Boolean(
            hour.is_closed,
          );

        let startTime =
          hour.start_time;

        let endTime =
          hour.end_time;

        /*
         * Dia fechado:
         * não grava horários.
         */
        if (isClosed) {
          startTime = null;
          endTime = null;
        }

        /*
         * Dia aberto:
         * horários obrigatórios.
         */
        if (
          !isClosed &&
          (!startTime ||
            !endTime)
        ) {
          throw new Error(
            "Informe o horário inicial e final.",
          );
        }

        /*
         * Final precisa ser maior
         * que o início.
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
         * Procura o horário existente.
         *
         * IMPORTANTE:
         * Não usamos recordset.
         * Isso é PostgreSQL.
         */
        const existing =
          await tx.first<{
            id: number;
          }>(
            `
              SELECT
                id
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

        /*
         * Atualiza.
         */
        if (existing) {
          await tx.execute(
            `
              UPDATE barber_hours
              SET
                start_time = @startTime,
                end_time = @endTime,
                is_closed = @isClosed,
                updated_at = @updatedAt
              WHERE id = @id
            `,
            {
              id:
                Number(
                  existing.id,
                ),

              startTime,

              endTime,

              /*
               * SMALLINT
               */
              isClosed:
                isClosed
                  ? 1
                  : 0,

              updatedAt:
                new Date(),
            },
          );

          continue;
        }

        /*
         * Cria.
         */
        await tx.execute(
          `
            INSERT INTO barber_hours
            (
              barber_id,
              day_of_week,
              start_time,
              end_time,
              is_closed,
              created_at,
              updated_at
            )
            VALUES
            (
              @barberId,
              @dayOfWeek,
              @startTime,
              @endTime,
              @isClosed,
              @createdAt,
              @updatedAt
            )
          `,
          {
            barberId,

            dayOfWeek:
              day,

            startTime,

            endTime,

            /*
             * SMALLINT
             */
            isClosed:
              isClosed
                ? 1
                : 0,

            createdAt:
              new Date(),

            updatedAt:
              new Date(),
          },
        );
      }
    },
  );
}

