import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const previewUrl = process.env.BOGOBOT_PREVIEW_URL || "http://127.0.0.1:4173/";
const qaDir = process.env.BOGOBOT_QA_DIR || path.join(process.cwd(), "qa/baseline-recovery-2026-08-02");
const executablePath = process.env.PLAYWRIGHT_CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const fallbackExecutable = path.join(os.homedir(), "Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell");
const launchOptions = fs.existsSync(executablePath)
  ? { headless: true, executablePath }
  : fs.existsSync(fallbackExecutable)
    ? { headless: true, executablePath: fallbackExecutable }
    : { headless: true };

const viewports = [
  { key: "desktop1440", label: "desktop-1440", width: 1440, height: 900 },
  { key: "mobile390", label: "mobile-390", width: 390, height: 844 }
];
const epsilon = 0.000001;
const problems = [];
const metrics = {};

fs.mkdirSync(qaDir, { recursive: true });

function vectorDelta(a, b) {
  if (!a || !b) return null;
  return {
    x: Math.abs((a.x ?? 0) - (b.x ?? 0)),
    y: Math.abs((a.y ?? 0) - (b.y ?? 0)),
    z: Math.abs((a.z ?? 0) - (b.z ?? 0)),
    max: Math.max(
      Math.abs((a.x ?? 0) - (b.x ?? 0)),
      Math.abs((a.y ?? 0) - (b.y ?? 0)),
      Math.abs((a.z ?? 0) - (b.z ?? 0))
    )
  };
}

function numberDelta(a, b) {
  return Math.abs((a ?? 0) - (b ?? 0));
}

function cameraDeltas(before, after) {
  return {
    position: vectorDelta(before.camera?.position, after.camera?.position),
    target: vectorDelta(before.camera?.target, after.camera?.target),
    zoom: numberDelta(before.camera?.zoom, after.camera?.zoom),
    rotationX: numberDelta(before.camera?.rotationX, after.camera?.rotationX),
    rotationY: numberDelta(before.camera?.rotationY, after.camera?.rotationY),
    modeBefore: before.camera?.mode ?? null,
    modeAfter: after.camera?.mode ?? null,
    selectedNodeBefore: before.camera?.selectedNode ?? before.selectedNode,
    selectedNodeAfter: after.camera?.selectedNode ?? after.selectedNode,
    activeCategoryBefore: before.camera?.activeCategory ?? before.category,
    activeCategoryAfter: after.camera?.activeCategory ?? after.category
  };
}

function assertCameraUnchanged(label, before, after, deltas) {
  if (!deltas.position || deltas.position.max > epsilon) problems.push(`${label}: position changed ${JSON.stringify(deltas.position)}`);
  if (!deltas.target || deltas.target.max > epsilon) problems.push(`${label}: target changed ${JSON.stringify(deltas.target)}`);
  if (deltas.zoom > epsilon) problems.push(`${label}: zoom changed ${deltas.zoom}`);
  if (deltas.rotationX > epsilon) problems.push(`${label}: rotationX changed ${deltas.rotationX}`);
  if (deltas.rotationY > epsilon) problems.push(`${label}: rotationY changed ${deltas.rotationY}`);
  if (deltas.modeAfter !== "RHIZOME 3D") problems.push(`${label}: renderer mode is ${deltas.modeAfter}`);
  if (deltas.selectedNodeAfter !== "BOGOBOT") problems.push(`${label}: selected node is ${deltas.selectedNodeAfter}`);
  if (!String(deltas.activeCategoryAfter || "").startsWith("MAP")) problems.push(`${label}: active category is ${deltas.activeCategoryAfter}`);
  if (after.glasVisible) problems.push(`${label}: GLAS still visible`);
  if (!after.askVisible) problems.push(`${label}: ASK GLAS not visible`);
  if (after.activeElementId !== "askGlasAction") problems.push(`${label}: focus is ${after.activeElementId}`);
  if (after.bodyGlasOpen) problems.push(`${label}: body.glas-open still true`);
  if (after.backgroundInert.length) problems.push(`${label}: background inert remains ${after.backgroundInert.join(",")}`);
  if (after.horizontalOverflow !== 0) problems.push(`${label}: horizontal overflow ${after.horizontalOverflow}`);
}

async function capture(page, label) {
  return page.evaluate((label) => {
    const visible = element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return !element.hidden && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const activeFilter = document.querySelector("#clusterNav button.active");
    const dialogue = document.querySelector("#bogobotDialogue");
    const ask = document.querySelector("#askGlasAction");
    const backgroundInert = [...document.querySelectorAll("body > *")]
      .filter(element => element.hasAttribute("inert"))
      .map(element => element.id || element.className || element.tagName);
    const camera = globalThis.__bogobotRhizomeDiagnostics?.getCameraState?.() ?? null;
    return {
      label,
      camera,
      activeElementId: document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName,
      askVisible: visible(ask),
      glasVisible: visible(dialogue),
      hidden: dialogue?.hidden ?? null,
      ariaHidden: dialogue?.getAttribute("aria-hidden") ?? null,
      bodyGlasOpen: document.body.classList.contains("glas-open"),
      backgroundInert,
      selectedNode: localStorage.getItem("bogobot.current"),
      category: activeFilter?.textContent?.trim() || null,
      renderer: document.querySelector("#rhizome3dCanvas:not([hidden])") ? "RHIZOME 3D" : document.querySelector("#graph:not([hidden])") ? "OVERVIEW 2D" : null,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      url: location.href,
      historyState: history.state
    };
  }, label);
}

async function waitForStableCamera(page) {
  await page.waitForFunction(() => Boolean(globalThis.__bogobotRhizomeDiagnostics?.getCameraState), { timeout: 10000 });
  let previous = null;
  for (let index = 0; index < 80; index += 1) {
    const current = await page.evaluate(() => globalThis.__bogobotRhizomeDiagnostics.getCameraState());
    if (!current.isAnimating && previous) {
      const stable = vectorDelta(previous.position, current.position)?.max <= epsilon
        && vectorDelta(previous.target, current.target)?.max <= epsilon
        && numberDelta(previous.zoom, current.zoom) <= epsilon
        && numberDelta(previous.rotationX, current.rotationX) <= epsilon
        && numberDelta(previous.rotationY, current.rotationY) <= epsilon;
      if (stable) return current;
    }
    previous = current;
    await page.waitForTimeout(100);
  }
  return page.evaluate(() => globalThis.__bogobotRhizomeDiagnostics.getCameraState());
}

async function bootToBogobot(page) {
  await page.goto(previewUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#enter", { timeout: 10000 });
  await page.click("#enter");
  await page.waitForSelector("#app.ready", { timeout: 10000 });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const surface3d = document.querySelector("#surface3d");
    if (surface3d?.getAttribute("aria-pressed") !== "true") surface3d.click();
  });
  await page.waitForFunction(() => !document.querySelector("#rhizome3dCanvas")?.hidden, { timeout: 10000 });
  await page.evaluate(() => document.querySelector(".brand")?.click());
  await page.waitForFunction(() => {
    const action = document.querySelector("#askGlasAction");
    return Boolean(action && !action.hidden && action.offsetParent !== null);
  }, { timeout: 10000 });
  await waitForStableCamera(page);
}

async function saveScreenshot(page, name) {
  await page.screenshot({ path: path.join(qaDir, name), fullPage: false });
}

const browser = await chromium.launch(launchOptions);
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
    page.on("console", message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });

    await bootToBogobot(page);
    await saveScreenshot(page, `${viewport.label}-glas-before-open.png`);
    const before = await capture(page, `${viewport.label}-before`);

    await page.click("#askGlasAction");
    await page.waitForFunction(() => {
      const dialogue = document.querySelector("#bogobotDialogue");
      return Boolean(dialogue && !dialogue.hidden && dialogue.getAttribute("aria-hidden") === "false");
    }, { timeout: 10000 });
    await waitForStableCamera(page);
    await saveScreenshot(page, `${viewport.label}-glas-open-camera-check.png`);
    const glasOpen = await capture(page, `${viewport.label}-glas-open`);

    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.querySelector("#bogobotDialogue")?.hidden === true, { timeout: 10000 });
    await waitForStableCamera(page);
    await saveScreenshot(page, `${viewport.label}-glas-after-escape-camera-check.png`);
    const afterEscape = await capture(page, `${viewport.label}-after-escape`);

    await page.click("#askGlasAction");
    await page.waitForFunction(() => document.querySelector("#bogobotDialogue")?.hidden === false, { timeout: 10000 });
    await waitForStableCamera(page);
    await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => page.keyboard.press("Escape"));
    await page.waitForFunction(() => document.querySelector("#bogobotDialogue")?.hidden === true, { timeout: 10000 });
    await waitForStableCamera(page);
    await saveScreenshot(page, `${viewport.label}-glas-after-back-camera-check.png`);
    const afterBack = await capture(page, `${viewport.label}-after-back`);

    const escapeDeltas = cameraDeltas(before, afterEscape);
    const backDeltas = cameraDeltas(before, afterBack);
    assertCameraUnchanged(`${viewport.key} escape`, before, afterEscape, escapeDeltas);
    assertCameraUnchanged(`${viewport.key} back`, before, afterBack, backDeltas);
    if (before.renderer !== "RHIZOME 3D") problems.push(`${viewport.key}: before renderer ${before.renderer}`);
    if (before.selectedNode !== "BOGOBOT") problems.push(`${viewport.key}: before selected ${before.selectedNode}`);
    if (!String(before.category || "").startsWith("MAP")) problems.push(`${viewport.key}: before category ${before.category}`);
    if (!before.askVisible) problems.push(`${viewport.key}: ASK GLAS not visible before open`);
    if (!glasOpen.glasVisible) problems.push(`${viewport.key}: GLAS not visible after open`);
    if (errors.length) problems.push(`${viewport.key}: runtime errors ${errors.join(" | ")}`);

    metrics[viewport.key] = {
      before,
      glasOpen,
      afterEscape,
      afterBack,
      deltas: { escape: escapeDeltas, back: backDeltas },
      runtimeErrors: errors
    };
    await page.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(qaDir, "camera-preservation-metrics.json"), JSON.stringify(metrics, null, 2));

if (problems.length) {
  console.error(JSON.stringify({ status: "FAIL", problems, metricsPath: path.join(qaDir, "camera-preservation-metrics.json") }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ status: "PASS", metricsPath: path.join(qaDir, "camera-preservation-metrics.json"), viewports: Object.keys(metrics) }, null, 2));
