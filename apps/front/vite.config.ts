import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode !== "production";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@ft-types": path.resolve(__dirname, "../../packages/types/src/"),
      },
    },
    build: {
      outDir: "../../dist/front",
    },
    server: {
      proxy: isDevelopment
        ? {
            "/api": {
              target: "http://localhost:3000",
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, "/api"),
            },
            "/ws": {
              target: "ws://localhost:3000",
              ws: true,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/ws/, "/ws"),
            },
          }
        : {},
    },
  };
});
