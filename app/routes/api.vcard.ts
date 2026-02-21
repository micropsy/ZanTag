import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getDb } from "~/utils/db.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const db = getDb(context);
  const profile = await db.profile.findUnique({
    where: { username: slug },
    include: { links: true, user: true },
  });

  if (!profile) {
    return new Response("Profile not found", { status: 404 });
  }

  // Generate vCard
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${profile.displayName || profile.username}`,
    `N:${profile.displayName || profile.username};;;;`,
    profile.bio ? `NOTE:${profile.bio}` : "",
    ...profile.links
      .filter((l) => l.type === "PHONE")
      .map((l) => `TEL;TYPE=CELL:${l.url.replace("tel:", "")}`),
    ...profile.links
      .filter((l) => l.type === "EMAIL")
      .map((l) => `EMAIL;TYPE=WORK:${l.url.replace("mailto:", "")}`),
    ...profile.links
      .filter((l) => l.type === "WEBSITE" || l.type === "SOCIAL")
      .map((l) => `URL:${l.url}`),
    "END:VCARD"
  ].filter(Boolean).join("\n");

  return new Response(vcard, {
    headers: {
      "Content-Type": "text/vcard",
      "Content-Disposition": `attachment; filename="${slug}.vcf"`,
    },
  });
};
