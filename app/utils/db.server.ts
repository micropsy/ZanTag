import { type AppLoadContext } from "@remix-run/cloudflare";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

export const getDb = (context: AppLoadContext) => {
  if (!context.cloudflare || !context.cloudflare.env) {
    // In dev mode without cloudflare proxy, or if context is missing
    throw new Error("Cloudflare context or environment variables are missing. Ensure you are running with 'wrangler pages dev' or have 'remixCloudflareDevProxy' configured.");
  }
  
  const env = context.cloudflare.env;
  
  if (!env.DB) {
    throw new Error("DB binding is missing in environment variables.");
  }
  const adapter = new PrismaD1(env.DB);
  return new PrismaClient({ adapter });
};