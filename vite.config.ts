//==========================
// Título : Config Vite — React SWC, alias @, chunks de vendor pesados
//==========================

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true
  },
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // vendors pesados (sem puxar React duplicado)
          if (id.includes('jspdf')) return 'vendor-jspdf';
          if (id.includes('xlsx')) return 'vendor-xlsx';
          if (id.includes('html2canvas')) return 'vendor-canvas';
          if (id.includes('d3') || id.includes('d3-cloud')) return 'vendor-d3';
          if (id.includes('recharts')) return 'vendor-recharts';
        },
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "react-router-dom",
      "@supabase/supabase-js",
    ],
    exclude: [],
    dedupe: [
      "react",
      "react-dom",
    ],
  },

}));
