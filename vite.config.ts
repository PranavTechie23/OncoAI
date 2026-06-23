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
          if (!id.includes('node_modules')) return;
          try {
            const parts = id.split('node_modules/')[1].split('/');
            let pkg = parts[0];
            if (pkg && pkg.startsWith('@')) pkg = parts.slice(0, 2).join('/');
            // sanitize package name for filename
            const name = pkg.replace('@', '').replace('/', '-');
            return `vendor-${name}`;
          } catch (e) {
            return 'vendor';
          }
        },
      },
    },
  },
});
