import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

// Chrome/Edge pueden fallar al cargar SVGs grandes como data URL cuando
// incluyen CSS + HTML en foreignObject. El generador de PDF usa esa técnica
// para capturar el CV; convertir esos data URL a Blob URL evita el error
// `Uncaught (in promise) Event { type: "error", target: img }`.
const nativeImageSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')

if (nativeImageSrc?.set && nativeImageSrc.get) {
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    enumerable: nativeImageSrc.enumerable,
    get: nativeImageSrc.get,
    set(value: string) {
      if (typeof value === 'string' && value.startsWith('data:image/svg+xml')) {
        const [, rawSvg = ''] = value.split(',', 2)
        const svg = value.includes(';base64,') ? atob(rawSvg) : decodeURIComponent(rawSvg)
        const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
        this.addEventListener('load', () => URL.revokeObjectURL(blobUrl), { once: true })
        this.addEventListener('error', () => URL.revokeObjectURL(blobUrl), { once: true })
        nativeImageSrc.set?.call(this, blobUrl)
        return
      }

      nativeImageSrc.set?.call(this, value)
    },
  })
}

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
