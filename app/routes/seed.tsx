import { type LoaderFunctionArgs, json } from "@remix-run/cloudflare";
import { getDb } from "~/utils/db.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const db = getDb(context);
  
  const codes = [
    "ZANTAG-ALPHA-001",
    "ZANTAG-ALPHA-002",
    "ZANTAG-ALPHA-003",
  ];

  const results = [];

  for (const code of codes) {
    const inviteCode = await db.inviteCode.upsert({
      where: { code },
      update: {},
      create: {
        code,
        isUsed: false,
      },
    });
    results.push(inviteCode);
  }

  return json({
    message: "Seed successful",
    codes: results,
  });
};

export default function Seed() {
  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Database Seeding</h1>
      <p>Check the JSON response for the generated invite codes.</p>
    </div>
  );
}
