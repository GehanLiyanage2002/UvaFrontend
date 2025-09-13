import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // You can add alias here if needed
  },
  build: {
    outDir: "dist", // ✅ Ensure build output goes to "dist"
    emptyOutDir: true,
  },
});
