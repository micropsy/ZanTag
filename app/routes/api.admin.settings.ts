import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from "@remix-run/cloudflare";
import { getDb } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";
import { UserRole } from "~/types";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const user = await getUser(request, context);
  // Allow any authenticated user to read settings? 
  // Maybe just return default if not admin, but let's stick to admin only for this route as requested by SystemConfig component logic.
  if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // If not admin, maybe return false? 
  // SystemConfig component handles UI visibility based on role.
  // But let's allow fetching so the component doesn't error out for non-admins if it tries to fetch.
  // Actually, SystemConfig component only fetches if user is SUPER_ADMIN.
  
  if (user.role !== UserRole.SUPER_ADMIN) {
    return json({ invitationOnly: false }); // Default for non-admins
  }

  const db = getDb(context);
  // We need to cast db as any or ensure types are updated because we just added SystemSetting
  const setting = await (db as unknown as { systemSetting: { findUnique: (args: { where: { key: string } }) => Promise<{ value: string } | null> } }).systemSetting.findUnique({
    where: { key: "invitationOnly" },
  });

  return json({ invitationOnly: setting?.value === "true" });
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await getUser(request, context);
  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return json({ error: "Unauthorized" }, { status: 403 });
  }

  const db = getDb(context);
  const { invitationOnly } = await request.json() as { invitationOnly: boolean };

  try {
    await (db as unknown as { systemSetting: { upsert: (args: { where: { key: string }, update: { value: string }, create: { key: string, value: string } }) => Promise<void> } }).systemSetting.upsert({
      where: { key: "invitationOnly" },
      update: { value: String(invitationOnly) },
      create: { key: "invitationOnly", value: String(invitationOnly) },
    });
    return json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return json({ error: (error as Error).message }, { status: 500 });
  }
};
