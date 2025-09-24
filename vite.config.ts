import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "./", // ✅ ensures relative paths, important for Azure App Service
  resolve: {
    // add aliases if needed
  },
  build: {
    outDir: "dist", // ✅ matches your setup
    emptyOutDir: true,
  },
});
