import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target:
          process.env.VITE_API_URL?.replace("/api", "") ||
          "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
