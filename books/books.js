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

  const ROUTE_NODE_IDS = Object.freeze({
    "identity-protocol-prologue":"IDENTITY_PROTOCOL_PROLOGUE",
    "before-error":"BEFORE_ERROR",
    "great-error":"GREAT_ERROR",
    "genesis":"BOOK_OF_GENESIS",
    "voice":"BOOK_OF_VOICE",
    "epilogue":"ARCHIVE_EPILOGUE"
  })

  function normalizeMapNodeId(value) {
    return typeof value === "string" && /^[A-Z0-9_]+$/.test(value) ? value : null
  }

  // BOGOBOT_BOOKS_MAP_SKIP_BOOT
  function armMapTransition(link) {
    if (!link) return
    link.addEventListener("click", () => {
      try { sessionStorage.setItem("bogobot.booksMapIntentOnce", "1") } catch {}
    }, { capture:true })
  }

  function mapRootHref(pageId) {
    return ROUTE_IDS.includes(pageId) ? "../../index.html" : "../index.html"
  }

  function mapDirectHref(pageId) {
    return `${mapRootHref(pageId)}?map=1`
  }

  function mapReturnHref(pageId, fromNodeId) {
    const nodeId = normalizeMapNodeId(fromNodeId) || ROUTE_NODE_IDS[pageId] || "BOGOBOT"
    const root = mapRootHref(pageId)
    return `${root}?node=${encodeURIComponent(nodeId)}`
  }

  function withMapOrigin(href, fromNodeId, baseHref = location.href) {
    const nodeId = normalizeMapNodeId(fromNodeId)
    if (!nodeId) return href
    const url = new URL(href, baseHref)
    if (url.origin !== location.origin || !url.pathname.includes("/books/")) return href
    url.searchParams.set("from", nodeId)
    return `${url.pathname}${url.search}${url.hash}`
  }

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
  globalThis.BogobotBooksRouting = Object.freeze({
    routeNodeIds: ROUTE_NODE_IDS,
    normalizeMapNodeId,
    mapDirectHref,
    mapReturnHref,
    withMapOrigin
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
      if (status) {
        if (isCurrent) {
          const index = element.dataset.routeIndex || String(ROUTE_IDS.indexOf(id) + 1).padStart(2, "0")
          const total = element.dataset.routeTotal || String(ROUTE_IDS.length).padStart(2, "0")
          status.hidden = false
          status.textContent = `${index} / ${total} · ПРОДОЛЖИТЬ`
        } else {
          status.hidden = true
          status.textContent = ""
        }
      }
    })

    const indexProgress = document.querySelector("[data-books-index-progress]")
    if (indexProgress) {
      const currentElement = document.querySelector(`[data-book-route-item][data-route-id="${state.current}"]`)
      if (currentElement && !completed.has(state.current)) {
        const label = currentElement.querySelector(".book-route-title")?.textContent?.trim() || "маршрут"
        indexProgress.hidden = false
        indexProgress.textContent = `ПРОДОЛЖИТЬ: ${label}`
      } else {
        indexProgress.hidden = true
        indexProgress.textContent = ""
      }
    }

    const axisCurrent = document.documentElement.dataset.booksPage === "index" ? "index" : state.current
    document.querySelectorAll("[data-books-axis-route]").forEach(link => {
      const active = link.dataset.booksAxisRoute === axisCurrent
      if (active) link.setAttribute("aria-current", "page")
      else link.removeAttribute("aria-current")
    })

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

  function setupMapRouting(pageId) {
    const params = new URLSearchParams(location.search)
    const explicitFrom = normalizeMapNodeId(params.get("from"))
    const fallbackNode = ROUTE_NODE_IDS[pageId] || null
    const mapOrigin = explicitFrom || fallbackNode
    const mapLinks = [...document.querySelectorAll("[data-books-map-link], [data-books-random-link]")]
    mapLinks.forEach(link => armMapTransition(link))
    if (!mapOrigin) return
    document.querySelectorAll('a[href]').forEach(link => {
      if (link.closest(".books-nav") || link.hasAttribute("data-books-map-link")) return
      const rawHref = link.getAttribute("href")
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) return
      const nextHref = withMapOrigin(rawHref, mapOrigin)
      if (nextHref !== rawHref) link.setAttribute("href", nextHref)
    })
  }

  function setBooksMobileMenu(open, { returnFocus = true } = {}) {
    const panel = document.querySelector("[data-books-mobile-menu]")
    const backdrop = document.querySelector("[data-books-mobile-menu-backdrop]")
    const toggle = document.querySelector("[data-books-mobile-menu-toggle]")
    if (!panel || !backdrop || !toggle) return
    panel.hidden = !open
    backdrop.hidden = !open
    panel.setAttribute("aria-hidden", String(!open))
    toggle.setAttribute("aria-expanded", String(open))
    document.body.classList.toggle("mobile-menu-open", open)
    if (!open && returnFocus) requestAnimationFrame(() => toggle.focus({ preventScroll:true }))
  }

  function setupBooksMobileMenu() {
    const toggle = document.querySelector("[data-books-mobile-menu-toggle]")
    const backdrop = document.querySelector("[data-books-mobile-menu-backdrop]")
    const panel = document.querySelector("[data-books-mobile-menu]")
    if (!toggle || !backdrop || !panel) return
    toggle.addEventListener("click", () => setBooksMobileMenu(panel.hidden, { returnFocus:false }))
    backdrop.addEventListener("click", () => setBooksMobileMenu(false))
    panel.addEventListener("click", event => {
      const signal = event.target.closest("[data-books-signal]")
      if (signal) return
      if (event.target.closest("[data-books-mobile-menu-close]")) setBooksMobileMenu(false, { returnFocus:false })
    })
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) {
        event.preventDefault()
        setBooksMobileMenu(false)
      }
    })
  }



  function setupBooksSearchPalette() {
    const searchLinks = [...document.querySelectorAll('a[href*="search=1"]')]
    if (!searchLinks.length) return
    let returnFocus = null
    let activeIndex = 0
    let visibleRecords = []
    const routeRecords = () => {
      const records = [...document.querySelectorAll('[data-books-axis-route], .book-route-link')]
        .map(link => {
          const href = link.getAttribute('href')
          const number = link.querySelector('span')?.textContent?.trim() || ''
          const title = link.querySelector('small, h2, .book-route-title')?.textContent?.trim() || link.textContent.trim().replace(/ОТКРЫТЬ\s*→?$/, '').trim()
          const id = link.dataset.booksAxisRoute || link.closest('[data-book-route-item]')?.dataset.routeId || href
          if (!href || href.includes('search=1') || id === 'index') return null
          return { id, href, title, meta:number || 'BOOKS', text:`${title} ${number} ${id}`.toLocaleLowerCase() }
        })
        .filter(Boolean)
      return [...new Map(records.map(record => [record.id, record])).values()]
    }
    const ensureDialog = () => {
      let dialog = document.querySelector('[data-books-search-dialog]')
      if (dialog) return dialog
      dialog = document.createElement('dialog')
      dialog.className = 'books-search-dialog search-palette'
      dialog.setAttribute('aria-labelledby', 'booksSearchPaletteTitle')
      dialog.setAttribute('data-books-search-dialog', '')
      dialog.innerHTML = `
        <div class="search-palette__panel" role="document">
          <header class="search-palette__header">
            <h2 id="booksSearchPaletteTitle">SEARCH NETWORK</h2>
            <button type="button" class="search-palette__close" data-books-search-close aria-label="Close search">ESC</button>
          </header>
          <div class="search-palette__input-wrap">
            <input class="search-palette__input" data-books-search-input type="search" placeholder="Введите название или термин…" autocomplete="off" spellcheck="false" />
            <button type="button" class="search-palette__clear" data-books-search-clear aria-label="Clear search" hidden>×</button>
            <p class="search-palette__hint" data-books-search-hint>Try: протокол, ошибка, глас, архив</p>
          </div>
          <div class="search-palette__content">
            <div class="search-palette__section-label" data-books-search-label>SUGGESTED</div>
            <div class="search-results search-palette__results" data-books-search-results role="listbox"></div>
          </div>
          <footer class="search-palette__footer">↑↓ SELECT · ENTER OPEN · ESC CLOSE</footer>
        </div>`
      document.body.append(dialog)
      const input = dialog.querySelector('[data-books-search-input]')
      const clear = dialog.querySelector('[data-books-search-clear]')
      const close = dialog.querySelector('[data-books-search-close]')
      dialog.addEventListener('click', event => { if (event.target === dialog) closeSearch() })
      dialog.addEventListener('cancel', event => { event.preventDefault(); closeSearch() })
      close.addEventListener('click', () => closeSearch())
      clear.addEventListener('click', () => { input.value = ''; render(''); input.focus({ preventScroll:true }) })
      input.addEventListener('input', event => render(event.target.value))
      dialog.addEventListener('keydown', event => {
        const focusables = [...dialog.querySelectorAll('input, button:not([hidden]), .search-result')].filter(el => !el.disabled && el.offsetParent !== null)
        if (event.key === 'Tab' && focusables.length) {
          const first = focusables[0]
          const last = focusables[focusables.length - 1]
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus({ preventScroll:true }) }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus({ preventScroll:true }) }
          return
        }
        if (event.key === 'ArrowDown' && visibleRecords.length) { event.preventDefault(); setActive(activeIndex + 1, true); return }
        if (event.key === 'ArrowUp' && visibleRecords.length) { event.preventDefault(); setActive(activeIndex - 1, true); return }
        if (event.key === 'Home' && visibleRecords.length) { event.preventDefault(); setActive(0, true); return }
        if (event.key === 'End' && visibleRecords.length) { event.preventDefault(); setActive(visibleRecords.length - 1, true); return }
        if (event.key === 'Enter' && visibleRecords.length && document.activeElement !== close && document.activeElement !== clear) { event.preventDefault(); openRecord(visibleRecords[activeIndex]); return }
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeSearch(); return }
      })
      return dialog
    }
    const setSearchActive = active => {
      document.body.classList.toggle('books-search-open', active)
      searchLinks.forEach(link => {
        link.classList.toggle('books-search-active', active)
        link.setAttribute('aria-pressed', String(active))
      })
    }
    const setActive = (index, scroll = false) => {
      const buttons = [...document.querySelectorAll('[data-books-search-results] .search-result')]
      if (!buttons.length) { activeIndex = 0; return }
      activeIndex = Math.max(0, Math.min(index, buttons.length - 1))
      buttons.forEach((button, buttonIndex) => button.setAttribute('aria-selected', String(buttonIndex === activeIndex)))
      if (scroll) buttons[activeIndex]?.scrollIntoView({ block:'nearest' })
    }
    const openRecord = record => {
      if (!record) return
      closeSearch({ returnFocus:false })
      location.href = record.href
    }
    const renderItems = (items, suggested = false) => {
      const dialog = ensureDialog()
      const results = dialog.querySelector('[data-books-search-results]')
      visibleRecords = items
      results.replaceChildren(...items.map((record, index) => {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'search-result'
        button.setAttribute('role', 'option')
        button.setAttribute('aria-selected', String(index === activeIndex))
        button.innerHTML = `<span class="search-result__title">${record.title}</span><span class="search-result__meta">${suggested && index === 0 ? 'START' : record.meta}</span>`
        button.addEventListener('mouseenter', () => setActive(index))
        button.addEventListener('focus', () => setActive(index))
        button.addEventListener('click', event => { event.stopPropagation(); openRecord(record) })
        return button
      }))
      setActive(activeIndex)
    }
    const render = query => {
      const dialog = ensureDialog()
      const input = dialog.querySelector('[data-books-search-input]')
      const clear = dialog.querySelector('[data-books-search-clear]')
      const hint = dialog.querySelector('[data-books-search-hint]')
      const label = dialog.querySelector('[data-books-search-label]')
      const q = query.trim().toLocaleLowerCase()
      activeIndex = 0
      clear.hidden = q.length === 0
      hint.hidden = q.length > 0
      const records = routeRecords()
      if (!q) {
        dialog.dataset.searchState = 'initial'
        label.textContent = 'SUGGESTED'
        renderItems(records.slice(0, 3), true)
        return
      }
      const matches = records.filter(record => record.text.includes(q))
      if (!matches.length) {
        dialog.dataset.searchState = 'empty'
        label.textContent = 'NO RESULTS'
        visibleRecords = []
        dialog.querySelector('[data-books-search-results]').replaceChildren(Object.assign(document.createElement('div'), {
          className:'search-empty',
          innerHTML:'<b>NO RESULTS</b><span>Попробуйте другое название, термин или место.</span>'
        }))
        return
      }
      dialog.dataset.searchState = 'results'
      label.textContent = `RESULTS · ${matches.length}`
      renderItems(matches)
    }
    const openSearch = event => {
      event.preventDefault()
      setBooksMobileMenu(false, { returnFocus:false })
      const dialog = ensureDialog()
      if (dialog.open) { closeSearch(); return }
      returnFocus = event.currentTarget
      dialog.querySelector('[data-books-search-input]').value = ''
      render('')
      dialog.showModal()
      setSearchActive(true)
      setTimeout(() => dialog.querySelector('[data-books-search-input]')?.focus({ preventScroll:true }), 50)
    }
    function closeSearch({ returnFocus:shouldReturnFocus = true } = {}) {
      const dialog = ensureDialog()
      if (dialog.open) dialog.close()
      setSearchActive(false)
      document.body.classList.remove('books-search-open')
      if (shouldReturnFocus) requestAnimationFrame(() => (returnFocus?.isConnected ? returnFocus : searchLinks[0])?.focus({ preventScroll:true }))
      returnFocus = null
    }
    searchLinks.forEach(link => {
      link.setAttribute('aria-pressed', 'false')
      link.addEventListener('click', openSearch)
    })
  }

  function setupBooksSignalControl() {
    const buttons = [...document.querySelectorAll("[data-books-signal]")]
    if (!buttons.length) return
    const readSound = () => {
      try { return localStorage.getItem("bogobot.sound") === "on" } catch { return false }
    }
    const writeSound = value => {
      try { localStorage.setItem("bogobot.sound", value ? "on" : "off") } catch {}
    }
    const sync = () => {
      const active = readSound()
      buttons.forEach(button => {
        button.textContent = `SIGNAL: ${active ? "ON" : "OFF"}`
        button.setAttribute("aria-pressed", String(active))
      })
    }
    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const next = !readSound()
        writeSound(next)
        sync()
      })
    })
    sync()
  }

  let state = readProgressState()
  const pageId = document.documentElement.dataset.bookRouteId
  setupMapRouting(pageId)
  setupBooksMobileMenu()
  setupBooksSearchPalette()
  setupBooksSignalControl()
  if (ROUTE_IDS.includes(pageId)) {
    state = setCurrent(state, pageId)
    writeProgressState(state)
  }
  updateRouteProgress(state)
  setupRouteStrip()
  setupMobileNavigation()
  setupSectionNavigation()

  const finishIndexEntrance = () => document.body.classList.remove("books-is-loading")
  if (document.body.classList.contains("books-is-loading")) {
    if (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) finishIndexEntrance()
    else setTimeout(finishIndexEntrance, 760)
  }

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
