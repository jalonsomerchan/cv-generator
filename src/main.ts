import { mount } from 'svelte'
import { PDFDocument } from 'pdf-lib'
import './app.css'
import App from './App.svelte'

type Html2Canvas = (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>

type Html2CanvasModule = {
  default?: Html2Canvas
}

const app = mount(App, {
  target: document.getElementById('app')!,
})

async function loadHtml2Canvas(): Promise<Html2Canvas> {
  const loadRemoteModule = new Function('url', 'return import(url)') as (
    url: string,
  ) => Promise<Html2CanvasModule | Html2Canvas>
  const module = await loadRemoteModule('https://esm.sh/html2canvas@1.4.1')
  return (typeof module === 'function' ? module : module.default) as Html2Canvas
}

function getPrintableCss() {
  return Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n')
      } catch {
        return ''
      }
    })
    .join('\n')
}

function safeFilename() {
  const value = document.querySelector<HTMLInputElement>('.cv-name')?.value || 'cv'
  return (
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'cv'
  )
}

function prepareCvCloneForPdf(source: HTMLElement) {
  const clone = source.cloneNode(true) as HTMLElement
  clone.classList.add('pdf-capture-export')

  clone.querySelectorAll('.mini-actions, .item-actions, .photo-actions, .empty-only').forEach((node) => node.remove())

  clone.querySelectorAll('input, textarea').forEach((node) => {
    const control = node as HTMLInputElement | HTMLTextAreaElement
    const value = control.value.trim()
    const replacement = document.createElement(control.tagName.toLowerCase() === 'textarea' ? 'div' : 'span')
    replacement.className = `${control.className} printed-field`
    replacement.textContent = value

    if (!value) {
      replacement.dataset.empty = 'true'
    }

    control.replaceWith(replacement)
  })

  clone.querySelectorAll('[data-empty="true"]').forEach((node) => {
    const listItem = node.closest('li')
    if (listItem) listItem.remove()
    else node.remove()
  })

  clone.querySelectorAll('.cv-item').forEach((node) => {
    if (!node.textContent?.trim()) node.remove()
  })

  clone.querySelectorAll('.cv-section').forEach((node) => {
    if (!node.querySelector('.cv-item')) node.remove()
  })

  const summary = clone.querySelector('.cv-summary')
  if (summary && !summary.textContent?.replace('Perfil', '').trim()) {
    summary.remove()
  }

  return clone
}

async function createPdfFromVisibleCv() {
  const source = document.querySelector<HTMLElement>('.cv-page')
  if (!source) throw new Error('No se ha encontrado el CV visible')

  const html2canvas = await loadHtml2Canvas()
  const clone = prepareCvCloneForPdf(source)
  const wrapper = document.createElement('div')
  const style = document.createElement('style')

  style.textContent = `${getPrintableCss()}
    .pdf-capture-root {
      position: fixed;
      left: -100000px;
      top: 0;
      width: ${source.scrollWidth}px;
      background: #ffffff;
      pointer-events: none;
      z-index: -1;
    }
    .pdf-capture-export {
      width: ${source.scrollWidth}px !important;
      min-height: ${source.scrollHeight}px !important;
      margin: 0 !important;
      box-shadow: none !important;
      transform: none !important;
    }
    .printed-field {
      display: inline-block !important;
      min-height: 0 !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
      color: inherit !important;
      white-space: pre-wrap !important;
      overflow: visible !important;
    }
    .printed-field.cv-textarea,
    .printed-field.item-description {
      display: block !important;
      width: 100% !important;
    }
    .mini-actions, .item-actions, .photo-actions { display: none !important; }
  `

  wrapper.className = 'pdf-capture-root'
  wrapper.append(style, clone)
  document.body.append(wrapper)

  try {
    const canvas = await html2canvas(clone, {
      backgroundColor: null,
      scale: Math.min(window.devicePixelRatio || 2, 2),
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: source.scrollWidth,
      windowHeight: source.scrollHeight,
    })

    const pdfDoc = await PDFDocument.create()
    const pageWidth = 595.28
    const pageHeight = 841.89
    const scale = pageWidth / canvas.width
    const sliceHeight = Math.floor(pageHeight / scale)

    for (let y = 0; y < canvas.height; y += sliceHeight) {
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = Math.min(sliceHeight, canvas.height - y)
      const ctx = pageCanvas.getContext('2d')
      if (!ctx) throw new Error('No se pudo crear el canvas del PDF')
      ctx.drawImage(canvas, 0, y, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height)

      const png = await pdfDoc.embedPng(pageCanvas.toDataURL('image/png'))
      const page = pdfDoc.addPage([pageWidth, pageHeight])
      const imageHeight = pageCanvas.height * scale
      page.drawImage(png, {
        x: 0,
        y: pageHeight - imageHeight,
        width: pageWidth,
        height: imageHeight,
      })
    }

    const bytes = await pdfDoc.save()
    const pdfBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    return new Blob([pdfBuffer], { type: 'application/pdf' })
  } finally {
    wrapper.remove()
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

async function handlePdfClick(event: Event) {
  const button = (event.target as HTMLElement).closest('button')
  if (!button) return

  const label = button.textContent?.toLowerCase().trim() || ''
  const isPdfAction = label.includes('preview pdf') || label.includes('previsualizar pdf') || label.includes('descargar pdf')

  if (!isPdfAction) return

  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()

  button.setAttribute('disabled', 'true')
  const previousText = button.textContent || ''
  button.textContent = 'Generando PDF...'

  try {
    const blob = await createPdfFromVisibleCv()
    downloadBlob(blob, `${safeFilename()}.pdf`)
  } catch (error) {
    console.error(error)
    alert('No se pudo generar el PDF. Prueba con una imagen más ligera o recarga la página.')
  } finally {
    button.removeAttribute('disabled')
    button.textContent = previousText
  }
}

document.addEventListener('click', handlePdfClick, true)

export default app
