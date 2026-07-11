import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const MANIFEST_PATH = path.join(ROOT, "books", "manifest.json")
const IBM_PLEX_STYLESHEET = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap"

const escapeHtml = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;")

const escapeAttribute = escapeHtml

const cyrillicMap = Object.freeze({
  а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"i",
  к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
  х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya"
})

export function stableAnchor(value) {
  const transliterated = String(value).toLowerCase()
    .split("")
    .map(char => cyrillicMap[char] ?? char)
    .join("")
  return transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section"
}

function sourceSha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex")
}

function stripFrontmatter(markdown) {
  const normalized = markdown.replace(/\r\n?/g, "\n")
  if (!normalized.startsWith("---\n")) return normalized
  const end = normalized.indexOf("\n---\n", 4)
  return end < 0 ? normalized : normalized.slice(end + 5)
}

function extractDocument(markdown) {
  const withoutFrontmatter = stripFrontmatter(markdown)
  const lines = withoutFrontmatter.split("\n")
  const titleIndex = lines.findIndex(line => /^#\s+/.test(line))
  if (titleIndex < 0) throw new Error("Canonical Markdown must contain one H1")
  return {
    title: lines[titleIndex].replace(/^#\s+/, "").trim(),
    markdown: lines.slice(titleIndex + 1).join("\n").replace(/^\n+/, "")
  }
}

const excludedBookSectionTitles = new Set([
  "источники / подкладка",
  "источники",
  "источники и подкладка"
])

export function filterBookOnlySections(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n")
  const filtered = []
  let excludedLevel = null

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/)
    if (excludedLevel !== null) {
      if (!heading || heading[1].length > excludedLevel) continue
      excludedLevel = null
    }
    if (heading && excludedBookSectionTitles.has(heading[2].trim().toLowerCase())) {
      excludedLevel = heading[1].length
      continue
    }
    filtered.push(line)
  }

  return filtered.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()
}

function renderInline(value) {
  const tokens = []
  const token = html => {
    const index = tokens.push(html) - 1
    return `\u0000${index}\u0000`
  }
  let output = String(value)
    .replace(/`([^`\n]+)`/g, (_, code) => token(`<code>${escapeHtml(code)}</code>`))
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, (_, slug, label) =>
      token(`<span class="book-crossref" data-wiki-slug="${escapeAttribute(slug.trim())}">${escapeHtml(label.trim())}</span>`))
    .replace(/\[\[([^\]]+)\]\]/g, (_, slug) =>
      token(`<span class="book-crossref" data-wiki-slug="${escapeAttribute(slug.trim())}">${escapeHtml(slug.trim())}</span>`))

  output = escapeHtml(output)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^\w])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/  \n/g, "<br>\n")
    .replace(/\n/g, " ")
    .replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)])

  return output
}

function isTableSeparator(line) {
  const cells = line.trim().replace(/^\||\|$/g, "").split("|")
  return cells.length > 0 && cells.every(cell => /^\s*:?-{3,}:?\s*$/.test(cell))
}

function tableCells(line) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim())
}

export function renderMarkdown(markdown, options = {}) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n")
  const html = []
  const anchors = new Map()
  let interludeOpen = false
  let index = 0

  const uniqueAnchor = title => {
    const base = stableAnchor(title)
    const count = (anchors.get(base) || 0) + 1
    anchors.set(base, count)
    return count === 1 ? base : `${base}-${count}`
  }

  const closeInterlude = () => {
    if (!interludeOpen) return
    html.push("</section>")
    interludeOpen = false
  }

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }

    const heading = line.match(/^(#{2,6})\s+(.+)$/)
    if (heading) {
      const level = heading[1].length
      const title = heading[2].trim()
      const anchor = uniqueAnchor(title)
      if (interludeOpen && level <= 2) closeInterlude()
      if (options.interlude?.anchor === anchor) {
        html.push(`<section class="book-interlude" data-book-internal-interlude="${escapeAttribute(anchor)}">`)
        interludeOpen = true
      }
      html.push(`<h${level} id="${escapeAttribute(anchor)}">${renderInline(title)}</h${level}>`)
      index += 1
      continue
    }

    if (/^```/.test(line)) {
      const language = line.slice(3).trim().replace(/[^\w-]/g, "")
      const code = []
      index += 1
      while (index < lines.length && !/^```/.test(lines[index])) {
        code.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      html.push(`<pre><code${language ? ` class="language-${escapeAttribute(language)}"` : ""}>${escapeHtml(code.join("\n"))}</code></pre>`)
      continue
    }

    if (/^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      html.push("<hr>")
      index += 1
      continue
    }

    if (/^>\s?/.test(line)) {
      const quoteLines = []
      while (index < lines.length && /^>/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""))
        index += 1
      }
      const quoteParagraphs = quoteLines.join("\n").split(/\n{2,}/)
        .filter(paragraph => paragraph.trim())
        .map(paragraph => `<p>${renderInline(paragraph)}</p>`)
        .join("")
      html.push(`<blockquote>${quoteParagraphs}</blockquote>`)
      continue
    }

    if (/^[-*+]\s+/.test(line)) {
      const items = []
      while (index < lines.length && /^[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*+]\s+/, ""))
        index += 1
      }
      html.push(`<ul>${items.map(item => `<li>${renderInline(item)}</li>`).join("")}</ul>`)
      continue
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items = []
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+[.)]\s+/, ""))
        index += 1
      }
      html.push(`<ol>${items.map(item => `<li>${renderInline(item)}</li>`).join("")}</ol>`)
      continue
    }

    if (line.includes("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const headers = tableCells(line)
      index += 2
      const rows = []
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(tableCells(lines[index]))
        index += 1
      }
      html.push(`<table><thead><tr>${headers.map(cell => `<th scope="col">${renderInline(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map((_, cellIndex) => `<td>${renderInline(row[cellIndex] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`)
      continue
    }

    const paragraph = [line]
    index += 1
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{2,6})\s+/.test(lines[index]) &&
      !/^```/.test(lines[index]) &&
      !/^>/.test(lines[index]) &&
      !/^[-*+]\s+/.test(lines[index]) &&
      !/^\d+[.)]\s+/.test(lines[index]) &&
      !/^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(lines[index])
    ) {
      paragraph.push(lines[index])
      index += 1
    }
    html.push(`<p>${renderInline(paragraph.join("\n"))}</p>`)
  }

  closeInterlude()
  return html.join("\n")
}

function relativeHref(fromOutput, toOutput) {
  const fromDirectory = path.posix.dirname(fromOutput)
  let relative = path.posix.relative(fromDirectory, path.posix.dirname(toOutput))
  if (!relative) relative = "."
  return `${relative}/`
}

function rootRelativeHref(fromOutput, target) {
  const fromDirectory = path.posix.dirname(fromOutput)
  return path.posix.relative(fromDirectory, target)
}

function renderFontLoader() {
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${escapeAttribute(IBM_PLEX_STYLESHEET)}" rel="stylesheet">`
}

function renderReaderRail(manifest, item, index) {
  return `<aside class="book-reader-rail" id="book-contents" aria-label="Текущая часть"><div class="book-reader-rail-sticky"><span>PART</span><strong class="book-reader-part">${escapeHtml(item.number)}</strong><span class="book-reader-position">${String(index + 1).padStart(2, "0")} / ${String(manifest.route.length).padStart(2, "0")}</span><div class="book-rail-progress" role="progressbar" aria-label="Прогресс чтения" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i data-reading-progress-fill></i></div></div></aside>`
}

function renderRelated(item) {
  if (!item.relatedNodes?.length) return ""
  return item.relatedNodes.map(related => `<aside class="book-related" aria-label="Дополнительное чтение"><div class="book-related-label">ДОПОЛНИТЕЛЬНОЕ ЧТЕНИЕ</div><span class="book-related-node" data-node-id="${escapeAttribute(related.nodeId)}">${escapeHtml(related.title)}</span><span class="book-related-description">${escapeHtml(related.description)}</span></aside>`).join("")
}

function renderPager(manifest, item, index) {
  const previous = manifest.route[index - 1]
  const next = manifest.route[index + 1]
  const previousMarkup = previous
    ? `<a class="book-pager-previous" data-pager="previous" href="${escapeAttribute(relativeHref(item.output, previous.output))}"><span class="book-pager-direction">← PREVIOUS</span><span class="book-pager-title">${escapeHtml(previous.shortTitle)}</span></a>`
    : `<span class="book-pager-previous book-pager-empty" data-pager="previous"><span class="book-pager-direction">PREVIOUS</span><span class="book-pager-title">Начало маршрута</span></span>`
  const nextMarkup = next
    ? `<a class="book-pager-next" data-pager="next" href="${escapeAttribute(relativeHref(item.output, next.output))}"><span class="book-pager-direction">NEXT →</span><span class="book-pager-title">${escapeHtml(next.shortTitle)}</span></a>`
    : `<span class="book-pager-next book-pager-empty" data-pager="next"><span class="book-pager-direction">NEXT</span><span class="book-pager-title">Конец маршрута</span></span>`
  return `<nav class="book-pager" aria-label="Навигация по книгам" data-prev-id="${escapeAttribute(previous?.id || "")}" data-next-id="${escapeAttribute(next?.id || "")}">${previousMarkup}${nextMarkup}</nav>`
}

function renderReaderPage(manifest, item, index, source) {
  const styleHref = rootRelativeHref(item.output, "books/books.css")
  const scriptHref = rootRelativeHref(item.output, "books/books.js")
  const mapHref = rootRelativeHref(item.output, "index.html")
  const booksHref = relativeHref(item.output, "books/index.html")
  const imageMarkup = item.image
    ? `<figure class="book-image-plate"><img src="${escapeAttribute(rootRelativeHref(item.output, item.image))}" alt=""><figcaption>ARCHIVE IMAGE / ${escapeHtml(item.shortTitle)}</figcaption></figure>`
    : ""
  const documentHtml = renderMarkdown(source.markdown, { interlude: item.internalInterlude })

  return `<!doctype html>
<html lang="ru" data-book-route-id="${escapeAttribute(item.id)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="source-sha256" content="${source.sha256}">
  <title>${escapeHtml(item.title)} — BOGOBOT / BOOKS</title>
  ${renderFontLoader()}
  <link rel="stylesheet" href="${escapeAttribute(styleHref)}">
</head>
<body>
  <a class="skip-link" href="#canonical-text">К каноническому тексту</a>
  <header class="books-topbar">
    <a class="books-mark" href="${escapeAttribute(booksHref)}">БОТ</a>
    <div class="books-brand">BOGOBOT / BOOKS<span>CANONICAL TEXT</span></div>
    <nav class="books-nav" aria-label="Глобальная навигация">
      <a href="${escapeAttribute(mapHref)}">MAP</a>
      <a href="${escapeAttribute(booksHref)}">BOOKS INDEX</a>
      <a href="#book-contents">CONTENTS</a>
    </nav>
  </header>
  <div class="book-reader-layout">
    ${renderReaderRail(manifest, item, index)}
    <main class="book-reader-main" id="canonical-text">
      <article class="book-article">
      <header class="book-reader-header">
        <p class="book-eyebrow">CANONICAL TEXT / ${escapeHtml(item.role)}</p>
        <h1 class="book-reader-title">${escapeHtml(item.title)}</h1>
      </header>
      ${imageMarkup}
      <div class="book-document" data-source-path="${escapeAttribute(item.source)}" data-source-sha256="${source.sha256}">
${documentHtml}
      </div>
      ${renderRelated(item)}
      ${renderPager(manifest, item, index)}
      </article>
    </main>
  </div>
  <script src="${escapeAttribute(scriptHref)}" defer></script>
</body>
</html>
`
}

function renderIndexPage(manifest) {
  const routeItems = manifest.route.map(item => `<li class="book-route-item" data-book-route-item data-route-id="${escapeAttribute(item.id)}" data-route-status="begin"><a class="book-route-link" href="${escapeAttribute(relativeHref("books/index.html", item.output))}"><span class="book-route-number">${escapeHtml(item.number)}</span><span class="book-route-title">${escapeHtml(item.shortTitle)}</span><span class="book-route-role">${escapeHtml(item.role)}<span class="book-route-description">${escapeHtml(item.description)}</span></span><span class="book-route-state"><strong data-route-status>BEGIN</strong><span class="book-route-mini"><i data-route-mini-fill></i></span></span></a></li>`).join("")
  return `<!doctype html>
<html lang="ru" data-books-page="index">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Книги — BOGOBOT</title>
  ${renderFontLoader()}
  <link rel="stylesheet" href="./books.css">
</head>
<body>
  <a class="skip-link" href="#books-route">К маршруту чтения</a>
  <header class="books-topbar">
    <a class="books-mark" href="./">БОТ</a>
    <div class="books-brand">BOGOBOT / BOOKS<span>LINEAR CANONICAL ROUTE</span></div>
    <a class="books-map" href="../">MAP</a>
  </header>
  <div class="books-index-layout">
    <aside class="books-route-rail">READING ROUTE<strong class="books-route-percent" data-route-progress-percent>0%</strong><span class="book-progress-copy"><span data-route-progress-copy>0 / ${manifest.route.length}</span> READ</span><div class="book-route-progress-track"><i data-route-progress-fill></i></div></aside>
    <main class="books-index-main" id="books-route">
      <section class="books-hero"><div><p class="books-kicker">CANONICAL ROUTE / P—−I—00—I—II—∞</p><h1>${escapeHtml(manifest.title)}</h1></div><p>${escapeHtml(manifest.subtitle)}: от сомнения в личности собеседника до сохранения несовпадающих версий мира.</p></section>
      <ol class="book-route-list">${routeItems}</ol>
      <a class="books-primary-action" data-books-primary href="./prologue/">BEGIN WITH PROLOGUE →</a>
      <p class="books-note">Books задаёт порядок чтения, но не создаёт второй редактируемый корпус. Все страницы собираются из canonical Markdown.</p>
    </main>
  </div>
  <script src="./books.js" defer></script>
</body>
</html>
`
}

export function readBooksManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"))
}

export function createBooksOutputs(manifest = readBooksManifest()) {
  const outputs = new Map()
  outputs.set("books/index.html", renderIndexPage(manifest))
  manifest.route.forEach((item, index) => {
    const sourcePath = path.join(ROOT, item.source)
    const buffer = fs.readFileSync(sourcePath)
    const sourceDocument = extractDocument(buffer.toString("utf8"))
    if (sourceDocument.title !== item.title) {
      throw new Error(`Manifest/source title mismatch for ${item.id}: ${sourceDocument.title}`)
    }
    outputs.set(item.output, renderReaderPage(manifest, item, index, {
      ...sourceDocument,
      markdown: filterBookOnlySections(sourceDocument.markdown),
      sha256: sourceSha256(buffer)
    }))
  })
  return outputs
}

export function writeBooksOutputs(outputs = createBooksOutputs()) {
  for (const [relativePath, content] of outputs) {
    const outputPath = path.join(ROOT, relativePath)
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, content)
  }
  return outputs
}

export function checkBooksOutputs(outputs = createBooksOutputs()) {
  const mismatches = []
  for (const [relativePath, expected] of outputs) {
    const outputPath = path.join(ROOT, relativePath)
    if (!fs.existsSync(outputPath)) {
      mismatches.push([relativePath, "missing"])
      continue
    }
    const actual = fs.readFileSync(outputPath, "utf8")
    if (actual !== expected) mismatches.push([relativePath, "outdated"])
  }
  return mismatches
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const outputs = createBooksOutputs()
  const checkOnly = process.argv.includes("--check")
  const mismatches = checkOnly ? checkBooksOutputs(outputs) : []
  if (!checkOnly) writeBooksOutputs(outputs)
  console.log(JSON.stringify({
    mode: checkOnly ? "check" : "build",
    routeItems: readBooksManifest().route.length,
    generatedPages: outputs.size,
    mismatches
  }, null, 2))
  if (mismatches.length) process.exit(1)
}
