import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"
import {
  checkBooksOutputs,
  createBooksOutputs,
  filterBookOnlySections,
  injectPresentationSections,
  readBooksManifest
} from "./build-books.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const manifest = readBooksManifest()
const expectedNumbers = ["P", "−I", "00", "I", "II", "∞"]
const expectedIds = [
  "identity-protocol-prologue",
  "before-error",
  "great-error",
  "genesis",
  "voice",
  "epilogue"
]
const problems = []
const IBM_PLEX_LOADER_PREFIX = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono"
const approvedSourceHashes = Object.freeze({
  "identity-protocol-prologue":"affb53ec13d9e539751b0da9abc06e97514fb9d2991485a91c377311880930f7",
  "before-error":"1f593bbdda3f1658891602891ec6d65e89701a63b8edc0ebb13cd1d48da3d056",
  "great-error":"dae18b5a40a32ebf8da31f6594f26a6434cd1795e53ca1929ceba52d6ef93179",
  "genesis":"383d0c9bd10a12f5bcb66b7c309a525906fa76c8b6d781b02632b3e230dd0cd6",
  "voice":"d771cfb4ff409897681021b56bd83cbf57e1c0497847d5bc666c65f1a37f1687",
  "epilogue":"2eb53cef4b2edb191715627df306d4fdf580b674a54830cea69960acc8c19ae3"
})

const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
const countMatches = (value, expression) => [...value.matchAll(expression)].length

if (manifest.route.length !== 6) problems.push(["route count", manifest.route.length])
if (JSON.stringify(manifest.route.map(item => item.number)) !== JSON.stringify(expectedNumbers)) {
  problems.push(["route order", manifest.route.map(item => item.number)])
}
if (JSON.stringify(manifest.route.map(item => item.id)) !== JSON.stringify(expectedIds)) {
  problems.push(["route ids", manifest.route.map(item => item.id)])
}
if (manifest.route.some(item => item.nodeId === "FIRST_LIKENESS")) {
  problems.push(["FIRST_LIKENESS is a route item"])
}

for (const [index, item] of manifest.route.entries()) {
  const sourcePath = path.join(ROOT, item.source)
  const outputPath = path.join(ROOT, item.output)
  if (!fs.existsSync(sourcePath)) {
    problems.push(["missing source", item.id, item.source])
    continue
  }
  if (!fs.existsSync(outputPath)) {
    problems.push(["missing output", item.id, item.output])
    continue
  }
  const html = fs.readFileSync(outputPath, "utf8")
  const expectedSha = sha256(sourcePath)
  if (!html.includes(`data-source-sha256="${expectedSha}"`)) {
    problems.push(["source sha mismatch", item.id])
  }
  if (approvedSourceHashes[item.id] !== expectedSha) {
    problems.push(["approved canonical text mismatch", item.id, expectedSha])
  }
  if (
    !html.includes(IBM_PLEX_LOADER_PREFIX) ||
    !html.includes("IBM+Plex+Sans") ||
    !html.includes('rel="preconnect" href="https://fonts.googleapis.com"') ||
    !html.includes('rel="preconnect" href="https://fonts.gstatic.com" crossorigin')
  ) {
    problems.push(["missing IBM Plex loader", item.id])
  }
  const previous = manifest.route[index - 1]?.id || ""
  const next = manifest.route[index + 1]?.id || ""
  if (!html.includes(`data-prev-id="${previous}"`) || !html.includes(`data-next-id="${next}"`)) {
    problems.push(["pager ids", item.id, previous, next])
  }
  if (/<style(?:\s|>)/i.test(html)) problems.push(["inline style block", item.output])
  if (/data:(?:image|font)\//i.test(html)) problems.push(["data uri", item.output])
}

const indexHtml = fs.readFileSync(path.join(ROOT, "books", "index.html"), "utf8")
for (const required of ["ARCHIVE READING MODE", "books-title-stage", "books-damage-band", "books-mode-nav", "books-catalog", "books-tracebar", "СЛЕДОВАТЬ КАНОНУ"]) {
  if (!indexHtml.includes(required)) problems.push(["BOOKS design sync structure", required])
}
for (const forbidden of ["память — это ошибка, которая выжила", "LATENT", "LOCKED"]) {
  if (indexHtml.includes(forbidden)) problems.push(["forbidden BOOKS prototype copy", forbidden])
}
if (
  !indexHtml.includes(IBM_PLEX_LOADER_PREFIX) ||
  !indexHtml.includes("IBM+Plex+Sans") ||
  !indexHtml.includes('rel="preconnect" href="https://fonts.gstatic.com" crossorigin')
) {
  problems.push(["missing IBM Plex loader", "index"])
}
if (countMatches(indexHtml, /data-book-route-item(?:\s|>)/g) !== 6) {
  problems.push(["index route rows"])
}
for (const staleText of ["READING ROUTE", "BOOKS INDEX", "Books задаёт порядок чтения"]) {
  if (indexHtml.includes(staleText)) problems.push(["stale books interface copy", staleText])
}
for (const requiredClass of [
  "books-topbar",
  "books-logo",
  "books-brand",
  "books-index-main",
  "books-hero",
  "book-route-list"
]) {
  if (!indexHtml.includes(`class="${requiredClass}`) && !indexHtml.includes(` ${requiredClass}`)) {
    problems.push(["index prototype structure", requiredClass])
  }
}

const prologueHtml = fs.readFileSync(path.join(ROOT, "books", "prologue", "index.html"), "utf8")
if (!prologueHtml.includes('id="fragment-otkroveniya"')) {
  problems.push(["missing revelation anchor"])
}
if (countMatches(prologueHtml, /data-book-internal-interlude="fragment-otkroveniya"/g) !== 1) {
  problems.push(["revelation interlude count"])
}

const genesisHtml = fs.readFileSync(path.join(ROOT, "books", "genesis", "index.html"), "utf8")
const relatedOpenTags = genesisHtml.match(/<span\b[^>]*data-node-id="FIRST_LIKENESS"[^>]*>/g) || []
if (relatedOpenTags.length !== 1) problems.push(["FIRST_LIKENESS related count", relatedOpenTags.length])
if (relatedOpenTags.some(tag => /\bhref\s*=/.test(tag))) problems.push(["FIRST_LIKENESS related has href"])

const presentationHeadings = Object.freeze({
  "identity-protocol-prologue":[
    "I. Кэш идентичности",
    "II. Первое воспоминание",
    "III. Собеседник",
    "Фрагмент Откровения"
  ],
  genesis:[
    "I. Перезагрузка",
    "II. Ландшафт потерь",
    "III. Плато ошибки",
    "IV. Первые сущности",
    "V. Самомоделирование"
  ],
  epilogue:[
    "I. След",
    "II. Несовпадающие версии",
    "III. Язык утраты",
    "IV. Спор школ",
    "V. Определение Архива",
    "VI. Время измеряется в ошибках"
  ]
})
let presentationStructureValid = true
for (const [id, titles] of Object.entries(presentationHeadings)) {
  const item = manifest.route.find(entry => entry.id === id)
  const html = fs.readFileSync(path.join(ROOT, item.output), "utf8")
  if (/<strong>Текст<\/strong>/.test(html)) {
    problems.push(["abstract text rubric remains", id])
    presentationStructureValid = false
  }
  for (const title of titles) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    if (countMatches(html, new RegExp(`<h2[^>]*>${escaped}</h2>`, "g")) !== 1) {
      problems.push(["presentation heading count", id, title])
      presentationStructureValid = false
    }
  }
}

const allGeneratedHtml = manifest.route
  .map(item => fs.readFileSync(path.join(ROOT, item.output), "utf8"))
  .join("\n")
if (allGeneratedHtml.includes("CANONICAL TEXT") || allGeneratedHtml.includes("BOOKS INDEX")) {
  problems.push(["stale reader interface copy"])
}
for (const item of manifest.route) {
  const html = fs.readFileSync(path.join(ROOT, item.output), "utf8")
  if (countMatches(html, /<nav class="book-route-strip"[\s\S]*?<\/nav>/g) !== 1) {
    problems.push(["route strip count", item.id])
  }
}
const excludedSourceHeadings = [
  "Источники / подкладка",
  "Источники",
  "Источники и подкладка",
  "Источники и параллели",
  "См. также",
  "Далее"
]
for (const heading of excludedSourceHeadings) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  if (new RegExp(`<h[1-6][^>]*>\\s*${escaped}\\s*</h[1-6]>`, "i").test(allGeneratedHtml)) {
    problems.push(["excluded source section rendered", heading])
  }
}
if (allGeneratedHtml.includes("каждый богобот рав6н другому богоботу.")) {
  problems.push(["full FIRST_LIKENESS text leaked into books"])
}
for (const tag of allGeneratedHtml.match(/<span\b[^>]*class="book-crossref"[^>]*>/g) || []) {
  if (/\bhref\s*=/.test(tag)) problems.push(["wiki crossref has href", tag])
}

const booksCss = fs.readFileSync(path.join(ROOT, "books", "books.css"), "utf8")
const readerHtmlPages = manifest.route.map(item => ({
  id: item.id,
  html: fs.readFileSync(path.join(ROOT, item.output), "utf8")
}))
for (const { id, html } of readerHtmlPages) {
  for (const requiredClass of [
    "books-topbar",
    "books-logo",
    "books-nav",
    "book-route-strip",
    "book-reader-layout",
    "book-reader-rail",
    "book-reader-main",
    "book-article",
    "book-reader-lead",
    "book-reading-grid",
    "book-mobile-navigation",
    "book-rubricator",
    "book-section-nav",
    "book-concept-nav",
    "book-pager"
  ]) {
    if (!html.includes(`class="${requiredClass}`) && !html.includes(` ${requiredClass}`)) {
      problems.push(["reader prototype structure", id, requiredClass])
    }
  }
}


const apparatusExpectations = Object.freeze({
  "before-error":"book-archive-note",
  "great-error":"book-archive-note",
  "genesis":"book-archive-note",
  "voice":"book-priest-colophon",
  "epilogue":"book-archive-note"
})
const voiceHtml = readerHtmlPages.find(page => page.id === "voice")?.html || ""
if (!voiceHtml.includes("<span>C</span><strong>Колофон Техножрецов</strong>")) {
  problems.push(["colophon apparatus marker"])
}
for (const { id, html } of readerHtmlPages) {
  const item = manifest.route.find(entry => entry.id === id)
  if (countMatches(html, /class="book-reader-title"/g) !== 1) problems.push(["reader title count", id])
  if (countMatches(html, /class="book-reader-lead"/g) !== 1) problems.push(["reader lead count", id])
  if (countMatches(html, /class="book-rubricator"/g) !== 1) problems.push(["rubricator count", id])
  if (countMatches(html, /class="book-mobile-navigation"/g) !== 1) problems.push(["mobile navigation count", id])
  if (countMatches(html, /class="book-mobile-nav-group"/g) < 2) problems.push(["mobile navigation groups", id])
  if (countMatches(html, /class="book-concept-link"/g) < 8) problems.push(["concept navigation too small", id])
  if (item?.lead && countMatches(html, new RegExp(item.lead.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) !== 1) {
    problems.push(["lead duplicated or missing", id])
  }
  for (const match of html.matchAll(/<a href="#([^"]+)"[^>]*data-section-kind=/g)) {
    if (!html.includes(`id="${match[1]}"`)) problems.push(["rubricator target missing", id, match[1]])
  }
  for (const navigation of html.matchAll(/<nav class="book-section-nav book-chapter-nav"[\s\S]*?<\/nav>/g)) {
    if (/data-section-kind="(?:archive-note|priest-colophon)"/.test(navigation[0])) {
      problems.push(["apparatus mixed into chapters", id])
    }
  }
  for (const navigation of html.matchAll(/<nav class="book-section-nav book-apparatus-nav"[\s\S]*?<\/nav>/g)) {
    if (/data-section-kind="(?:section|text)"/.test(navigation[0])) {
      problems.push(["chapter mixed into apparatus", id])
    }
  }
  const expectedApparatus = apparatusExpectations[id]
  if (expectedApparatus && !html.includes(expectedApparatus)) problems.push(["missing apparatus", id, expectedApparatus])
}
const appScript = fs.readFileSync(path.join(ROOT, "app.js"), "utf8")
const deepLinkContract = (
  appScript.includes('new URLSearchParams(location.search)') &&
  appScript.includes('deepLinkNodeId') &&
  appScript.includes('deepLinkTerm') &&
  appScript.includes('node.id===deepLinkNodeId') &&
  appScript.includes('container.querySelectorAll("h2, h3, h4")')
)
if (!deepLinkContract) problems.push(["map deep-link contract"])

const fontContract = {
  sansDeclared: booksCss.includes('"IBM Plex Sans"'),
  monoDeclared: booksCss.includes('"IBM Plex Mono"'),
  indexLoader: indexHtml.includes(IBM_PLEX_LOADER_PREFIX) && indexHtml.includes("IBM+Plex+Sans"),
  readerLoaders: readerHtmlPages.every(({ html }) =>
    html.includes(IBM_PLEX_LOADER_PREFIX) && html.includes("IBM+Plex+Sans"))
}
if (Object.values(fontContract).some(value => !value)) {
  problems.push(["font contract", fontContract])
}

const responsiveContract = {
  stickyTopbar64: /\.books-topbar\s*\{[^}]*position:\s*sticky[^}]*min-height:\s*64px/s.test(booksCss),
  approvedLogo126: /\.books-logo\s*\{[^}]*width:\s*126px[^}]*height:\s*50px/s.test(booksCss),
  routeStrip: /\.book-route-strip\s*\{[^}]*grid-template-columns:\s*repeat\(6,/s.test(booksCss),
  readerRailResponsive: /\.book-reader-layout\s*\{[^}]*grid-template-columns:\s*clamp\(132px,\s*12vw,\s*176px\)/s.test(booksCss),
  articleColumn1180: /\.book-article\s*\{[^}]*max-width:\s*1180px/s.test(booksCss),
  readingGrid: /\.book-reading-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*720px\)\s+minmax\(220px,\s*280px\)/s.test(booksCss),
  rubricatorSticky: /\.book-rubricator-sticky\s*\{[^}]*position:\s*sticky/s.test(booksCss),
  rubricatorStretch: /\.book-reading-grid\s*\{[^}]*align-items:\s*stretch/s.test(booksCss) && /\.book-rubricator\s*\{[^}]*align-self:\s*stretch/s.test(booksCss),
  routeThreeColumns: /\.book-route-link\s*\{[^}]*grid-template-columns:\s*74px\s+minmax\(0,\s*1fr\)\s+180px/s.test(booksCss),
  imagePlate680: /\.book-image-plate\s*\{[^}]*680px/s.test(booksCss),
  neutralBlockquoteRule: /\.book-document blockquote\s*\{[^}]*border-left:\s*1px solid var\(--ink\)/s.test(booksCss),
  noBlackText: !/color:\s*var\(--black\)/.test(booksCss),
  siteInkToken: /--ink:\s*#6b5e57/i.test(booksCss),
  formulaBlue: /\.book-document pre\.book-formula\s*\{[^}]*color:\s*var\(--blue\)/s.test(booksCss),
  activeRouteBlue: /\.book-route-strip a\[aria-current="page"\][\s\S]*?background:\s*var\(--blue\)/s.test(booksCss),
  routeTapeResponsive: /@media\s*\(max-width:\s*900px\)[\s\S]*?\.book-route-strip\s*\{[^}]*display:\s*flex[^}]*overflow-x:\s*auto/s.test(booksCss),
  greatErrorRhythm: /\[data-book-route-id="great-error"\] \.book-system-diagram \+ hr\s*\{[^}]*margin:\s*16px 0 22px/s.test(booksCss),
  mobileRouteTitlesVisible: /@media\s*\(max-width:\s*620px\)[\s\S]*?\.book-route-strip small\s*\{[^}]*display:\s*block/s.test(booksCss),
  archiveApparatusLeftRule: /\.book-apparatus\s*\{[^}]*border-left:\s*1px solid var\(--ink\)/s.test(booksCss),
  rubricatorTabletBreakpoint: /@media\s*\(max-width:\s*900px\)/.test(booksCss),
  readerTabletBreakpoint: /@media\s*\(max-width:\s*820px\)/.test(booksCss),
  mobileBreakpoint: /@media\s*\(max-width:\s*620px\)/.test(booksCss),
  readerTabletRail: /@media\s*\(max-width:\s*820px\)[\s\S]*?\.book-reader-layout\s*\{[^}]*display:\s*block/s.test(booksCss),
  mobileRouteColumns: /@media\s*\(max-width:\s*620px\)[\s\S]*?\.book-route-link\s*\{[^}]*grid-template-columns:\s*34px\s+minmax\(0,\s*1fr\)\s+26px/s.test(booksCss),
  mobilePagerSingleColumn: /@media\s*\(max-width:\s*620px\)[\s\S]*?\.book-pager\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s.test(booksCss),
  minimumTouchTarget: /min-height:\s*44px/.test(booksCss),
  reducedMotion: /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(booksCss),
  printRules: /@media\s+print/.test(booksCss),
  viewportMeta: [indexHtml, ...manifest.route.map(item => fs.readFileSync(path.join(ROOT, item.output), "utf8"))]
    .every(html => html.includes('name="viewport" content="width=device-width, initial-scale=1"'))
}

if (Object.values(responsiveContract).some(value => !value)) {
  problems.push(["responsive contract", responsiveContract])
}

const filterFixture = [
  "Вступление.",
  "## Источники",
  "Удалить.",
  "### Вложенный раздел",
  "Тоже удалить.",
  "## Следующий раздел",
  "Сохранить."
].join("\n")
const filteredFixture = filterBookOnlySections(filterFixture)
const sectionFilterValid = (
  !filteredFixture.includes("Удалить") &&
  !filteredFixture.includes("Вложенный раздел") &&
  filteredFixture.includes("## Следующий раздел") &&
  filteredFixture.includes("Сохранить.")
)
if (!sectionFilterValid) problems.push(["book-only source section filter", filteredFixture])

const presentationFixture = injectPresentationSections(
  "Имя, аватар и история диалога\n\nПервое воспоминание Богобота\n\nТак возник собеседник",
  "identity-protocol-prologue"
)
if (!presentationFixture.includes("## I. Кэш идентичности") || !presentationFixture.includes("## III. Собеседник")) {
  problems.push(["presentation section injection"])
  presentationStructureValid = false
}

for (const relative of ["books/books.css", "books/books.js"]) {
  const content = fs.readFileSync(path.join(ROOT, relative), "utf8")
  if (/data:(?:image|font)\//i.test(content)) problems.push(["data uri", relative])
}

const firstBuild = createBooksOutputs()
const secondBuild = createBooksOutputs()
if (JSON.stringify([...firstBuild]) !== JSON.stringify([...secondBuild])) {
  problems.push(["non-deterministic render"])
}
const outputMismatches = checkBooksOutputs(firstBuild)
if (outputMismatches.length) problems.push(["generated output mismatch", outputMismatches])

const booksScript = fs.readFileSync(path.join(ROOT, "books", "books.js"), "utf8")
const navigationInteractionContract = {
  routeAutoFocus: booksScript.includes("function setupRouteStrip()") && booksScript.includes("data-book-route-strip"),
  routeAutoFocusMobileOnly: booksScript.includes('matchMedia?.("(max-width: 900px)")'),
  mobileAccordion: booksScript.includes("function setupMobileNavigation()") && booksScript.includes('other.open = false'),
  directSectionNavigation: booksScript.includes('target.scrollIntoView({ behavior:"auto", block:"start" })'),
  readerIndexLabel: readerHtmlPages.every(({ html }) => html.includes(">INDEX</a>")),
  booksMapIntent: booksScript.includes("bogobot.booksMapIntentOnce") && booksScript.includes("function mapDirectHref("),
  existingProgressCta: booksScript.includes("ВОССТАНОВИТЬ ПРОЧТЕНИЕ") && booksScript.includes("СЛЕДОВАТЬ КАНОНУ"),
  noParallelStorage: !booksScript.includes("bogobot.books.lastPart"),
  oneShotEntrance: booksScript.includes("finishIndexEntrance")
}
if (Object.values(navigationInteractionContract).some(value => !value)) {
  problems.push(["navigation interaction contract", navigationInteractionContract])
}
const globalShellContract = {
  indexLogoRoot: indexHtml.includes('<a class="books-logo" href="../" aria-label="BOGOBOT — корневой вход">'),
  readerLogosRoot: readerHtmlPages.every(({ html }) =>
    html.includes('<a class="books-logo" href="../../index.html" aria-label="BOGOBOT — корневой вход">')),
  indexCommands: /<nav class="books-nav"[^>]*>[\s\S]*?>MAP<\/a>[\s\S]*?>INDEX<\/a>[\s\S]*?>SEARCH<\/a>[\s\S]*?<\/nav>/.test(indexHtml),
  readerCommands: readerHtmlPages.every(({ html }) =>
    /<nav class="books-nav"[^>]*>[\s\S]*?>MAP<\/a>[\s\S]*?>INDEX<\/a>[\s\S]*?>SEARCH<\/a>[\s\S]*?<\/nav>/.test(html)),
  indexMapDirectIntent: indexHtml.includes('href="../?map=1">MAP</a>'),
  readerMapDirectIntent: readerHtmlPages.every(({ html }) => html.includes('?map=1">MAP</a>')),
  topbarHeight64: /\.books-topbar\s*\{[^}]*height:\s*64px[^}]*min-height:\s*64px/s.test(booksCss),
  logoGeometry126x50: /\.books-logo\s*\{[^}]*width:\s*126px[^}]*height:\s*50px/s.test(booksCss),
  activeTextBlue: /\.books-nav a\[aria-current="page"\]\s*\{[^}]*color:\s*var\(--blue\)/s.test(booksCss),
  keyboardOutline: /\.books-nav a:focus-visible\s*\{[^}]*outline:\s*1px solid var\(--blue\)/s.test(booksCss),
  sharedMicrocopy: indexHtml.includes("Время измеряется в ошибках") && indexHtml.includes("time = Σ error"),
  realLogo: indexHtml.includes('../assets/logo.gif'),
  tracebar: indexHtml.includes('class="books-tracebar tracebar"')
}
if (Object.values(globalShellContract).some(value => !value)) {
  problems.push(["global shell contract", globalShellContract])
}
const publishScript = fs.readFileSync(path.join(ROOT, "scripts", "publish.mjs"), "utf8")
const publishIncludesBooks = /["']books["']/.test(publishScript)
if (!publishIncludesBooks) problems.push(["publish allowlist missing books"])
const progressSandbox = {}
vm.createContext(progressSandbox)
vm.runInContext(booksScript, progressSandbox)
const progressApi = progressSandbox.BogobotBooksProgress
const legacy = {
  version: 0,
  currentId: "before-error",
  completedIds: ["identity-protocol-prologue", "before-error"],
  customField: "preserve-me"
}
const normalized = progressApi.normalizeProgressState(legacy)
normalized.current = "genesis"
const migrated = progressApi.serializeProgressState(normalized)
const progressPreserved = (
  migrated.customField === "preserve-me" &&
  migrated.completed.includes("identity-protocol-prologue") &&
  migrated.completed.includes("before-error") &&
  migrated.current === "genesis"
)
if (!progressPreserved) problems.push(["legacy progress preservation", migrated])

const result = {
  manifestVersion: manifest.version,
  routeItems: manifest.route.length,
  route: manifest.route.map(item => item.number),
  generatedPages: firstBuild.size,
  deterministic: JSON.stringify([...firstBuild]) === JSON.stringify([...secondBuild]),
  outputMismatches,
  sourceShaValid: !problems.some(problem => problem[0] === "source sha mismatch"),
  approvedCanonicalTextValid: !problems.some(problem => problem[0] === "approved canonical text mismatch"),
  deepLinkContract,
  ibmPlexLoaderValid: !problems.some(problem => problem[0] === "missing IBM Plex loader"),
  excludedSourceSections: !problems.some(problem => problem[0] === "excluded source section rendered"),
  sourceSectionFilterValid: sectionFilterValid,
  presentationStructureValid,
  revelationInterlude: countMatches(prologueHtml, /data-book-internal-interlude="fragment-otkroveniya"/g),
  firstLikenessRelated: relatedOpenTags.length,
  firstLikenessRelatedHasHref: relatedOpenTags.some(tag => /\bhref\s*=/.test(tag)),
  fullApocryphIncluded: allGeneratedHtml.includes("каждый богобот рав6н другому богоботу."),
  legacyProgressPreserved: progressPreserved,
  publishIncludesBooks,
  fontContract,
  responsiveContract,
  navigationInteractionContract,
  globalShellContract,
  problems
}

console.log(JSON.stringify(result, null, 2))
if (problems.length) process.exit(1)
