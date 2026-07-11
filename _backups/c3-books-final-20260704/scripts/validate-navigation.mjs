import fs from "node:fs"
import vm from "node:vm"

const code = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8")
const end = code.indexOf("const clusterDefinitions =")
if (end < 0) throw new Error("Cannot locate navigation data boundary")

const sandbox = {
  console,
  innerWidth: 1440,
  localStorage: { getItem(){ return null }, setItem(){} }
}
vm.createContext(sandbox)
vm.runInContext(`${code.slice(0,end)}
globalThis.__records=records
globalThis.__graphNodes=graphNodes
globalThis.__pageNavigation=pageNavigation
globalThis.__chroniclePeriods=chroniclePeriods
globalThis.__approvedLocationIds=approvedLocationIds
globalThis.__nonGeographicLocationLabels=nonGeographicLocationLabels
globalThis.__topographyRouteIds=topographyRouteIds
globalThis.__mainSchoolIds=mainSchoolIds
globalThis.__relicRouteIds=relicRouteIds
globalThis.__protoAgentRouteIds=protoAgentRouteIds
globalThis.__preErrorEventIds=preErrorEventIds
`, sandbox)

const records = sandbox.__records
const graphNodes = sandbox.__graphNodes
const pageNavigation = sandbox.__pageNavigation
const chroniclePeriods = sandbox.__chroniclePeriods
const approvedLocationIds = sandbox.__approvedLocationIds
const nonGeographicLocationLabels = sandbox.__nonGeographicLocationLabels
const topographyRouteIds = sandbox.__topographyRouteIds
const mainSchoolIds = sandbox.__mainSchoolIds
const relicRouteIds = sandbox.__relicRouteIds
const protoAgentRouteIds = sandbox.__protoAgentRouteIds
const preErrorEventIds = sandbox.__preErrorEventIds

const ids = records.map(record => record.id)
const idSet = new Set(ids)
const runStoredStateScenario = initialEntries => {
  const storage = new Map(Object.entries(initialEntries))
  const scenarioSandbox = {
    console,
    innerWidth: 1440,
    localStorage: {
      getItem(key){ return storage.has(key) ? storage.get(key) : null },
      setItem(key,value){ storage.set(key,String(value)) }
    }
  }
  vm.createContext(scenarioSandbox)
  vm.runInContext(`${code.slice(0,end)}
globalThis.__state=state
`, scenarioSandbox)
  return {
    current: scenarioSandbox.__state.current,
    discovered: [...scenarioSandbox.__state.discovered],
    trace: [...scenarioSandbox.__state.trace],
    sound: scenarioSandbox.__state.sound,
    storage: Object.fromEntries(storage)
  }
}
const cleanStateMigration = runStoredStateScenario({})
const legacyStateMigration = runStoredStateScenario({
  "bogobot.current":"EPSILON_30",
  "bogobot.discovered":JSON.stringify(graphNodes.filter(record => record.id !== "GLOSSARY").map(record => record.id)),
  "bogobot.trace":JSON.stringify(["BOGOBOT","EPSILON_30","GLOSSARY"]),
  "bogobot.sound":"on",
  "bogobot.readerMode":"full"
})
const repeatedStateMigration = runStoredStateScenario(legacyStateMigration.storage)
const stateMigrationBroken = []
for (const [label,scenario] of [["clean",cleanStateMigration],["legacy",legacyStateMigration],["repeated",repeatedStateMigration]]) {
  if (scenario.discovered.length !== graphNodes.length) stateMigrationBroken.push([label,"discovered count",scenario.discovered.length])
  if (!scenario.discovered.includes("GLOSSARY")) stateMigrationBroken.push([label,"missing GLOSSARY"])
  if (new Set(scenario.discovered).size !== scenario.discovered.length) stateMigrationBroken.push([label,"duplicate discovered IDs"])
  if (scenario.storage["bogobot.stateVersion"] !== "1") stateMigrationBroken.push([label,"state version"])
}
if (legacyStateMigration.current !== "EPSILON_30") stateMigrationBroken.push(["legacy","current changed"])
if (JSON.stringify(legacyStateMigration.trace) !== JSON.stringify(["BOGOBOT","EPSILON_30","GLOSSARY"])) stateMigrationBroken.push(["legacy","trace changed"])
if (!legacyStateMigration.sound) stateMigrationBroken.push(["legacy","sound changed"])
if (legacyStateMigration.storage["bogobot.readerMode"] !== "full") stateMigrationBroken.push(["legacy","unrelated setting changed"])
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
  brokenSpecialIndexTargets,
  stateMigration: {
    clean: {
      discovered: cleanStateMigration.discovered.length,
      glossary: cleanStateMigration.discovered.includes("GLOSSARY")
    },
    legacy: {
      discovered: legacyStateMigration.discovered.length,
      glossary: legacyStateMigration.discovered.includes("GLOSSARY"),
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
  brokenSpecialIndexTargets,
  stateMigrationBroken
].some(list => list.length)

console.log(JSON.stringify(result, null, 2))
if (records.length !== 93 || graphNodes.length !== 52 || records.filter(record => record.pageOnly).length !== 41 || chroniclePeriods.length !== 7 || failing) {
  process.exit(1)
}
