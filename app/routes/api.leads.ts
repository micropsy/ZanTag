import { type ActionFunctionArgs, json } from "@remix-run/cloudflare";
import { getDb } from "~/utils/db.server";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const db = getDb(context);
    const body = await request.json() as { profileId: string; name: string; email?: string; phone?: string; notes?: string; source?: string };
    const { profileId, name, email, phone, notes, source } = body;

    if (!profileId || !name) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    const contact = await db.contact.create({
      data: {
        profileId,
        name,
        email,
        phone,
        notes,
        source: source || "FORM",
      },
    });

    return json({ success: true, contact });
  } catch (error) {
    console.error("Lead submission error:", error);
    return json({ error: (error as Error).message }, { status: 500 });
  }
};
