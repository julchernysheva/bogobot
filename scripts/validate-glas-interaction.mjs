import { chromium } from "playwright";

const previewUrl = process.env.BOGOBOT_PREVIEW_URL || "http://127.0.0.1:4173/";
const executablePath = process.env.PLAYWRIGHT_CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const runsPerQuestion = Number(process.env.BOGOBOT_GLAS_RUNS || 5);
const viewports = [
  { name: "desktop-1440", width: 1440, height: 900, mobile: false },
  { name: "mobile-390", width: 390, height: 844, mobile: true },
  { name: "landscape-667", width: 667, height: 375, mobile: true },
  { name: "landscape-844", width: 844, height: 390, mobile: false }
];

const problems = [];
const diagnostics = [];

async function openGlas(page) {
  await page.goto(previewUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#enter", { timeout: 10000 });
  await page.click("#enter");
  await page.waitForSelector("#app.ready", { timeout: 10000 });
  await page.waitForTimeout(200);
  await page.click('#desktopStageSwitcher button[data-desktop-stage="voice"]');
  await page.waitForFunction(() => {
    const app = document.querySelector("#app");
    return app?.dataset.desktopDialogueMode === "voice" || app?.dataset.mobileMode === "voice";
  }, { timeout: 10000 });
  await page.waitForTimeout(200);
}

async function signalInventory(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll(".bogobot-signal")]
      .filter(button => {
        const rect = button.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map(button => {
        const rect = button.getBoundingClientRect();
        const points = [
          { name: "center", x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
          { name: "left", x: rect.left + Math.min(44, rect.width / 4), y: rect.top + rect.height / 2 },
          { name: "right", x: rect.right - 12, y: rect.top + rect.height / 2 }
        ];
        return {
          id: button.dataset.signalId || "",
          signalType: button.dataset.signalType || "",
          text: button.textContent.trim(),
          tag: button.tagName,
          type: button.type,
          disabled: button.disabled,
          rect: rect.toJSON(),
          styles: {
            pointerEvents: getComputedStyle(button).pointerEvents,
            cursor: getComputedStyle(button).cursor,
            minHeight: getComputedStyle(button).minHeight,
            userSelect: getComputedStyle(button).userSelect
          },
          hitTargets: points.map(point => {
            const hit = document.elementFromPoint(point.x, point.y);
            return {
              point: point.name,
              tag: hit?.tagName || "",
              id: hit?.id || "",
              className: typeof hit?.className === "string" ? hit.className : "",
              ownsButton: Boolean(hit?.closest?.(".bogobot-signal") === button)
            };
          })
        };
      });
  });
}

async function waitForVisibleResult(page, contextLabel) {
  const started = Date.now();
  const states = [];
  let final = null;
  while (Date.now() - started < 12000) {
    const snapshot = await page.evaluate(() => {
      const form = document.querySelector("#bogobotDialogue");
      const answer = document.querySelector("#bogobotAnswer");
      const style = answer ? getComputedStyle(answer) : null;
      const rect = answer?.getBoundingClientRect();
      return {
        state: form?.dataset.state || "",
        phase: form?.dataset.phase || "",
        kind: form?.dataset.responseKind || "",
        answerHidden: answer ? answer.hidden : true,
        answerTextLength: answer?.textContent?.trim().length || 0,
        display: style?.display || "",
        visibility: style?.visibility || "",
        opacity: style?.opacity || "",
        rect: rect ? rect.toJSON() : null,
        mode: document.querySelector("#app")?.dataset.desktopDialogueMode || document.querySelector("#app")?.dataset.mobileMode || ""
      };
    });
    const previous = states[states.length - 1];
    if (!previous || previous.state !== snapshot.state || previous.answerTextLength !== snapshot.answerTextLength) states.push(snapshot);
    if (snapshot.state === "READY") {
      final = snapshot;
      break;
    }
    await page.waitForTimeout(100);
  }
  const elapsed = Date.now() - started;
  const visible = Boolean(final && !final.answerHidden && final.answerTextLength > 0 && final.display !== "none" && final.visibility !== "hidden" && Number(final.opacity) > 0);
  diagnostics.push({ context: contextLabel, signalType: "question", startState: states[0]?.state || "", finalState: final?.state || "TIMEOUT", answerTextLength: final?.answerTextLength || 0, elapsed, pass: visible, states });
  return { visible, elapsed, final, states };
}

async function returnToListening(page) {
  const clicked = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("#bogobotDialogueActions button")];
    const askAgain = buttons.find(button => /СПРОСИТЬ ЕЩЁ/.test(button.textContent));
    if (!askAgain) return false;
    askAgain.click();
    return true;
  });
  if (!clicked) return false;
  await page.waitForFunction(() => document.querySelector("#bogobotDialogue")?.dataset.state === "LISTENING", { timeout: 6000 });
  await page.waitForFunction(() => [...document.querySelectorAll(".bogobot-signal")].some(button => button.dataset.signalType === "question"), { timeout: 6000 });
  await page.waitForTimeout(150);
  return true;
}


async function ensureSignalVisible(page, signalId) {
  const selector = `.bogobot-signal[data-signal-id="${signalId}"]`;
  if (await page.locator(selector).count()) return;
  const refresh = page.locator("#bogobotSignalsRefresh");
  if (await refresh.count()) {
    const expanded = await refresh.getAttribute("aria-expanded");
    if (expanded !== "true") await refresh.click();
  }
  await page.waitForFunction(id => Boolean(document.querySelector(`.bogobot-signal[data-signal-id="${id}"]`)), signalId, { timeout: 6000 });
}

async function activateQuestion(page, signal, label) {
  const selector = `.bogobot-signal[data-signal-id="${signal.id}"]`;
  const startState = await page.evaluate(() => document.querySelector("#bogobotDialogue")?.dataset.state || "");
  const beforeTrace = await page.evaluate(() => [...document.querySelectorAll(".trace button")].length);
  const started = Date.now();
  await ensureSignalVisible(page, signal.id);
  await page.locator(selector).click();
  const result = await waitForVisibleResult(page, label);
  const afterTrace = await page.evaluate(() => [...document.querySelectorAll(".trace button")].length);
  const elapsed = Date.now() - started;
  const pass = result.visible && beforeTrace === afterTrace;
  diagnostics.push({ context: label, signalType: signal.signalType, signalText: signal.text, startState, finalState: result.final?.state || "TIMEOUT", answerTextLength: result.final?.answerTextLength || 0, elapsed, pass });
  if (!result.visible) problems.push(`${label}: QUESTION did not produce visible non-empty READY/SOURCE LOST result`);
  if (beforeTrace !== afterTrace) problems.push(`${label}: QUESTION changed trace count ${beforeTrace}→${afterTrace}`);
}

async function runViewport(browser, viewport) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1, isMobile: viewport.mobile, hasTouch: viewport.mobile });
  const consoleIssues = [];
  page.on("console", message => {
    if (["error", "warning"].includes(message.type())) consoleIssues.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", error => consoleIssues.push(`pageerror: ${error.message}`));

  try {
    await openGlas(page);
    const signals = await signalInventory(page);
    const questions = signals.filter(signal => signal.signalType === "question");
    const routes = signals.filter(signal => signal.signalType === "route");
    if (signals.length !== 3) problems.push(`${viewport.name}: expected 3 visible signals, got ${signals.length}`);
    if (questions.length !== 2) problems.push(`${viewport.name}: expected 2 QUESTION signals, got ${questions.length}`);
    if (routes.length !== 1) problems.push(`${viewport.name}: expected 1 ROUTE signal, got ${routes.length}`);
    signals.forEach(signal => {
      if (signal.tag !== "BUTTON" || signal.type !== "button") problems.push(`${viewport.name}: ${signal.id} is not semantic button[type=button]`);
      if (signal.disabled) problems.push(`${viewport.name}: ${signal.id} is disabled`);
      if (signal.styles.pointerEvents !== "auto") problems.push(`${viewport.name}: ${signal.id} pointer-events=${signal.styles.pointerEvents}`);
      if (signal.rect.height < 44) problems.push(`${viewport.name}: ${signal.id} hit height ${signal.rect.height} < 44`);
      signal.hitTargets.forEach(hit => {
        if (!hit.ownsButton) problems.push(`${viewport.name}: ${signal.id} ${hit.point} is covered by ${hit.tag}.${hit.className || hit.id}`);
      });
    });

    for (const question of questions) {
      for (let run = 1; run <= runsPerQuestion; run += 1) {
        await activateQuestion(page, question, `${viewport.name} ${question.id} run ${run}`);
        if (run < runsPerQuestion) {
          const reset = await returnToListening(page);
          if (!reset) problems.push(`${viewport.name} ${question.id} run ${run}: could not return to LISTENING`);
        }
      }
      await returnToListening(page);
    }

    if (routes[0]) {
      await openGlas(page);
      const routeBeforeTrace = await page.evaluate(() => [...document.querySelectorAll(".trace button")].length);
      await page.locator(`.bogobot-signal[data-signal-id="${routes[0].id}"]`).click();
      await page.waitForTimeout(600);
      const routeState = await page.evaluate(() => ({
        current: document.querySelector("#currentTitle")?.textContent?.trim() || "",
        trace: [...document.querySelectorAll(".trace button")].length,
        mode: document.querySelector("#app")?.dataset.desktopDialogueMode || document.querySelector("#app")?.dataset.mobileMode || ""
      }));
      diagnostics.push({ context: `${viewport.name} route ${routes[0].id}`, signalType: "route", signalText: routes[0].text, startState: "LISTENING", finalState: routeState.mode, answerTextLength: 0, elapsed: 600, pass: routeState.trace >= routeBeforeTrace });
      await page.click('#desktopStageSwitcher button[data-desktop-stage="voice"]');
      await page.waitForFunction(() => document.querySelector("#bogobotDialogue")?.dataset.state === "LISTENING", { timeout: 6000 });
      const freshQuestions = (await signalInventory(page)).filter(signal => signal.signalType === "question");
      if (!freshQuestions[0]) problems.push(`${viewport.name}: no QUESTION available after ROUTE`);
      else await activateQuestion(page, freshQuestions[0], `${viewport.name} after-route ${freshQuestions[0].id}`);
    }
  } finally {
    if (consoleIssues.length) problems.push(`${viewport.name}: console issues: ${consoleIssues.join(" | ")}`);
    await page.close();
  }
}

const browser = await chromium.launch({ headless: true, executablePath });
try {
  for (const viewport of viewports) await runViewport(browser, viewport);
} finally {
  await browser.close();
}

const conciseDiagnostics = diagnostics.map(({ context, signalType, signalText, startState, finalState, answerTextLength, elapsed, pass }) => ({ context, signalType, signalText, startState, finalState, answerTextLength, elapsed, pass }));
if (problems.length) {
  console.error("validate-glas-interaction: FAIL");
  console.error(JSON.stringify({ problems, diagnostics: conciseDiagnostics }, null, 2));
  process.exit(1);
}

console.log("validate-glas-interaction: PASS");
console.log(JSON.stringify({ runsPerQuestion, viewports, diagnostics: conciseDiagnostics }, null, 2));
