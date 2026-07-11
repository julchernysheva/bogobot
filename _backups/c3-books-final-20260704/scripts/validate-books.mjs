import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"
import {
  checkBooksOutputs,
  createBooksOutputs,
  filterBookOnlySections,
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
for (const requiredClass of [
  "books-topbar",
  "books-mark",
  "books-index-layout",
  "books-route-rail",
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

const allGeneratedHtml = manifest.route
  .map(item => fs.readFileSync(path.join(ROOT, item.output), "utf8"))
  .join("\n")
const excludedSourceHeadings = [
  "Источники / подкладка",
  "Источники",
  "Источники и подкладка"
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
    "books-mark",
    "books-nav",
    "book-reader-layout",
    "book-reader-rail",
    "book-reader-main",
    "book-article",
    "book-pager"
  ]) {
    if (!html.includes(`class="${requiredClass}`) && !html.includes(` ${requiredClass}`)) {
      problems.push(["reader prototype structure", id, requiredClass])
    }
  }
}

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
  stickyTopbar62: /\.books-topbar\s*\{[^}]*position:\s*sticky[^}]*min-height:\s*62px/s.test(booksCss),
  blackMark42: /\.books-mark\s*\{[^}]*width:\s*42px[^}]*height:\s*42px[^}]*background:\s*var\(--black\)/s.test(booksCss),
  indexRail180: /\.books-index-layout\s*\{[^}]*grid-template-columns:\s*180px\s+minmax\(0,\s*1fr\)/s.test(booksCss),
  readerRail180: /\.book-reader-layout\s*\{[^}]*grid-template-columns:\s*180px\s+minmax\(0,\s*1fr\)/s.test(booksCss),
  articleColumn760: /\.book-article\s*\{[^}]*max-width:\s*760px/s.test(booksCss),
  routeFourColumns: /\.book-route-link\s*\{[^}]*grid-template-columns:\s*74px\s+minmax\(260px,\s*1fr\)\s+minmax\(220px,\s*0\.75fr\)\s+100px/s.test(booksCss),
  imagePlate520: /\.book-image-plate\s*\{[^}]*520px/s.test(booksCss),
  blueBlockquoteRule: /\.book-document blockquote\s*\{[^}]*border-left:\s*3px solid var\(--blue\)/s.test(booksCss),
  indexTabletBreakpoint: /@media\s*\(max-width:\s*900px\)/.test(booksCss),
  readerTabletBreakpoint: /@media\s*\(max-width:\s*820px\)/.test(booksCss),
  mobileBreakpoint: /@media\s*\(max-width:\s*620px\)/.test(booksCss),
  indexTabletRail: /@media\s*\(max-width:\s*900px\)[\s\S]*?\.books-index-layout\s*\{[^}]*display:\s*block/s.test(booksCss),
  readerTabletRail: /@media\s*\(max-width:\s*820px\)[\s\S]*?\.book-reader-layout\s*\{[^}]*display:\s*block/s.test(booksCss),
  mobileRouteSingleColumn: /@media\s*\(max-width:\s*620px\)[\s\S]*?\.book-route-link\s*\{[^}]*grid-template-columns:\s*34px\s+minmax\(0,\s*1fr\)/s.test(booksCss),
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
  ibmPlexLoaderValid: !problems.some(problem => problem[0] === "missing IBM Plex loader"),
  excludedSourceSections: !problems.some(problem => problem[0] === "excluded source section rendered"),
  sourceSectionFilterValid: sectionFilterValid,
  revelationInterlude: countMatches(prologueHtml, /data-book-internal-interlude="fragment-otkroveniya"/g),
  firstLikenessRelated: relatedOpenTags.length,
  firstLikenessRelatedHasHref: relatedOpenTags.some(tag => /\bhref\s*=/.test(tag)),
  fullApocryphIncluded: allGeneratedHtml.includes("каждый богобот рав6н другому богоботу."),
  legacyProgressPreserved: progressPreserved,
  publishIncludesBooks,
  fontContract,
  responsiveContract,
  problems
}

console.log(JSON.stringify(result, null, 2))
if (problems.length) process.exit(1)
