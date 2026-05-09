import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

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

function prepareCvCloneForPrint(source: HTMLElement) {
  const clone = source.cloneNode(true) as HTMLElement
  clone.classList.add('print-export')

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
    const hasItems = node.querySelector('.cv-item')
    if (!hasItems) node.remove()
  })

  const summary = clone.querySelector('.cv-summary')
  if (summary && !summary.textContent?.replace('Perfil', '').trim()) {
    summary.remove()
  }

  return clone
}

function openNativePdfPreview() {
  const cvPage = document.querySelector<HTMLElement>('.cv-page')
  if (!cvPage) return

  const printableCv = prepareCvCloneForPrint(cvPage)
  const css = getPrintableCss()
  const printCss = `
    @page { size: A4; margin: 0; }
    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .print-export {
      width: 210mm !important;
      min-height: 297mm !important;
      margin: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
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
    }
    .printed-field.cv-textarea,
    .printed-field.item-description {
      display: block !important;
      width: 100% !important;
    }
    .site-header, .hero-section, .control-panel, .workspace-toolbar, .modal-backdrop,
    .mini-actions, .item-actions, .photo-actions { display: none !important; }
  `

  const iframe = document.createElement('iframe')
  iframe.title = 'Vista previa de impresión del CV'
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.append(iframe)

  const doc = iframe.contentDocument
  if (!doc) return

  doc.open()
  doc.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>CV</title><style>${css}\n${printCss}</style></head><body>${printableCv.outerHTML}</body></html>`)
  doc.close()

  const runPrint = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => iframe.remove(), 1200)
  }

  const images = Array.from(doc.images)
  if (!images.length) {
    setTimeout(runPrint, 80)
    return
  }

  let pending = images.length
  const done = () => {
    pending -= 1
    if (pending <= 0) setTimeout(runPrint, 80)
  }

  images.forEach((image) => {
    if (image.complete) done()
    else {
      image.addEventListener('load', done, { once: true })
      image.addEventListener('error', done, { once: true })
    }
  })
}

document.addEventListener(
  'click',
  (event) => {
    const button = (event.target as HTMLElement).closest('button')
    if (!button) return

    const label = button.textContent?.toLowerCase().trim() || ''
    const isPdfAction = label.includes('preview pdf') || label.includes('previsualizar pdf') || label.includes('descargar pdf')

    if (!isPdfAction) return

    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    openNativePdfPreview()
  },
  true,
)

export default app
