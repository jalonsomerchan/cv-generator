<script lang="ts">
  import { tick } from 'svelte'
  import { PDFDocument } from 'pdf-lib'

  type CvTheme = 'aurora' | 'ejecutivo' | 'minimal' | 'sidebar' | 'editorial' | 'tech'
  type SectionType = 'experience' | 'education' | 'skills' | 'languages' | 'projects' | 'custom'
  type ModalType = 'markdown' | 'json' | null

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
    photoDataUrl: string
    summary: string
    sections: CvSection[]
  }

  const STORAGE_KEY = 'cv-generator:data:v4'
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
    { id: 'aurora', name: 'Aurora', description: 'Cabecera con degradado, tarjetas y mucha presencia visual.' },
    { id: 'ejecutivo', name: 'Ejecutivo', description: 'Sobrio, compacto y formal para procesos tradicionales.' },
    { id: 'minimal', name: 'Minimal', description: 'Limpio, tipográfico y con mucho aire.' },
    { id: 'sidebar', name: 'Sidebar', description: 'Columna lateral para contacto, foto y competencias.' },
    { id: 'editorial', name: 'Editorial', description: 'Estilo revista, elegante y diferenciado.' },
    { id: 'tech', name: 'Tech', description: 'Oscuro, moderno y orientado a perfiles digitales.' },
  ]

  const starterCv = (): CvData => ({
    name: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    photoDataUrl: '',
    summary: '',
    sections: [
      {
        id: randomId(),
        type: 'experience',
        title: 'Experiencia',
        items: [{ id: randomId(), title: '', subtitle: '', meta: '', description: '', bullets: [''] }],
      },
      {
        id: randomId(),
        type: 'education',
        title: 'Formación',
        items: [{ id: randomId(), title: '', subtitle: '', meta: '', description: '', bullets: [] }],
      },
      {
        id: randomId(),
        type: 'skills',
        title: 'Competencias',
        items: [{ id: randomId(), title: '', subtitle: '', meta: '', description: '', bullets: [] }],
      },
      {
        id: randomId(),
        type: 'languages',
        title: 'Idiomas',
        items: [{ id: randomId(), title: '', subtitle: '', meta: '', description: '', bullets: [] }],
      },
    ],
  })

  let cv: CvData = starterCv()
  let selectedTheme: CvTheme = 'aurora'
  let wizardOpen = true
  let showMobilePanel = false
  let dataModal: ModalType = null
  let pdfModalOpen = false
  let pdfPreviewUrl = ''
  let importInput: HTMLInputElement | undefined
  let photoInput: HTMLInputElement | undefined
  let cvPage: HTMLElement | undefined
  let statusMessage = 'Rellena solo lo que quieras. Los campos vacíos no aparecen en las exportaciones.'
  let wizard = { name: '', headline: '', email: '', phone: '', location: '', website: '', summary: '' }

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
        statusMessage = 'No se pudo cargar el CV guardado. Se ha creado uno vacío.'
      }
    }
  }

  $: completion = getCompletion(cv)
  $: markdownContent = toMarkdown(cv)
  $: jsonContent = JSON.stringify(cv, null, 2)
  $: dataModalTitle = dataModal === 'markdown' ? 'Markdown del CV' : 'JSON editable del CV'
  $: dataModalText = dataModal === 'markdown' ? markdownContent : jsonContent

  function normalizeCv(value: Partial<CvData>): CvData {
    const fallback = starterCv()
    return {
      ...fallback,
      ...value,
      photoDataUrl: value.photoDataUrl || '',
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
    cv = { ...cv, sections: cv.sections.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)) }
    persist()
  }

  function updateItem(sectionId: string, itemId: string, patch: Partial<CvItem>) {
    cv = {
      ...cv,
      sections: cv.sections.map((section) =>
        section.id === sectionId
          ? { ...section, items: section.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)) }
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
                item.id === itemId ? { ...item, bullets: item.bullets.map((bullet, i) => (i === index ? value : bullet)) } : item,
              ),
            }
          : section,
      ),
    }
    persist()
  }

  function applyWizard() {
    cv = { ...cv, ...wizard }
    wizardOpen = false
    persist()
    statusMessage = 'Datos básicos añadidos. Ahora puedes editar el CV directamente.'
  }

  function skipWizard() {
    wizardOpen = false
  }

  function addSection(type: SectionType = 'custom') {
    const section: CvSection = {
      id: randomId(),
      type,
      title: sectionLabels[type],
      items: [{ id: randomId(), title: '', subtitle: '', meta: '', description: '', bullets: [] }],
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
    const item: CvItem = { id: randomId(), title: '', subtitle: '', meta: '', description: '', bullets: [] }
    cv = { ...cv, sections: cv.sections.map((section) => (section.id === sectionId ? { ...section, items: [...section.items, item] } : section)) }
    touch('Elemento añadido.')
  }

  function removeItem(sectionId: string, itemId: string) {
    cv = {
      ...cv,
      sections: cv.sections.map((section) => (section.id === sectionId ? { ...section, items: section.items.filter((item) => item.id !== itemId) } : section)),
    }
    touch('Elemento eliminado.')
  }

  function addBullet(sectionId: string, itemId: string) {
    cv = {
      ...cv,
      sections: cv.sections.map((section) =>
        section.id === sectionId
          ? { ...section, items: section.items.map((item) => (item.id === itemId ? { ...item, bullets: [...item.bullets, ''] } : item)) }
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
          ? { ...section, items: section.items.map((item) => (item.id === itemId ? { ...item, bullets: item.bullets.filter((_, i) => i !== index) } : item)) }
          : section,
      ),
    }
    touch('Punto eliminado.')
  }

  function resetCv() {
    cv = starterCv()
    wizard = { name: '', headline: '', email: '', phone: '', location: '', website: '', summary: '' }
    wizardOpen = true
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

  async function handlePhoto(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0]
    if (!file) return
    const photoDataUrl = await fileToDataUrl(file)
    updateCvField('photoDataUrl', photoDataUrl)
    statusMessage = 'Fotografía añadida.'
  }

  function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
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
    return (name || 'cv').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  function exportJson() {
    downloadBlob(new Blob([jsonContent], { type: 'application/json;charset=utf-8' }), `${safeFilename(cv.name)}.json`)
  }

  function exportMarkdown() {
    downloadBlob(new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' }), `${safeFilename(cv.name)}.md`)
  }

  function exportWord() {
    downloadBlob(new Blob([toWordHtml(cv)], { type: 'application/msword;charset=utf-8' }), `${safeFilename(cv.name)}.doc`)
  }

  async function copyModalText() {
    await navigator.clipboard.writeText(dataModalText)
    statusMessage = 'Contenido copiado al portapapeles.'
  }

  async function openPdfPreview() {
    const blob = await createPdfBlob()
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
    pdfPreviewUrl = URL.createObjectURL(blob)
    pdfModalOpen = true
    statusMessage = 'Vista previa del PDF generada.'
  }

  async function downloadPdf() {
    const blob = pdfPreviewUrl ? await fetch(pdfPreviewUrl).then((response) => response.blob()) : await createPdfBlob()
    downloadBlob(blob, `${safeFilename(cv.name)}.pdf`)
  }

  async function createPdfBlob() {
    if (!cvPage) throw new Error('No se ha encontrado la previsualización del CV.')
    await tick()
    const canvas = await renderCvToCanvas(cvPage)
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
      if (!ctx) throw new Error('No se pudo crear el contexto del PDF.')
      ctx.drawImage(canvas, 0, y, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height)
      const png = await pdfDoc.embedPng(pageCanvas.toDataURL('image/png'))
      const page = pdfDoc.addPage([pageWidth, pageHeight])
      const imageHeight = pageCanvas.height * scale
      page.drawImage(png, { x: 0, y: pageHeight - imageHeight, width: pageWidth, height: imageHeight })
    }

    const bytes = await pdfDoc.save()
    const pdfBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    return new Blob([pdfBuffer], { type: 'application/pdf' })
  }

  async function renderCvToCanvas(source: HTMLElement) {
    const clone = source.cloneNode(true) as HTMLElement
    clone.classList.add('pdf-export')
    prepareCloneForExport(clone)
    const css = collectCss()
    const width = Math.ceil(source.scrollWidth)
    const height = Math.ceil(source.scrollHeight)
    const html = `<div xmlns="http://www.w3.org/1999/xhtml"><style>${css}</style>${clone.outerHTML}</div>`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`
    const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
    const canvas = document.createElement('canvas')
    const ratio = 2
    canvas.width = width * ratio
    canvas.height = height * ratio
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No se pudo renderizar el CV.')
    ctx.scale(ratio, ratio)
    ctx.drawImage(image, 0, 0)
    return canvas
  }

  function prepareCloneForExport(root: HTMLElement) {
    root.querySelectorAll('.mini-actions, .item-actions, .photo-actions, .empty-only').forEach((node) => node.remove())
    root.querySelectorAll('input, textarea').forEach((node) => {
      const control = node as HTMLInputElement | HTMLTextAreaElement
      const value = control.value.trim()
      const replacement = document.createElement(control.tagName.toLowerCase() === 'textarea' ? 'div' : 'span')
      replacement.className = `${control.className} exported-field`
      replacement.textContent = value
      if (!value) replacement.classList.add('is-empty-export')
      control.replaceWith(replacement)
    })
    root.querySelectorAll('.is-empty-export').forEach((node) => {
      const listItem = node.closest('li')
      if (listItem) listItem.remove()
      else node.remove()
    })
    root.querySelectorAll('.cv-item').forEach((item) => {
      if (!item.textContent?.trim()) item.remove()
    })
    root.querySelectorAll('.cv-section').forEach((section) => {
      if (!section.textContent?.trim()) section.remove()
    })
  }

  function collectCss() {
    return Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n')
        } catch {
          return ''
        }
      })
      .join('\n')
  }

  function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = src
    })
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
    const checks = [data.name, data.headline, data.email, data.phone, data.location, data.summary, data.sections.find((section) => section.type === 'experience')?.items[0]?.title]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }

  function toMarkdown(data: CvData) {
    const lines = [data.name ? `# ${data.name}` : '', data.headline ? `**${data.headline}**` : '', [data.email, data.phone, data.location, data.website].filter(Boolean).join(' · '), data.summary ? `## Perfil\n\n${data.summary}` : ''].filter(Boolean)
    for (const section of data.sections) {
      const sectionLines: string[] = []
      for (const item of section.items) {
        if (item.title) sectionLines.push(`### ${item.title}`)
        const meta = [item.subtitle, item.meta].filter(Boolean).join(' · ')
        if (meta) sectionLines.push(`_${meta}_`)
        if (item.description) sectionLines.push(item.description)
        item.bullets.filter(Boolean).forEach((bullet) => sectionLines.push(`- ${bullet}`))
      }
      if (sectionLines.length) lines.push(`## ${section.title}\n\n${sectionLines.join('\n\n')}`)
    }
    return lines.join('\n\n').replace(/\n{3,}/g, '\n\n')
  }

  function escapeHtml(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function toWordHtml(data: CvData) {
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(data.name || 'CV')}</title></head><body>${toMarkdown(data).split('\n').map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</body></html>`
  }
</script>

<svelte:head>
  <title>Generador de CV online gratis | PDF, Word, Markdown y JSON</title>
  <meta name="description" content="Crea un currículum visual directamente en el navegador, elige plantilla y exporta tu CV a PDF, Word, Markdown o JSON." />
</svelte:head>

<div class="app-shell">
  <a class="skip-link" href="#editor">Saltar al editor</a>
  <header class="site-header">
    <nav class="header-inner" aria-label="Navegación principal">
      <a class="brand" href="./" aria-label="Ir al inicio"><span class="brand-mark">CV</span><span><strong>CV Generator</strong><small>Editor visual privado</small></span></a>
      <div class="header-actions"><button class="btn btn-ghost hide-mobile" type="button" on:click={() => (wizardOpen = true)}>Wizard inicial</button><button class="btn btn-secondary" type="button" on:click={toggleTheme}>Cambiar tema</button></div>
    </nav>
  </header>

  <main id="main">
    <section class="hero-section" aria-labelledby="main-title">
      <div class="hero-content"><span class="badge">PDF fiel al diseño · Sin subir archivos</span><h1 id="main-title">Crea y edita tu CV directamente sobre el documento</h1><p>Rellena solo los campos necesarios. Los textos vacíos no aparecen en PDF, Markdown ni Word.</p><div class="hero-actions"><a class="btn btn-primary" href="#editor">Empezar</a><button class="btn btn-secondary" type="button" on:click={openPdfPreview}>Previsualizar PDF</button></div></div>
      <aside class="hero-card" aria-label="Estado del CV"><strong>{completion}% completo</strong><div class="progress" aria-hidden="true"><span style={`width: ${completion}%`}></span></div><p>{statusMessage}</p></aside>
    </section>

    <section class="editor-layout" id="editor" aria-label="Editor visual de CV">
      <aside class="control-panel" class:open={showMobilePanel} aria-label="Opciones del generador">
        <div class="panel-header"><div><span class="eyebrow">Configuración</span><h2>Diseño y exportación</h2></div><button class="icon-button mobile-only" type="button" on:click={() => (showMobilePanel = false)} aria-label="Cerrar opciones">×</button></div>
        <section class="panel-card"><h3>Modelos de CV</h3><div class="theme-list">{#each themes as theme}<button class:active={selectedTheme === theme.id} class="theme-option" type="button" on:click={() => (selectedTheme = theme.id)}><strong>{theme.name}</strong><span>{theme.description}</span></button>{/each}</div></section>
        <section class="panel-card"><h3>Fotografía</h3><input bind:this={photoInput} class="sr-only" type="file" accept="image/*" on:change={handlePhoto} /><button class="btn btn-secondary full" type="button" on:click={() => photoInput?.click()}>{cv.photoDataUrl ? 'Cambiar fotografía' : 'Añadir fotografía'}</button>{#if cv.photoDataUrl}<button class="btn btn-ghost full" type="button" on:click={() => updateCvField('photoDataUrl', '')}>Quitar fotografía</button>{/if}</section>
        <section class="panel-card"><h3>Apartados</h3><div class="button-grid"><button class="btn btn-secondary" type="button" on:click={() => addSection('experience')}>Experiencia</button><button class="btn btn-secondary" type="button" on:click={() => addSection('education')}>Formación</button><button class="btn btn-secondary" type="button" on:click={() => addSection('skills')}>Competencias</button><button class="btn btn-secondary" type="button" on:click={() => addSection('projects')}>Proyectos</button><button class="btn btn-secondary" type="button" on:click={() => addSection('languages')}>Idiomas</button><button class="btn btn-secondary" type="button" on:click={() => addSection('custom')}>Personalizado</button></div></section>
        <section class="panel-card"><h3>Exportar</h3><div class="export-grid"><button class="btn btn-primary" type="button" on:click={openPdfPreview}>Preview PDF</button><button class="btn btn-secondary" type="button" on:click={exportWord}>Word</button><button class="btn btn-secondary" type="button" on:click={() => (dataModal = 'markdown')}>Markdown</button><button class="btn btn-secondary" type="button" on:click={() => (dataModal = 'json')}>JSON</button></div><input bind:this={importInput} class="sr-only" type="file" accept="application/json,.json" on:change={handleImport} /><button class="btn btn-ghost full" type="button" on:click={importJson}>Importar JSON</button></section>
        <section class="panel-card"><h3>Acciones</h3><button class="btn btn-secondary full" type="button" on:click={() => (wizardOpen = true)}>Abrir wizard</button><button class="btn btn-danger full" type="button" on:click={resetCv}>Reiniciar CV</button></section>
      </aside>

      <section class="workspace" aria-label="Previsualización editable">
        <div class="workspace-toolbar"><button class="btn btn-secondary mobile-only" type="button" on:click={() => (showMobilePanel = true)}>Opciones</button><p>{statusMessage}</p></div>
        <article bind:this={cvPage} class={`cv-page cv-${selectedTheme}`} aria-label="Currículum editable">
          <header class="cv-header">
            {#if cv.photoDataUrl}<img class="cv-photo" src={cv.photoDataUrl} alt="Foto del CV" />{:else}<button class="cv-photo photo-actions" type="button" on:click={() => photoInput?.click()}>Añadir foto</button>{/if}
            <div class="cv-identity"><input class="cv-name cv-input" aria-label="Nombre" placeholder="Tu nombre" bind:value={cv.name} on:input={() => updateCvField('name', cv.name)} /><input class="cv-headline cv-input" aria-label="Titular profesional" placeholder="Puesto objetivo o especialidad" bind:value={cv.headline} on:input={() => updateCvField('headline', cv.headline)} /></div>
            <ul class="cv-contact" aria-label="Datos de contacto"><li><input class="cv-input" aria-label="Email" placeholder="email@ejemplo.com" bind:value={cv.email} on:input={() => updateCvField('email', cv.email)} /></li><li><input class="cv-input" aria-label="Teléfono" placeholder="Teléfono" bind:value={cv.phone} on:input={() => updateCvField('phone', cv.phone)} /></li><li><input class="cv-input" aria-label="Ubicación" placeholder="Ciudad, país" bind:value={cv.location} on:input={() => updateCvField('location', cv.location)} /></li><li><input class="cv-input" aria-label="Web" placeholder="Web o LinkedIn" bind:value={cv.website} on:input={() => updateCvField('website', cv.website)} /></li></ul>
          </header>

          <section class="cv-summary" aria-labelledby="summary-title"><h2 id="summary-title">Perfil</h2><textarea class="cv-textarea" aria-label="Resumen profesional" placeholder="Resumen profesional" bind:value={cv.summary} on:input={() => updateCvField('summary', cv.summary)}></textarea></section>

          {#each cv.sections as section, index (section.id)}
            <section class="cv-section" aria-label={section.title}>
              <div class="section-toolbar"><input class="section-title cv-input" aria-label="Título del apartado" bind:value={section.title} on:input={() => updateSection(section.id, { title: section.title })} /><div class="mini-actions"><button type="button" on:click={() => moveSection(section.id, -1)} disabled={index === 0}>↑</button><button type="button" on:click={() => moveSection(section.id, 1)} disabled={index === cv.sections.length - 1}>↓</button><button type="button" on:click={() => addItem(section.id)}>+ item</button><button type="button" on:click={() => removeSection(section.id)}>×</button></div></div>
              {#each section.items as item (item.id)}
                <div class="cv-item"><div class="item-heading"><div><input class="item-title cv-input" aria-label="Título del elemento" placeholder="Título" bind:value={item.title} on:input={() => updateItem(section.id, item.id, { title: item.title })} /><input class="item-subtitle cv-input" aria-label="Subtítulo del elemento" placeholder="Empresa, centro o detalle" bind:value={item.subtitle} on:input={() => updateItem(section.id, item.id, { subtitle: item.subtitle })} /></div><input class="item-meta cv-input" aria-label="Fechas o información adicional" placeholder="Fechas" bind:value={item.meta} on:input={() => updateItem(section.id, item.id, { meta: item.meta })} /></div><textarea class="cv-textarea item-description" aria-label="Descripción" placeholder="Descripción" bind:value={item.description} on:input={() => updateItem(section.id, item.id, { description: item.description })}></textarea>{#if item.bullets.length}<ul class="bullet-list">{#each item.bullets as bullet, bulletIndex}<li><input class="cv-input" aria-label="Punto destacado" placeholder="Punto destacado" value={bullet} on:input={(event) => updateBullet(section.id, item.id, bulletIndex, inputValue(event))} /><button type="button" aria-label="Eliminar punto" on:click={() => removeBullet(section.id, item.id, bulletIndex)}>×</button></li>{/each}</ul>{/if}<div class="item-actions"><button type="button" on:click={() => addBullet(section.id, item.id)}>Añadir punto</button><button type="button" on:click={() => removeItem(section.id, item.id)}>Eliminar item</button></div></div>
              {/each}
            </section>
          {/each}
        </article>
      </section>
    </section>
  </main>
</div>

{#if wizardOpen}<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="wizard-title"><div class="modal-header"><div><span class="eyebrow">Primer paso</span><h2 id="wizard-title">Añade los datos básicos de tu CV</h2></div><button class="icon-button" type="button" on:click={skipWizard} aria-label="Cerrar wizard">×</button></div><div class="wizard-grid"><label><span>Nombre completo</span><input class="input" bind:value={wizard.name} placeholder="Ej. Ana García" /></label><label><span>Titular profesional</span><input class="input" bind:value={wizard.headline} placeholder="Ej. Desarrolladora frontend" /></label><label><span>Email</span><input class="input" bind:value={wizard.email} type="email" placeholder="ana@email.com" /></label><label><span>Teléfono</span><input class="input" bind:value={wizard.phone} placeholder="+34..." /></label><label><span>Ubicación</span><input class="input" bind:value={wizard.location} placeholder="Ciudad, país" /></label><label><span>Web o LinkedIn</span><input class="input" bind:value={wizard.website} placeholder="https://..." /></label><label class="wide"><span>Resumen profesional</span><textarea class="textarea" bind:value={wizard.summary} rows="4" placeholder="Describe tu perfil en 3 o 4 líneas."></textarea></label></div><div class="modal-actions"><button class="btn btn-secondary" type="button" on:click={skipWizard}>Usar CV vacío</button><button class="btn btn-primary" type="button" on:click={applyWizard}>Crear CV editable</button></div></div></div>{/if}

{#if dataModal}<div class="modal-backdrop"><div class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="data-modal-title"><div class="modal-header"><div><span class="eyebrow">Exportación</span><h2 id="data-modal-title">{dataModalTitle}</h2></div><button class="icon-button" type="button" on:click={() => (dataModal = null)} aria-label="Cerrar">×</button></div><textarea class="textarea code-output" readonly value={dataModalText}></textarea><div class="modal-actions"><button class="btn btn-secondary" type="button" on:click={copyModalText}>Copiar</button>{#if dataModal === 'markdown'}<button class="btn btn-primary" type="button" on:click={exportMarkdown}>Descargar Markdown</button>{:else}<button class="btn btn-primary" type="button" on:click={exportJson}>Descargar JSON</button>{/if}</div></div></div>{/if}

{#if pdfModalOpen}<div class="modal-backdrop"><div class="modal modal-pdf" role="dialog" aria-modal="true" aria-labelledby="pdf-modal-title"><div class="modal-header"><div><span class="eyebrow">Vista previa</span><h2 id="pdf-modal-title">PDF antes de descargar</h2></div><button class="icon-button" type="button" on:click={() => (pdfModalOpen = false)} aria-label="Cerrar">×</button></div><iframe class="pdf-frame" src={pdfPreviewUrl} title="Vista previa del PDF"></iframe><div class="modal-actions"><button class="btn btn-primary" type="button" on:click={downloadPdf}>Descargar PDF</button></div></div></div>{/if}
