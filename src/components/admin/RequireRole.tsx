import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

type RequireRoleProps = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export default async function RequireRole({
  children,
  allowedRoles,
}: RequireRoleProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!allowedRoles.includes(session.role)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-line bg-ink-2 p-8 text-center">
          <div className="text-4xl">🔒</div>

          <h1 className="mt-4 font-display text-2xl text-white">
            Acesso não autorizado.
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Você não possui permissão para acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  return children;
}