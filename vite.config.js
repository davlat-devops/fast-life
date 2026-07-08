import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        // @supabase/supabase-js unconditionally pulls in its websocket-based
        // realtime client (~330KB) even though this app never calls
        // .channel()/.on() — only auth + postgrest. Give it a stable chunk
        // name so it can be excluded from modulePreload below instead of
        // silently riding along in whatever chunk happens to import it.
        manualChunks(id) {
          if (id.includes('@supabase/realtime-js')) return 'supabase-realtime'
        },
      },
    },
    modulePreload: {
      // Without this, Vite tags the realtime chunk with <link rel=modulepreload>
      // on every route (including the login page), forcing the browser to
      // fetch+parse it at high priority in parallel with the hero image and
      // fonts — pure bandwidth/CPU contention on mobile for code that isn't
      // needed to render or use the login/dashboard screens.
      resolveDependencies: (filename, deps) => deps.filter((dep) => !dep.includes('supabase-realtime')),
    },
  },
})
