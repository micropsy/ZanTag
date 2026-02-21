import { type ActionFunctionArgs, json } from "@remix-run/cloudflare";
import { getDb } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";
import { UserRole } from "~/types";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await getUser(request, context);
  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return json({ error: "Unauthorized" }, { status: 403 });
  }

  const db = getDb(context);
  const { id, name, email, role } = await request.json() as { id: string; name?: string; email?: string; role?: string };

  if (!id) {
    return json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
      },
    });
    return json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("User update error:", error);
    return json({ error: (error as Error).message }, { status: 500 });
  }
};
