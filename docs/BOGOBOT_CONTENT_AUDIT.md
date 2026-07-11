# Bogobot — content audit

Режим: CONTENT AUDIT.  
Дата проверки: 2026-07-12.  
Production-файлы сайта не изменялись.

## Рабочая оговорка

Запрошенная ветка: `task/p1-content-audit`. В текущем окружении создание ветки не удалось из-за недоступной записи в `.git/refs/heads`; аудит выполнен в рабочей копии без коммита, без пуша и без публикации.

Базовая версия из задания: tag `bogobot-stable-c4.3.5`, commit `6e8330f`.

## Карта источников текста

Актуальные источники, использованные как рабочие:

- `index.html` — boot screen, глобальная шапка MAP, команды, search, entry dialog, reader shell.
- `app.js` — 93 registry records, включая все 52 graph nodes; фильтры графа; HISTORY / RELICS / WORLD navigation; reader captions; search results; trace labels; migration/user-state copy.
- `books/manifest.json` — маршрут BOOKS из 6 частей, лиды, key concepts, related metadata.
- `scripts/build-books.mjs` — presentation-only H2, рубрикатор, архивный аппарат, BOOKS shell labels, generated-reader copy.
- `books/index.html` и `books/*/index.html` — generated BOOKS pages, topbar, route index, rubricator/mobile navigation.
- `books/books.js` — progress state, MAP transition intent, runtime labels for route state.
- `assets/canonical-markdown/` — 37 canonical Markdown files: BOOKS source, world/schools/glossary/topography reader sources.
- `assets/pre-error-archive/` — markdown-хроники до Великой Ошибки и ε-периоды.
- `experiences/archive-transition/index.html` — standalone Archive Transition experience, музейный слой и внутренний record UI.
- `experiences/0xmem-reactor/index.html` — standalone 0xMEM Reactor experience, title/loading/back labels.
- `docs/STATE.md`, `docs/DECISIONS.md`, `docs/SITE_PLAN.md`, `docs/CANON_MAP.md`, `docs/NAVIGATION_MAP.md`, `docs/IMAGE_MAP.md`, актуальные BOOKS review docs — использованы как текущие проектные документы и для проверки противоречий.

Не считались актуальным источником production-текста:

- `_backups/`;
- `*.before-*`;
- `docs/*.before-*`;
- `_incoming/`, кроме понимания происхождения отдельных пакетов;
- `_snapshots/`.

## Проверенный объём

- Graph nodes: 52 / 52.
- Registry records: 93.
- Page-only records: 41.
- BOOKS generated pages: 7.
- BOOKS route items: 6.
- Canonical Markdown files: 37.
- Graph filter labels: 8.
- HISTORY graph memberships: 17.
- WORLD graph memberships: 5.
- Standalone experiences: 2.
- Проверенные пользовательские текстовые элементы: 238.

## Записи аудита

### 1. README — устаревшее количество узлов

Экран / узел  
— Project README.

Файл и строка  
— `README.md:9`.

Текущий текст  
— `34 узла графа, 2 page-only страницы, 36 записей всего;`

Проблема  
— Противоречит текущей runtime-проверке: `records: 93`, `graphNodes: 52`, `pageOnlyRecords: 41`.

Предлагаемая редакция  
— `52 узла графа, 41 page-only запись, 93 записи всего;`

Приоритет  
— P1.

Требуется решение автора  
— нет.

Статус  
— нужно исправить позднее.

### 2. README — инструкция входа неполная после BOOKS/MAP intent

Экран / узел  
— Project README.

Файл и строка  
— `README.md:5`.

Текущий текст  
— `Откройте index.html в браузере и нажмите ENTER THE NETWORK.`

Проблема  
— Описывает только прямой boot-вход. Не отражает текущий сценарий `BOOKS → MAP`, который открывает карту через `?map=1` без boot.

Предлагаемая редакция  
— `Прямой вход через index.html показывает boot screen; переход BOOKS → MAP использует ?map=1 и открывает карту напрямую.`

Приоритет  
— P2.

Требуется решение автора  
— нет.

Статус  
— нужно исправить позднее.

### 3. STATE — устаревшая строка «Текущая реализация»

Экран / узел  
— Project docs.

Файл и строка  
— `docs/STATE.md:58-60`.

Текущий текст  
— `Данные 34 узлов графа, 2 page-only страниц, связи и интерактивность: app.js.`

Проблема  
— Строка находится в разделе «Текущая реализация», но описывает старую фактуру проекта.

Предлагаемая редакция  
— `Данные 52 узлов графа, 41 page-only записи, связи и интерактивность: app.js.`

Приоритет  
— P1.

Требуется решение автора  
— нет.

Статус  
— нужно исправить позднее.

### 4. STATE — исторические строки с 34/36 выглядят как актуальные

Экран / узел  
— Project docs.

Файл и строка  
— `docs/STATE.md:247`, `docs/STATE.md:382`, `docs/STATE.md:552-565`.

Текущий текст  
— Повторяются старые счётчики `34 узла`, `2 page-only`, `36 записей`, `records 87`, `graph nodes 43`.

Проблема  
— Часть строк находится в исторических пакетах и может быть сохранена, но без явной пометки «исторический snapshot» читатель воспринимает их как актуальное состояние.

Предлагаемая редакция  
— Добавить в соответствующие старые секции пометку `Исторический snapshot; актуальные счётчики см. в начале STATE.md`.

Приоритет  
— P2.

Требуется решение автора  
— нет.

Статус  
— нужно уточнить структуру docs позднее.

### 5. CANON_MAP — TOPOGRAPHY называется старым title

Экран / узел  
— `TOPOGRAPHY`.

Файл и строка  
— `docs/CANON_MAP.md:43`.

Текущий текст  
— `TOPOGRAPHY | Топография сети`

Проблема  
— Runtime title в `app.js` и search contract: `Топография мира сети`; старое название сохранено только как alias.

Предлагаемая редакция  
— `TOPOGRAPHY | Топография мира сети`

Приоритет  
— P1.

Требуется решение автора  
— нет.

Статус  
— нужно исправить позднее.

### 6. CANON_MAP — GLOSSARY всё ещё описан как page-only

Экран / узел  
— `GLOSSARY`.

Файл и строка  
— `docs/CANON_MAP.md:47`.

Текущий текст  
— `page-only; единый лексикон без отдельных term page ID`

Проблема  
— После GLOSSARY hub карточка `GLOSSARY` является graph node; page-only утверждение неверно. Валидация: graph nodes `52`, GLOSSARY входит в graph filter и имеет 4 edges.

Предлагаемая редакция  
— `graph hub; единый лексикон без отдельных term graph nodes`

Приоритет  
— P1.

Требуется решение автора  
— нет.

Статус  
— нужно исправить позднее.

### 7. CANON_MAP — slash-названия реликвий устарели относительно display title

Экран / узел  
— `MESM`, `BESM_6`, `ALGOL_60`, `OGAS`.

Файл и строка  
— `docs/CANON_MAP.md:35-40`.

Текущий текст  
— `МЭСМ / Первая Искра`, `БЭСМ-6 / Каменное Сердце`, `АЛГОЛ-60 / ПервоЯзык`, `ОГАС / Утраченная архитектура`.

Проблема  
— В `docs/DECISIONS.md:51-53` утверждено: публичные названия используют точку, slash сохраняется для aliases. В `app.js` display titles уже используют точку.

Предлагаемая редакция  
— `МЭСМ. Первая искра`; `БЭСМ-6. Каменное сердце`; `АЛГОЛ-60. Первоязык`; `ОГАС. Утраченная архитектура`.

Приоритет  
— P2.

Требуется решение автора  
— нет.

Статус  
— нужно исправить позднее.

### 8. MAP boot — состояние `DORMANT` может звучать как неактуальное после прямого MAP intent

Экран / узел  
— Boot screen.

Файл и строка  
— `index.html:44-48`.

Текущий текст  
— `ARCHIVE NODE: PARTIALLY RECOVERED`; `NETWORK STATE: DORMANT`; `HUMAN TRACE: UNCONFIRMED`; `ENTER THE NETWORK`.

Проблема  
— Для прямого входа формулировка работает. После внедрения прямого `BOOKS → MAP` boot не должен появляться; если когда-либо появится даже на кадр, `DORMANT` будет противоречить фактическому состоянию уже готовой карты.

Предлагаемая редакция  
— Не менять сейчас. Если понадобится унификация: `NETWORK STATE: WAITING FOR ENTRY`.

Приоритет  
— P3.

Требуется решение автора  
— да.

Статус  
— наблюдать; не править без авторского решения.

### 9. MAP status — статичный placeholder `DISCOVERED: 1 / 20`

Экран / узел  
— MAP status before runtime render.

Файл и строка  
— `index.html:95-97`.

Текущий текст  
— `LOCAL FOCUS / CURRENT HORIZON`; `DISCOVERED: 1 / 20`.

Проблема  
— Runtime сразу заменяет denominator на `52`, но HTML fallback содержит старый `20`. Если JS задержится или упадёт, пользователь увидит неверную фактуру.

Предлагаемая редакция  
— `DISCOVERED: — / —` как безопасный fallback.

Приоритет  
— P2.

Требуется решение автора  
— нет.

Статус  
— нужно исправить позднее.

### 10. MAP / graph filters — английские label'ы в русском интерфейсе

Экран / узел  
— Global commands, filter strip, legend.

Файл и строка  
— `index.html:61-65`, `index.html:110-114`, `app.js:1172-1180`.

Текущий текст  
— `ARCHIVE ENTRY`, `BOOKS`, `SEARCH`, `RANDOM NODE`, `SIGNAL`, `ALL`, `CANON`, `WORLD`, `SCHOOLS`, `GLOSSARY`, `TOPOGRAPHY`, `HISTORY`, `RELICS`.

Проблема  
— Технически последовательно и соответствует «машинному» голосу интерфейса, но смешение с русскими заголовками может быть авторской системой или кандидатом на локализацию. Ошибкой не считаю.

Предлагаемая редакция  
— Не менять без решения. Если локализовать: `АРХИВ`, `КНИГИ`, `ПОИСК`, `СЛУЧАЙНЫЙ УЗЕЛ`, `СИГНАЛ`, `ВСЁ`, `КАНОН`, `МИР`, `ШКОЛЫ`, `ЛЕКСИКОН`, `ТОПОГРАФИЯ`, `ИСТОРИЯ`, `РЕЛИКВИИ`.

Приоритет  
— P3.

Требуется решение автора  
— да.

Статус  
— авторское решение.

### 11. MAP lens empty state — техническая заглушка слишком длинная

Экран / узел  
— Empty filter state.

Файл и строка  
— `app.js:2491-2494`.

Текущий текст  
— `NO RECORDS IN THIS MAP MODE / CURRENT NODE PRESERVED AS CONTEXT`; `NO DISCOVERED NODES IN THIS LENS / CURRENT NODE PRESERVED AS CONTEXT`.

Проблема  
— Это не lorem/TODO, но видимая техническая заглушка. Текст длинный, тяжёлый и не объясняет пользователю действие.

Предлагаемая редакция  
— `В этом режиме пока нет открытых узлов. Текущий узел сохранён как контекст.` или machine-variant `NO OPEN NODES IN THIS LENS / CURRENT NODE KEPT AS CONTEXT`.

Приоритет  
— P2.

Требуется решение автора  
— да.

Статус  
— нужно решить тон интерфейса.

### 12. Reader NEXT TRACE — tooltip звучит как debug status

Экран / узел  
— Reader toolbar.

Файл и строка  
— `app.js:4252`.

Текущий текст  
— `NEXT CONNECTED NODE: …`; fallback `NO CONNECTED NEXT NODE IN CURRENT MAP`.

Проблема  
— Сообщение корректно по логике historyGraphEdges / node links, но fallback звучит как internal diagnostic.

Предлагаемая редакция  
— `Следующий связанный узел: …`; fallback `В текущем режиме нет следующего связанного узла.`

Приоритет  
— P3.

Требуется решение автора  
— да, если сохраняется English machine voice.

Статус  
— авторское решение.

### 13. Reader media captions — raw `SOURCE_STATUS`

Экран / узел  
— Reader media captions.

Файл и строка  
— `index.html:141-143`, `app.js:4131-4140`.

Текущий текст  
— `SOURCE_STATUS: READING`; `SOURCE_STATUS: RECOVERED`.

Проблема  
— Системный стиль последовательный, но для обычного пользователя это выглядит как техническое поле, не как подпись. Не ошибка, если это утверждённый archival voice.

Предлагаемая редакция  
— Не менять без решения. Возможная мягкая версия: `STATUS: READING`; `STATUS: RECOVERED`.

Приоритет  
— P3.

Требуется решение автора  
— да.

Статус  
— авторское решение.

### 14. Search results — `UNKNOWN` может быть прочитан как неизвестный тип

Экран / узел  
— Search dialog.

Файл и строка  
— `app.js:4271`.

Текущий текст  
— `TYPE / DISCOVERED` или `TYPE / UNKNOWN`.

Проблема  
— `UNKNOWN` означает «ещё не discovered», но может восприниматься как неизвестная сущность или неизвестный источник.

Предлагаемая редакция  
— `TYPE / LATENT` или `TYPE / NOT DISCOVERED`.

Приоритет  
— P2.

Требуется решение автора  
— нет, если принять термин `LATENT`.

Статус  
— нужно исправить позднее.

### 15. BOOKS index — `CANON / 06` может читаться как номер книги, а не количество частей

Экран / узел  
— BOOKS index topbar.

Файл и строка  
— `books/index.html:17`.

Текущий текст  
— `BOOKS`; `CANON / 06`.

Проблема  
— На отдельных книгах `CANON / P`, `CANON / −I`, `CANON / 00`, `CANON / I`, `CANON / II`, `CANON / ∞` обозначает текущую часть. На index `CANON / 06` может быть прочитано как «шестая книга».

Предлагаемая редакция  
— `CANON / 6 PARTS` или `CANON / ROUTE 06`.

Приоритет  
— P3.

Требуется решение автора  
— да.

Статус  
— авторское решение.

### 16. BOOKS manifest — роль `Кода`

Экран / узел  
— BOOKS route item `epilogue`.

Файл и строка  
— `books/manifest.json:201-207`.

Текущий текст  
— `role: "Кода"`.

Проблема  
— Может быть музыкальным термином «кода», но визуально похоже на опечатку от «Код». Нужна авторская фиксация, чтобы редактор не «исправил» случайно.

Предлагаемая редакция  
— Если термин утверждён: оставить и добавить в финальный style guide. Если нет: `Эпилог`.

Приоритет  
— P3.

Требуется решение автора  
— да.

Статус  
— авторское решение.

### 17. BOOKS generator — fallback `Текст` всё ещё существует

Экран / узел  
— BOOKS rubricator generation.

Файл и строка  
— `scripts/build-books.mjs:234-237`.

Текущий текст  
— `Текст`.

Проблема  
— C4.3.1 убрал общий пункт «Текст» из ключевых книг через presentation-only headings, и generated pages сейчас валидны. Но fallback остался в генераторе и может вернуться на новой книге без H2.

Предлагаемая редакция  
— Заменить fallback на более точный `Основной текст` либо требовать явных presentation sections для всех route pages.

Приоритет  
— P2.

Требуется решение автора  
— нет.

Статус  
— нужно исправить позднее в BOOKS build layer.

### 18. RELICS CTA — `OPEN TRANSITION ARCHIVE` не указывает, что это standalone experience

Экран / узел  
— `RELICS`.

Файл и строка  
— `app.js:4195-4202`.

Текущий текст  
— `ARCHIVE EXPERIENCE`; `OPEN TRANSITION ARCHIVE →`.

Проблема  
— Переход открывается в той же вкладке и уводит из карты. Текст корректен, но не предупреждает о смене режима.

Предлагаемая редакция  
— `OPEN TRANSITION ARCHIVE →` оставить, но рядом/aria добавить `standalone experience`.

Приоритет  
— P3.

Требуется решение автора  
— да.

Статус  
— авторское решение.

### 19. 0xMEM CTA — `EXPAND REACTOR` последовательный, но англоязычный

Экран / узел  
— `0xMEM`.

Файл и строка  
— `app.js:4118-4126`, `experiences/0xmem-reactor/index.html:315-322`.

Текущий текст  
— `EXPAND REACTOR →`; `← BACK TO NETWORK TRACE`; `0xMEM / Initialising reactor`.

Проблема  
— Последовательно с machine UI, но смешано с русским reader. Не ошибка.

Предлагаемая редакция  
— Не менять без решения. Возможный вариант: `РАЗВЕРНУТЬ РЕАКТОР →`.

Приоритет  
— P3.

Требуется решение автора  
— да.

Статус  
— авторское решение.

### 20. Archive Transition — `53 RELICS` против graph RELICS count

Экран / узел  
— Standalone Archive Transition.

Файл и строка  
— `experiences/archive-transition/index.html:385`, `experiences/archive-transition/index.html:415`.

Текущий текст  
— `53 RELICS`; `53 RELICS / CONDITIONS RECORDED`.

Проблема  
— Внутри experience это может быть собственная музейная статистика, но рядом с картой `RELICS` filter содержит 7 graph nodes. Пользователь может счесть это расхождением счётчиков.

Предлагаемая редакция  
— Если 53 — число внутренних объектов, уточнить: `53 ARCHIVE OBJECTS` или `53 TRANSITION RELICS`.

Приоритет  
— P2.

Требуется решение автора  
— да.

Статус  
— авторское решение.

### 21. Archive Transition — `UNDER RECONSTRUCTION`

Экран / узел  
— Standalone Archive Transition.

Файл и строка  
— `experiences/archive-transition/index.html:385`.

Текущий текст  
— `UNDER RECONSTRUCTION`.

Проблема  
— Может выглядеть как техническая незавершённость сайта, хотя, вероятно, является стилизованным early-web артефактом.

Предлагаемая редакция  
— Если это diegetic text — оставить. Если нет — `ARCHIVE RECONSTRUCTION MODE`.

Приоритет  
— P3.

Требуется решение автора  
— да.

Статус  
— авторское решение.

### 22. Archive Transition — внутреннее меню `File Reading Damage Technopriest`

Экран / узел  
— Standalone Archive Transition record modal.

Файл и строка  
— `experiences/archive-transition/index.html:534`.

Текущий текст  
— `File   Reading   Damage   Technopriest`.

Проблема  
— Стилистически соответствует Windows 95 / early web артефакту, но `Technopriest` как singular рядом с меню-командами может выглядеть случайным.

Предлагаемая редакция  
— Diegetic: оставить. Уточнённый вариант: `File   Reading   Damage   Techno-priests`.

Приоритет  
— P3.

Требуется решение автора  
— да.

Статус  
— авторское решение.

### 23. HISTORY text — структура и фактическая навигация совпадают

Экран / узел  
— HISTORY / PRE-ERROR и HISTORY / NEWEST.

Файл и строка  
— `app.js:1160-1168`, `app.js:1171-1186`, validation output.

Текущий текст  
— `ЭПОХА ПЕРЕГРУЗКИ`, `ЭПОХА СЕТИ`, `КВАНТОВЫЙ ПРЕДЕЛ`, `INFORMATION ↔ ENERGY`, `БИОКОД`, `АВТОНОМНЫЕ ПРОЦЕССЫ`, `ТРИ ПУТИ ЭВОЛЮЦИИ`.

Проблема  
— Ошибок по тексту не найдено. Групповые подписи не заменяют реальные узлы; validator подтверждает HISTORY membership `17`.

Предлагаемая редакция  
— Без изменений.

Приоритет  
— P0.

Требуется решение автора  
— нет.

Статус  
— ok.

### 24. BOOKS — desktop/mobile рубрикатор синхронизирован

Экран / узел  
— BOOKS generated reader pages.

Файл и строка  
— `books/genesis/index.html:35`, `books/genesis/index.html:84`, `scripts/build-books.mjs:49-66`, `scripts/build-books.mjs:522-552`.

Текущий текст  
— `РУБРИКАТОР`, `АРХИВНЫЙ АППАРАТ`, `КЛЮЧЕВЫЕ ПОНЯТИЯ`; presentation-only H2 для пролога, «Книги бытия», «Эпилога Архива».

Проблема  
— Несовпадений desktop/mobile в текущей generated-разметке не найдено; validator подтверждает `presentationStructureValid: true`.

Предлагаемая редакция  
— Без изменений.

Приоритет  
— P0.

Требуется решение автора  
— нет.

Статус  
— ok.

### 25. Registry — точных дублей body + sourceMarkdown для ключевых хроник не найдено

Экран / узел  
— `PRE_ERROR_ARCHIVE`, `EPSILON_00`, `EPSILON_01`, `EPSILON_02`, `EPSILON_06`, `PROBABILISTS`, `BIOCODE`.

Файл и строка  
— `app.js` registry records; canonical Markdown in `assets/canonical-markdown/` and `assets/pre-error-archive/`.

Текущий текст  
— Full canonical text хранится в `sourceMarkdown`; body для проверенных canonical cards пустой или краткий, где это предусмотрено.

Проблема  
— Повторного вывода полного canonical-текста через `body + sourceMarkdown` в текущем состоянии не обнаружено.

Предлагаемая редакция  
— Без изменений.

Приоритет  
— P0.

Требуется решение автора  
— нет.

Статус  
— ok.

## Итоговые счётчики аудита

- Проверенных текстовых элементов: 238.
- Ошибок / расхождений, требующих исправления без авторского решения: 10.
- Технических заглушек или debug-like строк: 6.
- Дублирующихся формулировок, требующих правки: 0.
- Дубли-мотивы, сохранённые как намеренный стиль: `Время измеряется в ошибках / time = Σ error`, `SOURCE_STATUS`, `TRACE`.
- Несовпадения desktop/mobile: 0 подтверждённых; BOOKS validator подтверждает mobile/desktop navigation contract.

## Формулировки, требующие решения автора

- Оставлять ли английский machine voice в глобальных командах и фильтрах (`ARCHIVE ENTRY`, `SEARCH`, `ALL`, `WORLD`, etc.) или локализовать.
- Оставлять ли raw archival labels `SOURCE_STATUS`, `REACTOR_OBJECT`, `ARCHIVE_OBJECT`.
- Нужна ли мягкая пользовательская версия empty lens / no next node messages.
- Что означает `CANON / 06` на BOOKS index: количество частей или route marker.
- `Кода` в BOOKS manifest: утверждённый музыкальный термин или заменить на `Эпилог`.
- `53 RELICS` в Archive Transition: внутренние реликвии experience или конфликт с graph `RELICS`.
- Оставлять ли `UNDER RECONSTRUCTION` как diegetic early-web объект.

## Production-файлы, которые потребуется изменить позднее

- `README.md`
- `docs/STATE.md`
- `docs/CANON_MAP.md`
- `index.html`
- `app.js`
- `scripts/build-books.mjs`
- `books/manifest.json`
- generated `books/*.html` через `npm run build:books`
- `experiences/archive-transition/index.html`, если автор решит уточнить музейные счётчики
- `experiences/0xmem-reactor/index.html`, только если автор решит локализовать CTA/loading

## Проверки

- `node scripts/validate-navigation.mjs` — PASS.
- `npm run validate:books -- --summary` — PASS.
- Валидационная фактура: `records: 93`, `graphNodes: 52`, `pageOnlyRecords: 41`, `mediaMissing: []`, `duplicateIds: []`, `brokenWorldAxis: []`, `worldNavigation.items: 5`, `historyMembership.items: 17`.
