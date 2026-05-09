import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// GitHub Pages publica este repositorio bajo /cv-generator/.
// En desarrollo local mantenemos base relativa a raíz para que Vite funcione como siempre.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/cv-generator/' : '/',
  plugins: [svelte()],
}))
