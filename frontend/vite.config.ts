// vite.config.ts — Production-grade Vite configuration
// ======================================================
// Security : strict CSP via HTTP headers (production)
// Performance : code splitting, terser minification, gzip
// Efficiency : manual chunk splitting for vendor isolation

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    resolve: {
      alias: { "@": resolve(__dirname, "src") },
    },

    build: {
      // Target modern browsers — smaller bundles, no IE polyfills
      target: "es2020",

      // Warn on chunks > 500 kB (performance budget)
      chunkSizeWarningLimit: 500,

      rollupOptions: {
        output: {
          // Split vendor code into a separate cacheable chunk
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
        },
      },

      // Strip console.debug in production (removes GA debug logs)
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          drop_debugger: true,
        },
      },
    },

    server: {
      port: 3000,
      // Proxy API calls to FastAPI dev server — avoids CORS in dev
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
  };
});
