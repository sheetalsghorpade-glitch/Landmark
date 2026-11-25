import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
  build: mode === 'single' ? { outDir: 'dist-single' } : {},
}))
