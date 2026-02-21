import { type LoaderFunctionArgs, type ActionFunctionArgs, json } from "@remix-run/cloudflare";
import { getDb } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { UserRole } from "~/types";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const db = getDb(context);
  
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  
  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    throw new Response("Unauthorized", { status: 403 });
  }

  const organizations = await db.organization.findMany({
    include: {
      admin: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  
  return json(organizations);
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const db = getDb(context);
  
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  
  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    throw new Response("Unauthorized", { status: 403 });
  }

  if (request.method === "PATCH") {
    const { id, name, slug, adminId } = await request.json() as { id: string; name: string; slug: string; adminId?: string };
    
    try {
      const data: { name: string; slug: string; adminId?: string } = { name, slug };
      if (adminId) {
        data.adminId = adminId;
      }
      
      const updated = await db.organization.update({
        where: { id },
        data,
      });
      return json(updated);
    } catch (error) {
      return json({ error: (error as Error).message }, { status: 500 });
    }
  }

  if (request.method === "DELETE") {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing ID" }, { status: 400 });

    await db.organization.delete({ where: { id } });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};
