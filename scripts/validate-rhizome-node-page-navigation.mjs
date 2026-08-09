import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { chromium } from "playwright";

const previewUrl = process.env.BOGOBOT_PREVIEW_URL || "http://127.0.0.1:4173/";
const executablePath = process.env.PLAYWRIGHT_CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const qaDir = "qa/rhizome-category-lens-visible-2026-08-01/node-page-navigation";
const expectedGeometrySha256 = "d388a148e65421a10a7b3de368b4904aa470be84d1f04d8958131c1e155df152";
const problems = [];
const records = [];

fs.mkdirSync(qaDir, { recursive: true });

function failNow(geometrySha, consoleMessages = [], pageErrors = []) {
  fs.writeFileSync(path.join(qaDir, "navigation-metrics.json"), JSON.stringify(records, null, 2));
  console.error(JSON.stringify({ status: "FAIL", geometrySha, problems, consoleMessages, pageErrors, records }, null, 2));
  process.exit(1);
}

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
    document.querySelector("#resetView")?.click();
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
    document.querySelector("#resetView")?.click();
  });
  await page.waitForTimeout(1500);
  await page.waitForFunction(() => !(globalThis.__bogobotRhizomeDiagnostics?.getCameraState?.()?.isAnimating), { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function state(page) {
  return page.evaluate(() => {
    const frame = globalThis.__bogobotRhizomeDiagnostics?.getFrameMetrics?.() || null;
    const camera = globalThis.__bogobotRhizomeDiagnostics?.getCameraState?.() || null;
    return {
      category: document.querySelector("#clusterNav button.active")?.textContent?.trim() || null,
      renderer: document.querySelector("#rhizome3dCanvas:not([hidden])") ? "RHIZOME 3D" : "OTHER",
      selectedNode: camera?.selectedNode || null,
      camera,
      lens: frame?.lens || null,
      nodes: frame?.nodes || [],
      overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      readerOpen: !document.querySelector(".workspace")?.classList.contains("reader-closed"),
      nodeCode: document.querySelector("#nodeCode")?.textContent?.trim() || "",
      nodeTitle: document.querySelector("#nodeTitle")?.textContent?.trim() || "",
      sourceNodeId: document.querySelector("#nodeBody .source-document")?.dataset.nodeId || null,
      href: location.href,
      activeElement: document.activeElement?.id || document.activeElement?.className || null
    };
  });
}

async function clickNode(page, nodeId) {
  const before = await state(page);
  const node = before.nodes.find(item => item.id === nodeId);
  assert(Boolean(node), `${before.category}: missing projected node ${nodeId}`);
  if (!node) return null;
  const rect = await page.evaluate(() => {
    const box = document.querySelector("#rhizome3dCanvas")?.getBoundingClientRect();
    return box ? { left: box.left, top: box.top } : { left: 0, top: 0 };
  });
  await page.mouse.click(rect.left + node.x, rect.top + node.y);
  await page.waitForFunction((nodeId) => {
    const code = document.querySelector("#nodeCode")?.textContent || "";
    return code.includes(`NODE / ${nodeId}`) && !document.querySelector(".workspace")?.classList.contains("reader-closed");
  }, nodeId, { timeout: 10000 }).catch(async error => {
    const snapshot = await state(page).catch(() => ({ diagnosticsAvailable: false, href: page.url() }));
    assert(false, `${before.category}/${nodeId}: click did not open expected node page (${error.message}); state=${JSON.stringify(snapshot)}`);
  });
  if (problems.length) return null;
  await page.waitForTimeout(500);
  return { before, node };
}

async function backToCategory(page, expectedCategory, expectedNode) {
  await page.evaluate(() => history.back());
  const restored = await page.waitForFunction((expectedCategory) => {
    const active = document.querySelector("#clusterNav button.active")?.textContent || "";
    return active.toUpperCase().includes(expectedCategory) && document.querySelector("#rhizome3dCanvas:not([hidden])");
  }, expectedCategory, { timeout: 10000 }).then(() => true).catch(async error => {
    const snapshot = await state(page).catch(() => ({ diagnosticsAvailable: false, href: page.url() }));
    assert(false, `${expectedCategory}/${expectedNode}: Browser Back did not restore category/RHIZOME (${error.message}); state=${JSON.stringify(snapshot)}`);
    return false;
  });
  if (!restored) return await state(page).catch(() => ({ category: null, renderer: null, selectedNode: null, lens: null, camera: null, nodes: [], activeElement: null, overflowX: null }));
  await page.waitForTimeout(900);
  const after = await state(page);
  assert(after.category?.toUpperCase().includes(expectedCategory), `${expectedCategory}/${expectedNode}: category after Back ${after.category}`);
  assert(after.renderer === "RHIZOME 3D", `${expectedCategory}/${expectedNode}: renderer after Back ${after.renderer}`);
  assert(after.selectedNode === expectedNode, `${expectedCategory}/${expectedNode}: selected after Back ${after.selectedNode}`);
  assert(after.lens?.active === true, `${expectedCategory}/${expectedNode}: lens inactive after Back`);
  assert(Math.abs((after.lens?.strength ?? 0) - 1) <= 0.001, `${expectedCategory}/${expectedNode}: lens strength after Back ${after.lens?.strength}`);
  return after;
}

async function categoryToMap(page, label) {
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("#clusterNav button")].find(item => (item.textContent || "").toUpperCase().includes("MAP"));
    button?.click();
  });
  await page.waitForTimeout(900);
  const map = await state(page);
  assert(map.category?.includes("MAP"), `${label}: MAP category ${map.category}`);
  assert(map.lens?.active === false, `${label}: MAP lens active`);
  assert((map.lens?.strength ?? 0) === 0, `${label}: MAP lens strength ${map.lens?.strength}`);
  assert((map.lens?.targetStrength ?? 0) === 0, `${label}: MAP lens target ${map.lens?.targetStrength}`);
  return map;
}

const geometrySha = sha256("rhizome-3d-geometry.js");
assert(geometrySha === expectedGeometrySha256, `rhizome geometry sha changed ${geometrySha}`);

const consoleMessages = [];
const pageErrors = [];
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const viewports = [
    { key: "desktop-1440", viewport: { width: 1440, height: 900 } },
    { key: "mobile-390", viewport: { width: 390, height: 844 } }
  ];
  const cases = [
    { category: "WORLD", nodes: ["NETWORK_MATTER", "TOPOGRAPHY", "CULTURE"] },
    { category: "TOPOGRAPHY", nodes: ["TOPOGRAPHY", "DUBNA", "ISFAHAN"] },
    { category: "RELICS", nodes: ["RELICS", "OGAS", "MESM"] }
  ];

  for (const viewportCase of viewports) {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    page.on("console", message => {
      if (message.type() === "error") consoleMessages.push(`${viewportCase.key}: ${message.text()}`);
    });
    page.on("pageerror", error => pageErrors.push(`${viewportCase.key}: ${error.message}`));
    await boot(page, viewportCase.viewport);

    for (const categoryCase of cases) {
      await selectCategory(page, categoryCase.category);
      for (const nodeId of categoryCase.nodes) {
        const slug = `${viewportCase.key}-${categoryCase.category.toLowerCase()}-${nodeId.toLowerCase()}`;
        const click = await clickNode(page, nodeId);
        if (!click) continue;
        if (viewportCase.key === "desktop-1440" && nodeId === categoryCase.nodes[0]) {
          await page.screenshot({ path: path.join(qaDir, `${categoryCase.category.toLowerCase()}-node-before-open.png`), fullPage: false });
        }
        const opened = await state(page);
        if (viewportCase.key === "desktop-1440" && nodeId === categoryCase.nodes[0]) {
          await page.screenshot({ path: path.join(qaDir, `${categoryCase.category.toLowerCase()}-node-page.png`), fullPage: false });
        }
        assert(opened.nodeCode.includes(`NODE / ${nodeId}`), `${slug}: opened node code ${opened.nodeCode}`);
        assert(opened.nodeTitle.length > 0, `${slug}: empty reader title`);
        if (opened.sourceNodeId) assert(opened.sourceNodeId === nodeId, `${slug}: source node ${opened.sourceNodeId}`);
        const afterBack = await backToCategory(page, categoryCase.category, nodeId);
        if (problems.length) failNow(geometrySha, consoleMessages, pageErrors);
        if (viewportCase.key === "desktop-1440" && nodeId === categoryCase.nodes[0]) {
          await page.screenshot({ path: path.join(qaDir, `${categoryCase.category.toLowerCase()}-node-after-back.png`), fullPage: false });
        }
        const nodeAfter = afterBack.nodes.find(item => item.id === nodeId);
        assert(Boolean(nodeAfter), `${slug}: clicked node missing after Back`);
        records.push({
          viewport: viewportCase.key,
          category: categoryCase.category,
          clickedNodeId: nodeId,
          openedRoute: opened.href,
          openedTitle: opened.nodeTitle,
          categoryBefore: click.before.category,
          categoryAfterBack: afterBack.category,
          selectedBefore: click.before.selectedNode,
          selectedAfterBack: afterBack.selectedNode,
          rendererBefore: click.before.renderer,
          rendererAfterBack: afterBack.renderer,
          cameraDelta: {
            position: round(vectorDelta(click.before.camera?.position, afterBack.camera?.position)),
            target: round(vectorDelta(click.before.camera?.target, afterBack.camera?.target)),
            zoom: round(Math.abs((click.before.camera?.zoom ?? 0) - (afterBack.camera?.zoom ?? 0)))
          },
          lensBefore: click.before.lens ? { active: click.before.lens.active, strength: round(click.before.lens.strength) } : null,
          lensAfterBack: afterBack.lens ? { active: afterBack.lens.active, strength: round(afterBack.lens.strength) } : null,
          displayPositionBefore: { x: round(click.node.x), y: round(click.node.y) },
          displayPositionAfterBack: nodeAfter ? { x: round(nodeAfter.x), y: round(nodeAfter.y) } : null,
          focusTargetAfterBack: afterBack.activeElement,
          overflowX: afterBack.overflowX
        });
        await categoryToMap(page, slug);
        await selectCategory(page, categoryCase.category);
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(qaDir, "navigation-metrics.json"), JSON.stringify(records, null, 2));
assert(consoleMessages.length === 0, `console errors: ${consoleMessages.join("; ")}`);
assert(pageErrors.length === 0, `page errors: ${pageErrors.join("; ")}`);

if (problems.length) {
  console.error(JSON.stringify({ status: "FAIL", geometrySha, problems, consoleMessages, pageErrors, records }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ status: "PASS", geometrySha, records: records.length, metricsPath: path.join(qaDir, "navigation-metrics.json") }, null, 2));
