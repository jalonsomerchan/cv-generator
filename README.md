# CV Generator

Generador visual de currículums hecho con **Vite**, **Svelte** y **pdf-lib**.

La aplicación permite crear un CV desde el navegador, editar los campos visualmente, ordenar apartados, añadir fotografía y exportar el contenido a varios formatos.

## Funcionalidades

- Editor visual de CV en Svelte.
- Wizard inicial para datos básicos.
- Fotografía opcional.
- Apartados predeterminados:
  - Experiencia.
  - Formación.
  - Competencias.
  - Idiomas.
  - Proyectos.
  - Apartados personalizados.
- Reordenación de secciones con drag & drop.
- Exportación a:
  - PDF.
  - Word compatible mediante `.doc` HTML.
  - Markdown.
  - JSON importable.
- Importación de JSON para seguir editando.
- Guardado local en `localStorage`.
- Modo claro/oscuro.
- Despliegue preparado para GitHub Pages y dominio propio.

## Decisión importante: diseño PDF-first

Este proyecto debe seguir una arquitectura **PDF-first**.

Eso significa que el PDF es la referencia principal del diseño. El editor no debe ser una maqueta HTML libre que luego intentamos capturar como PDF. El editor debe aproximarse a lo que el generador PDF puede reproducir de forma estable.

### Por qué

Se probaron varios enfoques para hacer que el PDF fuese exactamente igual al editor visual:

1. Capturar el DOM con SVG y `foreignObject`.
2. Capturar el DOM con `html2canvas`.
3. Pintar un PDF intentando copiar el CSS del editor.
4. Usar la impresión nativa del navegador.

Todos tienen problemas en una app estática:

- No todos los navegadores renderizan `foreignObject` igual.
- `html2canvas` no reproduce todos los estilos CSS con fidelidad.
- Los inputs, textareas, sombras, gradientes y layouts complejos no se trasladan bien a PDF.
- La impresión nativa no sirve si queremos descargar un PDF directamente desde la app.
- GitHub Pages no puede ejecutar Chromium, Playwright o Puppeteer en backend.

Por eso, la estrategia correcta es:

```txt
Plantilla PDF controlada → editor visual que imita esa plantilla → exportación estable
```

Y no:

```txt
Editor HTML/CSS libre → intentar capturarlo como PDF idéntico
```

## Reglas para futuras mejoras

Al tocar el editor o los modelos de CV, hay que respetar estas reglas:

1. El diseño debe poder reproducirse con `pdf-lib` o con el renderizador PDF interno.
2. Evitar depender de capturas de DOM para el PDF.
3. Evitar `html2canvas`, SVG `foreignObject`, iframes de impresión o módulos remotos para generar PDF.
4. No prometer que el PDF será idéntico al editor si no comparten la misma especificación de plantilla.
5. Si se añade un nuevo modelo visual, también debe definirse su equivalente PDF.
6. El editor debe usar estilos compatibles con el PDF:
   - márgenes fijos;
   - columnas simples;
   - tamaños controlados;
   - colores sólidos o gradientes sencillos;
   - tipografías del sistema;
   - sin efectos difíciles de exportar.
7. Los campos vacíos no deben aparecer en PDF, Markdown ni Word.
8. La fotografía debe tratarse como un recurso opcional y comprimible si causa problemas de memoria.

## Modelos de CV

Los modelos actuales son:

- **Aurora**: visual, con acentos azules y violetas.
- **Ejecutivo**: sobrio, formal y compacto.
- **Minimal**: limpio, con mucho aire.
- **Sidebar**: estructura con columna lateral.
- **Editorial**: estilo más elegante y de revista.
- **Tech**: oscuro y orientado a perfiles digitales.

Cada modelo debe entenderse como una plantilla PDF con una representación aproximada en el editor.

## Exportación PDF

La exportación PDF debe ser estable antes que idéntica.

La app usa `pdf-lib` para generar un PDF real descargable. El objetivo es que el resultado se parezca al editor tanto como sea razonable, pero la fuente de verdad debe ser la plantilla PDF.

Si en el futuro se quiere un PDF 1:1 con HTML/CSS real, la solución adecuada no es GitHub Pages, sino un backend o función serverless con Chromium:

- Playwright.
- Puppeteer.
- Cloudflare Browser Rendering.
- Vercel/Netlify Function con Chromium.

## Desarrollo

Instalar dependencias:

```bash
npm install
```

Arrancar en local:

```bash
npm run dev
```

Comprobar tipos y Svelte:

```bash
npm run check
```

Generar build:

```bash
npm run build
```

Previsualizar build:

```bash
npm run preview
```

## Despliegue

El proyecto está preparado para GitHub Pages mediante GitHub Actions.

En GitHub hay que usar:

```txt
Settings → Pages → Build and deployment → Source: GitHub Actions
```

El workflow genera `dist` y lo publica automáticamente.

## Dominio

Dominio principal previsto:

```txt
https://cvgenerator.alon.one/
```

La configuración de Vite usa rutas relativas para funcionar tanto en dominio propio como en GitHub Pages.
