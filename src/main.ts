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
      border-radius: 0 !important;
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

function injectCvEnhancements() {
  const style = document.createElement('style')
  style.textContent = `
    .cv-section[draggable="true"] { position: relative; cursor: grab; }
    .cv-section[draggable="true"] .section-toolbar::before {
      content: '⋮⋮';
      display: inline-grid;
      place-items: center;
      width: 1.9rem;
      height: 1.9rem;
      margin-right: .35rem;
      border-radius: .55rem;
      background: color-mix(in srgb, var(--cv-accent) 10%, transparent);
      color: var(--cv-accent);
      font-weight: 900;
      letter-spacing: -.18em;
      cursor: grab;
    }
    .cv-section.is-dragging { opacity: .52; outline: 2px dashed var(--cv-accent); outline-offset: .4rem; }
    .cv-section.drop-before { box-shadow: 0 -5px 0 var(--cv-accent); }
    .cv-section.drop-after { box-shadow: 0 5px 0 var(--cv-accent); }
    .cv-section.drag-armed { transition: transform .16s ease, box-shadow .16s ease, background-color .16s ease; }
    .cv-section.drag-armed:hover { transform: translateY(-1px); }

    .theme-option { position: relative; overflow: hidden; }
    .theme-option::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: .35rem;
      background: linear-gradient(180deg, var(--color-primary), var(--color-secondary));
      opacity: .45;
    }
    .theme-option.active::before { opacity: 1; }

    .cv-page { overflow: hidden; transition: background .2s ease, box-shadow .2s ease, border-color .2s ease; }
    .cv-header { position: relative; }
    .cv-input, .cv-textarea { transition: border-color .14s ease, background-color .14s ease, box-shadow .14s ease; }

    .cv-aurora {
      --cv-accent: #2563eb;
      --cv-accent-2: #9333ea;
      --cv-line: #bfdbfe;
      background:
        radial-gradient(circle at 0% 0%, rgba(37, 99, 235, .18), transparent 18rem),
        radial-gradient(circle at 92% 0%, rgba(147, 51, 234, .13), transparent 16rem),
        #ffffff;
      border-top: 0;
    }
    .cv-aurora .cv-header {
      margin: -1.25rem -1.25rem 1.5rem;
      padding: clamp(1.25rem, 4vw, 2rem);
      border: 0;
      border-radius: 1.4rem;
      background: linear-gradient(135deg, rgba(37, 99, 235, .12), rgba(147, 51, 234, .08));
    }
    .cv-aurora .section-title { background: linear-gradient(90deg, var(--cv-accent), var(--cv-accent-2)); -webkit-background-clip: text; color: transparent; }

    .cv-ejecutivo {
      --cv-accent: #111827;
      --cv-line: #111827;
      border: 2px solid #111827;
      box-shadow: 12px 12px 0 #e5e7eb;
      background: #fff;
    }
    .cv-ejecutivo .cv-name { color: #111827; letter-spacing: -.035em; }
    .cv-ejecutivo .cv-contact li { border: 1px solid #111827; background: #fff; }
    .cv-ejecutivo .section-title { letter-spacing: .14em; }
    .cv-ejecutivo .cv-item { border-left: 3px solid #111827; border-radius: 0; }

    .cv-minimal {
      --cv-accent: #0f172a;
      --cv-line: #e5e7eb;
      padding: clamp(2.25rem, 6vw, 5rem);
      border: 1px solid #f1f5f9;
      background: #fff;
    }
    .cv-minimal .cv-header { grid-template-columns: 1fr; gap: .8rem; border-bottom: 1px solid #e5e7eb; }
    .cv-minimal .cv-photo { width: 5rem; height: 5rem; border-radius: 999px; border-width: 2px; }
    .cv-minimal .cv-name { font-weight: 700; letter-spacing: -.045em; }
    .cv-minimal .cv-section { margin-top: 2.2rem; }
    .cv-minimal .cv-item { padding-left: 0; padding-right: 0; }

    .cv-sidebar {
      --cv-accent: #0f766e;
      --cv-accent-2: #14b8a6;
      --cv-line: #99f6e4;
      grid-template-columns: minmax(13rem, 17rem) minmax(0, 1fr);
      gap: 2rem;
      background: linear-gradient(90deg, #ccfbf1 0 18.5rem, #ffffff 18.5rem);
    }
    .cv-sidebar .cv-header {
      position: sticky;
      top: 1rem;
      padding: 1.25rem;
      border-radius: 1.3rem;
      background: rgba(255, 255, 255, .62);
      box-shadow: inset 0 0 0 1px rgba(15, 118, 110, .13);
    }
    .cv-sidebar .cv-photo { width: 9rem; height: 9rem; border-radius: 2rem; }
    .cv-sidebar .cv-contact { display: grid; }
    .cv-sidebar .cv-contact li { background: rgba(255,255,255,.72); border: 1px solid rgba(15,118,110,.18); }

    .cv-editorial {
      --cv-accent: #be123c;
      --cv-accent-2: #f97316;
      --cv-line: #fecdd3;
      background:
        linear-gradient(90deg, #be123c 0 .85rem, transparent .85rem),
        linear-gradient(180deg, #fff7ed 0, #fff 22rem);
      border-left: 0;
      font-family: Georgia, 'Times New Roman', serif;
    }
    .cv-editorial .cv-header { border-bottom: 1px solid #be123c; }
    .cv-editorial .cv-name { font-weight: 700; color: #9f1239; }
    .cv-editorial .section-title { color: #9f1239; font-style: italic; text-transform: none; letter-spacing: 0; font-size: 1.35rem; }
    .cv-editorial .cv-item { background: rgba(255, 241, 242, .55); }

    .cv-tech {
      --cv-accent: #38bdf8;
      --cv-accent-2: #a78bfa;
      --cv-line: #334155;
      background:
        radial-gradient(circle at 12% 0%, rgba(56, 189, 248, .18), transparent 18rem),
        radial-gradient(circle at 100% 10%, rgba(167, 139, 250, .15), transparent 20rem),
        #0f172a;
      border-color: #334155;
      box-shadow: 0 28px 70px rgba(2, 6, 23, .35);
    }
    .cv-tech .cv-header { padding: 1.2rem; border: 1px solid #334155; border-radius: 1.3rem; background: rgba(15, 23, 42, .72); }
    .cv-tech .cv-name { color: #7dd3fc; text-shadow: 0 0 22px rgba(56,189,248,.26); }
    .cv-tech .section-title { color: #7dd3fc; }
    .cv-tech .cv-item { background: rgba(30, 41, 59, .42); border: 1px solid rgba(148, 163, 184, .14); }
    .cv-tech .cv-contact li { border: 1px solid rgba(148, 163, 184, .18); }

    .pdf-capture-export .cv-input,
    .pdf-capture-export .cv-textarea,
    .printed-field { font-synthesis: none; }
  `
  document.head.append(style)
}

function enhanceSectionDragAndDrop() {
  let draggedIndex = -1
  let desiredIndex = -1

  const sections = () => Array.from(document.querySelectorAll<HTMLElement>('.cv-page > .cv-section'))

  const markSections = () => {
    sections().forEach((section, index) => {
      section.draggable = true
      section.dataset.dndIndex = String(index)
      section.classList.add('drag-armed')
      section.setAttribute('title', 'Arrastra para reordenar este apartado')
    })
  }

  const clearDropState = () => {
    sections().forEach((section) => section.classList.remove('drop-before', 'drop-after', 'is-dragging'))
  }

  const clickMoveButton = (section: HTMLElement, direction: 'up' | 'down') => {
    const buttons = Array.from(section.querySelectorAll<HTMLButtonElement>('.mini-actions button'))
    const button = direction === 'up' ? buttons[0] : buttons[1]
    if (button && !button.disabled) button.click()
  }

  const moveByClicks = (from: number, to: number) => {
    const step = from < to ? 1 : -1
    let remaining = Math.abs(to - from)

    const run = () => {
      const currentSections = sections()
      const current = currentSections[Math.min(from, currentSections.length - 1)]
      if (!current || remaining <= 0) {
        markSections()
        return
      }

      clickMoveButton(current, step > 0 ? 'down' : 'up')
      from += step
      remaining -= 1
      window.setTimeout(run, 35)
    }

    run()
  }

  document.addEventListener('pointerdown', () => markSections(), true)
  document.addEventListener('focusin', () => markSections(), true)

  document.addEventListener('dragstart', (event) => {
    const target = event.target as HTMLElement
    if (target.closest('input, textarea, button, a')) {
      event.preventDefault()
      return
    }

    const section = target.closest<HTMLElement>('.cv-section')
    if (!section) return

    markSections()
    draggedIndex = Number(section.dataset.dndIndex || -1)
    desiredIndex = draggedIndex
    section.classList.add('is-dragging')
    event.dataTransfer?.setData('text/plain', String(draggedIndex))
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  })

  document.addEventListener('dragover', (event) => {
    const target = event.target as HTMLElement
    const section = target.closest<HTMLElement>('.cv-section')
    if (!section || draggedIndex < 0) return

    event.preventDefault()
    const rect = section.getBoundingClientRect()
    const isAfter = event.clientY > rect.top + rect.height / 2
    const targetIndex = Number(section.dataset.dndIndex || 0)
    desiredIndex = targetIndex + (isAfter ? 1 : 0)
    if (desiredIndex > draggedIndex) desiredIndex -= 1

    clearDropState()
    section.classList.add(isAfter ? 'drop-after' : 'drop-before')
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  })

  document.addEventListener('drop', (event) => {
    if (draggedIndex < 0) return
    event.preventDefault()
    const maxIndex = sections().length - 1
    const targetIndex = Math.max(0, Math.min(desiredIndex, maxIndex))
    clearDropState()
    if (targetIndex !== draggedIndex) moveByClicks(draggedIndex, targetIndex)
    draggedIndex = -1
    desiredIndex = -1
  })

  document.addEventListener('dragend', () => {
    clearDropState()
    draggedIndex = -1
    desiredIndex = -1
    window.setTimeout(markSections, 50)
  })

  markSections()
}

injectCvEnhancements()
enhanceSectionDragAndDrop()

export default app
