import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { chromium } from "playwright"

const baseUrl = process.env.READER_TEST_URL || "http://127.0.0.1:4173"
const screenshotDir = process.env.READER_SCREENSHOT_DIR || ""
const cachedExecutable = path.join(os.homedir(),"Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell")
const launchOptions = fs.existsSync(cachedExecutable) ? { headless:true, executablePath:cachedExecutable } : { headless:true }
const topologyIds = ["TOPOGRAPHY","DUBNA","MOSCOW","TTK_0xMEM","SKOLKOVO","BAIKAL","KARELIA","VARANASI","SHENZHEN","ISFAHAN"]
const relatedIds = ["FORK","HUMAN_TRACE","TIME_SUM_ERROR"]
const templateIds = ["ARCHIVE","ARCHIVE_EPILOGUE","BOOK_OF_GENESIS"]
const auditIds = [...topologyIds,...relatedIds,...templateIds]
const phaseIds = ["BOOK_OF_GENESIS","FORK","HUMAN_TRACE","ARCHIVE","TTK_0xMEM"]
const viewport = { width:1440, height:900 }

if(screenshotDir) fs.mkdirSync(screenshotDir,{recursive:true})
const browser = await chromium.launch(launchOptions)
const results=[]

const inspect = page => page.evaluate(() => {
  const reader=document.querySelector("#reader")
  const body=document.querySelector("#nodeBody")
  const source=body.querySelector(".source-document")
  const preview=body.querySelector(".source-brief")
  const readFull=document.querySelector("#readFull")
  const figure=document.querySelector("#archiveObject")
  const related=document.querySelector("#relatedMaterials")
  const scroll=document.querySelector(".reader-scroll")
  const trace=document.querySelector(".tracebar")
  const visible=element=>{
    if(!element) return false
    const style=getComputedStyle(element), rect=element.getBoundingClientRect()
    return !element.hidden&&style.display!=="none"&&style.visibility!=="hidden"&&Number(style.opacity)>0&&rect.width>0&&rect.height>0
  }
  const meaningful=element=>element&&element.textContent.replace(/\s+/g," ").trim().length>0
  const sourceBlocks=[...(source?.children||[])].filter(element=>!element.matches("figure, figcaption")&&meaningful(element))
  const previewBlocks=[...(preview?.children||[])].filter(element=>!element.matches("figure, figcaption")&&meaningful(element))
  const image=figure?.querySelector("img")
  const imageRect=image?.getBoundingClientRect(), shellRect=figure?.querySelector(".image-shell")?.getBoundingClientRect()
  let diagramPixels=null
  if(image?.complete&&image.naturalWidth&&figure?.classList.contains("media-diagram")){
    const canvas=document.createElement("canvas"), context=canvas.getContext("2d",{willReadFrequently:true})
    canvas.width=image.naturalWidth; canvas.height=image.naturalHeight; context.drawImage(image,0,0)
    const pixels=context.getImageData(0,0,canvas.width,canvas.height).data
    let opaque=0, central=0, minX=canvas.width, minY=canvas.height, maxX=-1, maxY=-1
    for(let y=0;y<canvas.height;y+=2) for(let x=0;x<canvas.width;x+=2){
      const alpha=pixels[(y*canvas.width+x)*4+3]
      if(alpha<24) continue
      opaque+=1; minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y)
      if(x>canvas.width*.15&&x<canvas.width*.85&&y>canvas.height*.15&&y<canvas.height*.85) central+=1
    }
    diagramPixels={opaque,central,bboxWidth:maxX-minX,bboxHeight:maxY-minY,naturalWidth:canvas.width,naturalHeight:canvas.height}
  }
  const lastContent=[...scroll.children].filter(visible).at(-1)
  const lastRect=lastContent?.getBoundingClientRect(), scrollRect=scroll.getBoundingClientRect(), traceRect=trace.getBoundingClientRect()
  return {
    expanded:reader.classList.contains("full-reading"),
    readerClass:reader.className,
    previewBlocks:previewBlocks.length,
    visiblePreviewTextBlocks:previewBlocks.filter(visible).length,
    sourceBlocks:sourceBlocks.length,
    sourceText:source?.textContent.replace(/\s+/g," ").trim()||"",
    previewText:preview?.textContent.replace(/\s+/g," ").trim()||"",
    readFullVisible:visible(readFull),
    bodyElements:body.querySelectorAll("*").length,
    readerElements:reader.querySelectorAll("*").length,
    relatedVisible:visible(related),
    relatedCount:related?.querySelectorAll("button[data-node-id]").length||0,
    relatedIds:[...(related?.querySelectorAll("button[data-node-id]")||[])].map(button=>button.dataset.nodeId),
    emptyRelated:Boolean(related)&&!related.querySelector("button[data-node-id]"),
    mediaVisible:visible(figure),
    mediaHasImage:Boolean(image?.getAttribute("src")),
    mediaClipped:Boolean(imageRect&&shellRect&&(imageRect.bottom>shellRect.bottom+1||imageRect.right>shellRect.right+1)),
    mediaNaturalWidth:image?.naturalWidth||0,
    mediaNaturalHeight:image?.naturalHeight||0,
    mediaRenderedWidth:imageRect?.width||0,
    mediaRenderedHeight:imageRect?.height||0,
    diagramPixels,
    archiveNotes:reader.querySelectorAll(".archive-note").length,
    rawMarkdown:/\*\*|__|^\s*[-*]\s+/m.test(body.textContent),
    genesisSources:/Источники\s*\/\s*подкладка/i.test(body.textContent),
    bottomClear:Boolean(lastRect)&&lastRect.bottom<=scrollRect.bottom+1&&scrollRect.bottom<=traceRect.top+1,
    scrollTop:scroll.scrollTop
  }
})

try{
  for(const nodeId of auditIds){
    const page=await browser.newPage({viewport})
    await page.goto(`${baseUrl}/?node=${encodeURIComponent(nodeId)}`,{waitUntil:"networkidle"})
    await page.evaluate(()=>{ document.querySelector("#boot")?.classList.add("hidden"); document.querySelector("#app")?.classList.add("ready") })
    await page.waitForFunction(()=>document.querySelector("#nodeBody")?.textContent.trim().length>0)
    await page.waitForTimeout(550)
    const preview=await inspect(page)
    const factualFull=preview.sourceBlocks>preview.previewBlocks
    assert.equal(preview.readFullVisible,factualFull,`${nodeId}: READ FULL predicate differs from factual content`)
    assert.equal(preview.expanded,false,`${nodeId}: did not open in preview`)
    assert.equal(preview.rawMarkdown,false,`${nodeId}: raw Markdown markers are visible`)
    assert.equal(preview.emptyRelated,false,`${nodeId}: empty related section exists`)
    assert.ok(preview.relatedCount<=3,`${nodeId}: more than three related materials`)
    assert.equal(new Set(preview.relatedIds).size,preview.relatedIds.length,`${nodeId}: duplicate related materials`)
    assert.equal(preview.mediaClipped,false,`${nodeId}: media is clipped by its shell`)

    if(relatedIds.includes(nodeId)) assert.ok(preview.relatedCount>0,`${nodeId}: real graph links did not produce related materials`)
    if(nodeId==="ARCHIVE_EPILOGUE") assert.equal(preview.mediaVisible&&preview.mediaHasImage,true,"ARCHIVE_EPILOGUE: confirmed media is not rendered")
    if(nodeId==="ARCHIVE") assert.equal(preview.mediaVisible&&preview.mediaHasImage,true,"ARCHIVE: confirmed media is not rendered")
    if(nodeId==="BOOK_OF_GENESIS") assert.equal(preview.genesisSources,false,"BOOK_OF_GENESIS: sources section remains in preview")
    if(nodeId==="BOOK_OF_GENESIS") assert.ok(preview.visiblePreviewTextBlocks>=1,"BOOK_OF_GENESIS: preview has no visible meaningful text")
    if(nodeId==="FORK"){
      assert.ok(preview.diagramPixels,"FORK: diagram media is not classified as diagram")
      assert.ok(preview.diagramPixels.opaque>100&&preview.diagramPixels.central>50,"FORK: diagram contains only frame or edge markers")
      assert.ok(preview.diagramPixels.bboxWidth>preview.diagramPixels.naturalWidth*.35&&preview.diagramPixels.bboxHeight>preview.diagramPixels.naturalHeight*.35,"FORK: diagram drawing bounding box is empty")
    }
    if(nodeId==="HUMAN_TRACE"){
      assert.ok(preview.mediaNaturalHeight>0&&preview.mediaRenderedHeight>150,"HUMAN_TRACE: raster collapsed into a strip")
      const naturalRatio=preview.mediaNaturalWidth/preview.mediaNaturalHeight
      const renderedRatio=preview.mediaRenderedWidth/preview.mediaRenderedHeight
      assert.ok(Math.abs(naturalRatio-renderedRatio)<.05,`HUMAN_TRACE: rendered aspect ratio changed (${naturalRatio} -> ${renderedRatio})`)
    }

    let full=null
    if(factualFull){
      await page.locator("#readFull").click()
      full=await inspect(page)
      assert.equal(full.expanded,true,`${nodeId}: full reader did not open`)
      assert.equal(full.sourceBlocks,preview.sourceBlocks,`${nodeId}: full source lost blocks`)
      assert.notEqual(full.sourceText,preview.previewText,`${nodeId}: preview substituted for full content`)
      assert.equal(full.rawMarkdown,false,`${nodeId}: raw Markdown markers in full reader`)
      assert.equal(full.mediaClipped,false,`${nodeId}: full media is clipped`)
      if(nodeId==="ARCHIVE_EPILOGUE") assert.ok(full.archiveNotes>=1,"ARCHIVE_EPILOGUE: archive-note component missing")
      if(nodeId==="BOOK_OF_GENESIS") assert.equal(full.genesisSources,false,"BOOK_OF_GENESIS: sources section remains in full reader")
      await page.locator(".reader-scroll").evaluate(element=>{ element.scrollTop=element.scrollHeight })
      const bottom=await inspect(page)
      assert.equal(bottom.bottomClear,true,`${nodeId}: lower content is obscured by TRACE bar`)
      await page.locator("#readFull").click()
      const collapsed=await inspect(page)
      assert.equal(collapsed.expanded,false,`${nodeId}: collapse did not restore preview`)
      assert.equal(collapsed.previewText,preview.previewText,`${nodeId}: preview changed after collapse`)
    }

    if(topologyIds.includes(nodeId)){
      const before={bodyElements:preview.bodyElements,readerElements:preview.readerElements,readerClass:preview.readerClass}
      await page.locator("#closeReader").click()
      await page.locator(`.graph-node[data-node-id="${nodeId}"]`).dispatchEvent("click")
      await page.waitForFunction(()=>!document.querySelector(".workspace")?.classList.contains("reader-closed"))
      await page.waitForTimeout(80)
      const reopened=await inspect(page)
      assert.deepEqual({bodyElements:reopened.bodyElements,readerElements:reopened.readerElements,readerClass:reopened.readerClass},before,`${nodeId}: reopen accumulated DOM or classes`)
    }

    results.push({nodeId,sourceBlocks:preview.sourceBlocks,previewBlocks:preview.previewBlocks,readFull:factualFull,related:preview.relatedCount})
    await page.close()
  }

  const page=await browser.newPage({viewport})
  await page.goto(`${baseUrl}/?node=TTK_0xMEM`,{waitUntil:"networkidle"})
  await page.evaluate(()=>{ document.querySelector("#boot")?.classList.add("hidden"); document.querySelector("#app")?.classList.add("ready"); document.querySelector(".reader-scroll").scrollTop=180 })
  await page.locator('#relatedMaterials button[data-node-id="TOPOGRAPHY"]').click()
  await page.waitForTimeout(100)
  const switched=await inspect(page)
  assert.ok(switched.scrollTop<=1,"reader scroll did not reset when changing node")
  await page.close()

  for(const nodeId of phaseIds){
    const phasePage=await browser.newPage({viewport})
    await phasePage.goto(`${baseUrl}/?node=${encodeURIComponent(nodeId)}`,{waitUntil:"networkidle"})
    await phasePage.evaluate(()=>{ document.querySelector("#boot")?.classList.add("hidden"); document.querySelector("#app")?.classList.add("ready") })
    await phasePage.waitForFunction(()=>document.querySelector("#nodeBody")?.textContent.trim().length>0)
    await phasePage.waitForTimeout(550)
    const initial=await inspect(phasePage)
    assert.ok(initial.scrollTop<=1,`${nodeId}: preview-top scroll is not zero`)
    const stable={bodyElements:initial.bodyElements,readerElements:initial.readerElements}
    const name=nodeId.toLowerCase().replace(/[^a-z0-9]+/g,"-")
    if(screenshotDir) await phasePage.screenshot({path:path.join(screenshotDir,`${name}-preview-top.png`)})

    if(initial.readFullVisible){
      await phasePage.locator("#readFull").click(); await phasePage.waitForTimeout(100)
      await phasePage.locator(".reader-scroll").evaluate(element=>{ element.scrollTop=0 })
      const fullTop=await inspect(phasePage)
      assert.equal(fullTop.expanded,true,`${nodeId}: full-top did not expand`)
      assert.ok(fullTop.scrollTop<=1,`${nodeId}: full-top moved away from top`)
      if(screenshotDir) await phasePage.screenshot({path:path.join(screenshotDir,`${name}-full-top.png`)})
      await phasePage.locator(".reader-scroll").evaluate(element=>{ element.scrollTop=element.scrollHeight })
      const fullBottom=await inspect(phasePage)
      assert.equal(fullBottom.bottomClear,true,`${nodeId}: full-bottom is obscured`)
      if(screenshotDir) await phasePage.screenshot({path:path.join(screenshotDir,`${name}-full-bottom.png`)})
    }

    const otherId=await phasePage.locator('#relatedMaterials button[data-node-id]').first().getAttribute("data-node-id")
    await phasePage.locator(`#relatedMaterials button[data-node-id="${otherId}"]`).click()
    await phasePage.waitForTimeout(100)
    assert.ok((await inspect(phasePage)).scrollTop<=1,`${nodeId}: new node did not reset scroll`)
    await phasePage.locator(`.graph-node[data-node-id="${nodeId}"]`).dispatchEvent("click")
    await phasePage.waitForTimeout(550)
    const reopened=await inspect(phasePage)
    assert.ok(reopened.scrollTop<=1,`${nodeId}: reopen-top scroll is not zero`)
    assert.equal(reopened.expanded,false,`${nodeId}: reopen did not restore preview phase`)
    assert.deepEqual({bodyElements:reopened.bodyElements,readerElements:reopened.readerElements},stable,`${nodeId}: reopen accumulated DOM`)
    if(screenshotDir) await phasePage.screenshot({path:path.join(screenshotDir,`${name}-reopen-top.png`)})
    await phasePage.close()
  }
} finally {
  await browser.close()
}

console.log(JSON.stringify({status:"PASS",policy:"source significant blocks > preview significant blocks",results},null,2))
