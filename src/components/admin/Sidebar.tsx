"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/hooks/useApi";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/agendamentos", label: "Agendamentos", icon: "🗓️" },
  { href: "/admin/calendario", label: "Calendário", icon: "📆" },
  { href: "/admin/clientes", label: "Clientes", icon: "👤" },
  { href: "/admin/barbeiros", label: "Profissionais", icon: "✂️" },
  { href: "/admin/servicos", label: "Serviços", icon: "💈" },
  { href: "/admin/produtos", label: "Produtos", icon: "🧴" },
  { href: "/admin/comissoes", label: "Comissões", icon: "💰" },
  { href: "/admin/financeiro", label: "Financeiro", icon: "📈" },
  { href: "/admin/horarios", label: "Horários", icon: "⏰" },
  { href: "/admin/bloqueios", label: "Bloqueios", icon: "🚫" },
  { href: "/admin/relatorios", label: "Relatórios", icon: "📑" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "⚙️" },
];

export default function Sidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-line bg-ink-2 px-4 py-3 lg:hidden">
        <Link href="/admin/dashboard" className="font-display text-lg">
          LA FÉ <span className="text-gold">ADMIN</span>
        </Link>
        <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-lg border border-line px-3 py-1 text-sm">
          {open ? "Fechar" : "Menu"}
        </button>
      </div>

      <aside
        className={`${open ? "block" : "hidden"} border-b border-line bg-ink-2 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r`}
      >
        <div className="hidden px-5 py-6 lg:block">
          <p className="font-display text-xl">
            LA FÉ <span className="text-gold">ADMIN</span>
          </p>
          <p className="mt-1 truncate text-xs text-zinc-500">{email}</p>
        </div>

        <nav className="px-3 pb-4">
          <ul className="grid gap-1">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      active ? "bg-gold/15 text-gold" : "text-zinc-300 hover:bg-ink-3 hover:text-white"
                    }`}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 border-t border-line pt-4">
            <p className="px-3 text-xs text-zinc-500">Olá, {name.split(" ")[0]}</p>
            <div className="mt-2 grid gap-1 px-1">
              <Link href="/" className="rounded-lg px-3 py-2 text-xs text-zinc-400 hover:bg-ink-3">
                Ver site
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg px-3 py-2 text-left text-xs text-rose-300 hover:bg-rose-500/10"
              >
                Sair
              </button>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
