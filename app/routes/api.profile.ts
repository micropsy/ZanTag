import { type ActionFunctionArgs, json } from "@remix-run/cloudflare";
import { getDb } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await getUser(request, context);
  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb(context);

  if (request.method === "PATCH") {
    try {
      const body = await request.json() as { 
        bio?: string; 
        primaryColor?: string; 
        secondaryColor?: string; 
        username?: string; 
        links?: Array<{ 
          id?: string; 
          title: string; 
          url: string; 
          type?: string; 
          icon?: string 
        }> 
      };
      
      const { bio, primaryColor, secondaryColor, username, links } = body;

      // Update Profile
      const updatedProfile = await db.profile.update({
        where: { userId: user.id },
        data: {
          bio,
          primaryColor,
          secondaryColor,
          username,
        },
      });

      // Update Links
      // Since links are managed in state as a list, we can use a transaction or simply delete and create.
      // However, to preserve IDs, we should upsert or update individually.
      // Given the implementation in ProfileEditor.tsx, links might be new or existing.
      
      // Simplify: Delete all existing links for this profile and create new ones
      // This is less efficient but safer for consistency if the UI sends the full list.
      // But we should check if links have IDs to update them.
      
      // Strategy:
      // 1. Get existing link IDs from DB
      // 2. Identify links to delete (in DB but not in payload)
      // 3. Identify links to update (in DB and payload)
      // 4. Identify links to create (in payload but no ID)

      // However, for simplicity and since the UI sends the full state:
      // We can iterate over the links payload.
      
      if (Array.isArray(links)) {
        for (const link of links) {
          if (link.id) {
            // Update existing
            await db.link.update({
              where: { id: link.id },
              data: {
                title: link.title,
                url: link.url,
                type: link.type || "SOCIAL",
                icon: link.icon,
              },
            }).catch(() => {}); // Ignore if not found (deleted by another process?)
          } else {
            // Create new
            await db.link.create({
              data: {
                profileId: updatedProfile.id,
                title: link.title,
                url: link.url,
                type: link.type || "SOCIAL",
                icon: link.icon,
              },
            });
          }
        }

        // Delete links that are not in the payload
        const payloadIds = links.filter(l => l.id).map(l => l.id as string);
        await db.link.deleteMany({
          where: {
            profileId: updatedProfile.id,
            id: { notIn: payloadIds },
          },
        });
      }

      return json({ success: true, profile: updatedProfile });
    } catch (error) {
      console.error("Profile update error:", error);
      return json({ error: (error as Error).message }, { status: 500 });
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};
