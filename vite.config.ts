import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    nodePolyfills({
      include: ["crypto", "stream", "events", "buffer", "path", "process", "util", "string_decoder"],
      globals: { Buffer: true, global: true, process: true },
    }),
    remixCloudflareDevProxy(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
        v3_singleFetch: true,
      },
    }),
    tsconfigPaths(),
  ],
  ssr: {
    external: ["node:crypto", "node:stream", "node:events", "node:path", "node:buffer", "node:util", "node:string_decoder", "node:process"],
    noExternal: ["googleapis", "google-auth-library", "gaxios", "gtoken", "gcp-metadata"],
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (warning.code === 'EMPTY_BUNDLE') return;
        defaultHandler(warning);
      },
    },
  },
});
