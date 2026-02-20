import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
}

export const getDb = (env: Env) => {
  const adapter = new PrismaD1(env.DB);
  return new PrismaClient({ adapter });
};