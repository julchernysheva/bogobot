import fs from "node:fs";
import crypto from "node:crypto";
import { chromium } from "playwright";

const previewUrl = process.env.BOGOBOT_PREVIEW_URL || "http://127.0.0.1:4173/";
const executablePath = process.env.PLAYWRIGHT_CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const expectedGeometrySha256 = "803b8b19e4cc37ee24c4ea7a27908d6e0617007e5baf5a2a17df2c422c67a680";
const epsilon = 0.000001;
const problems = [];
const diagnostics = [];

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function finite(value) {
  return Number.isFinite(value);
}
function vectorDelta(a, b) {
  if (!a || !b) return Infinity;
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
}
function assert(condition, message) {
  if (!condition) problems.push(message);
}
function round(value) {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : value;
}
function compactFrameSummary(item) {
  if (!item?.label) return null;
  const far = item.frame?.samples?.far;
  const mid = item.frame?.samples?.mid;
  const near = item.frame?.samples?.near;
  return {
    label: item.label,
    renderer: item.renderer,
    category: item.category,
    nodes: item.frame?.nodes?.length,
    occupancyX: round(item.frame?.bounds?.occupancyX),
    occupancyY: round(item.frame?.bounds?.occupancyY),
    far: far ? { id: far.id, scale: round(far.scale), opacity: round(far.opacity) } : null,
    mid: mid ? { id: mid.id, scale: round(mid.scale), opacity: round(mid.opacity) } : null,
    near: near ? { id: near.id, scale: round(near.scale), opacity: round(near.opacity) } : null
  };
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
  await page.waitForTimeout(900);
}
async function snapshot(page, label) {
  return page.evaluate((label) => {
    const frame = globalThis.__bogobotRhizomeDiagnostics?.getFrameMetrics?.() || null;
    const camera = globalThis.__bogobotRhizomeDiagnostics?.getCameraState?.() || null;
    const overflow = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const renderer = document.querySelector("#rhizome3dCanvas:not([hidden])") ? "RHIZOME 3D" : "OTHER";
    return { label, frame, camera, overflow, renderer, category: document.querySelector("#clusterNav button.active")?.textContent?.trim() || null };
  }, label);
}
function validateFrame(snapshot, expectedCountRange, framingKind) {
  const { label, frame, camera, overflow, renderer } = snapshot;
  assert(renderer === "RHIZOME 3D", `${label}: renderer ${renderer}`);
  assert(overflow === 0, `${label}: horizontal overflow ${overflow}`);
  assert(frame, `${label}: missing frame metrics`);
  if (!frame) return;
  assert(frame.nodes.length >= expectedCountRange[0] && frame.nodes.length <= expectedCountRange[1], `${label}: node count ${frame.nodes.length}`);
  assert(frame.nodes.every(node => finite(node.x) && finite(node.y) && finite(node.z) && finite(node.scale) && finite(node.opacity)), `${label}: non-finite node metrics`);
  assert(frame.nodes.every(node => node.scale >= 0.5 && node.scale <= 1.55), `${label}: scale outside range`);
  assert(frame.nodes.every(node => node.opacity >= 0.1 && node.opacity <= 1), `${label}: opacity outside range`);
  const { far, mid, near } = frame.samples || {};
  assert(far && mid && near, `${label}: missing depth samples`);
  if (far && mid && near) {
    assert(near.scale > mid.scale && mid.scale > far.scale, `${label}: scale order near/mid/far broken`);
    assert(near.opacity > far.opacity, `${label}: opacity order near/far broken`);
  }
  assert(frame.bounds && finite(frame.bounds.occupancyX) && finite(frame.bounds.occupancyY), `${label}: missing finite bounds`);
  if (frame.bounds) {
    if (framingKind === "map") {
      assert(frame.bounds.occupancyX >= 0.65 && frame.bounds.occupancyX <= 0.78, `${label}: MAP occupancyX ${frame.bounds.occupancyX}`);
      assert(frame.bounds.occupancyY >= 0.72 && frame.bounds.occupancyY <= 0.88, `${label}: MAP occupancyY ${frame.bounds.occupancyY}`);
    } else if (framingKind === "mobile-map") {
      assert(frame.bounds.occupancyX >= 0.85 && frame.bounds.occupancyX <= 1.04, `${label}: mobile occupancyX ${frame.bounds.occupancyX}`);
      assert(frame.bounds.occupancyY >= 0.32 && frame.bounds.occupancyY <= 0.58, `${label}: mobile occupancyY ${frame.bounds.occupancyY}`);
    } else {
      assert(frame.bounds.occupancyX >= 0.28 && frame.bounds.occupancyX <= 0.90, `${label}: category occupancyX ${frame.bounds.occupancyX}`);
      assert(frame.bounds.occupancyY >= 0.28 && frame.bounds.occupancyY <= 0.90, `${label}: category occupancyY ${frame.bounds.occupancyY}`);
    }
  }
  assert(camera?.mode === "RHIZOME 3D", `${label}: camera mode ${camera?.mode}`);
  assert(camera?.selectedNode === "BOGOBOT", `${label}: selected node ${camera?.selectedNode}`);
}
async function prepareBogobotContext(page) {
  await page.evaluate(() => document.querySelector(".brand")?.click());
  await page.waitForFunction(() => {
    const action = document.querySelector("#askGlasAction");
    return Boolean(action && !action.hidden && action.offsetParent !== null);
  }, { timeout: 10000 });
  await page.waitForTimeout(300);
}

async function validateCameraPreservation(page) {
  await boot(page, { width: 1440, height: 900 });
  const before = await snapshot(page, "camera-before");
  await page.click("#askGlasAction");
  await page.waitForFunction(() => document.querySelector("#bogobotDialogue")?.hidden === false, { timeout: 10000 });
  await page.waitForTimeout(400);
  const open = await snapshot(page, "camera-glas-open");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("#bogobotDialogue")?.hidden === true, { timeout: 10000 });
  await page.waitForTimeout(400);
  const after = await snapshot(page, "camera-after-escape");
  const deltaPosition = vectorDelta(before.camera?.position, after.camera?.position);
  const deltaTarget = vectorDelta(before.camera?.target, after.camera?.target);
  const deltaZoom = Math.abs((before.camera?.zoom ?? 0) - (after.camera?.zoom ?? 0));
  assert(deltaPosition <= epsilon, `GLAS camera position changed ${deltaPosition}`);
  assert(deltaTarget <= epsilon, `GLAS camera target changed ${deltaTarget}`);
  assert(deltaZoom <= epsilon, `GLAS camera zoom changed ${deltaZoom}`);
  assert(open.camera?.mode === "RHIZOME 3D" && after.camera?.mode === "RHIZOME 3D", "GLAS changed RHIZOME mode");
  const closedState = await page.evaluate(() => ({
    askVisible: (() => { const el = document.querySelector("#askGlasAction"); if (!el) return false; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return !el.hidden && cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0; })(),
    activeElementId: document.activeElement?.id || null,
    bodyGlasOpen: document.body.classList.contains("glas-open"),
    inertCount: [...document.querySelectorAll("body > *")].filter(el => el.hasAttribute("inert")).length,
    hidden: document.querySelector("#bogobotDialogue")?.hidden ?? null
  }));
  assert(closedState.askVisible, "ASK GLAS not visible after close");
  assert(closedState.activeElementId === "askGlasAction", `focus after close ${closedState.activeElementId}`);
  assert(!closedState.bodyGlasOpen, "body.glas-open remains after close");
  assert(closedState.inertCount === 0, `background inert count ${closedState.inertCount}`);
  assert(closedState.hidden === true, "GLAS not hidden after close");
  diagnostics.push({ cameraPreservation: { deltaPosition, deltaTarget, deltaZoom, closedState } });
}

const geometrySha = sha256("rhizome-3d-geometry.js");
assert(geometrySha === expectedGeometrySha256, `rhizome geometry sha changed ${geometrySha}`);
const geometryText = fs.readFileSync("rhizome-3d-geometry.js", "utf8");
assert((geometryText.match(/Object\.freeze\(\{ slotId:/g) || []).length === 53, "geometry node count changed");
assert(geometryText.includes('"BOGOBOT": Object.freeze({ slotId: "bogobot", x: -95, y: -60, z: 0 })'), "BOGOBOT coordinates changed");

const browser = await chromium.launch({ headless: true, executablePath });
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  await boot(page, { width: 1440, height: 900 });
  const map = await snapshot(page, "desktop-1440-map");
  validateFrame(map, [53, 53], "map");
  diagnostics.push(map);
  for (const category of ["CANON", "WORLD", "SCHOOLS", "GLOSSARY", "TOPOGRAPHY", "HISTORY", "RELICS"]) {
    await selectCategory(page, category);
    const item = await snapshot(page, `desktop-1440-${category.toLowerCase()}`);
    validateFrame(item, [1, 52], "category");
    diagnostics.push(item);
  }
  await validateCameraPreservation(page);
  await page.close();
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await boot(mobile, { width: 390, height: 844 });
  const mobileMap = await snapshot(mobile, "mobile-390-map");
  validateFrame(mobileMap, [53, 53], "mobile-map");
  diagnostics.push(mobileMap);
  await mobile.close();
} finally {
  await browser.close();
}

if (problems.length) {
  console.error(JSON.stringify({ status: "FAIL", geometrySha, problems, diagnostics: diagnostics.map(compactFrameSummary).filter(Boolean) }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ status: "PASS", geometrySha, checked: diagnostics.length, summary: diagnostics.map(compactFrameSummary).filter(Boolean) }, null, 2));
