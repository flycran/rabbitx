import webExtension from '@samrum/vite-plugin-web-extension'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import { getManifest } from './src/manifest'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      webExtension({
        manifest: getManifest(Number(env.MANIFEST_VERSION)),
        additionalInputs: {
          scripts: ['src/entries/devtools/devtools.ts'],
          html: ['src/entries/devtools/index.html'],
        },
      }),
    ],
    server: {
      port: 12002,
    },
    optimizeDeps: {
      exclude: ['chrome-exten-communication'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
