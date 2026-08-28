import type { Metadata } from "next";
import { SHOP } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: `${SHOP.name} | Barbearia em Jatiúca, Maceió`,
  description:
    "Barbearia La Fé — cortes, barba e tratamentos na Jatiúca, Maceió/AL. Agende online, escolha seu barbeiro e horário em segundos.",
  keywords: ["barbearia", "Maceió", "Jatiúca", "corte masculino", "barba", "La Fé"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-ink text-zinc-100">{children}</body>
    </html>
  );
}
