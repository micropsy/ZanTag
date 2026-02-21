import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "../build/server";

// @ts-ignore - the build file is generated at runtime
export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext: ({ context }) => {
    return {
      cloudflare: {
        env: context.env,
        cf: (context.request as any).cf || {},
        ctx: {
          waitUntil: context.waitUntil,
          passThroughOnException: () => {},
        },
      },
    };
  },
});
