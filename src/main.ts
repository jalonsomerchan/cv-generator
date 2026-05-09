import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

function injectCvEnhancements() {
  const style = document.createElement('style')
  style.textContent = `
    /* PDF-first editor preview
       The PDF renderer paints an A4 canvas of 1240x1754 with 82px margins.
       The editor mirrors that geometry at 50% scale: 620x877 with 41px margins.
       Keep these numbers in sync with renderPdfPages() in App.svelte. */
    .cv-page {
      --pdf-scale: .5;
      --pdf-page-w: 620px;
      --pdf-page-h: 877px;
      --pdf-margin: 41px;
      --pdf-photo: 80px;
      --pdf-photo-gap: 95px;
      --pdf-sidebar: 165px;
      --pdf-sidebar-total: 189px;
      --pdf-content-x: 41px;
      --pdf-content-w: 538px;
      width: min(100%, var(--pdf-page-w)) !important;
      min-height: var(--pdf-page-h) !important;
      padding: var(--pdf-margin) !important;
      border-radius: 0 !important;
      line-height: 1.35;
      overflow: hidden;
      transition: background .2s ease, box-shadow .2s ease, border-color .2s ease;
    }

    .cv-page:not(.cv-sidebar) .cv-header {
      display: grid !important;
      grid-template-columns: 80px minmax(0, 1fr) !important;
      grid-template-areas:
        'photo identity'
        'photo contact' !important;
      gap: 10px 15px !important;
      align-items: start !important;
      min-height: 112px !important;
      padding: 0 0 21px !important;
      margin: 0 !important;
      border-bottom: 1.5px solid var(--cv-line) !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    .cv-page:not(.cv-sidebar) .cv-photo { grid-area: photo; }
    .cv-page:not(.cv-sidebar) .cv-identity { grid-area: identity; min-width: 0; padding-top: 4px; }
    .cv-page:not(.cv-sidebar) .cv-contact { grid-area: contact; }

    .cv-photo {
      width: var(--pdf-photo) !important;
      height: var(--pdf-photo) !important;
      border-width: 2px !important;
      border-radius: 18px !important;
      object-fit: cover;
      flex: 0 0 auto;
    }
    button.cv-photo { font-size: 12px; line-height: 1.15; }

    .cv-name {
      font-size: 29px !important;
      line-height: .98 !important;
      letter-spacing: -.045em !important;
      font-weight: 900 !important;
      min-height: 34px !important;
    }
    .cv-headline {
      margin-top: 3px !important;
      font-size: 13px !important;
      line-height: 17px !important;
      font-weight: 700 !important;
      min-height: 20px !important;
    }
    .cv-contact {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 4px !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .cv-contact li {
      padding: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      border: 0 !important;
      max-width: 100%;
    }
    .cv-contact .cv-input {
      width: auto;
      max-width: 230px;
      min-height: 15px !important;
      font-size: 10.5px !important;
      line-height: 15px !important;
      font-weight: 700 !important;
      color: var(--cv-ink);
    }
    .cv-contact li:not(:last-child)::after {
      content: '·';
      color: var(--cv-muted);
      margin-left: 4px;
      margin-right: 1px;
      font-weight: 700;
    }

    .cv-input,
    .cv-textarea {
      border: 1px solid transparent;
      border-radius: 4px;
      background: transparent;
      color: inherit;
      font: inherit;
      line-height: inherit;
      outline: none;
      transition: border-color .14s ease, background-color .14s ease, box-shadow .14s ease;
    }
    .cv-input { padding: 1px 2px !important; }
    .cv-textarea {
      padding: 2px !important;
      resize: vertical;
      overflow: hidden;
      font-size: 11px !important;
      line-height: 16px !important;
      min-height: 48px !important;
    }
    .cv-input:hover,
    .cv-textarea:hover { border-color: rgb(37 99 235 / .16); background: rgb(37 99 235 / .05); }
    .cv-input:focus,
    .cv-textarea:focus { border-color: var(--cv-accent); background: rgb(37 99 235 / .08); box-shadow: 0 0 0 2px rgb(37 99 235 / .14); }

    .cv-summary {
      margin-top: 21px !important;
    }
    .cv-summary h2,
    .section-title {
      font-size: 12px !important;
      line-height: 16px !important;
      font-weight: 900 !important;
      letter-spacing: .035em !important;
      text-transform: uppercase !important;
      color: var(--cv-accent) !important;
    }
    .cv-summary .cv-textarea {
      margin-top: 8px;
      width: 100%;
    }

    .cv-section {
      margin-top: 31px !important;
      position: relative;
    }
    .section-toolbar {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 8px !important;
      padding-bottom: 8px !important;
      border-bottom: 1.5px solid var(--cv-line) !important;
    }
    .section-title {
      min-height: 18px !important;
      width: 100%;
      padding: 0 !important;
    }
    .cv-item {
      margin-top: 13px !important;
      padding: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      outline: 0 !important;
    }
    .item-heading {
      display: flex !important;
      align-items: flex-start !important;
      justify-content: space-between !important;
      gap: 18px !important;
    }
    .item-heading > div { min-width: 0; flex: 1; }
    .item-title {
      font-size: 12.5px !important;
      line-height: 16px !important;
      font-weight: 900 !important;
      min-height: 18px !important;
    }
    .item-subtitle,
    .item-meta {
      font-size: 10px !important;
      line-height: 14px !important;
      font-weight: 700 !important;
      color: var(--cv-muted) !important;
    }
    .item-meta {
      flex: 0 0 120px;
      max-width: 120px !important;
      text-align: right !important;
    }
    .item-description {
      margin-top: 6px !important;
      min-height: 32px !important;
    }
    .bullet-list {
      display: grid !important;
      gap: 2px !important;
      margin: 6px 0 0 !important;
      padding-left: 17px !important;
    }
    .bullet-list li {
      display: list-item !important;
      list-style: disc;
      padding-left: 0 !important;
    }
    .bullet-list .cv-input {
      width: calc(100% - 28px);
      font-size: 10.5px !important;
      line-height: 15px !important;
    }
    .bullet-list button { margin-left: 4px; }

    .mini-actions,
    .item-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      opacity: .18;
      transition: opacity .16s ease;
    }
    .cv-section:hover .mini-actions,
    .cv-item:hover .item-actions,
    .mini-actions:focus-within,
    .item-actions:focus-within { opacity: 1; }
    .mini-actions button,
    .item-actions button,
    .bullet-list button {
      min-height: 18px !important;
      padding: 1px 5px !important;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      background: #fff;
      color: #111827;
      font-size: 10px !important;
      font-weight: 800;
      cursor: pointer;
    }

    .cv-section[draggable="true"] { cursor: grab; }
    .cv-section[draggable="true"] .section-toolbar::before {
      content: '⋮⋮';
      display: inline-grid;
      place-items: center;
      flex: 0 0 19px;
      width: 19px;
      height: 19px;
      margin-right: 3px;
      border-radius: 5px;
      background: color-mix(in srgb, var(--cv-accent) 10%, transparent);
      color: var(--cv-accent);
      font-weight: 900;
      letter-spacing: -.18em;
      cursor: grab;
      font-size: 12px;
    }
    .cv-section.is-dragging { opacity: .52; outline: 2px dashed var(--cv-accent); outline-offset: 4px; }
    .cv-section.drop-before { box-shadow: 0 -4px 0 var(--cv-accent); }
    .cv-section.drop-after { box-shadow: 0 4px 0 var(--cv-accent); }
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

    .cv-aurora {
      --cv-accent: #2563eb;
      --cv-accent-2: #7c3aed;
      --cv-line: #bfdbfe;
      background: linear-gradient(180deg, #eff6ff 0, #ffffff 180px) !important;
      border-top: 0 !important;
    }

    .cv-ejecutivo {
      --cv-accent: #111827;
      --cv-line: #111827;
      background: #ffffff !important;
      border: 1px solid #111827 !important;
      box-shadow: 6px 6px 0 #e5e7eb !important;
    }
    .cv-ejecutivo .cv-photo { border-radius: 5px !important; filter: grayscale(1); }
    .cv-ejecutivo .cv-item { padding-left: 8px !important; border-left: 2px solid #111827; }

    .cv-minimal {
      --cv-accent: #0f172a;
      --cv-line: #e5e7eb;
      padding: 60px !important;
      background: #ffffff !important;
      box-shadow: none !important;
      border-color: #e5e7eb !important;
    }
    .cv-minimal .cv-header {
      grid-template-columns: 1fr !important;
      grid-template-areas:
        'photo'
        'identity'
        'contact' !important;
      min-height: 0 !important;
      gap: 7px !important;
      border-bottom: 1px solid #e5e7eb !important;
    }
    .cv-minimal .cv-photo { width: 64px !important; height: 64px !important; border-radius: 999px !important; }
    .cv-minimal .cv-name { font-size: 31px !important; font-weight: 700 !important; }
    .cv-minimal .cv-section { margin-top: 36px !important; }

    .cv-sidebar {
      --cv-accent: #0f766e;
      --cv-accent-2: #14b8a6;
      --cv-line: #99f6e4;
      --pdf-content-x: 206px;
      --pdf-content-w: 373px;
      display: grid !important;
      grid-template-columns: 165px minmax(0, 1fr) !important;
      gap: 24px !important;
      background: linear-gradient(90deg, #ecfeff 0 189px, #ffffff 189px) !important;
    }
    .cv-sidebar .cv-header {
      grid-column: 1 !important;
      display: grid !important;
      grid-template-columns: 1fr !important;
      grid-template-areas: 'photo' 'identity' 'contact' !important;
      gap: 12px !important;
      align-self: start !important;
      min-height: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      position: static !important;
    }
    .cv-sidebar .cv-photo { width: 95px !important; height: 95px !important; border-radius: 18px !important; }
    .cv-sidebar .cv-name { font-size: 21px !important; line-height: 24px !important; }
    .cv-sidebar .cv-headline { font-size: 12.5px !important; line-height: 17px !important; }
    .cv-sidebar .cv-contact { display: grid !important; gap: 4px !important; }
    .cv-sidebar .cv-contact li::after { content: none !important; }
    .cv-sidebar .cv-contact .cv-input { max-width: 130px; font-size: 10.5px !important; line-height: 15px !important; }
    .cv-sidebar .cv-summary { grid-column: 1 !important; margin-top: 16px !important; }
    .cv-sidebar .cv-summary .cv-textarea { font-size: 10px !important; line-height: 14.5px !important; }
    .cv-sidebar .cv-section { grid-column: 2 !important; margin-top: 31px !important; }
    .cv-sidebar .item-meta { flex-basis: 88px; max-width: 88px !important; }

    .cv-editorial {
      --cv-accent: #be123c;
      --cv-accent-2: #9f1239;
      --cv-line: #fecdd3;
      background: linear-gradient(90deg, #be123c 0 12px, #fffaf5 12px, #ffffff 180px) !important;
      font-family: Georgia, 'Times New Roman', serif !important;
    }
    .cv-editorial .cv-name { color: #9f1239 !important; font-family: Georgia, 'Times New Roman', serif !important; font-weight: 700 !important; }
    .cv-editorial .section-title { color: #9f1239 !important; font-style: normal !important; text-transform: uppercase !important; letter-spacing: .035em !important; font-size: 12px !important; }
    .cv-editorial .cv-item { background: transparent !important; }

    .cv-tech {
      --cv-accent: #38bdf8;
      --cv-accent-2: #8b5cf6;
      --cv-line: #334155;
      --cv-ink: #f8fafc;
      --cv-muted: #cbd5e1;
      background: #0f172a !important;
      color: #f8fafc !important;
      border-color: #334155 !important;
    }
    .cv-tech .cv-header {
      padding: 11px !important;
      margin: -11px -11px 21px !important;
      border: 0 !important;
      border-radius: 17px !important;
      background: #1e293b !important;
    }
    .cv-tech .cv-name { color: #38bdf8 !important; text-shadow: none !important; }
    .cv-tech .section-title { color: #38bdf8 !important; }
    .cv-tech .cv-item { background: transparent !important; border: 0 !important; }
    .cv-tech .cv-input::placeholder,
    .cv-tech .cv-textarea::placeholder { color: #64748b !important; }

    @media (max-width: 719px) {
      .cv-page {
        width: min(100%, 620px) !important;
        min-height: auto !important;
        padding: 22px !important;
      }
      .cv-page:not(.cv-sidebar) .cv-header,
      .cv-sidebar .cv-header {
        grid-template-columns: 1fr !important;
        grid-template-areas: 'photo' 'identity' 'contact' !important;
      }
      .cv-sidebar { display: block !important; background: #ffffff !important; }
      .cv-sidebar .cv-section,
      .cv-sidebar .cv-summary { grid-column: auto !important; }
      .item-heading { display: grid !important; }
      .item-meta { flex-basis: auto !important; max-width: none !important; text-align: left !important; }
      .mini-actions,
      .item-actions { opacity: 1; }
    }
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
