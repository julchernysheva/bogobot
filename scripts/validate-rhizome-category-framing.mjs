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
function round(value) {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : value;
}
function assert(condition, message) {
  if (!condition) problems.push(message);
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
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    if (document.querySelector("#surface3d")?.getAttribute("aria-pressed") !== "true") document.querySelector("#surface3d")?.click();
    document.querySelector(".brand")?.click();
  });
  await page.waitForFunction(() => Boolean(globalThis.__bogobotRhizomeDiagnostics?.getFrameMetrics?.()), { timeout: 10000 });
  await page.waitForTimeout(1000);
}

async function selectCategory(page, label) {
  if (label !== "MAP") {
    await page.evaluate((label) => {
      const button = [...document.querySelectorAll("#clusterNav button")].find(item => (item.textContent || "").toUpperCase().includes(label));
      button?.click();
    }, label);
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => {
    if (document.querySelector("#surface3d")?.getAttribute("aria-pressed") !== "true") document.querySelector("#surface3d")?.click();
  });
  await page.waitForTimeout(1200);
}

async function snapshot(page, label) {
  return page.evaluate((label) => {
    const frame = globalThis.__bogobotRhizomeDiagnostics?.getFrameMetrics?.() || null;
    const camera = globalThis.__bogobotRhizomeDiagnostics?.getCameraState?.() || null;
    const bounds = frame?.bounds || null;
    const viewport = frame?.viewport || { width: window.innerWidth, height: window.innerHeight };
    const center = bounds ? { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 } : null;
    const safeCenter = { x: viewport.width / 2, y: viewport.height / 2 };
    const nodes = frame?.nodes || [];
    const clipped = nodes.filter(node => node.x < 0 || node.x > viewport.width || node.y < 0 || node.y > viewport.height);
    const edgeMargins = bounds ? {
      left: bounds.minX,
      right: viewport.width - bounds.maxX,
      top: bounds.minY,
      bottom: viewport.height - bounds.maxY
    } : null;
    return {
      label,
      activeCategory: document.querySelector("#clusterNav button.active")?.textContent?.trim() || null,
      renderer: document.querySelector("#rhizome3dCanvas:not([hidden])") ? "RHIZOME 3D" : "OTHER",
      camera,
      nodeCount: nodes.length,
      finite: nodes.every(node => Number.isFinite(node.x) && Number.isFinite(node.y) && Number.isFinite(node.z) && Number.isFinite(node.scale) && Number.isFinite(node.opacity)),
      clippedNodeCount: clipped.length,
      clippedNodeIds: clipped.map(node => node.id),
      bounds,
      centerOffset: center ? {
        xRatio: (center.x - safeCenter.x) / Math.max(1, viewport.width),
        yRatio: (center.y - safeCenter.y) / Math.max(1, viewport.height)
      } : null,
      occupancy: bounds ? {
        width: bounds.occupancyX,
        height: bounds.occupancyY,
        dominant: Math.max(bounds.occupancyX, bounds.occupancyY),
        nonDominant: Math.min(bounds.occupancyX, bounds.occupancyY)
      } : null,
      minEdgeMargin: edgeMargins ? Math.min(edgeMargins.left, edgeMargins.right, edgeMargins.top, edgeMargins.bottom) : null,
      overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    };
  }, label);
}

function validateMetric(item, expectedNodes, viewportKind) {
  assert(item.renderer === "RHIZOME 3D", `${item.label}: renderer ${item.renderer}`);
  assert(item.nodeCount === expectedNodes, `${item.label}: node count ${item.nodeCount}, expected ${expectedNodes}`);
  assert(item.finite, `${item.label}: non-finite projected values`);
  assert(item.clippedNodeCount === 0, `${item.label}: clipped nodes ${item.clippedNodeIds.join(",")}`);
  assert(item.overflowX === 0, `${item.label}: horizontal overflow ${item.overflowX}`);
  assert(item.bounds, `${item.label}: missing bounds`);
  if (!item.bounds) return;
  const maxOffset = viewportKind === "mobile" ? 0.1 : 0.11;
  assert(Math.abs(item.centerOffset.xRatio) <= maxOffset, `${item.label}: x offset ${item.centerOffset.xRatio}`);
  assert(Math.abs(item.centerOffset.yRatio) <= maxOffset, `${item.label}: y offset ${item.centerOffset.yRatio}`);
  const minDominant = item.label.includes("MAP") ? (viewportKind === "mobile" ? 0.9 : 0.78) : viewportKind === "mobile" ? 0.68 : 0.58;
  const maxDominant = viewportKind === "mobile" ? 0.98 : 0.86;
  assert(item.occupancy.dominant >= minDominant, `${item.label}: dominant occupancy ${item.occupancy.dominant}`);
  assert(item.occupancy.dominant <= maxDominant, `${item.label}: dominant occupancy ${item.occupancy.dominant}`);
  assert(item.minEdgeMargin >= 0, `${item.label}: negative margin ${item.minEdgeMargin}`);
  assert(item.camera?.selectedNode === "BOGOBOT", `${item.label}: selected node ${item.camera?.selectedNode}`);
}

async function validateCameraPreservation(page) {
  await boot(page, { width: 1440, height: 900 });
  const before = await snapshot(page, "camera-before-glas");
  await page.waitForFunction(() => {
    const action = document.querySelector("#askGlasAction");
    return Boolean(action && !action.hidden && action.offsetParent !== null);
  }, { timeout: 10000 });
  await page.click("#askGlasAction");
  await page.waitForFunction(() => document.querySelector("#bogobotDialogue")?.hidden === false, { timeout: 10000 });
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("#bogobotDialogue")?.hidden === true, { timeout: 10000 });
  await page.waitForTimeout(400);
  const after = await snapshot(page, "camera-after-glas");
  assert(vectorDelta(before.camera?.position, after.camera?.position) <= epsilon, "GLAS changed camera position");
  assert(vectorDelta(before.camera?.target, after.camera?.target) <= epsilon, "GLAS changed camera target");
  assert(Math.abs((before.camera?.zoom ?? 0) - (after.camera?.zoom ?? 0)) <= epsilon, "GLAS changed camera zoom");
  assert(after.activeCategory?.includes("MAP"), `category after GLAS ${after.activeCategory}`);
}

const geometrySha = sha256("rhizome-3d-geometry.js");
assert(geometrySha === expectedGeometrySha256, `rhizome geometry sha changed ${geometrySha}`);
const geometryText = fs.readFileSync("rhizome-3d-geometry.js", "utf8");
assert((geometryText.match(/Object\.freeze\(\{ slotId:/g) || []).length === 53, "geometry node count changed");
assert(geometryText.includes('"BOGOBOT": Object.freeze({ slotId: "bogobot", x: -95, y: -60, z: 0 })'), "BOGOBOT coordinates changed");

const desktopCases = [["MAP", 53], ["CANON", 16], ["WORLD", 7], ["SCHOOLS", 8], ["GLOSSARY", 5], ["TOPOGRAPHY", 10], ["HISTORY", 9], ["RELICS", 7]];
const mobileCases = [["MAP", 53], ["WORLD", 7], ["TOPOGRAPHY", 10], ["RELICS", 7]];

const browser = await chromium.launch({ headless: true, executablePath });
try {
  const desktop = await browser.newPage({ reducedMotion: "reduce" });
  await boot(desktop, { width: 1440, height: 900 });
  for (const [category, expected] of desktopCases) {
    if (category === "MAP") await boot(desktop, { width: 1440, height: 900 });
    else await selectCategory(desktop, category);
    const item = await snapshot(desktop, `desktop-1440-${category}`);
    metrics.push(item);
    validateMetric(item, expected, "desktop");
  }
  await validateCameraPreservation(desktop);
  await desktop.close();

  const mobile = await browser.newPage({ reducedMotion: "reduce" });
  await boot(mobile, { width: 390, height: 844 });
  for (const [category, expected] of mobileCases) {
    if (category === "MAP") await boot(mobile, { width: 390, height: 844 });
    else await selectCategory(mobile, category);
    const item = await snapshot(mobile, `mobile-390-${category}`);
    metrics.push(item);
    validateMetric(item, expected, "mobile");
  }
  await mobile.close();
} finally {
  await browser.close();
}

const compact = metrics.map(item => ({
  label: item.label,
  activeCategory: item.activeCategory,
  nodes: item.nodeCount,
  clipped: item.clippedNodeCount,
  offsetX: round(item.centerOffset?.xRatio),
  offsetY: round(item.centerOffset?.yRatio),
  dominant: round(item.occupancy?.dominant),
  nonDominant: round(item.occupancy?.nonDominant),
  minMargin: round(item.minEdgeMargin),
  overflowX: item.overflowX
}));

if (problems.length) {
  console.error(JSON.stringify({ status: "FAIL", geometrySha, problems, metrics: compact }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ status: "PASS", geometrySha, metrics: compact }, null, 2));
