import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: (info) => {
          const name = info.name || (info.names && info.names[0]) || 'asset'
          if (name.endsWith('.css')) return 'app.css'
          if (/\.(woff2?|ttf|otf|eot)$/i.test(name)) return 'fonts/[name][extname]'
          return 'assets/[name][extname]'
        },
      },
    },
  },
  server: { port: 5173, open: true },
})
