import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the built site works at a domain root (Vercel/Netlify)
  // AND inside a sub-folder on shared hosting (e.g. Hostinger public_html/birthday/).
  base: './',
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    strictPort: Boolean(process.env.PORT),
    open: false,
    allowedHosts: true,
    cors: true,
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    allowedHosts: true,
    cors: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2019',
  },
});
