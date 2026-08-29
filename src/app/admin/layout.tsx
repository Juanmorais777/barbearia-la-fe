import { redirect } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Painel | Barbearia La Fé",
};

const BARBER_ALLOWED_PATHS = [
  "/admin/agendamentos",
  "/admin/calendario",
  "/admin/clientes",
  "/admin/produtos",
  "/admin/comissoes",
  "/admin/horarios",
  "/admin/bloqueios",
];

function isBarberAllowedPath(pathname: string): boolean {
  return BARBER_ALLOWED_PATHS.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(`${path}/`),
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        name={session.name}
        email={session.email}
        role={session.role}
      />

      <main className="flex-1 bg-ink px-4 py-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}