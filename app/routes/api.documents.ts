import { type ActionFunctionArgs, json } from "@remix-run/cloudflare";
import { getDb } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await getUser(request, context);
  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb(context);

  if (request.method === "POST") {
    const body = await request.json() as { title: string; url: string; profileId: string };
    const { title, url, profileId } = body;

    // Verify ownership
    // The user must own the profile OR be a SUPER_ADMIN
    const profile = await db.profile.findUnique({ where: { id: profileId } });
    
    if (!profile) {
        return json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.userId !== user.id && user.role !== "SUPER_ADMIN") {
        return json({ error: "Unauthorized" }, { status: 403 });
    }

    const doc = await db.document.create({
      data: {
        profileId,
        title,
        url,
      },
    });
    return json(doc);
  }

  if (request.method === "DELETE") {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing ID" }, { status: 400 });

    const doc = await db.document.findUnique({ where: { id } });
    if (!doc) return json({ error: "Not found" }, { status: 404 });

    const profile = await db.profile.findUnique({ where: { id: doc.profileId } });
    
    if (!profile) {
        // Orphaned document? Should still allow delete if admin or owner (if we knew owner)
        // If profile is gone, maybe we can just delete.
        // But for safety, check user role.
        if (user.role !== "SUPER_ADMIN") {
             return json({ error: "Unauthorized" }, { status: 403 });
        }
    } else {
        if (profile.userId !== user.id && user.role !== "SUPER_ADMIN") {
             return json({ error: "Unauthorized" }, { status: 403 });
        }
    }

    await db.document.delete({ where: { id } });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};
