import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Map convex imports to the root-level convex/ directory
      // Files import as "../../convex/..." or "../../../convex/..." 
      // but convex/ lives outside the frontend/ folder
      "../../convex": path.resolve(__dirname, "../convex"),
      "../../../convex": path.resolve(__dirname, "../convex"),
    },
  },
});
