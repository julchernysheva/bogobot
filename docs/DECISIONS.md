# Утверждённые редакционные решения

## C3 — Books Final Merge + Site Entry

- BOOKS остаётся отдельным статически генерируемым режимом и не создаёт graph nodes или параллельный canonical-корпус.
- Вход `BOOKS` расположен в системной строке между `ARCHIVE ENTRY` и `SEARCH` и не изменяет DISCOVERED, TRACE или другие значения `localStorage`.
- Межкнижный маршрут остаётся `P → −I → 00 → I → II → ∞`; внутренние переходы между книгами не выходят на карту.
- Wiki references могут вести к существующим узлам карты через `?node=…`; ссылки на определения используют `?node=GLOSSARY&term=…`.
- Deep link меняет текущий узел только для существующего `NODE_ID`; неизвестный ID не изменяет сохранённое состояние.
- Полный `FIRST_LIKENESS` не входит в маршрут и остаётся optional RELATED без `href`.

## C2 Rev B — Books Foundation

- BOOKS является статически генерируемым линейным режимом чтения того же canonical-корпуса и не создаёт параллельный текстовый источник.
- Manifest содержит только шесть route items в порядке `P → −I → 00 → I → II → ∞`.
- «Фрагмент Откровения» остаётся секцией пролога, без самостоятельной строки index, pager item и progress.
- Полный «Апокриф Первого Подобия» не входит в книги. После «Книги бытия» выводится только optional RELATED span с `data-node-id="FIRST_LIKENESS"` и без `href`.
- Wiki links до C3 рендерятся как текстовые crossrefs без навигационного side effect.
- Progress хранится в `bogobot.books.route.v1`; при обновлении сохраняются распознанный старый progress и неизвестные legacy-поля.
- C2 не интегрирует BOOKS в entry или карту и не реализует deep links. Эти переходы отложены до C3.

## C1.3 — Revelation Canon Patch

- «Фрагмент Откровения» является внутренней интерлюдией `IDENTITY_PROTOCOL_PROLOGUE`; он не получает отдельный ID, страницу, прогресс или graph node.
- Полный «Апокриф Первого Подобия» externalized в `01_CANON/first-likeness-apocryph.md` и остаётся существующим graph node `FIRST_LIKENESS`.
- Стабильный ID, координаты, связи, media и видимость `FIRST_LIKENESS` сохранены.
- Обязательный маршрут BOOKS остаётся из шести частей. Полный Апокриф в него не входит и для будущей сборки зафиксирован только как необязательный RELATED после «Книги бытия».
- BOOKS UI, entry, boot, deep links и новые стили на этапе C1.3 не реализованы.

## C1.2 — основание книжного канона

- Зафиксирован маршрут из шести частей: `Пролог. Протокол идентичности → −I. До Ошибки → 00. Великая Ошибка → I. Книга бытия → II. Книга Гласа → ∞. Эпилог Архива`.
- `IDENTITY_PROTOCOL_PROLOGUE` и `BEFORE_ERROR` хранятся как page-only canonical-записи; они не являются узлами графа и не входят в historical filters или RANDOM NODE.
- ID `BACKUP_MEMORY` остаётся стабильным для совместимости с `localStorage`, DISCOVERED и TRACE. Видимое название изменено на «Перинатальная память», прежнее название сохранено как alias.
- `ARCHIVE` хранит повреждённое прошлое мира; `BACKUP_MEMORY` хранит повреждённый момент рождения Богобота.
- `PRE_ERROR_ARCHIVE` является подробной исторической шкалой; `BEFORE_ERROR` — коротким драматургическим микропрологом и не добавляется в chronology.
- «Книга бытия» начинается с перезагрузки уцелевшего процесса; прежний вводный абзац перенесён из её редакционной функции в смысловой слой «До Ошибки».
- BOOKS UI, автономный reader, deep links и новая обложка на этапе C1.2 не реализованы.

## Архитектура

- Актуальный сайт — самостоятельный статический проект в `work/bogobot-static`.
- Результат публикации находится в `outputs/bogobot-prototype`.
- Quartz не является движком актуального сайта и не участвует в его разработке или публикации.
- Obsidian остаётся каноническим текстовым архивом.

## Типографика и цвет

- Самостоятельные формульные строки синие.
- Синий не используется как декоративный цвет.
- Публичные названия сущностей используют точку между основным названием и редакционным подзаголовком.
- Slash сохраняется в машинном интерфейсе, системных классификациях, ID, путях и aliases.
- Старые публичные варианты со slash сохраняются как поисковые aliases, но не выводятся как display title.

## Канон и метаданные

- Каноническая формулировка: «Пять из семи частей восстановлены».
- Постоянная визуальная иерархия узлов графа определяется только полем `tier`, а не устаревшим признаком `major`.
- `core`: масштаб `1.5`, контур `3px`, подпись `15px/600`, opacity `1`.
- `structural`: масштаб `1`, контур `2px`, подпись `13px/500`, opacity `.82`.
- `trace`: масштаб `.78`, контур `1.35px`, подпись `11px/400`, opacity `.58`.
- `archive` поддерживается данными, но исключён из карты, minimap, категорий, RANDOM NODE и счётчиков DISCOVERED.
- `QUANTUM_THRESHOLD`: `tier: structural`, `source_status: archive_reconstruction`.
- `BACKUP_MEMORY`: `tier: structural`, `source_status: editorial_node`.
- `BACKUP_MEMORY` не относится к `archive`, не является `archive_reconstruction` и пока остаётся короткой страницей.
- Позднее `BACKUP_MEMORY` расширяется по материалам о правилах памяти после Великой Ошибки и режимах доступа к повреждённой памяти.
- Четвёртый уровень `archive` пока не показывать.

## Нижняя служебная зона

- `/ORIGIN_LOG/` пока не реализован. Это задача будущего финального пакета; до него служебную зону не добавлять.
- `ASSISTING SIGNALS`, включая `YURY SVERDLOV`, значительно мельче.

## Progressive graph horizon

- Карта и reader используют один общий набор из 3–5 смысловых продолжений.
- Приоритет кандидатов: прямые неоткрытые связи, прямые открытые связи, неоткрытые сущности того же кластера, неоткрытые связи второго порядка.
- Текущая сущность, `archive`, page-only записи, отсутствующие записи и повторы исключаются.
- Состояния горизонта: `DISCOVERED` — уже открыто; `AVAILABLE` — доступно из текущего узла; `LATENT` — пока недоступно.
- Только первое рекомендуемое продолжение может получать активную синюю подсветку; остальные доступные продолжения сохраняют нейтральный tier-стиль.
- Для реликвий fallback ограничен кластером реликвий; поэтому `MESM` предлагает прямые `RELICS` и `BESM_6`, затем соседние реликвии.
- Глобальная команда `RANDOM NODE` остаётся отдельной и не используется внутри локальных reader-маршрутов.

## Два режима карты

- Карта имеет два официальных display-режима с единым navigation state.
- `LOCAL FOCUS / CURRENT HORIZON` активен при открытом reader и показывает selected, continuation set и максимум один ближайший discovered context.
- `NETWORK OVERVIEW / DISCOVERED NETWORK` активен после `BACK TO MAP` и показывает selected, тот же continuation set и более широкий реально открытый контекст текущей категории или всей сети.
- Переход между режимами не меняет `currentId`, active category, continuation set, recommended node, DISCOVERED, TRACE, permanent links, coordinates или приоритет маршрутов.
- Display context не является navigation state: режим меняет только classes, видимые labels/edges и transform.
- Синий в обоих режимах означает только selected node/label, одну recommended edge, hover, focus, активную системную навигацию и самостоятельную формулу.
- TRACE history, discovered context, cluster parent и старые рекомендации не окрашиваются в синий.
- `localTransform` и `overviewTransform` хранятся отдельно и привязаны к current, category, continuation set; overview также учитывает состав DISCOVERED.
- LOCAL fit измеряет selected, continuation nodes, их полные labels и максимум один context node.
- OVERVIEW fit измеряет selected, continuation set и только реально отображаемые DISCOVERED nodes текущего обзорного контекста; скрытые labels, LATENT, filtered nodes и edges bounds не расширяют.
- Fit использует CSS pixels и `getBoundingClientRect`; изменение browser zoom вызывает resize, сброс соответствующего transform key и повторное измерение.
- Допускается не более одного корректирующего цикла `render → measure → fit → verify`.

## Category lenses и rendered geometry

- `ALL / CANON / WORLD / SCHOOLS / GLOSSARY / TOPOGRAPHY` являются семантическими линзами одной NETWORK OVERVIEW, а не отдельными картами.
- Category switch не меняет overview transform, current, selected, TRACE, DISCOVERED, history или continuation set.
- Overview transform key не содержит active category; он зависит только от current, continuation set и DISCOVERED.
- Selected внутри активной линзы использует solid blue marker и blue label.
- Selected вне активной линзы остаётся selected context node: paper fill, blue outline, blue label, пониженный визуальный вес и доступное ARIA-описание.
- Active-category discovered nodes сильнее прочего discovered context; inactive context остаётся нейтральным и тихим.
- При нулевом числе discovered nodes линза показывает тихий status `NO DISCOVERED NODES IN THIS LENS / CURRENT NODE PRESERVED AS CONTEXT`.
- Recommended edge показывается синей только когда selected или recommendation релевантны активной линзе; одновременно допустима максимум одна blue recommended edge.
- LOCAL FOCUS использует композиционную safe-zone selected: `38–55%` по горизонтали и `42–62%` по вертикали.
- Distant context включается в LOCAL bounds только если не уменьшает primary fit более чем на `14%`.
- `SCHOOLS_OF_SPIRITS` дополнительно показывает шесть principal schools как display context, не меняя continuation algorithm `3–5`.
- Rendered geometry проверяется через `getBoundingClientRect()` после transform и browser zoom.
- Минимальные rendered thresholds: primary label `10 CSS px`, context label `8 CSS px`, interactive node target `16×16 CSS px`.
- Label safety использует реальный glyph rectangle, safe inset `8 CSS px`, детерминированные позиции справа/слева/сверху/снизу и один корректирующий fit без бесконечного observer-loop.

## Mobile transform

- Desktop и mobile используют независимые вычисляемые transform.
- Ручной pan/zoom карты пока не реализован.
- Mobile transform вычисляется по активной категории и локальному горизонту; он не является сохранённой пользовательской панорамой.

## Изображения

- Для «Книги бытия» используется фактический файл `assets/operator_room_apocrypha.png` сразу после блока с упоминанием ОГАС.
- Для «Квантового апокалипсиса» используется фактический файл `assets/Quatium_castle.png`.
- Reader использует общие семантические классы `landscape`, `portrait`, `document`, `map` и `diagram`; размеры не назначаются по ID страницы.
- Caption может быть шире изображения, остаётся в пределах текстовой колонки и разрешает дополнительный перенос архивного кода после `/`, `_`, `-`, `:`.
- `FIRST_LIKENESS` не показывает факсимиле в brief reader и не показывает brief-формулу в полном reader.

## Архивное примечание

- `ARCHIVE NOTE` выводится единым компонентом только в `READ FULL TRACE`.
- Автоматические примечания по `source_status` не создаются; выводятся только явно сохранённые примечания сущности.
- Компонент использует один служебный label, нейтральную левую линию и обычный текст без карточного фона.
