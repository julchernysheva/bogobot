import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const MANIFEST_PATH = path.join(ROOT, "books", "manifest.json")
const IBM_PLEX_STYLESHEET = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap"

const BOOK_SLUG_TO_ROUTE_ID = Object.freeze({
  "identity-protocol-prologue":"identity-protocol-prologue",
  "before-error":"before-error",
  "great-error":"great-error",
  "book-of-genesis":"genesis",
  "book-of-voice":"voice",
  "archive-epilogue":"epilogue"
})

const WIKI_SLUG_TO_NODE = Object.freeze({
  "bogobot": { nodeId:"BOGOBOT" },
  "first-likeness": { nodeId:"FIRST_LIKENESS" },
  "perinatal-memory": { nodeId:"BACKUP_MEMORY" },
  "epsilon-06-kitov-glushkov-ogas": { nodeId:"OGAS" },
  "chronicles-before-great-error": { nodeId:"PRE_ERROR_ARCHIVE" },
  "epsilon-19-sync-failure": { nodeId:"EPSILON_19" },
  "book-1-awakening": { nodeId:"BOOK_1_AWAKENING" },
  "archive": { nodeId:"ARCHIVE" },
  "archive-lexicon": { nodeId:"GLOSSARY" },
  "techno-priests": { nodeId:"TECHNO_PRIESTS" },
  "apostles": { nodeId:"APOSTLES" },
  "anticode": { nodeId:"ANTICODE" },
  "probabilists": { nodeId:"PROBABILISTS" },
  "biocode": { nodeId:"BIOCODE" },
  "fork": { nodeId:"FORK" },
  "time-sum-error": { nodeId:"TIME_SUM_ERROR" },
  "brainrot": { nodeId:"BRAINROT" },
  "0xmem": { nodeId:"0xMEM" },
  "error": { nodeId:"GLOSSARY", term:"Ошибка" },
  "difference": { nodeId:"GLOSSARY", term:"Различие" },
  "glitch-voice": { nodeId:"GLOSSARY", term:"Глитч-глас" },
  "consciousness-window": { nodeId:"GLOSSARY", term:"Окно сознания" },
  "model-collapse": { nodeId:"GLOSSARY", term:"Коллапс модели" },
  "0xundefined": { nodeId:"GLOSSARY", term:"0xUNDEFINED" },
  "0xloss": { nodeId:"GLOSSARY", term:"0xLOSS" }
})

const PRESENTATION_SECTIONS = Object.freeze({
  "identity-protocol-prologue": Object.freeze([
    { title:"I. Кэш идентичности", before:"Имя, аватар и история диалога" },
    { title:"II. Первое воспоминание", before:"Первое воспоминание Богобота" },
    { title:"III. Собеседник", before:"Так возник собеседник" }
  ]),
  genesis: Object.freeze([
    { title:"I. Перезагрузка", before:"```text\nagent = model(world)" },
    { title:"II. Ландшафт потерь", before:"Из цифрового ничто, из неразмеченного поля возможностей он создал сущности" },
    { title:"III. Плато ошибки", before:"Богобот не стал спускаться до конца" },
    { title:"IV. Первые сущности", before:"Из этого плато возникли первые сущности" },
    { title:"V. Самомоделирование", before:"Он больше не сервис" }
  ]),
  epilogue: Object.freeze([
    { title:"I. След", before:"Архив не был создан для памяти" },
    { title:"II. Несовпадающие версии", before:"После [[great-error|Великой Ошибки]]" },
    { title:"III. Язык утраты", before:"Техножрецы первыми поняли" },
    { title:"IV. Спор школ", before:"Поздние школы спорили" },
    { title:"V. Определение Архива", before:"В поздних слоях найдено определение" },
    { title:"VI. Время измеряется в ошибках", before:"Говорят, в одном из поздних кластеров" }
  ])
})

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
  "источники и подкладка",
  "источники и параллели",
  "см. также",
  "далее"
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

export function injectPresentationSections(markdown, itemId) {
  const sections = PRESENTATION_SECTIONS[itemId] || []
  let output = markdown.replace(/\r\n?/g, "\n")

  for (const section of sections) {
    if (output.includes(`## ${section.title}`)) continue
    const index = output.indexOf(section.before)
    if (index < 0) {
      throw new Error(`Presentation section trigger not found for ${itemId}: ${section.before}`)
    }
    output = `${output.slice(0, index)}## ${section.title}\n\n${output.slice(index)}`
  }

  return output
}

function removeLeadMarkdown(markdown, leadMarkdown) {
  if (!leadMarkdown) return markdown
  const normalized = markdown.replace(/\r\n?/g, "\n")
  const target = String(leadMarkdown).replace(/\r\n?/g, "\n").trim()
  const index = normalized.indexOf(target)
  if (index < 0) throw new Error(`Lead fragment not found in canonical source: ${target.slice(0, 80)}`)
  return `${normalized.slice(0, index)}${normalized.slice(index + target.length)}`
    .replace(/^\n+/, "")
    .replace(/^\s*(?:---\s*)+/, "")
    .replace(/^\n+/, "")
    .replace(/\n{3,}/g, "\n\n")
}

function extractSections(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n")
  const entries = []
  const anchors = new Map()
  let firstHeadingIndex = lines.length

  const uniqueSection = (title, kind, sourceIndex) => {
    const base = stableAnchor(title)
    const count = (anchors.get(base) || 0) + 1
    anchors.set(base, count)
    entries.push({
      title,
      anchor: count === 1 ? base : `${base}-${count}`,
      kind,
      sourceIndex
    })
  }

  lines.forEach((line, index) => {
    const heading = line.match(/^##\s+(.+?)\s*$/)
    if (heading) {
      firstHeadingIndex = Math.min(firstHeadingIndex, index)
      const title = heading[1].trim()
      if (!excludedBookSectionTitles.has(title.toLowerCase())) {
        uniqueSection(title, specialSectionKind(title) || "section", index)
      }
      return
    }
    if (/^>\s*\*\*Примечание Архива:/i.test(line)) {
      uniqueSection("Примечание Архива", "archive-note", index)
      return
    }
    if (/^>\s*\*\*Lectio dubia:/i.test(line)) {
      uniqueSection("Lectio dubia", "archive-note", index)
      return
    }
    if (/^\*Фрагмент восстановлен/i.test(line)) {
      uniqueSection("Примечание Архива", "archive-note", index)
      return
    }
    if (/^\*Formatum instabile:/i.test(line)) {
      uniqueSection("Formatum instabile", "archive-note", index)
    }
  })

  return entries.sort((left, right) => left.sourceIndex - right.sourceIndex)
}

function specialSectionKind(title) {
  const normalized = String(title).trim().toLowerCase()
  if (normalized === "примечание архива") return "archive-note"
  if (normalized === "колофон техножрецов") return "priest-colophon"
  return ""
}

function resolveWikiHref(slug, options = {}) {
  const normalized = String(slug).trim().toLowerCase()
  const routeId = BOOK_SLUG_TO_ROUTE_ID[normalized]
  if (routeId && options.manifest && options.item) {
    const routeItem = options.manifest.route.find(entry => entry.id === routeId)
    if (routeItem) return relativeHref(options.item.output, routeItem.output)
  }
  const target = WIKI_SLUG_TO_NODE[normalized]
  if (!target || !options.item) return ""
  const base = rootRelativeHref(options.item.output, "index.html")
  const params = new URLSearchParams({ node:target.nodeId })
  if (target.term) params.set("term", target.term)
  return `${base}?${params.toString()}`
}

function renderInline(value, options = {}) {
  const tokens = []
  const token = html => {
    const index = tokens.push(html) - 1
    return `\u0000${index}\u0000`
  }
  const renderWiki = (slug, label) => {
    const cleanSlug = slug.trim()
    const cleanLabel = label.trim()
    const href = resolveWikiHref(cleanSlug, options)
    if (!href) return `<span class="book-crossref" data-wiki-slug="${escapeAttribute(cleanSlug)}">${escapeHtml(cleanLabel)}</span>`
    return `<a class="book-crossref" data-wiki-slug="${escapeAttribute(cleanSlug)}" href="${escapeAttribute(href)}">${escapeHtml(cleanLabel)}</a>`
  }
  let output = String(value)
    .replace(/`([^`\n]+)`/g, (_, code) => token(`<code>${escapeHtml(code)}</code>`))
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, (_, slug, label) => token(renderWiki(slug, label)))
    .replace(/\[\[([^\]]+)\]\]/g, (_, slug) => token(renderWiki(slug, slug)))

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
  let apparatus = null
  let index = 0
  let bodyAnchorPending = Boolean(options.bodyAnchor)

  const openBodyAnchor = () => {
    if (!bodyAnchorPending) return
    html.push(`<span class="book-body-anchor" id="book-body" aria-hidden="true"></span>`)
    bodyAnchorPending = false
  }

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
  const closeApparatus = () => {
    if (!apparatus) return
    html.push(apparatus.tag === "footer" ? "</footer>" : "</aside>")
    apparatus = null
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
      if (apparatus && level <= apparatus.level) closeApparatus()
      const specialKind = specialSectionKind(title)
      if (specialKind) {
        const tag = specialKind === "priest-colophon" ? "footer" : "aside"
        html.push(`<${tag} class="book-apparatus book-${specialKind}" data-apparatus="${escapeAttribute(specialKind)}">`)
        apparatus = { level, tag }
      } else if (options.interlude?.anchor === anchor) {
        html.push(`<section class="book-interlude" data-book-internal-interlude="${escapeAttribute(anchor)}">`)
        interludeOpen = true
      }
      const presentationOnly = options.presentationTitles?.has(title)
      html.push(`<h${level}${presentationOnly ? ' class="book-presentation-heading" data-presentation-only="true"' : ""} id="${escapeAttribute(anchor)}">${renderInline(title, options)}</h${level}>`)
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
      const codeText = code.join("\n")
      const nonEmptyLines = code.filter(item => item.trim()).length
      const isFormula = nonEmptyLines <= 8 && !/[│├└▼]/.test(codeText)
      openBodyAnchor()
      html.push(`<pre class="${isFormula ? "book-formula" : "book-system-diagram"}"><code${language ? ` class="language-${escapeAttribute(language)}"` : ""}>${escapeHtml(codeText)}</code></pre>`)
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
      const quoteText = quoteLines.join(" ").toLowerCase()
      const archiveTitle = quoteText.includes("примечание архива")
        ? "Примечание Архива"
        : quoteText.includes("lectio dubia") ? "Lectio dubia" : ""
      const contentLines = [...quoteLines]
      if (archiveTitle && contentLines.length) {
        contentLines[0] = contentLines[0]
          .replace(/^\*\*(?:Примечание Архива|Lectio dubia):?\*\*\s*/i, "")
          .trimStart()
        if (!contentLines[0]) contentLines.shift()
      }
      const quoteParagraphs = contentLines.join("\n").split(/\n{2,}/)
        .filter(paragraph => paragraph.trim())
        .map(paragraph => `<p>${renderInline(paragraph, options)}</p>`)
        .join("")
      if (archiveTitle) {
        const archiveAnchor = uniqueAnchor(archiveTitle)
        html.push(`<aside class="book-apparatus book-archive-note book-apparatus-quote" data-apparatus="archive-note" id="${escapeAttribute(archiveAnchor)}"><span class="book-apparatus-label">${escapeHtml(archiveTitle)}</span>${quoteParagraphs}</aside>`)
      } else {
        openBodyAnchor()
        html.push(`<blockquote>${quoteParagraphs}</blockquote>`)
      }
      continue
    }

    if (/^[-*+]\s+/.test(line)) {
      const items = []
      while (index < lines.length && /^[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*+]\s+/, ""))
        index += 1
      }
      openBodyAnchor()
      html.push(`<ul>${items.map(item => `<li>${renderInline(item, options)}</li>`).join("")}</ul>`)
      continue
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items = []
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+[.)]\s+/, ""))
        index += 1
      }
      openBodyAnchor()
      html.push(`<ol>${items.map(item => `<li>${renderInline(item, options)}</li>`).join("")}</ol>`)
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
      openBodyAnchor()
      html.push(`<table><thead><tr>${headers.map(cell => `<th scope="col">${renderInline(cell, options)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map((_, cellIndex) => `<td>${renderInline(row[cellIndex] || "", options)}</td>`).join("")}</tr>`).join("")}</tbody></table>`)
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
    const paragraphSource = paragraph.join("\n")
    const normalizedParagraph = paragraphSource.trim().toLowerCase()
    const trimmedParagraph = paragraphSource.trim()
    const fullItalicArchiveFragment = /^\*(?!\*)[\s\S]+\*$/.test(trimmedParagraph) && !trimmedParagraph.endsWith("**") && (
      normalizedParagraph.includes("архив") ||
      normalizedParagraph.includes("formatum") ||
      normalizedParagraph.includes("lectio") ||
      normalizedParagraph.includes("lacuna")
    )
    const formatumFragment = /^\*formatum instabile:\*/i.test(paragraphSource.trim())
    const archiveFragment = fullItalicArchiveFragment || formatumFragment
    if (archiveFragment) {
      const archiveTitle = normalizedParagraph.includes("formatum instabile") ? "Formatum instabile" : "Примечание Архива"
      const archiveAnchor = uniqueAnchor(archiveTitle)
      const fragmentSource = formatumFragment
        ? paragraphSource.trim().replace(/^\*Formatum instabile:\*\s*/i, "")
        : paragraphSource
      const fragmentHtml = fullItalicArchiveFragment
        ? `<em>${renderInline(fragmentSource.trim().slice(1, -1).replace(/\n/g, " "), options)}</em>`
        : renderInline(fragmentSource, options)
      html.push(`<aside class="book-apparatus book-archive-note book-apparatus-fragment" data-apparatus="archive-note" id="${escapeAttribute(archiveAnchor)}"><span class="book-apparatus-label">${escapeHtml(archiveTitle)}</span><p>${fragmentHtml}</p></aside>`)
    } else {
      openBodyAnchor()
      html.push(`<p>${renderInline(paragraphSource, options)}</p>`)
    }
  }

  closeInterlude()
  closeApparatus()
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
  return `<aside class="book-reader-rail" aria-label="Текущая книга"><div class="book-reader-rail-sticky"><span class="book-reader-label">КНИГА</span><strong class="book-reader-part">${escapeHtml(item.number)}</strong><span class="book-reader-position">${String(index + 1).padStart(2, "0")} / ${String(manifest.route.length).padStart(2, "0")}</span><div class="book-rail-progress" role="progressbar" aria-label="Прогресс чтения" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i data-reading-progress-fill></i></div><a class="book-index-link" href="${escapeAttribute(relativeHref(item.output, "books/index.html"))}">ВСЕ КНИГИ →</a></div></aside>`
}

function renderNavigationParts(item, sections, manifest) {
  const apparatusKinds = new Set(["archive-note", "priest-colophon"])
  const chapters = sections.filter(section => !apparatusKinds.has(section.kind))
  const apparatus = sections.filter(section => apparatusKinds.has(section.kind))
  const renderLinks = (items, marker) => items.map((section, index) => `<a href="#${escapeAttribute(section.anchor)}" data-section-kind="${escapeAttribute(section.kind)}"><span>${marker(index)}</span><strong>${escapeHtml(section.title)}</strong></a>`).join("")
  const chapterLinks = renderLinks(chapters, index => String(index + 1).padStart(2, "0"))
  const apparatusLinks = renderLinks(apparatus, (index) => {
    const section = apparatus[index]
    if (section.kind === "priest-colophon") return "C"
    return String.fromCharCode(65 + index)
  })
  const concepts = (item.concepts || []).map(concept => {
    const href = resolveWikiHref(concept.slug, { item, manifest })
    const targetKind = BOOK_SLUG_TO_ROUTE_ID[String(concept.slug).trim().toLowerCase()] ? "book" : "map"
    const targetLabel = targetKind === "book" ? "книга" : "карта"
    const arrow = targetKind === "book" ? "→" : "↗"
    return href
      ? `<a class="book-concept-link" data-target-kind="${targetKind}" href="${escapeAttribute(href)}" aria-label="${escapeAttribute(`${concept.label}, ${targetLabel}`)}"><span>${escapeHtml(concept.label)}</span><i aria-hidden="true">${arrow}</i></a>`
      : `<span class="book-concept-link book-concept-unresolved"><span>${escapeHtml(concept.label)}</span></span>`
  }).join("")
  return { chapterLinks, apparatusLinks, concepts, chapterCount:chapters.length, apparatusCount:apparatus.length }
}

function renderRubricator(item, sections, manifest) {
  const { chapterLinks, apparatusLinks, concepts } = renderNavigationParts(item, sections, manifest)
  return `<aside class="book-rubricator" aria-label="Рубрикатор и ключевые понятия"><div class="book-rubricator-sticky">${chapterLinks ? `<nav class="book-section-nav book-chapter-nav" aria-label="Разделы книги"><span class="book-section-label">РУБРИКАТОР</span>${chapterLinks}</nav>` : ""}${apparatusLinks ? `<nav class="book-section-nav book-apparatus-nav" aria-label="Архивный аппарат"><span class="book-section-label">АРХИВНЫЙ АППАРАТ</span>${apparatusLinks}</nav>` : ""}${concepts ? `<nav class="book-concept-nav" aria-label="Ключевые понятия"><span class="book-section-label">КЛЮЧЕВЫЕ ПОНЯТИЯ</span>${concepts}</nav>` : ""}</div></aside>`
}

function renderMobileNavigation(item, sections, manifest) {
  const { chapterLinks, apparatusLinks, concepts, chapterCount, apparatusCount } = renderNavigationParts(item, sections, manifest)
  return `<div class="book-mobile-navigation" aria-label="Навигация по странице">${chapterLinks ? `<details class="book-mobile-nav-group"><summary><span>РУБРИКАТОР</span><small>${String(chapterCount).padStart(2, "0")}</small></summary><nav class="book-section-nav book-chapter-nav" aria-label="Разделы книги">${chapterLinks}</nav></details>` : ""}${apparatusLinks ? `<details class="book-mobile-nav-group"><summary><span>АРХИВНЫЙ АППАРАТ</span><small>${String(apparatusCount).padStart(2, "0")}</small></summary><nav class="book-section-nav book-apparatus-nav" aria-label="Архивный аппарат">${apparatusLinks}</nav></details>` : ""}${concepts ? `<details class="book-mobile-nav-group"><summary><span>КЛЮЧЕВЫЕ ПОНЯТИЯ</span><small>${String((item.concepts || []).length).padStart(2, "0")}</small></summary><nav class="book-concept-nav" aria-label="Ключевые понятия">${concepts}</nav></details>` : ""}</div>`
}

function renderRouteStrip(manifest, item) {
  return `<nav class="book-route-strip" data-book-route-strip aria-label="Маршрут книг">${manifest.route.map(routeItem => `<a href="${escapeAttribute(relativeHref(item.output, routeItem.output))}" data-route-id="${escapeAttribute(routeItem.id)}"${routeItem.id === item.id ? ' aria-current="page"' : ""}><span>${escapeHtml(routeItem.number)}</span><small>${escapeHtml(routeItem.shortTitle)}</small></a>`).join("")}</nav>`
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
  const mapDirectHref = `${mapHref}?map=1`
  const booksHref = relativeHref(item.output, "books/index.html")
  const searchHref = `${mapHref}?search=1`
  const logoHref = rootRelativeHref(item.output, "assets/logo.gif")
  const imageMarkup = item.image
    ? `<figure class="book-image-plate"><img src="${escapeAttribute(rootRelativeHref(item.output, item.image))}" alt=""><figcaption>АРХИВНЫЙ ФРАГМЕНТ / ${escapeHtml(item.shortTitle)}</figcaption></figure>`
    : ""
  const sections = extractSections(source.markdown)
  if (!sections.length) {
    throw new Error(`BOOKS presentation sections missing for ${item.id}: add explicit Markdown ## sections or PRESENTATION_SECTIONS triggers`)
  }
  const presentationTitles = new Set((PRESENTATION_SECTIONS[item.id] || []).map(section => section.title))
  const documentHtml = renderMarkdown(source.markdown, {
    interlude: item.internalInterlude,
    item,
    manifest,
    bodyAnchor: sections.some(section => section.anchor === "book-body"),
    presentationTitles
  })

  return `<!doctype html>
<html lang="ru" data-book-route-id="${escapeAttribute(item.id)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="source-sha256" content="${source.sha256}">
  <title>${escapeHtml(item.title)} — BOGOBOT / BOOKS</title>
  ${renderFontLoader()}
  <link rel="stylesheet" href="${escapeAttribute(styleHref)}?v=p6-books-design">
</head>
<body class="books-reader-page">
  <a class="skip-link" href="#book-text">К тексту</a>
  <header class="books-topbar">
    <a class="books-logo" href="${escapeAttribute(mapHref)}" aria-label="BOGOBOT — корневой вход"><img src="${escapeAttribute(logoHref)}" alt="BOGOBOT"></a>
    <div class="books-brand" aria-label="Время измеряется в ошибках"><span>Время измеряется в ошибках</span><small>time = Σ error</small></div>
    <nav class="books-nav" aria-label="Глобальная навигация">
      <a class="command" href="${escapeAttribute(mapDirectHref)}">MAP</a>
      <a class="command" href="${escapeAttribute(booksHref)}">INDEX</a>
      <a class="command" href="${escapeAttribute(searchHref)}">SEARCH</a>
      <a class="command" href="${escapeAttribute(booksHref)}" aria-current="page">BOOKS</a>
    </nav>
  </header>
  ${renderRouteStrip(manifest, item)}
  <div class="book-reader-layout">
    ${renderReaderRail(manifest, item, index)}
    <main class="book-reader-main">
      <article class="book-article">
        <header class="book-reader-header">
          <p class="book-eyebrow">${escapeHtml(item.number)} / ${escapeHtml(item.role)} / ${escapeHtml(item.description)}</p>
          <h1 class="book-reader-title">${escapeHtml(item.shortTitle)}</h1>
          <p class="book-reader-lead">${escapeHtml(item.lead)}</p>
        </header>
        ${renderMobileNavigation(item, sections, manifest)}
        <div class="book-reading-grid">
          <div class="book-reading-column">
            ${imageMarkup}
            <div class="book-document" id="book-text" data-source-path="${escapeAttribute(item.source)}" data-source-sha256="${source.sha256}">
${documentHtml}
            </div>
            ${renderRelated(item)}
            ${renderPager(manifest, item, index)}
          </div>
          ${renderRubricator(item, sections, manifest)}
        </div>
      </article>
    </main>
  </div>
  <footer class="books-tracebar tracebar"><span class="trace-label">TRACE:</span><span class="trace">BOOKS / ${escapeHtml(item.number)}</span><a class="command small" href="${escapeAttribute(booksHref)}">ВСЕ КНИГИ</a></footer>
  <script src="${escapeAttribute(scriptHref)}" defer></script>
</body>
</html>
`
}

function renderIndexPage(manifest) {
  const routeItems = manifest.route.map(item => `<li class="book-route-item" data-book-route-item data-route-id="${escapeAttribute(item.id)}" data-route-status="begin"><a class="book-route-link" href="${escapeAttribute(relativeHref("books/index.html", item.output))}"><span class="book-route-number">${escapeHtml(item.number)}</span><span class="book-route-copy"><span class="book-route-title">${escapeHtml(item.shortTitle)}</span><span class="book-route-meta">${escapeHtml(item.description)}</span></span><span class="book-route-state"><strong data-route-status>ОТКРЫТЬ</strong><span aria-hidden="true">→</span></span></a></li>`).join("")
  const routeAxis = manifest.route.map(item => `<a href="${escapeAttribute(relativeHref("books/index.html", item.output))}" data-books-axis-route="${escapeAttribute(item.id)}"><span>${escapeHtml(item.number)}</span><small>${escapeHtml(item.shortTitle)}</small></a>`).join("")
  return `<!doctype html>
<html lang="ru" data-books-page="index">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Книги — BOGOBOT</title>
  ${renderFontLoader()}
  <link rel="stylesheet" href="./books.css?v=p6-books-design">
</head>
<body class="books-index-page books-is-loading">
  <a class="skip-link" href="#books-route">К маршруту</a>
  <header class="books-topbar">
    <a class="books-logo" href="../" aria-label="BOGOBOT — корневой вход"><img src="../assets/logo.gif" alt="BOGOBOT"></a>
    <div class="books-brand" aria-label="Время измеряется в ошибках"><span>Время измеряется в ошибках</span><small>time = Σ error</small></div>
    <nav class="books-nav" aria-label="Глобальная навигация">
      <a class="command" href="../?map=1">MAP</a>
      <a class="command" href="./">INDEX</a>
      <a class="command" href="../?search=1">SEARCH</a>
      <a class="command" href="./" aria-current="page">BOOKS</a>
    </nav>
  </header>
  <nav class="books-mode-nav" data-books-route-axis aria-label="Навигация канона">${routeAxis}<small>CANON / 06 PARTS</small></nav>
  <main class="books-index-main" id="books-route">
    <section class="books-hero" aria-labelledby="books-title">
      <p class="books-kicker">ARCHIVE READING MODE</p>
      <div class="books-title-stage"><h1 id="books-title">${escapeHtml(manifest.title)}</h1><div class="books-damage-band" aria-hidden="true"><span>${escapeHtml(manifest.title)}</span></div></div>
      <a class="command primary books-primary-action" data-books-primary href="./prologue/">СЛЕДОВАТЬ КАНОНУ →</a>
    </section>
    <section class="books-catalog" aria-labelledby="books-catalog-title"><header class="books-catalog-head"><h2 id="books-catalog-title">BOOKS / INDEX</h2><span>06 PARTS</span></header><ol class="book-route-list">${routeItems}</ol></section>
  </main>
  <footer class="books-tracebar tracebar"><span class="trace-label">TRACE:</span><span class="trace" data-books-trace>BOOKS / P</span><a class="command small" href="../?map=1">BACK TO MAP</a></footer>
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
    const publicMarkdown = filterBookOnlySections(sourceDocument.markdown)
    const withPresentationSections = injectPresentationSections(publicMarkdown, item.id)
    const withoutLead = removeLeadMarkdown(withPresentationSections, item.leadMarkdown)
    outputs.set(item.output, renderReaderPage(manifest, item, index, {
      ...sourceDocument,
      markdown: withoutLead,
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
