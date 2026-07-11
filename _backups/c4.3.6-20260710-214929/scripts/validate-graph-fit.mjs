import fs from "node:fs"

const appCode = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8")
const problems = []

const finiteTransform = transform => {
  const values = transform.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)?.map(Number) || []
  return values.length === 6 && values.every(Number.isFinite) && values[0] > 0 && values[3] > 0
}

const geometry = ({ paneWidth, paneHeight, readerOverlay = 0 }) => {
  if (paneWidth <= 1 || paneHeight <= 1 || readerOverlay >= paneWidth - 1) {
    return { valid:false, paneWidth, paneHeight, readerOverlay, reason:"invalid-pane-geometry" }
  }
  const viewHeight = 720
  const viewWidth = viewHeight * paneWidth / paneHeight
  return {
    valid:true,
    paneWidth,
    paneHeight,
    readerOverlay,
    viewWidth,
    viewHeight,
    viewBox:`0 0 ${viewWidth} ${viewHeight}`
  }
}

const cacheKey = ({ mode, lens, current, discovery, pane }) => [
  mode,
  lens,
  current,
  discovery,
  `${Math.round(pane.paneWidth)}x${Math.round(pane.paneHeight)}`,
  Math.round(pane.readerOverlay),
  pane.viewBox || "invalid"
].join(":")

const fit = ({ paneWidth, paneHeight, readerOverlay = 0, previousTransform, nodeCount = 8 }) => {
  const pane = geometry({ paneWidth, paneHeight, readerOverlay })
  if (!pane.valid) return { skipped:true, transform:previousTransform, pane }
  const bounds = { minX:80, maxX:920, minY:70, maxY:650, width:840, height:580 }
  const mobile = paneWidth <= 900
  const occupancy = mobile ? (nodeCount <= 1 ? .68 : nodeCount <= 4 ? .72 : .74) : (nodeCount <= 1 ? .5 : nodeCount <= 4 ? .56 : nodeCount <= 10 ? .66 : .62)
  const maxScale = mobile ? (nodeCount <= 1 ? 1.05 : nodeCount <= 4 ? 1.35 : 1.8) : (nodeCount <= 1 ? 1.05 : nodeCount <= 4 ? 1.3 : nodeCount <= 10 ? 1.8 : 2.2)
  const paddingX = 64 * pane.viewWidth / paneWidth
  const paddingY = 56 * pane.viewHeight / paneHeight
  const visibleWidth = pane.viewWidth * (paneWidth - readerOverlay) / paneWidth
  const scale = Math.min(
    maxScale,
    Math.max(1, visibleWidth - paddingX * 2) * occupancy / bounds.width,
    Math.max(1, pane.viewHeight - paddingY * 2) / bounds.height
  )
  const translateX = visibleWidth / 2 - scale * (bounds.minX + bounds.maxX) / 2
  const translateY = pane.viewHeight / 2 - scale * (bounds.minY + bounds.maxY) / 2
  const transform = `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`
  return { skipped:false, transform, pane, scale, translate:[translateX, translateY] }
}

const cases = [
  { name:"desktop-1440x700", paneWidth:1440, paneHeight:700 },
  { name:"desktop-901x700", paneWidth:901, paneHeight:700 },
  { name:"mobile-390x650", paneWidth:390, paneHeight:650 }
].map(test => ({ ...test, result:fit(test) }))

for (const test of cases) {
  if (test.result.skipped) problems.push(`${test.name}: unexpectedly skipped`)
  if (!finiteTransform(test.result.transform)) problems.push(`${test.name}: invalid transform ${test.result.transform}`)
}

const retained = "matrix(1.1, 0, 0, 1.1, 20, 30)"
const zeroHeight = fit({ paneWidth:390, paneHeight:0, previousTransform:retained })
if (!zeroHeight.skipped || zeroHeight.transform !== retained) problems.push("zero-height pane did not retain previous transform")

const paneA = geometry({ paneWidth:901, paneHeight:700 })
const paneB = geometry({ paneWidth:901, paneHeight:640 })
const keyA = cacheKey({ mode:"overview", lens:"all", current:"BOGOBOT", discovery:"same", pane:paneA })
const keyB = cacheKey({ mode:"overview", lens:"all", current:"BOGOBOT", discovery:"same", pane:paneB })
if (keyA === keyB) problems.push("pane-size change did not invalidate cache key")

const desktopBefore = fit({ paneWidth:1440, paneHeight:700 })
const mobile = fit({ paneWidth:390, paneHeight:650, previousTransform:desktopBefore.transform })
const desktopAfter = fit({ paneWidth:1440, paneHeight:700, previousTransform:mobile.transform })
if (desktopAfter.transform === mobile.transform) problems.push("desktop reused mobile transform")
if (desktopAfter.transform !== desktopBefore.transform) problems.push("desktop geometry did not deterministically recover after mobile")

const requiredContracts = [
  "function graphGeometry(",
  "function isValidGraphTransform(",
  "function scheduleGeometryRetry(",
  "new ResizeObserver(()=>schedulePaneRefit())",
  "globalThis.__bogobotFitDiagnostics",
  "const viewWidth=viewHeight*paneWidth/paneHeight"
]
for (const contract of requiredContracts) {
  if (!appCode.includes(contract)) problems.push(`missing app contract: ${contract}`)
}

for (const functionName of ["fitMobileMap", "fitDesktopMap"]) {
  const start = appCode.indexOf(`function ${functionName}(`)
  const end = appCode.indexOf("\nfunction ", start + 1)
  const source = appCode.slice(start, end < 0 ? undefined : end)
  if (source.includes('viewport.style.transform=""')) problems.push(`${functionName}: clears transform before valid fit`)
}

const result = {
  cases:cases.map(test=>({
    name:test.name,
    pane:{ width:test.paneWidth, height:test.paneHeight },
    viewBox:{ width:test.result.pane.viewWidth, height:test.result.pane.viewHeight },
    scale:test.result.scale,
    translate:test.result.translate,
    transform:test.result.transform
  })),
  zeroHeightRetainsTransform:zeroHeight.skipped && zeroHeight.transform === retained,
  paneResizeChangesCacheKey:keyA !== keyB,
  desktopMobileDesktopIsolation:desktopAfter.transform !== mobile.transform && desktopAfter.transform === desktopBefore.transform,
  finiteTransforms:cases.every(test=>finiteTransform(test.result.transform)),
  problems
}

console.log(JSON.stringify(result, null, 2))
if (problems.length) process.exit(1)
