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

    document.querySelectorAll("[data-book-route-item]").forEach(element => {
      const id = element.dataset.routeId
      const status = element.querySelector("[data-route-status]")
      const isRead = completed.has(id)
      const isCurrent = id === state.current && !isRead
      element.dataset.routeStatus = isRead ? "read" : isCurrent ? "current" : "available"
      if (status) status.textContent = "ЧИТАТЬ"
    })

    const primary = document.querySelector("[data-books-primary]")
    if (primary) {
      const current = ROUTE_IDS.includes(state.current) ? state.current : ROUTE_IDS[0]
      const routeLink = document.querySelector(`[data-book-route-item][data-route-id="${current}"] a`)
      primary.href = routeLink?.getAttribute("href") || "./prologue/"
      primary.textContent = state.current ? "ПРОДОЛЖИТЬ →" : "НАЧАТЬ С ПРОЛОГА →"
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

  function setupSectionNavigation() {
    const links = [...document.querySelectorAll('.book-section-nav a[href^="#"]')]
    if (!links.length) return
    const targets = links
      .map(link => ({ link, target:document.querySelector(link.getAttribute("href")) }))
      .filter(entry => entry.target)
    if (!targets.length) return

    const setActive = targetId => {
      targets.forEach(({ link, target }) => {
        if (target.id === targetId) link.setAttribute("aria-current", "location")
        else link.removeAttribute("aria-current")
      })
    }

    targets.forEach(({ link, target }) => {
      link.addEventListener("click", event => {
        event.preventDefault()
        const href = link.getAttribute("href")
        if (href && location.hash !== href) history.pushState(null, "", href)
        target.scrollIntoView({ behavior:"auto", block:"start" })
        setActive(target.id)
      })
    })

    setActive(targets[0].target.id)
    if (!("IntersectionObserver" in globalThis)) return
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)
      if (visible[0]) setActive(visible[0].target.id)
    }, { rootMargin:"-128px 0px -65% 0px", threshold:[0, 1] })
    targets.forEach(({ target }) => observer.observe(target))
  }


  function setupRouteStrip() {
    const strip = document.querySelector("[data-book-route-strip]")
    const current = strip?.querySelector('[aria-current="page"]')
    if (!strip || !current) return

    const centerCurrent = () => {
      if (!globalThis.matchMedia?.("(max-width: 900px)")?.matches) {
        strip.scrollLeft = 0
        return
      }
      if (strip.scrollWidth <= strip.clientWidth + 2) {
        strip.scrollLeft = 0
        return
      }
      const target = current.offsetLeft - (strip.clientWidth - current.offsetWidth) / 2
      const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
      strip.scrollTo({ left:Math.max(0, target), behavior:reducedMotion ? "auto" : "smooth" })
    }

    requestAnimationFrame(centerCurrent)
    addEventListener("resize", centerCurrent)
  }

  function setupMobileNavigation() {
    const groups = [...document.querySelectorAll(".book-mobile-nav-group")]
    groups.forEach(group => {
      group.addEventListener("toggle", () => {
        if (!group.open) return
        groups.forEach(other => {
          if (other !== group) other.open = false
        })
      })
    })
  }

  let state = readProgressState()
  const pageId = document.documentElement.dataset.bookRouteId
  if (ROUTE_IDS.includes(pageId)) {
    state = setCurrent(state, pageId)
    writeProgressState(state)
  }
  updateRouteProgress(state)
  setupRouteStrip()
  setupMobileNavigation()
  setupSectionNavigation()

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
