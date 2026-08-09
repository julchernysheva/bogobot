import fs from "node:fs";
import crypto from "node:crypto";
import { chromium } from "playwright";

const previewUrl = process.env.BOGOBOT_PREVIEW_URL || "http://127.0.0.1:4173/";
const executablePath = process.env.PLAYWRIGHT_CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const expectedGeometrySha256 = "803b8b19e4cc37ee24c4ea7a27908d6e0617007e5baf5a2a17df2c422c67a680";
const epsilon = 0.000001;
const problems = [];
const metrics = [];

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function assert(condition, message) {
  if (!condition) problems.push(message);
}

function round(value) {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : value;
}

function vectorDelta(a, b) {
  if (!a || !b) return Infinity;
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
}

async function boot(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(previewUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#enter", { timeout: 10000 });
  await page.click("#enter");
  await page.waitForSelector("#app.ready", { timeout: 10000 });
  await page.evaluate(() => {
    if (document.querySelector("#surface3d")?.getAttribute("aria-pressed") !== "true") document.querySelector("#surface3d")?.click();
    document.querySelector(".brand")?.click();
  });
  await page.waitForFunction(() => Boolean(globalThis.__bogobotRhizomeDiagnostics?.getFrameMetrics?.()), { timeout: 10000 });
  await page.waitForTimeout(900);
}

async function selectCategory(page, label) {
  await page.evaluate((label) => {
    const button = [...document.querySelectorAll("#clusterNav button")].find(item => (item.textContent || "").toUpperCase().includes(label));
    button?.click();
  }, label);
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    if (document.querySelector("#surface3d")?.getAttribute("aria-pressed") !== "true") document.querySelector("#surface3d")?.click();
  });
  await page.waitForTimeout(1400);
  await page.waitForFunction(() => !(globalThis.__bogobotRhizomeDiagnostics?.getCameraState?.()?.isAnimating), { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(250);
}

async function snapshot(page, label) {
  return page.evaluate((label) => {
    const frame = globalThis.__bogobotRhizomeDiagnostics?.getFrameMetrics?.() || null;
    const camera = globalThis.__bogobotRhizomeDiagnostics?.getCameraState?.() || null;
    const nodes = frame?.nodes || [];
    const displayDeltas = nodes.map(node => {
      const source = node.source || null;
      const display = node.display || null;
      if (!source || !display) return null;
      return Math.hypot(display.x - source.x, display.y - source.y, display.z - source.z);
    }).filter(Number.isFinite);
    return {
      label,
      activeCategory: document.querySelector("#clusterNav button.active")?.textContent?.trim() || null,
      renderer: document.querySelector("#rhizome3dCanvas:not([hidden])") ? "RHIZOME 3D" : "OTHER",
      camera,
      frame,
      nodeCount: nodes.length,
      finite: nodes.every(node => (
        Number.isFinite(node.x) &&
        Number.isFinite(node.y) &&
        Number.isFinite(node.z) &&
        Number.isFinite(node.scale) &&
        Number.isFinite(node.opacity) &&
        Number.isFinite(node.source?.x) &&
        Number.isFinite(node.source?.y) &&
        Number.isFinite(node.source?.z) &&
        Number.isFinite(node.display?.x) &&
        Number.isFinite(node.display?.y) &&
        Number.isFinite(node.display?.z)
      )),
      clippedNodeIds: nodes
        .filter(node => node.x < 0 || node.x > frame.viewport.width || node.y < 0 || node.y > frame.viewport.height)
        .map(node => node.id),
      maxDisplayDelta: displayDeltas.length ? Math.max(...displayDeltas) : 0,
      minGap: frame?.minGap || 0,
      overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    };
  }, label);
}

function validateLensCase(item, expectedNodes, viewportKind) {
  const { label, frame } = item;
  assert(item.renderer === "RHIZOME 3D", `${label}: renderer ${item.renderer}`);
  assert(item.nodeCount === expectedNodes, `${label}: node count ${item.nodeCount}, expected ${expectedNodes}`);
  assert(item.finite, `${label}: non-finite source/display/projected values`);
  assert(item.clippedNodeIds.length === 0, `${label}: clipped nodes ${item.clippedNodeIds.join(",")}`);
  assert(item.overflowX === 0, `${label}: horizontal overflow ${item.overflowX}`);
  assert(frame?.lens?.active === true, `${label}: lens inactive`);
  assert(Math.abs((frame?.lens?.strength ?? 0) - 1) <= epsilon, `${label}: lens strength ${frame?.lens?.strength}`);
  assert(Math.abs((frame?.lens?.targetStrength ?? 0) - 1) <= epsilon, `${label}: lens target ${frame?.lens?.targetStrength}`);
  assert(item.maxDisplayDelta > 1, `${label}: display coordinates match canonical source`);
  assert(frame?.bounds, `${label}: missing bounds`);
  if (frame?.bounds) {
    const dominant = Math.max(frame.bounds.occupancyX, frame.bounds.occupancyY);
    const maxDominant = viewportKind === "mobile" ? 0.98 : 0.86;
    const minDominant = viewportKind === "mobile" ? 0.18 : 0.28;
    assert(dominant >= minDominant, `${label}: weak occupancy ${dominant}`);
    assert(dominant <= maxDominant, `${label}: excessive occupancy ${dominant}`);
  }
  assert(item.camera?.selectedNode === "BOGOBOT", `${label}: selected node ${item.camera?.selectedNode}`);
}

function validateMapCase(item, expectedNodes) {
  const { label, frame } = item;
  assert(item.renderer === "RHIZOME 3D", `${label}: renderer ${item.renderer}`);
  assert(item.nodeCount === expectedNodes, `${label}: node count ${item.nodeCount}, expected ${expectedNodes}`);
  assert(item.finite, `${label}: non-finite source/display/projected values`);
  assert(item.clippedNodeIds.length === 0, `${label}: clipped nodes ${item.clippedNodeIds.join(",")}`);
  assert(item.overflowX === 0, `${label}: horizontal overflow ${item.overflowX}`);
  assert(frame?.lens?.active === false, `${label}: MAP lens active`);
  assert(Math.abs(frame?.lens?.strength ?? 0) <= epsilon, `${label}: MAP lens strength ${frame?.lens?.strength}`);
  assert(Math.abs(frame?.lens?.targetStrength ?? 0) <= epsilon, `${label}: MAP lens target ${frame?.lens?.targetStrength}`);
  assert(item.maxDisplayDelta <= epsilon, `${label}: MAP display delta ${item.maxDisplayDelta}`);
  assert(item.camera?.selectedNode === "BOGOBOT", `${label}: selected node ${item.camera?.selectedNode}`);
}

const geometrySha = sha256("rhizome-3d-geometry.js");
assert(geometrySha === expectedGeometrySha256, `rhizome geometry sha changed ${geometrySha}`);
const geometryText = fs.readFileSync("rhizome-3d-geometry.js", "utf8");
assert((geometryText.match(/Object\.freeze\(\{ slotId:/g) || []).length === 53, "geometry node count changed");
assert(geometryText.includes('"BOGOBOT": Object.freeze({ slotId: "bogobot", x: -95, y: -60, z: 0 })'), "BOGOBOT coordinates changed");

const browser = await chromium.launch({ headless: true, executablePath });
try {
  const cases = [
    { viewport: { width: 1440, height: 900 }, kind: "desktop" },
    { viewport: { width: 1280, height: 900 }, kind: "desktop" },
    { viewport: { width: 390, height: 844 }, kind: "mobile" }
  ];
  const categories = [
    ["WORLD", 7],
    ["TOPOGRAPHY", 10],
    ["RELICS", 7]
  ];

  for (const viewportCase of cases) {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    await boot(page, viewportCase.viewport);
    const mapBefore = await snapshot(page, `${viewportCase.kind}-${viewportCase.viewport.width}-MAP-before`);
    metrics.push(mapBefore);
    validateMapCase(mapBefore, 53);

    for (const [category, expectedNodes] of categories) {
      await selectCategory(page, category);
      const categoryItem = await snapshot(page, `${viewportCase.kind}-${viewportCase.viewport.width}-${category}`);
      metrics.push(categoryItem);
      validateLensCase(categoryItem, expectedNodes, viewportCase.kind);

      await selectCategory(page, "MAP");
      const mapAfter = await snapshot(page, `${viewportCase.kind}-${viewportCase.viewport.width}-MAP-after-${category}`);
      metrics.push(mapAfter);
      validateMapCase(mapAfter, 53);
    }
    await page.close();
  }
} finally {
  await browser.close();
}

const compact = metrics.map(item => ({
  label: item.label,
  category: item.activeCategory,
  nodes: item.nodeCount,
  clipped: item.clippedNodeIds.length,
  lensActive: item.frame?.lens?.active,
  lensStrength: round(item.frame?.lens?.strength),
  maxDisplayDelta: round(item.maxDisplayDelta),
  occupancyX: round(item.frame?.bounds?.occupancyX),
  occupancyY: round(item.frame?.bounds?.occupancyY),
  minGap: round(item.minGap),
  overflowX: item.overflowX
}));

if (problems.length) {
  console.error(JSON.stringify({ status: "FAIL", geometrySha, problems, metrics: compact }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ status: "PASS", geometrySha, metrics: compact }, null, 2));
