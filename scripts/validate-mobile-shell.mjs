import fs from "node:fs"

const indexHtml = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8")
const appJs = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8")
const stylesCss = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8")

const problems = []
const fail = message => problems.push(message)

const stageButtons = [...indexHtml.matchAll(/data-desktop-stage="([^"]+)"/g)].map(match => match[1])
if (stageButtons.join("|") !== "graph|voice|reader") fail(`stage switcher must contain only graph|voice|reader, found ${stageButtons.join("|")}`)
if (/data-stage-back/.test(indexHtml + appJs + stylesCss)) fail("legacy data-stage-back control still present")
if (/←\s*НАЗАД/.test(indexHtml + appJs)) fail("legacy reader/back label ← НАЗАД still present in runtime sources")

if (!indexHtml.includes('id="mobileMenuButton"')) fail("mobile burger button missing")
if (!indexHtml.includes('aria-label="Открыть меню"')) fail("mobile burger aria-label missing")
if (!indexHtml.includes('aria-controls="mobileGlobalMenu"')) fail("mobile burger aria-controls missing")
if (!indexHtml.includes('aria-expanded="false"')) fail("mobile burger initial aria-expanded missing")
const burgerMatch = indexHtml.match(/<button[^>]+id="mobileMenuButton"[\s\S]*?<\/button>/)
if (!burgerMatch) fail("mobile burger markup missing")
else {
  if (/МЕНЮ/.test(burgerMatch[0])) fail("mobile burger must not contain text МЕНЮ")
  const lineCount = (burgerMatch[0].match(/<span aria-hidden="true"><\/span>/g) || []).length
  if (lineCount !== 3) fail(`mobile burger must contain 3 icon lines, found ${lineCount}`)
}
if (/data-mobile-command="brand"/.test(indexHtml)) fail("brand subtitle is still a menu command")
const menuMarkup = indexHtml.match(/<aside class="mobile-global-menu"[\s\S]*?<\/aside>/)?.[0] || ""
if (/Архив несбывшегося будущего/.test(menuMarkup)) fail("brand subtitle is still inside burger menu")
if (!/function toggleMobileGlobalMenu\(\)/.test(appJs)) fail("mobile menu toggle function missing")
if (!/mobileMenuButton"\)\?\.addEventListener\("click",toggleMobileGlobalMenu\)/.test(appJs)) fail("mobile menu button does not use toggle handler")
if (!/document\.body\.classList\.toggle\("mobile-menu-open",open\)/.test(appJs)) fail("mobile menu body lock not tied to open state")

const closeButtonMatch = indexHtml.match(/<button[^>]+id="bogobotDialogueClose"[^>]*>([\s\S]*?)<\/button>/)
if (!closeButtonMatch) fail("GLAS return control missing")
else {
  const label = closeButtonMatch[1].trim()
  if (label === "×" || label.includes("✕")) fail("GLAS still uses a cross close control")
  if (!/К\s+КАРТЕ/.test(label)) fail(`GLAS return control must be ← К КАРТЕ, found ${label}`)
}
if (!/bogobotDialogueClose"\)\?\.addEventListener\("click",\(\)=>closeBogobotOverlay\(\)\)/.test(appJs)) fail("GLAS return control is not wired to close overlay")


const closeReaderMatch = indexHtml.match(/<button[^>]+id="closeReader"[^>]*>/)?.[0] || ""
if (!/hidden/.test(closeReaderMatch)) fail("reader duplicate map control #closeReader must be hidden by default")
if (!/#closeReader\[hidden\]\s*\{\s*display:\s*none\s*!important;\s*\}/.test(stylesCss)) fail("#closeReader hidden CSS guard missing")
if (!indexHtml.includes('id="previousTrace"')) fail("previous reader object control missing")
if (!indexHtml.includes('← PREVIOUS OBJECT')) fail("previous reader object label missing")
if (!indexHtml.includes('NEXT OBJECT →')) fail("next reader object label missing")
if (!/function previousTraceRecord\(/.test(appJs)) fail("previous trace helper missing")
if (!/previous-trace/.test(appJs)) fail("previous trace open source missing")

if (!indexHtml.includes('id="traceToggle" aria-expanded="false"')) fail("route tray toggle aria-expanded missing")
if (!/traceToggle"\)\.setAttribute\("aria-expanded",String\(expanded\)\)/.test(appJs)) fail("route tray aria-expanded is not updated")
if (!/\.trace-label\s*\{[^}]*cursor:\s*pointer/s.test(stylesCss) && !/\.trace-label\s*\{[^}]*touch-action:\s*manipulation/s.test(stylesCss)) fail("route tray toggle lacks explicit touch/click affordance")
if (!/\.mobile-menu-toggle span\s*\{[^}]*background:\s*currentColor/s.test(stylesCss)) fail("mobile burger icon line styling missing")
if (!/\.app > \.topbar \.brand-title\s*\{[^}]*white-space:\s*normal/s.test(stylesCss)) fail("mobile brand subtitle is not allowed to wrap")

if (!/@media \(max-width: 767px\), \(max-height: 430px\) and \(orientation: landscape\)/.test(stylesCss)) fail("mobile/low-height landscape shell media query missing")
if (!/overflow-x:\s*hidden/.test(stylesCss)) fail("mobile horizontal overflow guard missing")
if (!/min-height:\s*44px/.test(stylesCss)) fail("mobile touch target floor missing")

if (problems.length) {
  console.error("validate-mobile-shell: FAIL")
  for (const problem of problems) console.error(`- ${problem}`)
  process.exit(1)
}
console.log("validate-mobile-shell: PASS")
