# Bogobot — content final candidates

Режим: CONTENT AUDIT.
Этот файл не применяет правки к production. Он фиксирует безопасный редакционный backlog после аудита `docs/BOGOBOT_CONTENT_AUDIT.md`.

## Короткий вывод

Канонические тексты BOOKS и HISTORY в текущем состоянии структурно валидны. Главный риск — не в художественном тексте, а в рассинхроне служебных документов и нескольких интерфейсных строках, где старые счётчики или debug-like формулировки могут противоречить фактической навигации.

## Редакции, которые можно внести без авторского решения

### A. README counts

Экран / узел
— Project README.

Файл и строка
— `README.md:9`.

Текущий текст
— `34 узла графа, 2 page-only страницы, 36 записей всего;`

Проблема
— Устаревшие счётчики.

Предлагаемая редакция
— `52 узла графа, 41 page-only запись, 93 записи всего;`

Приоритет
— P1.

Требуется решение автора
— нет.

Статус
— ready for implementation.

### B. STATE current implementation

Экран / узел
— Project docs.

Файл и строка
— `docs/STATE.md:58-60`.

Текущий текст
— `Данные 34 узлов графа, 2 page-only страниц, связи и интерактивность: app.js.`

Проблема
— Устаревшие счётчики в актуальном разделе.

Предлагаемая редакция
— `Данные 52 узлов графа, 41 page-only записи, связи и интерактивность: app.js.`

Приоритет
— P1.

Требуется решение автора
— нет.

Статус
— ready for implementation.

### C. CANON_MAP TOPOGRAPHY title

Экран / узел
— `TOPOGRAPHY`.

Файл и строка
— `docs/CANON_MAP.md:43`.

Текущий текст
— `Топография сети`

Проблема
— Не совпадает с runtime title.

Предлагаемая редакция
— `Топография мира сети`

Приоритет
— P1.

Требуется решение автора
— нет.

Статус
— ready for implementation.

### D. CANON_MAP GLOSSARY status

Экран / узел
— `GLOSSARY`.

Файл и строка
— `docs/CANON_MAP.md:47`.

Текущий текст
— `page-only; единый лексикон без отдельных term page ID`

Проблема
— `GLOSSARY` уже graph hub node.

Предлагаемая редакция
— `graph hub; единый лексикон без отдельных term graph nodes`

Приоритет
— P1.

Требуется решение автора
— нет.

Статус
— ready for implementation.

### E. MAP fallback progress

Экран / узел
— MAP status fallback.

Файл и строка
— `index.html:95-97`.

Текущий текст
— `DISCOVERED: 1 / 20`

Проблема
— Устаревший fallback до runtime render.

Предлагаемая редакция
— `DISCOVERED: — / —`

Приоритет
— P2.

Требуется решение автора
— нет.

Статус
— ready for implementation.

### F. Search undiscovered status

Экран / узел
— Search results.

Файл и строка
— `app.js:4271`.

Текущий текст
— `UNKNOWN`

Проблема
— Может читаться как неизвестный тип/источник, а не undiscovered state.

Предлагаемая редакция
— `LATENT`

Приоритет
— P2.

Требуется решение автора
— нет.

Статус
— ready for implementation, если `LATENT` принят как стандарт.

### G. BOOKS generator fallback

Экран / узел
— BOOKS rubricator fallback.

Файл и строка
— `scripts/build-books.mjs:234-237`.

Текущий текст
— `Текст`

Проблема
— Может вернуть абстрактный пункт в будущих generated pages.

Предлагаемая редакция
— `Основной текст` или обязательные explicit presentation sections для каждой route page.

Приоритет
— P2.

Требуется решение автора
— нет.

Статус
— ready for implementation, предпочтительно через build contract.

## Редакции, требующие авторского решения

### H. Machine voice language contract

Экран / узел
— MAP commands and filters.

Файл и строка
— `index.html:61-65`, `index.html:110-114`, `app.js:1172-1180`.

Текущий текст
— `ARCHIVE ENTRY`, `BOOKS`, `SEARCH`, `RANDOM NODE`, `SIGNAL`, `ALL`, `CANON`, `WORLD`, `SCHOOLS`, `GLOSSARY`, `TOPOGRAPHY`, `HISTORY`, `RELICS`.

Проблема
— Нужно решить: это утверждённый машинный интерфейс или временная англоязычная разметка.

Предлагаемая редакция
— Если локализовать: `АРХИВ`, `КНИГИ`, `ПОИСК`, `СЛУЧАЙНЫЙ УЗЕЛ`, `СИГНАЛ`, `ВСЁ`, `КАНОН`, `МИР`, `ШКОЛЫ`, `ЛЕКСИКОН`, `ТОПОГРАФИЯ`, `ИСТОРИЯ`, `РЕЛИКВИИ`.

Приоритет
— P3.

Требуется решение автора
— да.

Статус
— blocked by author decision.

### I. Empty lens status

Экран / узел
— Empty graph lens.

Файл и строка
— `app.js:2491-2494`.

Текущий текст
— `NO RECORDS IN THIS MAP MODE / CURRENT NODE PRESERVED AS CONTEXT`; `NO DISCOVERED NODES IN THIS LENS / CURRENT NODE PRESERVED AS CONTEXT`.

Проблема
— Debug-like visible copy.

Предлагаемая редакция
— `В этом режиме пока нет открытых узлов. Текущий узел сохранён как контекст.`

Приоритет
— P2.

Требуется решение автора
— да.

Статус
— blocked by author decision.

### J. Reader media status

Экран / узел
— Reader media captions.

Файл и строка
— `index.html:143`, `app.js:4131-4140`.

Текущий текст
— `SOURCE_STATUS: READING`; `SOURCE_STATUS: RECOVERED`.

Проблема
— Системное поле может быть как diegetic archival style, так и лишняя техничность.

Предлагаемая редакция
— `STATUS: READING`; `STATUS: RECOVERED` или оставить без изменений.

Приоритет
— P3.

Требуется решение автора
— да.

Статус
— blocked by author decision.

### K. BOOKS index marker

Экран / узел
— BOOKS index.

Файл и строка
— `books/index.html:17`.

Текущий текст
— `CANON / 06`

Проблема
— Может выглядеть как шестая книга, а не шесть частей.

Предлагаемая редакция
— `CANON / 6 PARTS` или `CANON / ROUTE 06`.

Приоритет
— P3.

Требуется решение автора
— да.

Статус
— blocked by author decision.

### L. Epilogue role

Экран / узел
— BOOKS route `epilogue`.

Файл и строка
— `books/manifest.json:206`.

Текущий текст
— `Кода`

Проблема
— Может быть утверждённым термином, но выглядит как возможная опечатка.

Предлагаемая редакция
— Оставить и зафиксировать в style guide либо заменить на `Эпилог`.

Приоритет
— P3.

Требуется решение автора
— да.

Статус
— blocked by author decision.

### M. Archive Transition relic count

Экран / узел
— Archive Transition experience.

Файл и строка
— `experiences/archive-transition/index.html:385`, `experiences/archive-transition/index.html:415`.

Текущий текст
— `53 RELICS`; `53 RELICS / CONDITIONS RECORDED`.

Проблема
— Возможный конфликт с graph `RELICS` count, где реально 7 graph nodes.

Предлагаемая редакция
— `53 TRANSITION RELICS` или `53 ARCHIVE OBJECTS`.

Приоритет
— P2.

Требуется решение автора
— да.

Статус
— blocked by author decision.

## Что не требует правок по итогам аудита

- Все 52 graph nodes существуют и проходят navigation validation.
- HISTORY / PRE-ERROR и HISTORY / NEWEST используют фактические graph memberships; текстовые подписи эпох не противоречат наличию кликабельных узлов.
- WORLD сейчас содержит 5 graph nodes; `TOPOGRAPHY` входит в WORLD и TOPOGRAPHY.
- BOOKS route содержит ровно 6 частей: `P → −I → 00 → I → II → ∞`.
- `Фрагмент Откровения` остаётся секцией пролога, не route item.
- `FIRST_LIKENESS` после «Книги бытия» остаётся optional RELATED без `href`.
- Полный «Апокриф Первого Подобия» не вставлен в BOOKS.
- Desktop/mobile BOOKS rubricator synchronized by generated markup.
- Повторного вывода canonical текста через `body + sourceMarkdown` для проверенных хроник не обнаружено.

## Итоговый change backlog

Файлы для будущего минимального content-fix пакета:

1. `README.md`
2. `docs/STATE.md`
3. `docs/CANON_MAP.md`
4. `index.html`
5. `app.js`
6. `scripts/build-books.mjs`
7. `books/manifest.json`
8. generated `books/` после build, если меняется manifest/build layer
9. `experiences/archive-transition/index.html`, только после авторского решения

## Финальные счётчики аудита

- Проверенных текстовых элементов: 238.
- Ошибок / расхождений: 10.
- Технических заглушек или debug-like строк: 6.
- Дублей, требующих удаления: 0.
- Формулировок, требующих решения автора: 7.

## Контрольные проверки, использованные в аудите

- `node scripts/validate-navigation.mjs` — PASS.
- `npm run validate:books -- --summary` — PASS.
- Фактические счётчики: `records 93`, `graph nodes 52`, `page-only records 41`, `mediaMissing []`, `world navigation 5`, `history membership 17`, `BOOKS generated pages 7`.
