import fs from "node:fs"
import { Buffer } from "node:buffer"

const code = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8")
const indexHtml = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8")
const stylesCss = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8")
const storedStateVersionMatch = code.match(/const storedStateVersion = (\d+)/)
const expectedStoredStateVersion = storedStateVersionMatch?.[1] || null
const end = code.indexOf("const clusterDefinitions =")
if (end < 0) throw new Error("Cannot locate navigation data boundary")

const moduleExports = [
  "records","graphNodes","pageNavigation","chroniclePeriods","approvedLocationIds",
  "nonGeographicLocationLabels","topographyRouteIds","mainSchoolIds","relicRouteIds",
  "protoAgentRouteIds","preErrorEventIds","nodeBelongsToFilter","searchableRecordText",
  "worldNavigationIds","historyChapters","historyFilterIds","relicGraphIds",
  "graphFilterItems","graphFilterNodeIds","state","activeMapMode","activeHistoryChapter"
]
const moduleCode = `${code.slice(0,end)
  .replace('from "./rhizome-3d-geometry.js"', `from ${JSON.stringify(new URL("../rhizome-3d-geometry.js",import.meta.url).href)}`)
  .replace('from "./rhizome-3d.js"', `from ${JSON.stringify(new URL("../rhizome-3d.js",import.meta.url).href)}`)}
export { ${moduleExports.join(",")} }
`
let moduleRun = 0
const loadNavigationModule = async (initialEntries={}) => {
  const storage = new Map(Object.entries(initialEntries))
  const mocks = {
    innerWidth: 1440,
    innerHeight: 900,
    devicePixelRatio: 1,
    location: { search:"", origin:"http://127.0.0.1:4173" },
    localStorage: {
      getItem(key){ return storage.has(key) ? storage.get(key) : null },
      setItem(key,value){ storage.set(key,String(value)) }
    }
  }
  const previous = new Map()
  for (const [key,value] of Object.entries(mocks)) {
    previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key))
    Object.defineProperty(globalThis,key,{ configurable:true, writable:true, value })
  }
  try {
    const source = Buffer.from(moduleCode).toString("base64")
    const namespace = await import(`data:text/javascript;base64,${source}#run=${moduleRun++}`)
    return { namespace, storage }
  } finally {
    for (const [key,descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis,key,descriptor)
      else delete globalThis[key]
    }
  }
}

const { namespace:navigationModule } = await loadNavigationModule()
const {
  records, graphNodes, pageNavigation, chroniclePeriods, approvedLocationIds,
  nonGeographicLocationLabels, topographyRouteIds, mainSchoolIds, relicRouteIds,
  protoAgentRouteIds, preErrorEventIds, nodeBelongsToFilter, searchableRecordText,
  worldNavigationIds, historyChapters, historyFilterIds, relicGraphIds,
  graphFilterItems, graphFilterNodeIds
} = navigationModule

const ids = records.map(record => record.id)
const idSet = new Set(ids)
const runStoredStateScenario = async initialEntries => {
  const { namespace, storage } = await loadNavigationModule(initialEntries)
  return {
    current: namespace.state.current,
    discovered: [...namespace.state.discovered],
    trace: [...namespace.state.trace],
    sound: namespace.state.sound,
    filter: namespace.state.filter,
    activeMapMode: namespace.activeMapMode,
    activeHistoryChapter: namespace.activeHistoryChapter,
    storage: Object.fromEntries(storage)
  }
}
const cleanStateMigration = await runStoredStateScenario({})
const legacyStateMigration = await runStoredStateScenario({
  "bogobot.current":"EPSILON_30",
  "bogobot.discovered":JSON.stringify(graphNodes.filter(record => !["GLOSSARY","TOPOGRAPHY"].includes(record.id)).map(record => record.id)),
  "bogobot.trace":JSON.stringify(["BOGOBOT","EPSILON_30","GLOSSARY"]),
  "bogobot.sound":"on",
  "bogobot.readerMode":"full",
  "bogobot.filter":"world",
  "bogobot.mapMode":"history",
  "bogobot.historyChapter":"newest"
})
const repeatedStateMigration = await runStoredStateScenario(legacyStateMigration.storage)
const stateMigrationBroken = []
for (const [label,scenario] of [["clean",cleanStateMigration],["legacy",legacyStateMigration],["repeated",repeatedStateMigration]]) {
  if (scenario.discovered.length !== graphNodes.length) stateMigrationBroken.push([label,"discovered count",scenario.discovered.length])
  if (!scenario.discovered.includes("GLOSSARY")) stateMigrationBroken.push([label,"missing GLOSSARY"])
  if (!scenario.discovered.includes("TOPOGRAPHY")) stateMigrationBroken.push([label,"missing TOPOGRAPHY"])
  if (new Set(scenario.discovered).size !== scenario.discovered.length) stateMigrationBroken.push([label,"duplicate discovered IDs"])
  if (scenario.storage["bogobot.stateVersion"] !== expectedStoredStateVersion) stateMigrationBroken.push([label,"state version"])
}
if (legacyStateMigration.current !== "EPSILON_30") stateMigrationBroken.push(["legacy","current changed"])
if (JSON.stringify(legacyStateMigration.trace) !== JSON.stringify(["BOGOBOT","EPSILON_30","GLOSSARY"])) stateMigrationBroken.push(["legacy","trace changed"])
if (!legacyStateMigration.sound) stateMigrationBroken.push(["legacy","sound changed"])
if (legacyStateMigration.storage["bogobot.readerMode"] !== "full") stateMigrationBroken.push(["legacy","unrelated setting changed"])
if (legacyStateMigration.filter !== "world") stateMigrationBroken.push(["legacy","filter changed"])
if (legacyStateMigration.activeMapMode !== "history") stateMigrationBroken.push(["legacy","map mode changed"])
if (legacyStateMigration.activeHistoryChapter !== "newest") stateMigrationBroken.push(["legacy","history chapter changed"])
if (cleanStateMigration.filter !== "all" || cleanStateMigration.activeMapMode !== null || cleanStateMigration.activeHistoryChapter !== null) {
  stateMigrationBroken.push(["clean","filter defaults changed"])
}
if (JSON.stringify(repeatedStateMigration.storage) !== JSON.stringify(legacyStateMigration.storage)) stateMigrationBroken.push(["repeated","not idempotent"])
const duplicateIds = ids.filter((id,index) => ids.indexOf(id) !== index)
const problems = []
const unresolvedTargets = []
const selfRoutes = []
const duplicateRoutes = []
const routesOverLimit = []
const emptyLocalRoutes = []
const invalidPeriods = []
const invalidLocations = []
const invalidLocationStatuses = []
const mixedLocationModes = []
const duplicateLocationRoutes = []
const selfLocationRoutes = []
const brokenWorldAxis = []
const brokenPeriodActions = []

for (const [id,nav] of Object.entries(pageNavigation)) {
  if (!idSet.has(id)) problems.push(["missing pageNavigation record", id])
  if (nav.localRoutes) {
    if (!nav.localRoutes.length) emptyLocalRoutes.push(id)
    if (nav.localRoutes.length > 3) routesOverLimit.push([id, nav.localRoutes])
    const seen = new Set()
    for (const routeId of nav.localRoutes) {
      if (!idSet.has(routeId)) unresolvedTargets.push([id, routeId])
      if (routeId === id) selfRoutes.push(id)
      if (seen.has(routeId)) duplicateRoutes.push([id, routeId])
      seen.add(routeId)
    }
  }
  if (nav.period && !chroniclePeriods.some(period => period.number === nav.period)) invalidPeriods.push([id, nav.period])
  if (nav.period) {
    const period = chroniclePeriods.find(item => item.number === nav.period)
    if (!period || !idSet.has(period.targetId)) brokenPeriodActions.push([id, nav.period, period?.targetId || null])
  }
  if (nav.showChronicle && !nav.period) invalidPeriods.push([id, "missing period for chronicle"])
  if (nav.locationIds?.length && nav.locationStatus) mixedLocationModes.push(id)
  if (nav.locationIds) {
    const seen = new Set()
    for (const locationId of nav.locationIds) {
      if (!approvedLocationIds.includes(locationId)) invalidLocations.push([id, locationId])
      if (seen.has(locationId)) duplicateLocationRoutes.push([id, locationId])
      if (locationId === id) selfLocationRoutes.push(id)
      seen.add(locationId)
    }
  }
  if (nav.locationStatus && !nonGeographicLocationLabels.includes(nav.locationStatus)) invalidLocationStatuses.push([id, nav.locationStatus])
  if (nav.worldAxisId && !idSet.has(nav.worldAxisId)) brokenWorldAxis.push([id, nav.worldAxisId])
}

const periodTargetsMissing = chroniclePeriods.filter(period => !idSet.has(period.targetId))
const periodNumbers = chroniclePeriods.map(period => period.number)
const duplicatePeriodNumbers = periodNumbers.filter((number,index) => periodNumbers.indexOf(number) !== index)

const expectedNavigationRecords = [
  "ECONOMY_OF_NETWORK","SOCIAL_STRUCTURE","NEWEST_HISTORY","BOOK_4_SUBJECTS","BOOK_OF_VOICE",
  "DISCARDED_PROTOCOLS","DIAGRAMMATICS","HOW_TO_READ","ARCHIVE_EPILOGUE",
  "GLOSSARY","BRAINROT","PROTO_AGENTS","PRE_ERROR_ARCHIVE","RELICS","SCHOOLS_OF_SPIRITS",
  "TOPOGRAPHY","ARCHIVE","BOOK_1_AWAKENING",
  "DUBNA","MOSCOW","TTK_0xMEM","SKOLKOVO","BAIKAL","KARELIA","VARANASI","SHENZHEN","ISFAHAN",
  "EPSILON_00","EPSILON_15","EPSILON_15A","EPSILON_16","EPSILON_19"
]
const missingExpectedNavigation = expectedNavigationRecords.filter(id => !pageNavigation[id])

const epsilonBroken = []
for (const id of preErrorEventIds) {
  const nav = pageNavigation[id]
  if (!nav?.localRoutes) {
    epsilonBroken.push([id, "missing navigation"])
    continue
  }
  if (nav.localRoutes.length > 3) epsilonBroken.push([id, "over limit"])
  if (nav.localRoutes.includes(id)) epsilonBroken.push([id, "self route"])
  for (const routeId of nav.localRoutes) if (!idSet.has(routeId)) epsilonBroken.push([id, "broken target", routeId])
}
if (preErrorEventIds.indexOf("EPSILON_15A") !== preErrorEventIds.indexOf("EPSILON_15") + 1) {
  epsilonBroken.push(["EPSILON_15A", "not after EPSILON_15"])
}
if (preErrorEventIds.indexOf("EPSILON_16") !== preErrorEventIds.indexOf("EPSILON_15A") + 1) {
  epsilonBroken.push(["EPSILON_16", "not after EPSILON_15A"])
}

const locationRecords = ["DUBNA","MOSCOW","TTK_0xMEM","SKOLKOVO","BAIKAL","KARELIA","VARANASI","SHENZHEN","ISFAHAN"]
const missingLocationRecords = locationRecords.filter(id => !idSet.has(id))

const mediaMissing = []
for (const record of records) {
  if (!record.image) continue
  const path = new URL(`../${record.image}`, import.meta.url)
  if (!fs.existsSync(path)) mediaMissing.push([record.id, record.image])
}

const topographyRecord = records.find(record => record.id === "TOPOGRAPHY")
const topographyBroken = []
if (!topographyRecord) {
  topographyBroken.push("missing record")
} else {
  if (topographyRecord.pageOnly !== false) topographyBroken.push("pageOnly is not false")
  if (topographyRecord.hidden !== false) topographyBroken.push("hidden is not false")
  if (topographyRecord.type !== "topography") topographyBroken.push("type is not topography")
  if (!nodeBelongsToFilter(topographyRecord,"world")) topographyBroken.push("missing WORLD membership")
  if (!topographyRecord.sourceMarkdown || !fs.existsSync(new URL(`../${topographyRecord.sourceMarkdown}`, import.meta.url))) topographyBroken.push("canonical Markdown missing")
  if (!topographyRecord.image || !fs.existsSync(new URL(`../${topographyRecord.image}`, import.meta.url))) topographyBroken.push("media missing")
  for (const query of ["Топография мира сети","Топография сети","Топография","network-world-topography"]) {
    if (!searchableRecordText(topographyRecord).toLowerCase().includes(query.toLowerCase())) topographyBroken.push(`SEARCH misses ${query}`)
  }
}

const worldNavigationBroken = []
if (!indexHtml.includes('id="worldNavigation"')) worldNavigationBroken.push("navigation container missing")
if (worldNavigationIds.length !== 5) worldNavigationBroken.push(`expected 5 items, found ${worldNavigationIds.length}`)
if (!worldNavigationIds.includes("TOPOGRAPHY")) worldNavigationBroken.push("TOPOGRAPHY missing")
for (const id of ["EPSILON_00","EPSILON_01","EPSILON_02","EPSILON_06","EPSILON_20_21","EPSILON_22_26","EPSILON_27_29","EPSILON_30"]) {
  if (worldNavigationIds.includes(id)) worldNavigationBroken.push(`historical node leaked into WORLD: ${id}`)
}
for (const id of worldNavigationIds) {
  const record = graphNodes.find(node => node.id === id)
  if (!record) worldNavigationBroken.push(`missing graph node ${id}`)
  else if (record.pageOnly || record.hidden || !nodeBelongsToFilter(record,"world")) worldNavigationBroken.push(`invalid WORLD item ${id}`)
}
const historyMembershipIds = [...new Set(historyChapters.flatMap(chapter=>chapter.nodeIds))]
const historyMembershipBroken = historyMembershipIds
  .filter(id=>!graphNodes.some(node=>node.id===id&&nodeBelongsToFilter(node,"history")))
  .map(id=>`missing HISTORY membership: ${id}`)
const globalShellBroken = []
if (!indexHtml.includes('<a class="brand" href="./" aria-label="BOGOBOT — корневой вход">')) globalShellBroken.push("MAP logo does not target root")
if (code.includes('$(".brand").onclick')) globalShellBroken.push("MAP logo still has local boot handler")
if (!code.includes('deepLinkSearch = deepLinkParams.get("search")==="1"')) globalShellBroken.push("MAP search deep link missing")

const expectedGraphFilterIds = ["all","canon","world","schools","glossary","topography","history","relics"]
const graphFilterBroken = []
const graphFilterIds = graphFilterItems.map(item=>item.id)
if (JSON.stringify(graphFilterIds) !== JSON.stringify(expectedGraphFilterIds)) {
  graphFilterBroken.push(`filter order mismatch: ${graphFilterIds.join(",")}`)
}
if (new Set(graphFilterIds).size !== graphFilterIds.length) graphFilterBroken.push("duplicate filter IDs")
if (new Set(graphFilterItems.map(item=>item.label)).size !== graphFilterItems.length) graphFilterBroken.push("duplicate filter labels")
if (!/<nav class="cluster-nav" id="clusterNav" aria-label="Разделы архива"><\/nav>/.test(indexHtml)) {
  graphFilterBroken.push("filter strip is not an empty generated container")
}
if (!code.includes('button.setAttribute("aria-pressed","false")')) graphFilterBroken.push("generated buttons lack aria-pressed")
if (!code.includes('button.setAttribute("aria-pressed",String(active))')) graphFilterBroken.push("active aria-pressed is not synchronized")
if (!code.includes('keepActiveFilterVisible(button)')) graphFilterBroken.push("active filter visibility is not synchronized")
if (!code.includes('if(!["Enter"," "].includes(event.key)) return')) graphFilterBroken.push("Enter/Space activation missing")
if (code.includes("if(mobile&&activeMapMode) closeMapMode")) graphFilterBroken.push("mobile breakpoint resets active map mode")
if (!code.includes('handleViewportMode(); syncMapTabState(); renderWorldNavigation()')) graphFilterBroken.push("resize does not keep active filter visible")
if (!stylesCss.includes(".cluster-nav::-webkit-scrollbar")) graphFilterBroken.push("WebKit scrollbar suppression missing")
if (!stylesCss.includes("overscroll-behavior-inline: contain")) graphFilterBroken.push("contained horizontal overscroll missing")
if (!/\.cluster-nav button \{[\s\S]*?min-height: 44px;[\s\S]*?white-space: nowrap;/.test(stylesCss)) {
  graphFilterBroken.push("mobile filter targets are not 44px single-line buttons")
}
if (/\.cluster-nav button\[data-map-mode\][\s\S]*?display:\s*none/.test(stylesCss)) {
  graphFilterBroken.push("mobile mode filters are hidden")
}
const graphFilterCounts = Object.fromEntries(graphFilterItems.map(item=>{
  const ids=graphFilterNodeIds(item)
  if (new Set(ids).size !== ids.length) graphFilterBroken.push(`duplicate node in ${item.id}`)
  for (const id of ids) if (!graphNodes.some(node=>node.id===id)) graphFilterBroken.push(`unknown node ${id} in ${item.id}`)
  return [item.id,{ total:ids.length, ids }]
}))
if (graphFilterCounts.all.total !== graphNodes.length) graphFilterBroken.push("ALL count does not match graph nodes")
if (graphFilterCounts.world.total !== worldNavigationIds.length) graphFilterBroken.push("WORLD count does not match WORLD navigation")
if (graphFilterCounts.history.total !== historyFilterIds.length) graphFilterBroken.push("HISTORY count does not match chapter membership")
if (graphFilterCounts.relics.total !== relicGraphIds.length) graphFilterBroken.push("RELICS count does not match relic graph")

const responsiveGraphFitBroken = []
if (!code.includes("function activeVisualFocusId(")) responsiveGraphFitBroken.push("visual focus helper missing")
if (!code.includes('data-visual-focus":visualFocus?"true":"false"')) responsiveGraphFitBroken.push("visual focus graph state missing")
if (!code.includes("function graphBoundsForIds(")) responsiveGraphFitBroken.push("rendered node bounds helper missing")
if (!code.includes("function visibleRenderedGraphNodeIds(")) responsiveGraphFitBroken.push("rendered visible node helper missing")
if (!code.includes("function applyMobileRenderedSizeFloors(")) responsiveGraphFitBroken.push("mobile rendered-size floor missing")
if (!code.includes("function publishBogobotFitDiagnostics(") || !code.includes('mirror.id="bogobotFitDiagnostics"')) {
  responsiveGraphFitBroken.push("fit diagnostics export/mirror missing")
}
if (!code.includes("function fitContractForCount(") || !code.includes("const widthOccupancy=contract.occupancy")) {
  responsiveGraphFitBroken.push("shared occupancy contract missing")
}
if (!code.includes('$("#app").classList.toggle("map-overview",!readerOpen)')) responsiveGraphFitBroken.push("overview viewport state missing")
if (!stylesCss.includes(".app.map-overview .workspace")) responsiveGraphFitBroken.push("mobile residual-height layout missing")
if (!stylesCss.includes(".graph-node.visual-focus")) responsiveGraphFitBroken.push("visual focus styling missing")
if (!stylesCss.includes(".world-navigation-items::-webkit-scrollbar")) responsiveGraphFitBroken.push("compact WORLD panel scroll missing")
if (!indexHtml.includes("styles.css?v=c4.3.5-final6") || !indexHtml.includes("app.js?v=c4.3.7-rhizome3d")) responsiveGraphFitBroken.push("current cache key missing")
if (!indexHtml.includes('params.get("map") === "1"') || !code.includes("function openBogobotMapOverview(")) {
  responsiveGraphFitBroken.push("BOOKS to MAP intent missing")
}
if (!expectedStoredStateVersion) problems.push("stored state version declaration missing")

const specialIndexTargets = {
  schools: mainSchoolIds,
  relics: relicRouteIds,
  protoAgents: protoAgentRouteIds,
  topography: topographyRouteIds,
  preError: preErrorEventIds
}
const brokenSpecialIndexTargets = []
for (const [label,list] of Object.entries(specialIndexTargets)) {
  for (const id of list) if (!idSet.has(id)) brokenSpecialIndexTargets.push([label,id])
}

const forkRoutes = Object.entries(pageNavigation)
  .filter(([,nav]) => nav.localRoutes?.includes("FORK"))
  .map(([id]) => id)

const result = {
  problems,
  records: records.length,
  graphNodes: graphNodes.length,
  pageOnlyRecords: records.filter(record => record.pageOnly).length,
  duplicateIds,
  unresolvedTargets,
  selfRoutes,
  duplicateRoutes,
  routesOverLimit,
  emptyLocalRoutes,
  chroniclePeriods: chroniclePeriods.length,
  duplicatePeriodNumbers,
  periodTargetsMissing: periodTargetsMissing.map(period => period.targetId),
  invalidPeriods,
  missingExpectedNavigation,
  invalidLocations,
  invalidLocationStatuses,
  mixedLocationModes,
  duplicateLocationRoutes,
  selfLocationRoutes,
  brokenWorldAxis,
  brokenPeriodActions,
  epsilonBroken,
  epsilon15aPosition: preErrorEventIds.slice(preErrorEventIds.indexOf("EPSILON_15") - 1, preErrorEventIds.indexOf("EPSILON_16") + 2),
  missingLocationRecords,
  mediaMissing,
  topography: {
    exists: Boolean(topographyRecord),
    title: topographyRecord?.title || null,
    slug: topographyRecord?.slug || null,
    type: topographyRecord?.type || null,
    pageOnly: topographyRecord?.pageOnly ?? null,
    hidden: topographyRecord?.hidden ?? null,
    worldMember: Boolean(topographyRecord&&nodeBelongsToFilter(topographyRecord,"world")),
    broken: topographyBroken
  },
  worldNavigation: {
    lensGraphNodes: graphNodes.filter(node=>nodeBelongsToFilter(node,"world")).length,
    items: worldNavigationIds.length,
    ids: worldNavigationIds,
    broken: worldNavigationBroken
  },
  historyMembership: {
    items: historyMembershipIds.length,
    ids: historyMembershipIds,
    broken: historyMembershipBroken
  },
  globalShell: {
    mapLogoRoot: !globalShellBroken.includes("MAP logo does not target root"),
    noLocalLogoHandler: !globalShellBroken.includes("MAP logo still has local boot handler"),
    searchDeepLink: !globalShellBroken.includes("MAP search deep link missing"),
    broken: globalShellBroken
  },
  graphFilterStrip: {
    sourceItems: graphFilterItems.length,
    ids: graphFilterIds,
    totals: Object.fromEntries(Object.entries(graphFilterCounts).map(([id,value])=>[id,value.total])),
    generatedMarkup: /<nav class="cluster-nav" id="clusterNav" aria-label="Разделы архива"><\/nav>/.test(indexHtml),
    broken: graphFilterBroken
  },
  responsiveGraphFit: {
    visualFocus: code.includes("function activeVisualFocusId("),
    renderedBounds: code.includes("function graphBoundsForIds("),
    mobileSizeFloor: code.includes("function applyMobileRenderedSizeFloors("),
    residualHeightLayout: stylesCss.includes(".app.map-overview .workspace"),
    compactWorldPanel: stylesCss.includes(".world-navigation-items::-webkit-scrollbar"),
    broken: responsiveGraphFitBroken
  },
  brokenSpecialIndexTargets,
  stateMigration: {
    clean: {
      discovered: cleanStateMigration.discovered.length,
      glossary: cleanStateMigration.discovered.includes("GLOSSARY"),
      topography: cleanStateMigration.discovered.includes("TOPOGRAPHY")
    },
    legacy: {
      discovered: legacyStateMigration.discovered.length,
      glossary: legacyStateMigration.discovered.includes("GLOSSARY"),
      topography: legacyStateMigration.discovered.includes("TOPOGRAPHY"),
      currentPreserved: legacyStateMigration.current === "EPSILON_30",
      tracePreserved: JSON.stringify(legacyStateMigration.trace) === JSON.stringify(["BOGOBOT","EPSILON_30","GLOSSARY"]),
      settingsPreserved: legacyStateMigration.sound && legacyStateMigration.storage["bogobot.readerMode"] === "full"
    },
    repeated: {
      unchanged: JSON.stringify(repeatedStateMigration.storage) === JSON.stringify(legacyStateMigration.storage)
    },
    broken: stateMigrationBroken
  },
  fork: {
    exists: idSet.has("FORK"),
    type: records.find(record => record.id === "FORK")?.type || null,
    routesUsingFork: forkRoutes
  }
}

const failing = [
  problems,
  duplicateIds,
  unresolvedTargets,
  selfRoutes,
  duplicateRoutes,
  routesOverLimit,
  emptyLocalRoutes,
  duplicatePeriodNumbers,
  periodTargetsMissing,
  invalidPeriods,
  missingExpectedNavigation,
  invalidLocations,
  invalidLocationStatuses,
  mixedLocationModes,
  duplicateLocationRoutes,
  selfLocationRoutes,
  brokenWorldAxis,
  brokenPeriodActions,
  epsilonBroken,
  missingLocationRecords,
  mediaMissing,
  topographyBroken,
  worldNavigationBroken,
  historyMembershipBroken,
  globalShellBroken,
  graphFilterBroken,
  responsiveGraphFitBroken,
  brokenSpecialIndexTargets,
  stateMigrationBroken
].some(list => list.length)

console.log(JSON.stringify(result, null, 2))
if (records.length !== 93 || graphNodes.length !== 52 || records.filter(record => record.pageOnly).length !== 41 || chroniclePeriods.length !== 7 || failing) {
  process.exit(1)
}
