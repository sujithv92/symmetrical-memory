import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Base path for built assets. GitHub Pages project sites are served from
  // /<repo-name>/, so CI sets BASE_PATH=/symmetrical-memory/. Local builds
  // and root-domain hosts keep the default "/".
  base: process.env.BASE_PATH || "/",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: true,
  },
});
