(() => {
  "use strict"

  const STORAGE_KEY = "bogobot.books.route.v1"
  const ROUTE_IDS = Object.freeze([
    "identity-protocol-prologue",
    "before-error",
    "great-error",
    "genesis",
    "voice",
    "epilogue"
  ])

  function uniqueRouteIds(value) {
    if (!Array.isArray(value)) return []
    return [...new Set(value.filter(id => ROUTE_IDS.includes(id)))]
  }

  function normalizeProgressState(parsed) {
    const rawObject = parsed && !Array.isArray(parsed) && typeof parsed === "object"
      ? { ...parsed }
      : {}
    const completed = uniqueRouteIds(
      Array.isArray(parsed)
        ? parsed
        : parsed?.completed ?? parsed?.completedIds ?? parsed?.read ?? []
    )
    const currentCandidate = parsed?.current ?? parsed?.currentId ?? parsed?.last ?? null
    const current = ROUTE_IDS.includes(currentCandidate) ? currentCandidate : null
    return {
      raw: parsed,
      rawObject,
      current,
      completed
    }
  }

  function serializeProgressState(state) {
    const base = { ...state.rawObject }
    if (state.raw !== null && state.raw !== undefined && Array.isArray(state.raw)) {
      base.legacyValue = [...state.raw]
    }
    return {
      ...base,
      version: 1,
      current: ROUTE_IDS.includes(state.current) ? state.current : null,
      completed: uniqueRouteIds(state.completed)
    }
  }

  globalThis.BogobotBooksProgress = Object.freeze({
    storageKey: STORAGE_KEY,
    routeIds: ROUTE_IDS,
    normalizeProgressState,
    serializeProgressState
  })

  if (typeof document === "undefined" || typeof localStorage === "undefined") return

  function readProgressState() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return normalizeProgressState(null)
    try {
      return normalizeProgressState(JSON.parse(stored))
    } catch {
      return normalizeProgressState(null)
    }
  }

  function writeProgressState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeProgressState(state)))
    } catch {
      // Reading remains available when storage is disabled.
    }
  }

  function setCurrent(state, id) {
    if (!ROUTE_IDS.includes(id)) return state
    return { ...state, current: id }
  }

  function markCompleted(state, id) {
    if (!ROUTE_IDS.includes(id) || state.completed.includes(id)) return state
    return { ...state, completed: [...state.completed, id] }
  }

  function updateRouteProgress(state) {
    const completed = new Set(state.completed)
    const percent = completed.size / ROUTE_IDS.length * 100
    document.querySelectorAll("[data-route-progress-fill]").forEach(element => {
      element.style.width = `${percent}%`
    })
    document.querySelectorAll("[data-route-progress-copy]").forEach(element => {
      element.textContent = `${completed.size} / ${ROUTE_IDS.length}`
    })
    document.querySelectorAll("[data-route-progress-percent]").forEach(element => {
      element.textContent = `${Math.round(percent)}%`
    })

    document.querySelectorAll("[data-book-route-item]").forEach(element => {
      const id = element.dataset.routeId
      const status = element.querySelector("[data-route-status]")
      const mini = element.querySelector("[data-route-mini-fill]")
      const isRead = completed.has(id)
      const isCurrent = id === state.current && !isRead
      element.dataset.routeStatus = isRead ? "read" : isCurrent ? "current" : "begin"
      if (status) status.textContent = isRead ? "READ" : isCurrent ? "CURRENT" : "BEGIN"
      if (mini) mini.style.width = isRead ? "100%" : isCurrent ? "58%" : "0"
    })

    const primary = document.querySelector("[data-books-primary]")
    if (primary) {
      const current = ROUTE_IDS.includes(state.current) ? state.current : ROUTE_IDS[0]
      const routeLink = document.querySelector(`[data-book-route-item][data-route-id="${current}"] a`)
      primary.href = routeLink?.getAttribute("href") || "./prologue/"
      primary.textContent = state.current ? "CONTINUE READING →" : "BEGIN WITH PROLOGUE →"
    }
  }

  function updateReadingProgress() {
    const fill = document.querySelector("[data-reading-progress-fill]")
    if (!fill) return 0
    const root = document.documentElement
    const available = Math.max(1, root.scrollHeight - innerHeight)
    const ratio = Math.min(1, Math.max(0, scrollY / available))
    fill.style.width = `${ratio * 100}%`
    fill.parentElement?.setAttribute("aria-valuenow", String(Math.round(ratio * 100)))
    return ratio
  }

  let state = readProgressState()
  const pageId = document.documentElement.dataset.bookRouteId
  if (ROUTE_IDS.includes(pageId)) {
    state = setCurrent(state, pageId)
    writeProgressState(state)
  }
  updateRouteProgress(state)

  let completedOnThisVisit = state.completed.includes(pageId)
  const onProgress = () => {
    const ratio = updateReadingProgress()
    if (!completedOnThisVisit && ROUTE_IDS.includes(pageId) && ratio >= 0.9) {
      state = markCompleted(state, pageId)
      completedOnThisVisit = true
      writeProgressState(state)
      updateRouteProgress(state)
    }
  }

  updateReadingProgress()
  addEventListener("scroll", onProgress, { passive: true })
  addEventListener("resize", updateReadingProgress)
})()
