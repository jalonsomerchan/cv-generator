import { readFileSync, writeFileSync } from 'node:fs'

const file = 'src/App.svelte'
let source = readFileSync(file, 'utf8')

const themeUnion = "type CvTheme = 'azul' | 'grafito' | 'minimal' | 'oliva' | 'marino' | 'atlas' | 'coral' | 'violeta' | 'arena' | 'tinta' | 'aurora' | 'ejecutivo' | 'sidebar' | 'editorial' | 'tech'"

const themeType = `type ThemeCfg = {
    accent: string
    accent2: string
    text: string
    muted: string
    bg: string
    soft: string
    line: string
    dark: boolean
    layout: 'normal' | 'sidebar' | 'minimal' | 'editorial'
    photoRound?: number
    strongLines?: boolean
  }`

const themeList = `const themes: { id: CvTheme; name: string; description: string }[] = [
    { id: 'azul', name: 'Azul profesional', description: 'Clásico, limpio y muy cercano al PDF.' },
    { id: 'grafito', name: 'Grafito ejecutivo', description: 'Formal, blanco y negro, líneas fuertes.' },
    { id: 'minimal', name: 'Minimal', description: 'Mucho aire, tipografía sobria y márgenes amplios.' },
    { id: 'oliva', name: 'Oliva lateral', description: 'Sidebar verde suave, estable y legible.' },
    { id: 'marino', name: 'Marino lateral', description: 'Sidebar azul oscuro compacto.' },
    { id: 'atlas', name: 'Atlas', description: 'Lateral azul corporativo con foto redonda.' },
    { id: 'coral', name: 'Coral editorial', description: 'Cálido, serif y con acento lateral.' },
    { id: 'violeta', name: 'Violeta creativo', description: 'Color moderno sin efectos difíciles de exportar.' },
    { id: 'arena', name: 'Arena minimal', description: 'Neutro cálido y discreto.' },
    { id: 'tinta', name: 'Tinta tech', description: 'Oscuro, controlado y PDF-first.' },
  ]`

const themeCfg = `const themeCfg: Record<CvTheme, ThemeCfg> = {
    azul: { accent: '#2563eb', accent2: '#1d4ed8', text: '#111827', muted: '#64748b', bg: '#ffffff', soft: '#eff6ff', line: '#bfdbfe', dark: false, layout: 'normal', photoRound: 18 },
    grafito: { accent: '#111827', accent2: '#374151', text: '#111827', muted: '#4b5563', bg: '#ffffff', soft: '#f9fafb', line: '#111827', dark: false, layout: 'normal', photoRound: 5, strongLines: true },
    minimal: { accent: '#0f172a', accent2: '#334155', text: '#0f172a', muted: '#64748b', bg: '#ffffff', soft: '#ffffff', line: '#e5e7eb', dark: false, layout: 'minimal', photoRound: 999 },
    oliva: { accent: '#3f6212', accent2: '#65a30d', text: '#1f2937', muted: '#64748b', bg: '#ffffff', soft: '#f7fee7', line: '#d9f99d', dark: false, layout: 'sidebar', photoRound: 18 },
    marino: { accent: '#0f3a5f', accent2: '#0369a1', text: '#0f172a', muted: '#475569', bg: '#ffffff', soft: '#e0f2fe', line: '#7dd3fc', dark: false, layout: 'sidebar', photoRound: 10 },
    atlas: { accent: '#1e40af', accent2: '#2563eb', text: '#172033', muted: '#64748b', bg: '#ffffff', soft: '#dbeafe', line: '#93c5fd', dark: false, layout: 'sidebar', photoRound: 999 },
    coral: { accent: '#be123c', accent2: '#f97316', text: '#111827', muted: '#57534e', bg: '#fffaf5', soft: '#fff1f2', line: '#fecdd3', dark: false, layout: 'editorial', photoRound: 16 },
    violeta: { accent: '#6d28d9', accent2: '#9333ea', text: '#111827', muted: '#64748b', bg: '#ffffff', soft: '#f5f3ff', line: '#ddd6fe', dark: false, layout: 'normal', photoRound: 22 },
    arena: { accent: '#92400e', accent2: '#d97706', text: '#1c1917', muted: '#78716c', bg: '#fffbeb', soft: '#fef3c7', line: '#fde68a', dark: false, layout: 'minimal', photoRound: 999 },
    tinta: { accent: '#38bdf8', accent2: '#a78bfa', text: '#f8fafc', muted: '#cbd5e1', bg: '#0f172a', soft: '#1e293b', line: '#334155', dark: true, layout: 'normal', photoRound: 18 },
    aurora: { accent: '#2563eb', accent2: '#7c3aed', text: '#111827', muted: '#64748b', bg: '#ffffff', soft: '#eff6ff', line: '#bfdbfe', dark: false, layout: 'normal', photoRound: 18 },
    ejecutivo: { accent: '#111827', accent2: '#374151', text: '#111827', muted: '#4b5563', bg: '#ffffff', soft: '#f9fafb', line: '#111827', dark: false, layout: 'normal', photoRound: 5, strongLines: true },
    sidebar: { accent: '#0f766e', accent2: '#14b8a6', text: '#0f172a', muted: '#64748b', bg: '#ffffff', soft: '#ecfeff', line: '#99f6e4', dark: false, layout: 'sidebar', photoRound: 18 },
    editorial: { accent: '#be123c', accent2: '#9f1239', text: '#111827', muted: '#57534e', bg: '#fffaf5', soft: '#fff1f2', line: '#fecdd3', dark: false, layout: 'editorial', photoRound: 16 },
    tech: { accent: '#38bdf8', accent2: '#8b5cf6', text: '#f8fafc', muted: '#cbd5e1', bg: '#0f172a', soft: '#1e293b', line: '#334155', dark: true, layout: 'normal', photoRound: 18 },
  }`

source = source.replace(/type CvTheme = .+/, themeUnion)
source = source.replace(/type ThemeCfg = \{[\s\S]*?\n  \}/, themeType)
source = source.replace(/const themes: \{ id: CvTheme; name: string; description: string \}\[\] = \[[\s\S]*?\n  \]/, themeList)
source = source.replace(/const themeCfg: Record<CvTheme, ThemeCfg> = \{[\s\S]*?\n  \}/, themeCfg)
source = source.replace("let selectedTheme: CvTheme = 'aurora'", "let selectedTheme: CvTheme = 'azul'")
source = source.replace("$: dataModalText = dataModal === 'markdown' ? markdownContent : jsonContent", "$: dataModalText = dataModal === 'markdown' ? markdownContent : jsonContent\n  $: editorVars = `--cv-accent:${themeCfg[selectedTheme].accent};--cv-accent-2:${themeCfg[selectedTheme].accent2};--cv-text:${themeCfg[selectedTheme].text};--cv-muted:${themeCfg[selectedTheme].muted};--cv-bg:${themeCfg[selectedTheme].bg};--cv-soft:${themeCfg[selectedTheme].soft};--cv-line:${themeCfg[selectedTheme].line};--cv-photo-radius:${themeCfg[selectedTheme].photoRound ?? 18}px;`")
source = source.replace("<article class={`cv-page cv-${selectedTheme}`} aria-label=\"Currículum editable\">", "<article class={`cv-page cv-${selectedTheme} cv-${themeCfg[selectedTheme].layout} ${themeCfg[selectedTheme].dark ? 'cv-dark' : ''}`} style={editorVars} aria-label=\"Currículum editable\">")
source = source.replaceAll("selectedTheme === 'aurora'", "(selectedTheme === 'aurora' || selectedTheme === 'azul' || selectedTheme === 'violeta')")
source = source.replaceAll("selectedTheme === 'tech'", "(selectedTheme === 'tech' || selectedTheme === 'tinta')")
source = source.replaceAll("selectedTheme === 'ejecutivo' ? 10 : 36", "themeCfg[selectedTheme].photoRound ?? 36")
source = source.replaceAll("drawPhoto(photo, margin, sidebarY, 190, 36)", "drawPhoto(photo, margin, sidebarY, 190, themeCfg[selectedTheme].photoRound ?? 36)")
source = source.replace("ctx.lineWidth = 3", "ctx.lineWidth = cfg.strongLines ? 4 : 3")

writeFileSync(file, source)
