import { db, ident } from "@/lib/database/connection";
import {
  bool,
  nowStamp,
  toDate,
  toTime,
} from "@/utils/datetime";
import { notFound } from "@/lib/api/response";
import type {
  BlockedTime,
  BusinessHour,
  Setting,
} from "@/types";

/* =========================================================
   HORÁRIOS DE FUNCIONAMENTO
   ========================================================= */

function mapBusinessHour(
  row: Record<string, unknown>,
): BusinessHour {
  return {
    id: Number(row.id),
    day_of_week: Number(row.day_of_week),
    open_time: toTime(row.open_time),
    close_time: toTime(row.close_time),
    is_closed: bool(row.closed),
  };
}

export async function getBusinessHours(): Promise<
  BusinessHour[]
> {
  const rows =
    await db.query<Record<string, unknown>>(
      `SELECT
          id,
          day_of_week,
          open_time,
          close_time,
          closed
       FROM ${ident("business_hours")}
       ORDER BY day_of_week ASC`,
    );

  return rows.map(mapBusinessHour);
}

export async function getBusinessHourByDay(
  dayOfWeek: number,
): Promise<BusinessHour | null> {
  const row =
    await db.first<Record<string, unknown>>(
      `SELECT
          id,
          day_of_week,
          open_time,
          close_time,
          closed
       FROM ${ident("business_hours")}
       WHERE day_of_week = @dayOfWeek`,
      {
        dayOfWeek,
      },
    );

  return row
    ? mapBusinessHour(row)
    : null;
}

export async function upsertBusinessHour(
  hour: {
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  },
): Promise<void> {
  const existing =
    await db.first<{ id: number }>(
      `SELECT id
       FROM ${ident("business_hours")}
       WHERE day_of_week = @dayOfWeek`,
      {
        dayOfWeek: hour.day_of_week,
      },
    );

  const params = {
    dayOfWeek: hour.day_of_week,
    openTime: hour.is_closed
      ? null
      : hour.open_time,
    closeTime: hour.is_closed
      ? null
      : hour.close_time,
    closed: hour.is_closed ? 1 : 0,
  };

  if (existing) {
    await db.execute(
      `UPDATE ${ident("business_hours")}
       SET
         open_time = @openTime,
         close_time = @closeTime,
         closed = @closed
       WHERE id = @id`,
      {
        ...params,
        id: Number(existing.id),
      },
    );

    return;
  }

  await db.insert(
    "business_hours",
    {
      day_of_week: hour.day_of_week,
      open_time: params.openTime,
      close_time: params.closeTime,
      closed: params.closed,
    },
  );
}

/* =========================================================
   BLOQUEIOS
   ========================================================= */

/*
 * BANCO:
 *
 * blocked_times
 *
 * id
 * barber_id
 * date
 * start_time
 * end_time
 * reason
 * type
 * active -> smallint
 * created_at
 * updated_at
 *
 * NÃO usar:
 *
 * block_date
 * all_day
 */

function mapBlocked(
  row: Record<string, unknown>,
): BlockedTime {
  return {
    id: Number(row.id),

    barber_id:
      row.barber_id === null ||
      row.barber_id === undefined
        ? null
        : Number(row.barber_id),

    barber_name:
      row.barber_name === null ||
      row.barber_name === undefined
        ? null
        : String(row.barber_name),

    date:
      toDate(row.date) as string,

    start_time:
      toTime(row.start_time),

    end_time:
      toTime(row.end_time),

    reason:
      row.reason === null ||
      row.reason === undefined
        ? ""
        : String(row.reason),

    type:
      row.type === null ||
      row.type === undefined
        ? ("BLOCK" as BlockedTime["type"])
        : (String(
            row.type,
          ) as BlockedTime["type"]),

    active:
      bool(row.active),

    created_at:
      toDate(row.created_at),
  };
}

/* =========================================================
   LISTAR BLOQUEIOS
   ========================================================= */

export async function getBlockedTimes(
  filters: {
    from?: string | null;
    to?: string | null;
    barber_id?: number | null;
    activeOnly?: boolean;
  },
): Promise<BlockedTime[]> {
  const conditions: string[] = [];

  const params: Record<
    string,
    unknown
  > = {};

  if (filters.from) {
    conditions.push(
      `bt.date >= @from`,
    );

    params.from = filters.from;
  }

  if (filters.to) {
    conditions.push(
      `bt.date <= @to`,
    );

    params.to = filters.to;
  }

  if (
    filters.barber_id !== null &&
    filters.barber_id !== undefined
  ) {
    conditions.push(
      `bt.barber_id = @barberId`,
    );

    params.barberId =
      filters.barber_id;
  }

  /*
   * IMPORTANTE:
   *
   * active é SMALLINT no banco.
   *
   * Portanto:
   * active = 1
   *
   * e NÃO:
   * active = true
   */

  if (filters.activeOnly) {
    conditions.push(
      `bt.active = 1`,
    );
  }

  const where =
    conditions.length > 0
      ? `WHERE ${conditions.join(
          " AND ",
        )}`
      : "";

  const rows =
    await db.query<
      Record<string, unknown>
    >(
      `SELECT
          bt.id,
          bt.barber_id,
          bt.date,
          bt.start_time,
          bt.end_time,
          bt.reason,
          bt.type,
          bt.active,
          bt.created_at,
          bt.updated_at,
          b.name AS barber_name
       FROM ${ident(
         "blocked_times",
       )} bt
       LEFT JOIN ${ident(
         "barbers",
       )} b
         ON b.id = bt.barber_id
       ${where}
       ORDER BY
         bt.date ASC,
         bt.start_time ASC`,
      params,
    );

  return rows.map(mapBlocked);
}

/* =========================================================
   BLOQUEIOS DE UMA DATA
   ========================================================= */

export async function getBlockedForDate(
  date: string,
  barberIds: number[] = [],
): Promise<BlockedTime[]> {
  const rows =
    await getBlockedTimes({
      from: date,
      to: date,
      activeOnly: true,
    });

  return rows.filter(
    (block) =>
      block.barber_id === null ||
      barberIds.includes(
        block.barber_id,
      ),
  );
}

/* =========================================================
   BUSCAR BLOQUEIO POR ID
   ========================================================= */

export async function getBlockedById(
  id: number,
): Promise<BlockedTime> {
  const rows =
    await db.query<
      Record<string, unknown>
    >(
      `SELECT
          bt.id,
          bt.barber_id,
          bt.date,
          bt.start_time,
          bt.end_time,
          bt.reason,
          bt.type,
          bt.active,
          bt.created_at,
          bt.updated_at,
          b.name AS barber_name
       FROM ${ident(
         "blocked_times",
       )} bt
       LEFT JOIN ${ident(
         "barbers",
       )} b
         ON b.id = bt.barber_id
       WHERE bt.id = @id`,
      {
        id,
      },
    );

  if (!rows.length) {
    throw notFound(
      "Bloqueio não encontrado.",
    );
  }

  return mapBlocked(rows[0]);
}

/* =========================================================
   CRIAR BLOQUEIO
   ========================================================= */

export async function createBlockedTime(
  data: {
    barber_id: number | null;
    date: string;
    start_time: string | null;
    end_time: string | null;
    reason: string;
    type?: string;
    active: boolean;
  },
): Promise<number> {
  return db.insert(
    "blocked_times",
    {
      barber_id:
        data.barber_id,

      date:
        data.date,

      start_time:
        data.start_time,

      end_time:
        data.end_time,

      reason:
        data.reason,

      type:
        data.type ||
        (
          data.start_time === null &&
          data.end_time === null
            ? "DIA_INTEIRO"
            : "BLOCK"
        ),

      /*
       * Banco = SMALLINT
       *
       * true  -> 1
       * false -> 0
       */

      active:
        data.active ? 1 : 0,

      created_at:
        nowStamp(),
    },
  );
}

/* =========================================================
   ATUALIZAR BLOQUEIO
   ========================================================= */

export async function updateBlockedTime(
  id: number,
  data: Partial<{
    barber_id: number | null;
    date: string;
    start_time: string | null;
    end_time: string | null;
    reason: string;
    type: string;
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

  if (
    data.barber_id !==
    undefined
  ) {
    fields.push(
      "barber_id = @barberId",
    );

    params.barberId =
      data.barber_id;
  }

  if (
    data.date !==
    undefined
  ) {
    fields.push(
      "date = @date",
    );

    params.date =
      data.date;
  }

  if (
    data.start_time !==
    undefined
  ) {
    fields.push(
      "start_time = @startTime",
    );

    params.startTime =
      data.start_time;
  }

  if (
    data.end_time !==
    undefined
  ) {
    fields.push(
      "end_time = @endTime",
    );

    params.endTime =
      data.end_time;
  }

  if (
    data.reason !==
    undefined
  ) {
    fields.push(
      "reason = @reason",
    );

    params.reason =
      data.reason;
  }

  if (
    data.type !==
    undefined
  ) {
    fields.push(
      "type = @type",
    );

    params.type =
      data.type;
  }

  /*
   * active = SMALLINT
   *
   * Nunca enviar boolean diretamente.
   */

  if (
    data.active !==
    undefined
  ) {
    fields.push(
      "active = @active",
    );

    params.active =
      data.active ? 1 : 0;
  }

  if (!fields.length) {
    return;
  }

  await db.execute(
    `UPDATE ${ident(
      "blocked_times",
    )}
     SET ${fields.join(
       ", ",
     )}
     WHERE id = @id`,
    params,
  );
}

/* =========================================================
   CONFIGURAÇÕES
   ========================================================= */

/*
 * BANCO:
 *
 * settings
 *
 * id
 * key
 * value
 * updated_at
 *
 * NÃO usar:
 *
 * setting_key
 * setting_value
 */

export async function getSettings(): Promise<
  Setting[]
> {
  const rows =
    await db.query<{
      key: string;
      value: string | null;
    }>(
      `SELECT
          key,
          value
       FROM ${ident("settings")}
       ORDER BY key`,
    );

  return rows.map(
    (row) => ({
      key: String(row.key),

      value:
        row.value === null
          ? null
          : String(row.value),
    }),
  );
}

export async function getSetting(
  key: string,
): Promise<string | null> {
  const row =
    await db.first<{
      value: string | null;
    }>(
      `SELECT value
       FROM ${ident("settings")}
       WHERE key = @key`,
      {
        key,
      },
    );

  if (
    row?.value === null ||
    row?.value === undefined
  ) {
    return null;
  }

  return String(row.value);
}

export async function setSetting(
  key: string,
  value: string,
): Promise<void> {
  const existing =
    await db.first<{ id: number }>(
      `SELECT id
       FROM ${ident("settings")}
       WHERE key = @key`,
      {
        key,
      },
    );

  if (existing) {
    await db.execute(
      `UPDATE ${ident("settings")}
       SET
         value = @value,
         updated_at = @now
       WHERE id = @id`,
      {
        value,
        now: nowStamp(),
        id: Number(
          existing.id,
        ),
      },
    );

    return;
  }

  await db.insert(
    "settings",
    {
      key,
      value,
      updated_at:
        nowStamp(),
    },
  );
}

/* =========================================================
   EXCLUIR BLOQUEIO
   ========================================================= */

export async function deleteBlockedTime(
  id: number,
): Promise<void> {
  const result =
    await db.execute(
      `DELETE FROM ${ident(
        "blocked_times",
      )}
       WHERE id = @id`,
      {
        id,
      },
    );

  if (result === 0) {
    throw notFound(
      "Bloqueio não encontrado.",
    );
  }
}