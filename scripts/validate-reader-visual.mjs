import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { chromium } from "playwright"

const baseUrl = process.env.READER_TEST_URL || "http://127.0.0.1:4173"
const screenshotDir = process.env.READER_SCREENSHOT_DIR || ""
const cachedExecutable = path.join(
  os.homedir(),
  "Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell"
)
const launchOptions = fs.existsSync(cachedExecutable)
  ? { headless: true, executablePath: cachedExecutable }
  : { headless: true }
const viewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 }
]
const nodeIds = ["PROTOCOL", "FIRST_LIKENESS", "BOGOBOT", "TIME_SUM_ERROR"]
const fullReaderNodeIds = new Set(["PROTOCOL", "FIRST_LIKENESS", "BOGOBOT"])

if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true })

const browser = await chromium.launch(launchOptions)
const results = []

try {
  for (const nodeId of nodeIds) {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport })
      await page.goto(`${baseUrl}/?node=${encodeURIComponent(nodeId)}`, { waitUntil: "networkidle" })
      await page.evaluate(() => {
        document.querySelector("#boot")?.classList.add("hidden")
        document.querySelector("#app")?.classList.add("ready")
      })
      await page.waitForFunction(() => document.querySelector("#nodeBody")?.textContent.trim().length > 0)
      await page.waitForTimeout(250)

      const inspect = () => page.evaluate(() => {
        const reader = document.querySelector("#reader")
        const body = document.querySelector("#nodeBody")
        const readFull = document.querySelector("#readFull")
        const visible = element => {
          const style = getComputedStyle(element)
          const rect = element.getBoundingClientRect()
          return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
        }
        const significant = [...body.querySelectorAll(":scope > p, :scope > .source-brief > *, :scope > .source-document > *")]
          .filter(element => element.textContent.trim() && visible(element))
        const geometry = selector => {
          const element = document.querySelector(selector)
          if (!element || !visible(element)) return null
          const rect = element.getBoundingClientRect()
          const style = getComputedStyle(element)
          return { left: rect.left, right: rect.right, width: rect.width, top: rect.top, bottom: rect.bottom, position: style.position }
        }
        const fullContent = body.querySelector(".source-document.source-canonical") || body
        const fullStyle = getComputedStyle(fullContent)
        const figure = document.querySelector("#archiveObject")
        const note = document.querySelector("#archiveNote")
        const axis = geometry(".preview-content") || geometry(".node-body")
        const axisSelectors = [".node-body", ".reader-divider", "#archiveObject", "#archiveObject figcaption", "#archiveNote"]
        if (reader.classList.contains("full-reading")) axisSelectors.push("#readFull")
        const aligned = axisSelectors
          .map(geometry).filter(Boolean)
          .every(rect => axis && Math.abs(rect.left - axis.left) <= 1 && Math.abs(rect.width - axis.width) <= 1)
        return {
          readerClass: reader.className,
          expanded: reader.classList.contains("full-reading"),
          readFullVisible: visible(readFull),
          significantBlocks: significant.length,
          bodyElements: body.querySelectorAll("*").length,
          readerElements: reader.querySelectorAll("*").length,
          figures: reader.querySelectorAll("figure").length,
          notes: reader.querySelectorAll(".archive-note").length,
          aligned,
          unclamped: fullStyle.maxHeight === "none" && fullStyle.webkitLineClamp === "none" && !["hidden", "clip"].includes(fullStyle.overflowY),
          figureInFlow: figure.hidden || getComputedStyle(figure).position === "static",
          figureBeforeBody: figure.hidden || figure.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING,
          notePresent: Boolean(note),
          noteComplete: !note || note.hidden || note.scrollHeight <= note.clientHeight,
          classTokensUnique: new Set(reader.className.split(/\s+/).filter(Boolean)).size === reader.classList.length,
          rawEmphasis: body.textContent.includes("**"),
          relatedSections: reader.querySelectorAll("#relatedMaterials, .related-nodes").length,
          sourceSeeAlso: [...body.querySelectorAll("h2")].filter(heading => heading.textContent.trim() === "См. также").length
        }
      })

      const preview = await inspect()
      assert.equal(preview.significantBlocks, 2, `${nodeId} ${viewport.width}: preview must contain two significant blocks`)
      assert.equal(preview.expanded, false)
      assert.equal(preview.readFullVisible, fullReaderNodeIds.has(nodeId), `${nodeId} ${viewport.width}: full-reader control visibility is wrong`)
      assert.equal(preview.rawEmphasis, false, `${nodeId} ${viewport.width}: raw Markdown emphasis is visible`)
      const stableCounts = {
        bodyElements: preview.bodyElements,
        readerElements: preview.readerElements,
        figures: preview.figures,
        notes: preview.notes
      }

      if (!fullReaderNodeIds.has(nodeId)) {
        if (screenshotDir) {
          const name = `${nodeId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${viewport.width}x${viewport.height}`
          await page.screenshot({ path: path.join(screenshotDir, `${name}-preview.png`), fullPage: viewport.width <= 900 })
        }
        results.push({ nodeId, viewport: `${viewport.width}x${viewport.height}`, previewBlocks: 2, fullBlocks: 0, cycles: 0 })
        await page.close()
        continue
      }

      let fullBlocks = 0
      for (let cycle = 1; cycle <= 5; cycle += 1) {
        await page.locator("#readFull").click()
        const full = await inspect()
        fullBlocks ||= full.significantBlocks
        assert.equal(full.expanded, true, `${nodeId} ${viewport.width}: cycle ${cycle} did not open full reader`)
        assert.equal(full.significantBlocks, fullBlocks, `${nodeId} ${viewport.width}: full block count changed`)
        assert.ok(full.significantBlocks > 2, `${nodeId} ${viewport.width}: full reader did not expose all content`)
        assert.equal(full.unclamped, true, `${nodeId} ${viewport.width}: full reader is clamped or clipped`)
        assert.equal(full.figureInFlow, true, `${nodeId} ${viewport.width}: figure left normal flow`)
        assert.ok(full.figureBeforeBody, `${nodeId} ${viewport.width}: figure no longer precedes reader body`)
        assert.equal(full.notePresent, true, `${nodeId} ${viewport.width}: ARCHIVE NOTE component is missing`)
        assert.equal(full.noteComplete, true, `${nodeId} ${viewport.width}: ARCHIVE NOTE is clipped`)
        assert.equal(full.classTokensUnique, true, `${nodeId} ${viewport.width}: reader classes accumulated`)
        assert.equal(full.rawEmphasis, false, `${nodeId} ${viewport.width}: raw Markdown emphasis is visible`)
        assert.equal(full.relatedSections, 1, `${nodeId} ${viewport.width}: related navigation is duplicated`)
        assert.equal(full.sourceSeeAlso, 0, `${nodeId} ${viewport.width}: source См. также was not normalized`)

        await page.locator("#readFull").click()
        await page.locator(".reader-scroll").evaluate(element => { element.scrollTop = 120 })
        const beforeExpandScroll = await page.locator(".reader-scroll").evaluate(element => element.scrollTop)
        await page.locator("#readFull").dispatchEvent("click")
        const afterExpandScroll = await page.locator(".reader-scroll").evaluate(element => element.scrollTop)
        assert.equal(afterExpandScroll, beforeExpandScroll, `${nodeId} ${viewport.width}: expanding article reset reader scroll`)
        await page.locator("#readFull").click()
        const collapsed = await inspect()
        assert.equal(collapsed.expanded, false, `${nodeId} ${viewport.width}: cycle ${cycle} did not collapse`)
        assert.equal(collapsed.significantBlocks, 2, `${nodeId} ${viewport.width}: collapse did not restore preview`)

        await page.locator("#closeReader").click()
        await page.locator(`.graph-node[data-node-id="${nodeId}"]`).dispatchEvent("click")
        await page.waitForFunction(() => !document.querySelector(".workspace")?.classList.contains("reader-closed"))
        await page.waitForFunction(() => !document.querySelector("#readFull")?.hidden)
        await page.waitForTimeout(50)
        const reopened = await inspect()
        assert.deepEqual({
          bodyElements: reopened.bodyElements,
          readerElements: reopened.readerElements,
          figures: reopened.figures,
          notes: reopened.notes
        }, stableCounts, `${nodeId} ${viewport.width}: DOM count changed after cycle ${cycle}`)
        assert.equal(reopened.significantBlocks, 2, `${nodeId} ${viewport.width}: reopen did not restore preview`)
      }

      if (screenshotDir) {
        const name = `${nodeId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${viewport.width}x${viewport.height}`
        await page.screenshot({ path: path.join(screenshotDir, `${name}-preview.png`), fullPage: viewport.width <= 900 })
        await page.locator("#readFull").click()
        await page.screenshot({ path: path.join(screenshotDir, `${name}-full.png`), fullPage: viewport.width <= 900 })
        await page.locator("#readFull").click()
      }

      results.push({ nodeId, viewport: `${viewport.width}x${viewport.height}`, previewBlocks: 2, fullBlocks, cycles: 5 })
      await page.close()
    }
  }
} finally {
  await browser.close()
}

console.log(JSON.stringify({ status: "PASS", policy: "sourceMarkdown || runtimeBlocks > 2", results }, null, 2))
