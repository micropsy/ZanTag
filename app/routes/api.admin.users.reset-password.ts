import { type ActionFunctionArgs, json } from "@remix-run/cloudflare";
import { getDb } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";
import { UserRole } from "~/types";
import { hash } from "bcrypt-ts";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await getUser(request, context);
  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return json({ error: "Unauthorized" }, { status: 403 });
  }

  const db = getDb(context);
  const { id } = await request.json() as { id: string };

  if (!id) {
    return json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const hashedPassword = await hash("password123", 10);
    await db.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });
    return json({ success: true, message: "Password reset to 'password123'" });
  } catch (error) {
    console.error("Password reset error:", error);
    return json({ error: (error as Error).message }, { status: 500 });
  }
};
