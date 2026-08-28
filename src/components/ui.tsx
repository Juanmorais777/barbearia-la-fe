import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function SectionTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
      ) : null}
      <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-2 max-w-2xl text-sm text-zinc-400">{subtitle}</p> : null}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="font-display mt-1 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${className}`}>
      {children}
    </span>
  );
}

export function Empty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-ink-2/60 p-8 text-center">
      <p className="font-display text-lg text-zinc-200">{title}</p>
      {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
    </div>
  );
}

export function Loading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 p-6 text-sm text-zinc-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      {label}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{message}</div>
  );
}

export function SuccessBox({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
      <p>{message}</p>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-ink-3 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-gold/70";

export const labelClass = "mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-400";

export const btnPrimary =
  "btn-gold rounded-full px-5 py-2.5 text-xs uppercase tracking-[0.14em] transition disabled:cursor-not-allowed";

export const btnGhost =
  "rounded-full border border-line px-4 py-2 text-xs uppercase tracking-[0.14em] text-zinc-300 transition hover:border-gold/60 hover:text-white disabled:opacity-50";

export function LinkButton({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`btn-gold inline-block rounded-full px-6 py-3 text-xs uppercase tracking-[0.16em] ${className}`}>
      {children}
    </Link>
  );
}
