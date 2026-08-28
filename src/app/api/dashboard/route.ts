
import { adminRoute, ok } from "@/lib/api/handler";
import { db, dialect } from "@/lib/database/connection";

export const dynamic = "force-dynamic";

export async function GET() {
  return adminRoute(async () => {
    const result = await db.query<{
      now: string;
    }>("SELECT NOW() AS now");

    return ok({
      success: true,
      database: "connected",
      dialect,
      now: result[0]?.now ?? null,
    });
  });
}

