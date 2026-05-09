import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

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
