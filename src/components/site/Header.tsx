"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SHOP } from "@/lib/constants";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/servicos", label: "Serviços" },
  { href: "/profissionais", label: "Profissionais" },
  { href: "/produtos", label: "Produtos" },
  { href: "/avaliacoes", label: "Avaliações" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 font-display text-lg font-bold text-gold">
            LF
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold tracking-wide">
              BARBEARIA <span className="gold-text">LA FÉ</span>
            </span>
            <span className="block text-[10px] uppercase tracking-[0.25em] text-zinc-500">Jatiúca · Maceió</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-2 text-sm transition ${
                  active ? "bg-ink-3 text-gold" : "text-zinc-300 hover:bg-ink-3 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/agendamento"
            className="btn-gold hidden rounded-full px-5 py-2 text-xs uppercase sm:inline-block"
          >
            Agendar agora
          </Link>
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg border border-line p-2 text-zinc-300 lg:hidden"
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-line bg-ink-2 px-4 py-3 lg:hidden">
          <ul className="grid gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-ink-3"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/agendamento"
            onClick={() => setOpen(false)}
            className="btn-gold mt-3 block rounded-full px-4 py-2 text-center text-xs uppercase"
          >
            Agendar agora
          </Link>
        </nav>
      ) : null}
    </header>
  );
}

export function ShopFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-ink-2">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl font-semibold">
            BARBEARIA <span className="gold-text">LA FÉ</span>
          </p>
          <p className="mt-2 text-sm text-zinc-400">{SHOP.tagline}</p>
          <p className="mt-3 text-sm text-zinc-500">⭐ {SHOP.rating.toFixed(1)} de avaliação</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Endereço</p>
          <p className="mt-2 text-sm text-zinc-300">{SHOP.address}</p>
          <p className="text-sm text-zinc-300">{SHOP.city}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Contato</p>
          <p className="mt-2 text-sm text-zinc-300">{SHOP.phone}</p>
          <a className="block text-sm text-zinc-300 hover:text-gold" href={`https://wa.me/${SHOP.whatsapp}`}>
            WhatsApp
          </a>
          <a className="block text-sm text-zinc-300 hover:text-gold" href={SHOP.instagramUrl} target="_blank" rel="noreferrer">
            @{SHOP.instagram}
          </a>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Funcionamento</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            <li>Segunda: 09:00 - 21:00</li>
            <li>Terça a Sábado: 09:00 - 17:00</li>
            <li className="text-zinc-500">Domingo: fechado</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} {SHOP.name} — Todos os direitos reservados ·{" "}
        <Link href="/login" className="hover:text-gold">
          Área administrativa
        </Link>
      </div>
    </footer>
  );
}
