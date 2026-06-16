import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }
          if (id.includes('recharts')) {
            return 'vendor-recharts';
          }
          if (id.includes('lucide-react')) {
            return 'vendor-lucide';
          }
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-react-query';
          }
          if (id.includes('framer-motion')) {
            return 'vendor-framer-motion';
          }
          if (id.includes('react-dom')) {
            return 'vendor-react-dom';
          }
          if (id.includes('react')) {
            return 'vendor-react';
          }
          if (id.includes('@radix-ui')) {
            return 'vendor-radix';
          }
          if (id.includes('sonner')) {
            return 'vendor-sonner';
          }
          return 'vendor';
        },
      },
    },
  },
});
