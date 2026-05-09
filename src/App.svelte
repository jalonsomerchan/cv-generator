<script lang="ts">
  import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

  type CvTheme = 'moderno' | 'clasico' | 'creativo'
  type SectionType = 'experience' | 'education' | 'skills' | 'languages' | 'projects' | 'custom'

  type CvItem = {
    id: string
    title: string
    subtitle: string
    meta: string
    description: string
    bullets: string[]
  }

  type CvSection = {
    id: string
    type: SectionType
    title: string
    items: CvItem[]
  }

  type CvData = {
    name: string
    headline: string
    email: string
    phone: string
    location: string
    website: string
    summary: string
    sections: CvSection[]
  }

  const STORAGE_KEY = 'cv-generator:data:v3'
  const THEME_KEY = 'cv-generator:theme'
  const randomId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)

  const sectionLabels: Record<SectionType, string> = {
    experience: 'Experiencia',
    education: 'Formación',
    skills: 'Competencias',
    languages: 'Idiomas',
    projects: 'Proyectos',
    custom: 'Apartado personalizado',
  }

  const themes: { id: CvTheme; name: string; description: string }[] = [
    { id: 'moderno', name: 'Moderno', description: 'Color, presencia visual y estructura clara.' },
    { id: 'clasico', name: 'Clásico', description: 'Sobrio, formal y muy legible.' },
    { id: 'creativo', name: 'Creativo', description: 'Más expresivo, con lateral y acento visual.' },
  ]

  const starterCv = (): CvData => ({
    name: 'Tu nombre',
    headline: 'Puesto objetivo o especialidad profesional',
    email: 'email@ejemplo.com',
    phone: '+34 600 000 000',
    location: 'Ciudad, país',
    website: 'portfolio.com',
    summary:
      'Profesional con experiencia en proyectos digitales, comunicación clara y orientación a resultados. Edita este texto directamente sobre el CV para adaptarlo a tu perfil.',
    sections: [
      {
        id: randomId(),
        type: 'experience',
        title: 'Experiencia',
        items: [
          {
            id: randomId(),
            title: 'Puesto o rol profesional',
            subtitle: 'Empresa o cliente',
            meta: '2023 - actualidad',
            description: 'Describe tu responsabilidad principal, el contexto del puesto y el impacto de tu trabajo.',
            bullets: ['Logro medible o responsabilidad destacada.', 'Proyecto relevante o mejora conseguida.'],
          },
        ],
      },
      {
        id: randomId(),
        type: 'education',
        title: 'Formación',
        items: [
          {
            id: randomId(),
            title: 'Título o certificación',
            subtitle: 'Centro educativo',
            meta: '2020 - 2022',
            description: 'Especialidad, itinerario o conocimientos principales.',
            bullets: [],
          },
        ],
      },
      {
        id: randomId(),
        type: 'skills',
        title: 'Competencias',
        items: [
          {
            id: randomId(),
            title: 'Frontend, diseño, SEO técnico, accesibilidad',
            subtitle: '',
            meta: '',
            description: 'Añade tus habilidades separadas por comas o crea apartados nuevos.',
            bullets: [],
          },
        ],
      },
      {
        id: randomId(),
        type: 'languages',
        title: 'Idiomas',
        items: [
          {
            id: randomId(),
            title: 'Español nativo · Inglés profesional',
            subtitle: '',
            meta: '',
            description: '',
            bullets: [],
          },
        ],
      },
    ],
  })

  let cv: CvData = starterCv()
  let selectedTheme: CvTheme = 'moderno'
  let wizardOpen = true
  let showMobilePanel = false
  let importInput: HTMLInputElement | undefined
  let statusMessage = 'Edita directamente los campos dentro del CV.'
  let wizard = {
    name: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    summary: '',
  }

  if (typeof window !== 'undefined') {
    const storedTheme = localStorage.getItem(THEME_KEY)
    const storedCv = localStorage.getItem(STORAGE_KEY)

    if (storedTheme === 'light' || storedTheme === 'dark') {
      document.documentElement.dataset.theme = storedTheme
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.dataset.theme = 'dark'
    }

    if (storedCv) {
      try {
        cv = normalizeCv(JSON.parse(storedCv))
        wizardOpen = false
      } catch {
        statusMessage = 'No se pudo cargar el CV guardado. Se ha creado uno de ejemplo.'
      }
    }
  }

  $: completion = getCompletion(cv)
  $: markdownContent = toMarkdown(cv)

  function normalizeCv(value: Partial<CvData>): CvData {
    const fallback = starterCv()
    return {
      ...fallback,
      ...value,
      sections: Array.isArray(value.sections)
        ? value.sections.map((section) => ({
            id: section.id || randomId(),
            type: section.type || 'custom',
            title: section.title || 'Nuevo apartado',
            items: Array.isArray(section.items)
              ? section.items.map((item) => ({
                  id: item.id || randomId(),
                  title: item.title || '',
                  subtitle: item.subtitle || '',
                  meta: item.meta || '',
                  description: item.description || '',
                  bullets: Array.isArray(item.bullets) ? item.bullets : [],
                }))
              : [],
          }))
        : fallback.sections,
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cv))
  }

  function touch(message = 'Cambios guardados automáticamente.') {
    cv = { ...cv, sections: [...cv.sections] }
    persist()
    statusMessage = message
  }

  function updateCvField<K extends keyof CvData>(field: K, value: CvData[K]) {
    cv = { ...cv, [field]: value }
    persist()
  }

  function updateSection(sectionId: string, patch: Partial<CvSection>) {
    cv = {
      ...cv,
      sections: cv.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    }
    persist()
  }

  function updateItem(sectionId: string, itemId: string, patch: Partial<CvItem>) {
    cv = {
      ...cv,
      sections: cv.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item,
              ),
            }
          : section,
      ),
    }
    persist()
  }

  function updateBullet(sectionId: string, itemId: string, index: number, value: string) {
    cv = {
      ...cv,
      sections: cv.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId
                  ? { ...item, bullets: item.bullets.map((bullet, i) => (i === index ? value : bullet)) }
                  : item,
              ),
            }
          : section,
      ),
    }
    persist()
  }

  function applyWizard() {
    cv = {
      ...cv,
      name: wizard.name || cv.name,
      headline: wizard.headline || cv.headline,
      email: wizard.email || cv.email,
      phone: wizard.phone || cv.phone,
      location: wizard.location || cv.location,
      website: wizard.website || cv.website,
      summary: wizard.summary || cv.summary,
    }
    wizardOpen = false
    persist()
    statusMessage = 'Datos básicos añadidos. Ya puedes editar el CV directamente.'
  }

  function skipWizard() {
    wizardOpen = false
    statusMessage = 'Plantilla de ejemplo cargada.'
  }

  function addSection(type: SectionType = 'custom') {
    const section: CvSection = {
      id: randomId(),
      type,
      title: sectionLabels[type],
      items: [
        {
          id: randomId(),
          title: type === 'projects' ? 'Nombre del proyecto' : 'Nuevo elemento',
          subtitle: type === 'projects' ? 'Rol, cliente o tecnología' : '',
          meta: '',
          description: 'Describe este apartado directamente aquí.',
          bullets: [],
        },
      ],
    }
    cv = { ...cv, sections: [...cv.sections, section] }
    touch('Apartado añadido.')
  }

  function removeSection(sectionId: string) {
    cv = { ...cv, sections: cv.sections.filter((section) => section.id !== sectionId) }
    touch('Apartado eliminado.')
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    const index = cv.sections.findIndex((section) => section.id === sectionId)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= cv.sections.length) return
    const sections = [...cv.sections]
    const [section] = sections.splice(index, 1)
    sections.splice(nextIndex, 0, section)
    cv = { ...cv, sections }
    touch('Apartado reordenado.')
  }

  function addItem(sectionId: string) {
    const item: CvItem = {
      id: randomId(),
      title: 'Nuevo elemento',
      subtitle: '',
      meta: '',
      description: 'Añade la descripción de este elemento.',
      bullets: [],
    }
    cv = {
      ...cv,
      sections: cv.sections.map((section) =>
        section.id === sectionId ? { ...section, items: [...section.items, item] } : section,
      ),
    }
    touch('Elemento añadido.')
  }

  function removeItem(sectionId: string, itemId: string) {
    cv = {
      ...cv,
      sections: cv.sections.map((section) =>
        section.id === sectionId
          ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
          : section,
      ),
    }
    touch('Elemento eliminado.')
  }

  function addBullet(sectionId: string, itemId: string) {
    cv = {
      ...cv,
      sections: cv.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, bullets: [...item.bullets, 'Nuevo punto clave.'] } : item,
              ),
            }
          : section,
      ),
    }
    touch('Punto añadido.')
  }

  function removeBullet(sectionId: string, itemId: string, index: number) {
    cv = {
      ...cv,
      sections: cv.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId
                  ? { ...item, bullets: item.bullets.filter((_, i) => i !== index) }
                  : item,
              ),
            }
          : section,
      ),
    }
    touch('Punto eliminado.')
  }

  function resetCv() {
    cv = starterCv()
    wizardOpen = true
    wizard = { name: '', headline: '', email: '', phone: '', location: '', website: '', summary: '' }
    persist()
    statusMessage = 'CV reiniciado.'
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    const next = current === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem(THEME_KEY, next)
  }

  function inputValue(event: Event) {
    return (event.currentTarget as HTMLInputElement).value
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

  function safeFilename(name: string) {
    return (name || 'cv')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function exportJson() {
    downloadBlob(new Blob([JSON.stringify(cv, null, 2)], { type: 'application/json' }), `${safeFilename(cv.name)}.json`)
    statusMessage = 'JSON exportado.'
  }

  function exportMarkdown() {
    downloadBlob(new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' }), `${safeFilename(cv.name)}.md`)
    statusMessage = 'Markdown exportado.'
  }

  function exportWord() {
    downloadBlob(new Blob([toWordHtml(cv)], { type: 'application/msword;charset=utf-8' }), `${safeFilename(cv.name)}.doc`)
    statusMessage = 'Documento Word exportado.'
  }

  async function exportPdf() {
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([595.28, 841.89])
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const palette = {
      moderno: { primary: rgb(0.14, 0.39, 0.92), secondary: rgb(0.96, 0.98, 1), text: rgb(0.05, 0.09, 0.16) },
      clasico: { primary: rgb(0.06, 0.09, 0.16), secondary: rgb(0.96, 0.96, 0.94), text: rgb(0.05, 0.09, 0.16) },
      creativo: { primary: rgb(0.49, 0.23, 0.93), secondary: rgb(0.98, 0.95, 1), text: rgb(0.05, 0.09, 0.16) },
    }[selectedTheme]

    const margin = 48
    const maxWidth = 500
    let y = 792

    const ensurePage = (needed = 52) => {
      if (y < margin + needed) {
        page = pdfDoc.addPage([595.28, 841.89])
        y = 792
      }
    }

    const clean = (value: string) =>
      (value || '')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[–—]/g, '-')
        .replace(/•/g, '-')
        .replace(/[^\x09\x0A\x0D\x20-\x7EÀ-ÿ]/g, '')

    const drawWrapped = (text: string, x: number, size: number, font = regular, width = maxWidth) => {
      const words = clean(text).split(/\s+/).filter(Boolean)
      let line = ''
      const lines: string[] = []
      for (const word of words) {
        const next = line ? `${line} ${word}` : word
        if (font.widthOfTextAtSize(next, size) > width && line) {
          lines.push(line)
          line = word
        } else {
          line = next
        }
      }
      if (line) lines.push(line)
      for (const currentLine of lines) {
        ensurePage(24)
        page.drawText(currentLine, { x, y, size, font, color: palette.text })
        y -= size + 5
      }
    }

    page.drawRectangle({ x: 0, y: 750, width: 595.28, height: 92, color: palette.secondary })
    page.drawText(clean(cv.name), { x: margin, y: 792, size: 25, font: bold, color: palette.primary })
    page.drawText(clean(cv.headline), { x: margin, y: 762, size: 12, font: regular, color: palette.text })
    y = 732
    drawWrapped([cv.email, cv.phone, cv.location, cv.website].filter(Boolean).join(' · '), margin, 10)
    y -= 12
    drawWrapped(cv.summary, margin, 11)

    for (const section of cv.sections) {
      ensurePage(92)
      y -= 12
      page.drawText(clean(section.title.toUpperCase()), { x: margin, y, size: 12, font: bold, color: palette.primary })
      y -= 16
      page.drawLine({ start: { x: margin, y }, end: { x: margin + maxWidth, y }, thickness: 1, color: palette.primary })
      y -= 18

      for (const item of section.items) {
        ensurePage(78)
        if (item.title) {
          page.drawText(clean(item.title), { x: margin, y, size: 12, font: bold, color: palette.text })
          y -= 15
        }
        const meta = [item.subtitle, item.meta].filter(Boolean).join(' · ')
        if (meta) drawWrapped(meta, margin, 10)
        if (item.description) drawWrapped(item.description, margin, 10)
        for (const bullet of item.bullets.filter(Boolean)) drawWrapped(`- ${bullet}`, margin + 10, 10, regular, maxWidth - 10)
        y -= 8
      }
    }

    const bytes = await pdfDoc.save()
    const pdfBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    downloadBlob(new Blob([pdfBuffer], { type: 'application/pdf' }), `${safeFilename(cv.name)}.pdf`)
    statusMessage = 'PDF generado en el navegador.'
  }

  function importJson() {
    importInput?.click()
  }

  async function handleImport(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      cv = normalizeCv(JSON.parse(await file.text()))
      wizardOpen = false
      persist()
      statusMessage = 'CV importado correctamente.'
    } catch {
      statusMessage = 'El archivo no es un JSON válido de CV.'
    } finally {
      ;(event.currentTarget as HTMLInputElement).value = ''
    }
  }

  function getCompletion(data: CvData) {
    const checks = [
      data.name,
      data.headline,
      data.email,
      data.phone,
      data.location,
      data.summary,
      data.sections.find((section) => section.type === 'experience')?.items[0]?.title,
      data.sections.find((section) => section.type === 'education')?.items[0]?.title,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }

  function toMarkdown(data: CvData) {
    const lines = [
      `# ${data.name}`,
      '',
      `**${data.headline}**`,
      '',
      [data.email, data.phone, data.location, data.website].filter(Boolean).join(' · '),
      '',
      '## Perfil',
      '',
      data.summary,
      '',
    ]

    for (const section of data.sections) {
      lines.push(`## ${section.title}`, '')
      for (const item of section.items) {
        if (item.title) lines.push(`### ${item.title}`)
        const meta = [item.subtitle, item.meta].filter(Boolean).join(' · ')
        if (meta) lines.push(`_${meta}_`)
        if (item.description) lines.push('', item.description)
        if (item.bullets.length) {
          lines.push('')
          item.bullets.filter(Boolean).forEach((bullet) => lines.push(`- ${bullet}`))
        }
        lines.push('')
      }
    }

    return lines.join('\n').replace(/\n{3,}/g, '\n\n')
  }

  function escapeHtml(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function toWordHtml(data: CvData) {
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(data.name)} - CV</title><style>body{font-family:Arial,sans-serif;color:#111827;line-height:1.45;margin:42px}h1{font-size:30px;margin:0 0 6px;color:#1d4ed8}h2{font-size:15px;text-transform:uppercase;border-bottom:1px solid #cbd5e1;padding-bottom:6px;margin-top:24px;color:#1d4ed8}h3{font-size:14px;margin-bottom:2px}p{margin:6px 0}.meta{color:#475569;font-size:12px}.summary{font-size:14px}</style></head><body><h1>${escapeHtml(data.name)}</h1><p><strong>${escapeHtml(data.headline)}</strong></p><p class="meta">${escapeHtml([data.email, data.phone, data.location, data.website].filter(Boolean).join(' · '))}</p><p class="summary">${escapeHtml(data.summary)}</p>${data.sections
      .map(
        (section) => `<h2>${escapeHtml(section.title)}</h2>${section.items
          .map(
            (item) => `<h3>${escapeHtml(item.title)}</h3><p class="meta">${escapeHtml([item.subtitle, item.meta].filter(Boolean).join(' · '))}</p><p>${escapeHtml(item.description)}</p>${item.bullets.length ? `<ul>${item.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>` : ''}`,
          )
          .join('')}`,
      )
      .join('')}</body></html>`
  }
</script>

<svelte:head>
  <title>Generador de CV online gratis | PDF, Word, Markdown y JSON</title>
  <meta name="description" content="Crea un currículum visual directamente en el navegador, elige plantilla y exporta tu CV a PDF, Word, Markdown o JSON." />
  <meta name="robots" content="index,follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Generador de CV online gratis" />
  <meta property="og:description" content="Editor visual de currículum con plantillas, apartados personalizados y exportación local a PDF, Word, Markdown y JSON." />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="app-shell">
  <a class="skip-link" href="#editor">Saltar al editor</a>

  <header class="site-header">
    <nav class="header-inner" aria-label="Navegación principal">
      <a class="brand" href="./" aria-label="Ir al inicio">
        <span class="brand-mark">CV</span>
        <span><strong>CV Generator</strong><small>Editor visual privado</small></span>
      </a>
      <div class="header-actions">
        <button class="btn btn-ghost hide-mobile" type="button" on:click={() => (wizardOpen = true)}>Wizard inicial</button>
        <button class="btn btn-secondary" type="button" on:click={toggleTheme}>Cambiar tema</button>
      </div>
    </nav>
  </header>

  <main id="main">
    <section class="hero-section" aria-labelledby="main-title">
      <div class="hero-content">
        <span class="badge">Sin subir archivos · Exportación local</span>
        <h1 id="main-title">Crea y edita tu CV directamente sobre el documento</h1>
        <p>Elige un estilo, escribe encima de la previsualización real, añade apartados y descarga tu currículum en PDF, Word, Markdown o JSON.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#editor">Empezar a editar</a>
          <button class="btn btn-secondary" type="button" on:click={exportPdf}>Descargar PDF</button>
        </div>
      </div>
      <aside class="hero-card" aria-label="Estado del CV">
        <strong>{completion}% completo</strong>
        <div class="progress" aria-hidden="true"><span style={`width: ${completion}%`}></span></div>
        <p>{statusMessage}</p>
      </aside>
    </section>

    <section class="editor-layout" id="editor" aria-label="Editor visual de CV">
      <aside class="control-panel" class:open={showMobilePanel} aria-label="Opciones del generador">
        <div class="panel-header">
          <div><span class="eyebrow">Configuración</span><h2>Diseño y exportación</h2></div>
          <button class="icon-button mobile-only" type="button" on:click={() => (showMobilePanel = false)} aria-label="Cerrar opciones">×</button>
        </div>

        <section class="panel-card">
          <h3>Estilo de CV</h3>
          <div class="theme-list">
            {#each themes as theme}
              <button class:active={selectedTheme === theme.id} class="theme-option" type="button" on:click={() => (selectedTheme = theme.id)}>
                <strong>{theme.name}</strong><span>{theme.description}</span>
              </button>
            {/each}
          </div>
        </section>

        <section class="panel-card">
          <h3>Apartados</h3>
          <div class="button-grid">
            <button class="btn btn-secondary" type="button" on:click={() => addSection('experience')}>Experiencia</button>
            <button class="btn btn-secondary" type="button" on:click={() => addSection('education')}>Formación</button>
            <button class="btn btn-secondary" type="button" on:click={() => addSection('skills')}>Competencias</button>
            <button class="btn btn-secondary" type="button" on:click={() => addSection('projects')}>Proyectos</button>
            <button class="btn btn-secondary" type="button" on:click={() => addSection('languages')}>Idiomas</button>
            <button class="btn btn-secondary" type="button" on:click={() => addSection('custom')}>Personalizado</button>
          </div>
        </section>

        <section class="panel-card">
          <h3>Exportar</h3>
          <div class="export-grid">
            <button class="btn btn-primary" type="button" on:click={exportPdf}>PDF</button>
            <button class="btn btn-secondary" type="button" on:click={exportWord}>Word</button>
            <button class="btn btn-secondary" type="button" on:click={exportMarkdown}>Markdown</button>
            <button class="btn btn-secondary" type="button" on:click={exportJson}>JSON</button>
          </div>
          <input bind:this={importInput} class="sr-only" type="file" accept="application/json,.json" on:change={handleImport} />
          <button class="btn btn-ghost full" type="button" on:click={importJson}>Importar JSON guardado</button>
        </section>

        <section class="panel-card">
          <h3>Acciones</h3>
          <button class="btn btn-secondary full" type="button" on:click={() => (wizardOpen = true)}>Abrir wizard</button>
          <button class="btn btn-danger full" type="button" on:click={resetCv}>Reiniciar CV</button>
        </section>

        <section class="panel-card">
          <h3>Vista Markdown</h3>
          <textarea class="textarea markdown-preview" readonly value={markdownContent}></textarea>
        </section>
      </aside>

      <section class="workspace" aria-label="Previsualización editable">
        <div class="workspace-toolbar">
          <button class="btn btn-secondary mobile-only" type="button" on:click={() => (showMobilePanel = true)}>Opciones</button>
          <p>{statusMessage}</p>
        </div>

        <article class={`cv-page cv-${selectedTheme}`} aria-label="Currículum editable">
          <header class="cv-header">
            <div>
              <input class="cv-name cv-input" aria-label="Nombre" bind:value={cv.name} on:input={() => updateCvField('name', cv.name)} />
              <input class="cv-headline cv-input" aria-label="Titular profesional" bind:value={cv.headline} on:input={() => updateCvField('headline', cv.headline)} />
            </div>
            <ul class="cv-contact" aria-label="Datos de contacto">
              <li><input class="cv-input" aria-label="Email" bind:value={cv.email} on:input={() => updateCvField('email', cv.email)} /></li>
              <li><input class="cv-input" aria-label="Teléfono" bind:value={cv.phone} on:input={() => updateCvField('phone', cv.phone)} /></li>
              <li><input class="cv-input" aria-label="Ubicación" bind:value={cv.location} on:input={() => updateCvField('location', cv.location)} /></li>
              <li><input class="cv-input" aria-label="Web" bind:value={cv.website} on:input={() => updateCvField('website', cv.website)} /></li>
            </ul>
          </header>

          <section class="cv-summary" aria-labelledby="summary-title">
            <h2 id="summary-title">Perfil</h2>
            <textarea class="cv-textarea" aria-label="Resumen profesional" bind:value={cv.summary} on:input={() => updateCvField('summary', cv.summary)}></textarea>
          </section>

          {#each cv.sections as section, index (section.id)}
            <section class="cv-section" aria-label={section.title}>
              <div class="section-toolbar">
                <input class="section-title cv-input" aria-label="Título del apartado" bind:value={section.title} on:input={() => updateSection(section.id, { title: section.title })} />
                <div class="mini-actions">
                  <button type="button" on:click={() => moveSection(section.id, -1)} disabled={index === 0}>↑</button>
                  <button type="button" on:click={() => moveSection(section.id, 1)} disabled={index === cv.sections.length - 1}>↓</button>
                  <button type="button" on:click={() => addItem(section.id)}>+ item</button>
                  <button type="button" on:click={() => removeSection(section.id)}>×</button>
                </div>
              </div>

              {#each section.items as item (item.id)}
                <div class="cv-item">
                  <div class="item-heading">
                    <div>
                      <input class="item-title cv-input" aria-label="Título del elemento" bind:value={item.title} on:input={() => updateItem(section.id, item.id, { title: item.title })} />
                      <input class="item-subtitle cv-input" aria-label="Subtítulo del elemento" bind:value={item.subtitle} on:input={() => updateItem(section.id, item.id, { subtitle: item.subtitle })} />
                    </div>
                    <input class="item-meta cv-input" aria-label="Fechas o información adicional" bind:value={item.meta} on:input={() => updateItem(section.id, item.id, { meta: item.meta })} />
                  </div>
                  <textarea class="cv-textarea item-description" aria-label="Descripción" bind:value={item.description} on:input={() => updateItem(section.id, item.id, { description: item.description })}></textarea>

                  {#if item.bullets.length}
                    <ul class="bullet-list">
                      {#each item.bullets as bullet, bulletIndex}
                        <li>
                          <input class="cv-input" aria-label="Punto destacado" value={bullet} on:input={(event) => updateBullet(section.id, item.id, bulletIndex, inputValue(event))} />
                          <button type="button" aria-label="Eliminar punto" on:click={() => removeBullet(section.id, item.id, bulletIndex)}>×</button>
                        </li>
                      {/each}
                    </ul>
                  {/if}

                  <div class="item-actions">
                    <button type="button" on:click={() => addBullet(section.id, item.id)}>Añadir punto</button>
                    <button type="button" on:click={() => removeItem(section.id, item.id)}>Eliminar item</button>
                  </div>
                </div>
              {/each}
            </section>
          {/each}
        </article>
      </section>
    </section>

    <section class="seo-content" aria-labelledby="how-title">
      <h2 id="how-title">Cómo crear tu currículum online</h2>
      <ol>
        <li>Completa el wizard inicial o edita directamente los campos del CV.</li>
        <li>Elige un diseño profesional: moderno, clásico o creativo.</li>
        <li>Añade experiencias, formación, competencias, proyectos o apartados personalizados.</li>
        <li>Exporta tu currículum a PDF, Word, Markdown o JSON sin enviar tus datos a un servidor.</li>
      </ol>
    </section>
  </main>

  <footer class="site-footer">
    <p>CV Generator procesa la información en tu navegador y guarda una copia local para seguir editando.</p>
  </footer>
</div>

{#if wizardOpen}
  <div class="modal-backdrop">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
      <div class="modal-header">
        <div><span class="eyebrow">Primer paso</span><h2 id="wizard-title">Añade los datos básicos de tu CV</h2></div>
        <button class="icon-button" type="button" on:click={skipWizard} aria-label="Cerrar wizard">×</button>
      </div>
      <div class="wizard-grid">
        <label><span>Nombre completo</span><input class="input" bind:value={wizard.name} placeholder="Ej. Ana García" /></label>
        <label><span>Titular profesional</span><input class="input" bind:value={wizard.headline} placeholder="Ej. Desarrolladora frontend" /></label>
        <label><span>Email</span><input class="input" bind:value={wizard.email} type="email" placeholder="ana@email.com" /></label>
        <label><span>Teléfono</span><input class="input" bind:value={wizard.phone} placeholder="+34..." /></label>
        <label><span>Ubicación</span><input class="input" bind:value={wizard.location} placeholder="Ciudad, país" /></label>
        <label><span>Web o LinkedIn</span><input class="input" bind:value={wizard.website} placeholder="https://..." /></label>
        <label class="wide"><span>Resumen profesional</span><textarea class="textarea" bind:value={wizard.summary} rows="4" placeholder="Describe tu perfil en 3 o 4 líneas."></textarea></label>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" type="button" on:click={skipWizard}>Usar plantilla de ejemplo</button>
        <button class="btn btn-primary" type="button" on:click={applyWizard}>Crear CV editable</button>
      </div>
    </div>
  </div>
{/if}
