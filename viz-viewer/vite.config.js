import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true,
    fs: {
      // Allow serving files from the entire repo (one level up from viz-viewer/)
      allow: [path.resolve(__dirname, "..")],
    },
  },
});
