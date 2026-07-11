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

const fitContractForCount = (count,{readerOpen=false,mobile=false}={}) => {
  if(readerOpen) return {occupancy:.66,maxScale:2}
  if(mobile){
    if(count<=1) return {occupancy:.68,maxScale:1.05}
    if(count<=4) return {occupancy:.72,maxScale:1.35}
    return {occupancy:.74,maxScale:1.8}
  }
  if(count<=1) return {occupancy:.5,maxScale:1.05}
  if(count<=4) return {occupancy:.56,maxScale:1.3}
  if(count<=10) return {occupancy:.66,maxScale:1.8}
  return {occupancy:.78,maxScale:2.4,leftPadPx:48,rightPadPx:48,topPadPx:38,bottomPadPx:38}
}

const horizontalSpread = ({paneWidth,paneHeight,nodeCount,readerOpen=false,mobile=false}) => {
  if(readerOpen||mobile||nodeCount<=10||paneWidth<=1||paneHeight<=1) return 1
  return Math.min(1.36,Math.max(1,paneWidth/paneHeight/(1000/720)))
}

const fit = ({
  paneWidth,
  paneHeight,
  readerOverlay = 0,
  previousTransform,
  nodeCount = 8,
  bounds = { minX:80, maxX:920, minY:70, maxY:650, width:840, height:580 }
}) => {
  const pane = geometry({ paneWidth, paneHeight, readerOverlay })
  if (!pane.valid) return { skipped:true, transform:previousTransform, pane }

  const mobile = paneWidth <= 900
  const contract = fitContractForCount(nodeCount,{mobile})
  const spread = horizontalSpread({paneWidth,paneHeight,nodeCount,mobile})
  const projectedWidth = bounds.width * spread
  const leftPadPx = contract.leftPadPx ?? 64
  const rightPadPx = contract.rightPadPx ?? 64
  const topPadPx = contract.topPadPx ?? 56
  const bottomPadPx = contract.bottomPadPx ?? 56
  const paddingLeft = leftPadPx * pane.viewWidth / paneWidth
  const paddingRight = rightPadPx * pane.viewWidth / paneWidth
  const paddingTop = topPadPx * pane.viewHeight / paneHeight
  const paddingBottom = bottomPadPx * pane.viewHeight / paneHeight
  const visibleWidth = pane.viewWidth * (paneWidth - readerOverlay) / paneWidth
  const usableWidth = Math.max(1, visibleWidth - paddingLeft - paddingRight)
  const usableHeight = Math.max(1, pane.viewHeight - paddingTop - paddingBottom)
  const scale = Math.min(
    contract.maxScale,
    usableWidth * contract.occupancy / projectedWidth,
    usableHeight / bounds.height
  )
  const projectedCenterX = 500 + (((bounds.minX+bounds.maxX)/2)-500) * spread
  const centerY = (bounds.minY+bounds.maxY)/2
  const translateX = visibleWidth / 2 - scale * projectedCenterX
  const translateY = pane.viewHeight / 2 - scale * centerY
  const transform = `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`
  return {
    skipped:false,
    transform,
    pane,
    scale,
    translate:[translateX,translateY],
    spread,
    renderedWidth:projectedWidth*scale,
    renderedHeight:bounds.height*scale,
    visibleWidth,
    visibleHeight:pane.viewHeight,
    occupancy:projectedWidth*scale/visibleWidth
  }
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

const largeCanon = fit({
  paneWidth:1440,
  paneHeight:700,
  nodeCount:15,
  bounds:{minX:150,maxX:850,minY:190,maxY:520,width:700,height:330}
})
if (largeCanon.spread <= 1) problems.push("large desktop category did not receive horizontal projection")
if (largeCanon.occupancy < .70) problems.push(`large desktop category occupancy too low: ${largeCanon.occupancy}`)

const largeAll = fit({
  paneWidth:1440,
  paneHeight:700,
  nodeCount:28,
  bounds:{minX:240,maxX:760,minY:90,maxY:590,width:520,height:500}
})
if (largeAll.occupancy < .60) problems.push(`large ALL overview still forms a narrow island: ${largeAll.occupancy}`)
if (largeAll.renderedHeight > largeAll.visibleHeight) problems.push("large ALL overview exceeds viewport height")

const smallWorld = fit({
  paneWidth:1440,
  paneHeight:700,
  nodeCount:5,
  bounds:{minX:260,maxX:740,minY:210,maxY:500,width:480,height:290}
})
if (smallWorld.spread !== 1) problems.push("small category was horizontally projected")

const requiredContracts = [
  "function graphGeometry(",
  "function isValidGraphTransform(",
  "function scheduleGeometryRetry(",
  "function overviewHorizontalSpread(",
  "function projectDisplayPoint(",
  "function desktopFitNodeSets(",
  "new ResizeObserver(()=>schedulePaneRefit())",
  "globalThis.__bogobotFitDiagnostics",
  "const viewWidth=viewHeight*paneWidth/paneHeight",
  "return {occupancy:.78,maxScale:2.4,leftPadPx:48,rightPadPx:48,topPadPx:38,bottomPadPx:38}"
]
for (const contract of requiredContracts) {
  if (!appCode.includes(contract)) problems.push(`missing app contract: ${contract}`)
}

if (appCode.includes("if(!readerOpen||combinedFit>=primaryFit*.86)")) {
  problems.push("overview still forces secondary context into fit bounds")
}
if (!appCode.includes('const allOverview=!readerOpen&&!categoryIds&&!activeMapMode&&state.filter==="all"')) {
  problems.push("ALL overview does not promote discovered nodes to primary bounds")
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
  largeCategory:{
    canon:{occupancy:largeCanon.occupancy,spread:largeCanon.spread,scale:largeCanon.scale},
    all:{occupancy:largeAll.occupancy,spread:largeAll.spread,scale:largeAll.scale},
    world:{occupancy:smallWorld.occupancy,spread:smallWorld.spread,scale:smallWorld.scale}
  },
  zeroHeightRetainsTransform:zeroHeight.skipped && zeroHeight.transform === retained,
  paneResizeChangesCacheKey:keyA !== keyB,
  desktopMobileDesktopIsolation:desktopAfter.transform !== mobile.transform && desktopAfter.transform === desktopBefore.transform,
  finiteTransforms:cases.every(test=>finiteTransform(test.result.transform)),
  problems
}

console.log(JSON.stringify(result, null, 2))
if (problems.length) process.exit(1)
