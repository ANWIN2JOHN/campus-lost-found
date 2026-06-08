import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Build-time check for Vercel deployment environment
if (process.env.VERCEL !== '1') {
  console.error("\n❌ Vercel execution hardening: Frontend build/dev is only allowed in the Vercel deployment environment.\n");
  process.exit(1);
}

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  define: {
    'import.meta.env.VITE_VERCEL': JSON.stringify(process.env.VERCEL || ''),
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
