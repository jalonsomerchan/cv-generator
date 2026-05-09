import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// Usamos rutas relativas para que el build funcione igual en dominio propio
// (https://cvgenerator.alon.one/) y en GitHub Pages bajo subcarpeta.
export default defineConfig({
  base: './',
  plugins: [svelte()],
})
