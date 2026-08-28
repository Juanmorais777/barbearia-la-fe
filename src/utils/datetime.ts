/** Utilitários de data/hora independentes de dialeto (mssql e pg devolvem tipos diferentes). */

export function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Converte qualquer valor vindo do banco em "YYYY-MM-DD". */
export function toDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

/** Converte qualquer valor vindo do banco em "HH:MM". */
export function toTime(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  const raw = String(value);
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${pad(Number(match[1]))}:${match[2]}`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

/** Converte qualquer valor vindo do banco em "YYYY-MM-DD HH:MM". */
export function toDateTime(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return `${toDate(value)} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }
  const raw = String(value).replace("T", " ");
  return raw.slice(0, 16);
}

export function num(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function bool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value === "true" || value === "1";
  return false;
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  return hours * 60 + (minutes || 0);
}

export function fromMinutes(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 0 = Domingo ... 6 = Sábado */
export function dayOfWeek(iso: string): number {
  return new Date(`${iso}T12:00:00`).getDay();
}

export function formatBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function weekdayNamePT(iso: string): string {
  const names = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return names[dayOfWeek(iso)];
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function nowStamp(): string {
  const now = new Date();
  return `${todayISO()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
