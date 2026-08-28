import { redirect } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Painel | Barbearia La Fé" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar name={session.name} email={session.email} />
      <main className="flex-1 bg-ink px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}
