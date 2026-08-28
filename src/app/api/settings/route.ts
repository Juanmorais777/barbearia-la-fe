import { adminRoute, ok, publicRoute, readJson } from "@/lib/api/handler";
import { settingsSchema } from "@/lib/validations/schemas";
import { listSettings, updateSettings } from "@/services/schedule.service";

export const dynamic = "force-dynamic";

export async function GET() {
  return publicRoute(async () => ok({ settings: await listSettings() }));
}

export async function PUT(request: Request) {
  return adminRoute(async () => {
    const input = settingsSchema.parse(await readJson(request));
    return ok({ settings: await updateSettings(input.settings) });
  });
}
