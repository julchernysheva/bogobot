import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { chromium } from "playwright"

const baseUrl=process.env.READER_TEST_URL||"http://127.0.0.1:4173"
const screenshotDir=process.env.GUIDE_SCREENSHOT_DIR||""
const mapScreenshotOnly=process.env.GUIDE_SCREENSHOT_SCOPE==="map"
const cachedExecutable=path.join(os.homedir(),"Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell")
const launchOptions=fs.existsSync(cachedExecutable)?{headless:true,executablePath:cachedExecutable}:{headless:true}
const browser=await chromium.launch(launchOptions)
const runtimeErrors=[]
let screenshotScroll=null
if(screenshotDir) fs.mkdirSync(screenshotDir,{recursive:true})

const newPage=async(viewport={width:1440,height:900})=>{
  const page=await browser.newPage({viewport,reducedMotion:"reduce"})
  page.on("pageerror",error=>runtimeErrors.push(`pageerror: ${error.message}`))
  page.on("requestfailed",request=>runtimeErrors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText||"unknown"})`))
  page.on("response",response=>{if(response.status()>=400) runtimeErrors.push(`response ${response.status()}: ${response.url()}`)})
  return page
}

const boot=async(page,node="BOGOBOT")=>{
  await page.goto(`${baseUrl}/?node=${encodeURIComponent(node)}&map=1`,{waitUntil:"networkidle"})
  await page.evaluate(()=>{document.querySelector("#boot")?.classList.add("hidden");document.querySelector("#app")?.classList.add("ready")})
  await page.waitForFunction(()=>document.querySelector("#nodeCode")?.textContent.includes("NODE /"))
}

const waitGuide=page=>page.waitForFunction(()=>document.querySelector("#guideDocument")?.dataset.sourceState==="ready")
const openGuide=async page=>{
  await page.locator("#guideButton").click()
  await waitGuide(page)
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
}
const closeGuide=async page=>{
  await page.locator("#closeReader").click()
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
  await page.waitForTimeout(700)
}
const snapshot=page=>page.evaluate(()=>{
  const visible=element=>{
    if(!element) return false
    const style=getComputedStyle(element),rect=element.getBoundingClientRect()
    return !element.hidden&&style.display!=="none"&&style.visibility!=="hidden"&&rect.width>0&&rect.height>0
  }
  const reader=document.querySelector("#reader"),scroll=document.querySelector(".reader-scroll")
  return {
    guide:reader.classList.contains("guide-mode"),
    guideReady:document.querySelector("#guideDocument")?.dataset.sourceState,
    guideScrollTop:scroll.scrollTop,
    guideScrollHeight:scroll.scrollHeight,
    guideClientHeight:scroll.clientHeight,
    steps:[...document.querySelectorAll("#guideContent .guide-steps li")].map(item=>item.textContent.trim()),
    guideText:document.querySelector("#guideDocument")?.textContent.replace(/\s+/g," ").trim()||"",
    guideH1:document.querySelector("#guideTitle")?.textContent.trim()||"",
    guideButtonText:document.querySelector("#guideButton")?.textContent.trim()||"",
    guideButtonBackground:getComputedStyle(document.querySelector("#guideButton")).backgroundColor,
    returnText:document.querySelector("#closeReader")?.textContent.trim()||"",
    visibleReaderText:reader.innerText.replace(/\s+/g," ").trim(),
    current:localStorage.getItem("bogobot.current"),
    filter:localStorage.getItem("bogobot.filter"),
    trace:JSON.parse(localStorage.getItem("bogobot.trace")||"[]"),
    readerClosed:document.querySelector(".workspace").classList.contains("reader-closed"),
    readerFull:reader.classList.contains("full-reading"),
    readerScrollTop:scroll.scrollTop,
    nodeCode:document.querySelector("#nodeCode")?.textContent,
    nodeMetaVisible:visible(document.querySelector(".node-meta")),
    readFullVisible:visible(document.querySelector("#readFull")),
    nextTraceVisible:visible(document.querySelector("#nextTrace")),
    relatedVisible:visible(document.querySelector("#relatedMaterials")),
    guideVisible:visible(document.querySelector("#guideContent")),
    canvasCount:document.querySelectorAll("#rhizome3dCanvas").length,
    canvasSame:window.__guideCanvas?window.__guideCanvas===document.querySelector("#rhizome3dCanvas"):null,
    surface3d:document.querySelector("#surface3d")?.getAttribute("aria-pressed"),
    surface2d:document.querySelector("#surface2d")?.getAttribute("aria-pressed"),
    selected:[...document.querySelectorAll(".graph-node.active")].map(node=>node.dataset.nodeId),
    activeCategory:document.querySelector("#clusterNav button.active")?.dataset.cluster||null,
    guideRole:reader.getAttribute("role"),
    guideLabelledBy:reader.getAttribute("aria-labelledby"),
    mapPointerEvents:getComputedStyle(document.querySelector(".map-pane")).pointerEvents,
    mapOpacity:Number(getComputedStyle(document.querySelector(".map-pane")).opacity),
    mapFilter:getComputedStyle(document.querySelector(".map-pane")).filter,
    tracePointerEvents:getComputedStyle(document.querySelector(".tracebar")).pointerEvents,
    traceOpacity:Number(getComputedStyle(document.querySelector(".tracebar")).opacity),
    focusId:document.activeElement?.id||"",
    duplicateGuide:document.querySelectorAll("#guideContent").length,
    url:location.href,
    historyLength:history.length
  }
})

try{
  const page=await newPage()
  await boot(page)
  const button=page.locator("#guideButton")
  assert.equal(await button.isVisible(),true,"GUIDE menu entry is not visible")
  assert.equal(await button.getAttribute("aria-label"),"Как читать архив")
  assert.equal((await button.textContent()).trim(),"HOW TO READ")
  await button.focus(); await page.keyboard.press("Enter"); await waitGuide(page)
  let guide=await snapshot(page)
  assert.equal(guide.guide,true)
  assert.equal(guide.guideVisible,true)
  assert.equal(guide.guideScrollTop,0)
  assert.equal(guide.steps.length,5)
  assert.ok(guide.guideText.length>500,"full HOW TO READ document is missing")
  assert.ok(guide.guideScrollHeight>guide.guideClientHeight*2,"full HOW TO READ document is not visibly scrollable")
  assert.equal(guide.guideH1,"КАК ЧИТАТЬ АРХИВ")
  assert.equal(guide.nodeCode,"GUIDE")
  assert.equal(guide.visibleReaderText.includes("READER MODE: GUIDE"),false)
  assert.equal(guide.visibleReaderText.includes("GUIDE / ARCHIVE NAVIGATION"),false)
  assert.equal(guide.returnText,"← BACK TO ARCHIVE")
  assert.equal(guide.mapPointerEvents,"none")
  assert.equal(guide.mapOpacity,1)
  assert.equal(guide.mapFilter,"none")
  assert.equal(guide.tracePointerEvents,"none")
  assert.ok(guide.traceOpacity<1)
  assert.ok(["rgba(0, 0, 0, 0)","transparent"].includes(guide.guideButtonBackground),"active HOW TO READ has a filled background")
  assert.equal(guide.nodeMetaVisible,false)
  assert.equal(guide.readFullVisible,false)
  assert.equal(guide.nextTraceVisible,false)
  assert.equal(guide.relatedVisible,false)
  assert.equal(guide.guideRole,"region")
  assert.equal(guide.guideLabelledBy,"guideTitle")
  const blockedCurrent=guide.current,blockedTrace=[...guide.trace]
  const mapBox=await page.locator(".map-pane").boundingBox()
  const resetBox=await page.locator("#resetButton").boundingBox()
  await page.mouse.move(mapBox.x+mapBox.width*.35,mapBox.y+mapBox.height*.45)
  await page.mouse.click(mapBox.x+mapBox.width*.35,mapBox.y+mapBox.height*.45)
  await page.mouse.click(resetBox.x+resetBox.width*.5,resetBox.y+resetBox.height*.5)
  const blockedAfter=await snapshot(page)
  assert.equal(blockedAfter.current,blockedCurrent,"map accepted a click while GUIDE was open")
  assert.deepEqual(blockedAfter.trace,blockedTrace,"TRACE accepted an action while GUIDE was open")
  await page.keyboard.press("Escape")
  await page.waitForFunction(()=>!document.querySelector("#reader").classList.contains("guide-mode"))
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
  assert.equal((await snapshot(page)).focusId,"guideButton","focus did not return to GUIDE button")
  await button.focus(); await page.keyboard.press("Space"); await waitGuide(page); await closeGuide(page)

  // Trace and current-node isolation, including five reopen cycles.
  const isolationBefore=await snapshot(page)
  for(let index=0;index<5;index+=1){await openGuide(page);assert.equal((await snapshot(page)).guideScrollTop,0);await closeGuide(page)}
  const isolationAfter=await snapshot(page)
  assert.equal(isolationAfter.current,isolationBefore.current)
  assert.deepEqual(isolationAfter.trace,isolationBefore.trace)
  assert.equal(isolationAfter.url,isolationBefore.url)
  assert.equal(isolationAfter.historyLength,isolationBefore.historyLength)
  assert.equal(isolationAfter.trace.includes("HOW_TO_READ"),false)
  assert.equal(isolationAfter.duplicateGuide,1)
  assert.equal(isolationAfter.guide,false)

  // Preview restoration.
  await page.goto(`${baseUrl}/?node=EPSILON_06&map=1`,{waitUntil:"networkidle"})
  await page.waitForFunction(()=>document.querySelector("#nodeBody .source-document")?.dataset.sourceState==="ready")
  await page.locator(".reader-scroll").evaluate(element=>{element.scrollTop=120})
  const previewBefore=await snapshot(page)
  await openGuide(page); await closeGuide(page)
  await page.waitForFunction(()=>document.querySelector("#nodeBody .source-document")?.dataset.sourceState==="ready")
  const previewAfter=await snapshot(page)
  assert.equal(previewAfter.current,previewBefore.current)
  assert.equal(previewAfter.readerFull,false)
  assert.ok(Math.abs(previewAfter.readerScrollTop-previewBefore.readerScrollTop)<=3,`preview scroll changed ${previewBefore.readerScrollTop} -> ${previewAfter.readerScrollTop}`)

  // Full-reader phase and mid-article scroll restoration.
  await page.locator("#readFull").click()
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
  await page.locator(".reader-scroll").evaluate(element=>{element.scrollTop=Math.round(element.scrollHeight*.45)})
  const fullBefore=await snapshot(page)
  assert.equal(fullBefore.readerFull,true)
  await openGuide(page); await closeGuide(page)
  await page.waitForFunction(()=>document.querySelector("#nodeBody .source-document")?.dataset.sourceState==="ready")
  const fullAfter=await snapshot(page)
  assert.equal(fullAfter.current,fullBefore.current)
  assert.equal(fullAfter.readerFull,true)
  assert.ok(Math.abs(fullAfter.readerScrollTop-fullBefore.readerScrollTop)<=3,`full scroll changed ${fullBefore.readerScrollTop} -> ${fullAfter.readerScrollTop}`)

  // 2D map/category/selection restoration.
  await page.locator("#closeReader").click()
  await page.locator("#surface2d").click()
  await page.locator('#clusterNav button[data-cluster="canon"]').click()
  const map2dBefore=await snapshot(page)
  await openGuide(page); await closeGuide(page)
  const map2dAfter=await snapshot(page)
  assert.equal(map2dAfter.surface2d,"true")
  assert.equal(map2dAfter.filter,map2dBefore.filter)
  assert.equal(map2dAfter.activeCategory,map2dBefore.activeCategory)
  assert.deepEqual(map2dAfter.selected,map2dBefore.selected)
  assert.equal(map2dAfter.readerClosed,true)
  assert.notEqual(map2dAfter.mapPointerEvents,"none")
  assert.equal(map2dAfter.mapOpacity,1)
  assert.equal(map2dAfter.mapFilter,"none")

  // 3D restoration keeps the exact Canvas instance and one renderer surface.
  await page.locator('#clusterNav button[data-cluster="all"]').click()
  await page.locator("#surface3d").click()
  await page.evaluate(()=>{window.__guideCanvas=document.querySelector("#rhizome3dCanvas")})
  const map3dBefore=await snapshot(page)
  await openGuide(page); await closeGuide(page)
  const map3dAfter=await snapshot(page)
  assert.equal(map3dAfter.surface3d,"true")
  assert.equal(map3dAfter.canvasCount,1)
  assert.equal(map3dAfter.canvasSame,true)
  assert.equal(map3dAfter.current,map3dBefore.current)
  assert.notEqual(map3dAfter.mapPointerEvents,"none")
  assert.equal(map3dAfter.mapOpacity,1)
  assert.equal(map3dAfter.mapFilter,"none")

  // Search excludes HOW TO READ; random and trace remain ordinary node features.
  await page.locator("#searchButton").click(); await page.locator("#searchInput").fill("Как читать этот архив")
  assert.equal(await page.locator(".search-result").filter({hasText:"Как читать этот архив"}).count(),0)
  await page.locator("#searchDialog").evaluate(dialog=>dialog.close())
  await page.locator("#randomButton").click()
  const randomState=await snapshot(page)
  assert.notEqual(randomState.current,"HOW_TO_READ")
  await page.locator("#nextTrace").click()
  const nextState=await snapshot(page)
  assert.equal(nextState.trace.includes("HOW_TO_READ"),false)

  // Topbar remains page-width safe at required viewports.
  for(const viewport of [{width:1440,height:900},{width:1280,height:800},{width:1024,height:768}]){
    await page.setViewportSize(viewport)
    const geometry=await page.evaluate(()=>({
      documentOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
      topbarOverflow:document.querySelector(".topbar").scrollWidth>document.querySelector(".topbar").clientWidth,
      guideVisible:document.querySelector("#guideButton").getBoundingClientRect().width>0
    }))
    assert.equal(geometry.documentOverflow,false,`${viewport.width}: document has horizontal overflow`)
    assert.equal(geometry.topbarOverflow,false,`${viewport.width}: topbar overflows`)
    assert.equal(geometry.guideVisible,true,`${viewport.width}: GUIDE button disappeared`)
  }
  await page.close()

  if(screenshotDir){
    const shotPage=await newPage()
    const shot=name=>shotPage.screenshot({path:path.join(screenshotDir,name)})
    await boot(shotPage,"BOGOBOT")
    await shotPage.locator("#closeReader").click()
    await shotPage.locator("#surface2d").click()
    if(!mapScreenshotOnly) await shot("guide-topbar-how-to-read.png")
    await openGuide(shotPage)
    await shot("guide-2d-inactive.png")
    await shotPage.locator(".reader-scroll").evaluate(element=>{element.scrollTop=0})
    if(!mapScreenshotOnly){
      await shot("guide-five-steps-refined.png")
      await shot("guide-back-to-archive.png")
      await shot("guide-trace-inactive.png")
    }
    await closeGuide(shotPage)

    await shotPage.goto(`${baseUrl}/?node=EPSILON_06&map=1`,{waitUntil:"networkidle"})
    await shotPage.waitForFunction(()=>document.querySelector("#nodeBody .source-document")?.dataset.sourceState==="ready")
    await shotPage.locator("#readFull").click()
    await shotPage.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
    await shotPage.locator(".reader-scroll").evaluate(element=>{element.scrollTop=Math.round(element.scrollHeight*.45)})
    const beforeScroll=await shotPage.locator(".reader-scroll").evaluate(element=>element.scrollTop)
    await openGuide(shotPage)
    await closeGuide(shotPage)
    await shotPage.waitForFunction(()=>document.querySelector("#nodeBody .source-document")?.dataset.sourceState==="ready")
    const afterScroll=await shotPage.locator(".reader-scroll").evaluate(element=>element.scrollTop)
    screenshotScroll={before:beforeScroll,after:afterScroll}
    assert.ok(Math.abs(afterScroll-beforeScroll)<=3,`screenshot restoration changed scroll ${beforeScroll} -> ${afterScroll}`)
    if(!mapScreenshotOnly) await shot("guide-return-restored.png")

    await shotPage.locator("#closeReader").click()
    await shotPage.locator("#surface3d").click()
    await openGuide(shotPage)
    await shot("guide-3d-inactive.png")
    await shotPage.setViewportSize({width:1024,height:768})
    await shotPage.waitForTimeout(350)
    assert.equal(await shotPage.locator("#guideContent").isVisible(),true,"GUIDE disappeared after resizing from desktop to 1024px")
    await shot("guide-1024x768.png")
    await shotPage.close()
  }
  assert.deepEqual(runtimeErrors,[],`GUIDE runtime errors:\n${runtimeErrors.join("\n")}`)
  console.log(JSON.stringify({status:"PASS",fullScroll:{before:fullBefore.readerScrollTop,after:fullAfter.readerScrollTop},screenshotScroll,runtimeErrors},null,2))
} finally {
  await browser.close()
}
