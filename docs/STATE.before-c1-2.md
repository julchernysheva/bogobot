# Текущее состояние

Дата фиксации: 2026-06-21.

## Актуальный проект

- Тип: самостоятельный статический сайт на HTML, CSS и JavaScript.
- Редактируемый источник: `work/bogobot-static`.
- Публикуемая версия: `outputs/bogobot-prototype`.
- Резервная копия исходного рабочего сайта: `outputs/bogobot-prototype-backup-2026-06-21`.
- Obsidian используется как канонический текстовый архив.
- Quartz-проект `work/bogobot-prototype` является отдельным устаревшим прототипом и не должен изменяться в рамках этого сайта.

## Текущая реализация

- Основная разметка: `index.html`.
- Данные 34 узлов графа, 2 page-only страниц, связи и интерактивность: `app.js`.
- Общие стили и адаптивность: `styles.css`.
- Локальные изображения: `assets/`.
- Исходная миграция выполнена без изменения дизайна, контента и поведения.
- Файлы сайта в рабочей копии побайтово совпадают с версией, которая была опубликована до миграции.

## Стабилизация системной геометрии

- Технический этап выполнен в `work/bogobot-static` без публикации в `outputs`.
- Глобальные команды сохраняют полные названия и при недостатке ширины прокручиваются только внутри своей строки.
- Локальный reader-header сохраняет все команды и при недостатке ширины прокручивается только внутри своей строки.
- Логотип получил фиксированную flex-базу и не сжимается.
- Reader-контейнер локализует собственное переполнение.
- Компактные изображения больше не растягиваются до полной ширины; сохраняются пропорции и естественный размер в пределах контейнера.
- Длинные архивные подписи безопасно переносятся внутри своей ширины.
- Данные, связи, координаты, масштаб и логика графа не изменялись; `app.js` не изменён.
- Сервер предварительного просмотра на `127.0.0.1:4175` запущен из `work/bogobot-static`.
- В этой сессии автоматизированный браузерный рендер был недоступен; финальный визуальный проход на 375 и 1440 px остаётся ручной проверкой.
- Прямое открытие `/` всегда оставляет входной экран активным; автоматический пропуск через `sessionStorage` удалён.
- Логотип `БОТ` возвращает на входной экран без изменения `localStorage` и прогресса `DISCOVERED`.
- `NEXT TRACE` переходит к первому смысловому продолжению; полный текст открывает только `READ FULL TRACE`.
- `BACK TO MAP` доступен в обычном и расширенном reader-режиме на всех поддерживаемых ширинах.

## Финальная техническая проверка перед пакетом 2

- Входной экран и знак `БОТ`: проверены по разметке, стилям и исходному изображению.
- `ENTER THE NETWORK`: проверены обработчик, hover, focus-visible, active, pointer и переход 150 ms.
- Логотип: возвращает на вход без изменения ключей `bogobot.current`, `bogobot.discovered`, `bogobot.trace`, `bogobot.sound`.
- Навигация и reader-header: полные названия сохранены; переполнение локализовано в соответствующих строках.
- Смена категории не создаёт reader-панели и не добавляет offset или transform.
- Массив узлов, связи и координаты побайтово соответствуют резервной версии.
- `index.html` соответствует резервной версии; опубликованный `outputs/bogobot-prototype` не изменялся.
- Ручная проверка 375 и 1440 px завершена пользователем: PASS.
- Логика категорий зафиксирована: `ALL` и категория активного узла сохраняют reader; несовместимая категория закрывает reader и снимает активное выделение.
- Закрытие reader не изменяет `state.current`, `DISCOVERED`, trace или ключи `localStorage`.
- Переключение категории больше не вызывает `focusCluster()` и не сбрасывает внутренний transform карты.
- Возврат к прежней категории не открывает закрытый reader автоматически.
- Программная проверка сценариев категорий:
  - `BOGOBOT → WORLD`: reader закрывается — PASS;
  - `BOGOBOT → SCHOOLS`: reader остаётся — PASS;
  - `CANON → CANON`: reader остаётся — PASS;
  - `CANON → TOPOGRAPHY`: reader закрывается — PASS;
  - `любой узел → ALL`: открытый reader сохраняется — PASS.
- Синтаксис JavaScript и структура CSS проверены.
- Горизонтальный overflow отсутствует; вход, логотип, навигация, reader и смена категорий работают корректно.
- Итоговый технический статус: `READY FOR PACKAGE 2`.

## Пакет 2 — карта канона и метаданные

- Пакет 2 выполнен 2026-06-21.
- Проведён один структурный обход доступной копии Obsidian-архива `work/vault-extract-2/05_Богобот`: использованы только пути, frontmatter, первые заголовки и wiki-ссылки.
- На этапе пакета 2 `docs/CANON_MAP.md` содержал 29 сущностей и фиксировал два отсутствующих маршрута: `PROTOCOL`, `ARCHIVE`; они добавлены в пакете 4B.
- Каждому текущему узлу добавлены независимые поля `tier` и `source_status`.
- В схеме данных предусмотрены `core`, `structural`, `trace`, `archive`; `archive` не подключён к визуальному слою.
- `QUANTUM_THRESHOLD`: `tier: structural`, `source_status: archive_reconstruction`.
- `BACKUP_MEMORY`: `tier: structural`, `source_status: editorial_node`.
- Узлы, связи, координаты, типы, маршруты, масштаб и визуальная логика не изменены.
- `CSS`, `index.html`, тексты, изображения, Obsidian и `outputs/bogobot-prototype` не изменялись.

## Пакет 2B — нормализация карты канона

- Пакет 2B выполнен 2026-06-21 без повторного обхода архива.
- Реальных дублей основных ID сайта не обнаружено.
- Группы документов разделены на основные источники, определения, варианты, приложения, redirects и дочерние сущности.
- Для `PROTOCOL` выбран основной источник `01_CANON/book-3-protocol.md`; узел создан в пакете 4B.
- Для `ARCHIVE` выбран основной источник `04_GLOSSARY/archive.md`; узел создан в пакете 4B, неоднозначные нарративная, лексическая и интерфейсная функции разделены.
- `BACKUP_MEMORY` остаётся утверждённым редакционным узлом и не считается ошибкой канона.
- `HUMAN_TRACE` сохранён как самостоятельный `trace / editorial_node`, подчинённый `BACKUP_MEMORY`.
- Зафиксированы восемь отсутствующих дочерних локаций `TOPOGRAPHY`; новые узлы не создавались.
- Проверка `app.js`: пакет 2 изменил в блоке данных только `tier`, `source_status` и декларацию схемы `graphSchema`.
- После удаления новых метаданных узлы, порядок, категории, координаты, связи, тексты и изображения совпадают с резервной версией.
- Изменения reader, входа и категорий в сравнении с резервной версией относятся к техническому этапу до пакета 2 и не откатывались.
- В пакете 2B `app.js` не изменялся.

## Пакет 3 — изображения, реликвии и подписи

- Пакет 3 выполнен 2026-06-21 без публикации в `outputs`.
- Renderer поддерживает общие режимы `full`, `compact`, `portrait`, `relic`, `diagram`.
- Все 16 подключённых изображений получили режим на уровне данных узла.
- Figure, изображение и подпись используют одну левую ось; автоматическое центрирование компактных изображений удалено.
- Компактные изображения ограничены `24rem`, портреты `30rem`, реликвии `38rem`, диаграммы `42rem`; `full` ограничен reader-контейнером.
- Пропорции сохраняются через `height: auto`, `max-width: 100%` и `object-fit: contain`.
- Длинные подписи переносятся внутри ширины figure.
- `BOOK_OF_GENESIS` использует утверждённый `assets/operator_room_apocrypha.png` после первого абзаца с упоминанием ОГАС.
- `QUANTUM_THRESHOLD` использует утверждённый `assets/Quatium_castle.png`.
- Узлы, связи, координаты, категории, `tier`, `source_status`, zoom, transform, localStorage и reader-переходы не изменялись.
- `index.html`, Obsidian и `outputs/bogobot-prototype` не изменялись.

## Завершение пакета 3

- Утверждённые файлы найдены в `work/vault-extract-2/05_Богобот/07_VISUAL_SYSTEM/04_REFERENCE_EFFECTS/Image/`.
- `operator_room_apocrypha.png` скопирован в `assets` и подключён только к `BOOK_OF_GENESIS`.
- `Quatium_castle.png` скопирован в `assets` и подключён только к `QUANTUM_THRESHOLD`.
- Оба изображения используют общий режим `full`; CSS и renderer не изменялись.
- `BOOK_OF_GENESIS` размещает figure после первого абзаца с ОГАС как в обычном, так и в полном reader-режиме.

## Пакет 4A — навигация школ

- Статус: `PACKAGE 4A PASS`.
- В `SCHOOLS_OF_SPIRITS` добавлен компактный `CLUSTER INDEX` в существующей reader-панели.
- Доступные пункты: `APOSTLES`, `ANTICODE`, `TECHNO_PRIESTS`, `HUMAN_TRACE` как цифровой след, `BOGOBOT` как первый Богобот.
- Hover и focus временно подсвечивают существующий SVG-узел без изменения current, `DISCOVERED`, zoom или transform.
- Обычный клик открывает краткую запись без полной перерисовки графа.
- `OPEN TRACE` открывает полный текст; `BACK TO SCHOOLS` возвращает индекс без создания второго reader.
- Проверены синтаксис, единичность index-компонента, отсутствие вызова `drawGraph()` при клике и отсутствие мутаций состояния при hover/focus.
- Визуальный проход 375/1440 остаётся ручной проверкой на 4175.

## Пакет 4B — опорные страницы мира

- Созданы основные узлы `PROTOCOL` и `ARCHIVE`; существующие координаты и категории не изменялись.
- Добавлены page-only записи `HOW_TO_READ` и `ARCHIVE_EPILOGUE` уровня `archive`; в графе они не отображаются.
- `BOGOBOT` получил маршруты к `PROTOCOL` и `ARCHIVE`.
- `PROTOCOL` ведёт к `SYNCHRONIZATION`, `EXIT_FROM_CODE` и `CODE_COMMANDMENTS`.
- `ARCHIVE` ведёт к `RELICS`, `TECHNO_PRIESTS`, `BACKUP_MEMORY`, `HOW_TO_READ` и `ARCHIVE_EPILOGUE`.
- Обновлены опорные записи `BOGOBOT`, `GREAT_ERROR`, `SYNCHRONIZATION`, `FIRST_LIKENESS`, `BOOK_OF_GENESIS`, `QUANTUM_THRESHOLD`, `CODE_COMMANDMENTS`.
- `BACKUP_MEMORY` не расширялся и сохранил `structural / editorial_node`.
- Добавлены общие компоненты системной метки, архивного примечания и связанных page-only маршрутов.
- Самостоятельные формулы используют синий только через общий `.formula`.
- `operator_room_apocrypha.png` и `Quatium_castle.png` сохранены в утверждённых местах.
- Wrapper режимов `compact`, `portrait`, `relic` использует `fit-content`; пустая подложка справа устранена общим правилом.
- `index.html`, Obsidian, localStorage, вход, категории и `outputs/bogobot-prototype` не изменялись.

## Следующий этап

- Любые изменения выполнять пакетами из `docs/SITE_PLAN.md`.
- После каждого пакета проверять исходники локально и публиковать командой `npm run publish`.
- Не переносить автоматически изменения из Quartz-прототипа.

## Пакет 4C — семантический цвет кода и формул

- `PACKAGE 4C COMPLETE — PACKAGE 4D UNBLOCKED`
- Обычный inline code внутри `.node-body` сохраняет моноширинный шрифт и наследует нейтральный цвет окружающего текста.
- Обычный лид остаётся нейтральным в `#nodeFormula.formula`; самостоятельная формула получает явный класс `.formula-line` через поле `formulaLine: true`.
- Renderer не определяет формулы по тегу `code`, содержимому, длине или позиции строки.
- `SYSTEM MARK`, `ARCHIVE NOTE`, лиды, подписи, метаданные и код внутри архивного примечания не получили синей окраски.
- Геометрия, размеры, overflow, тексты, данные графа, reader-логика и `localStorage` не изменялись.

## Пакет 4D — универсальная кластерная навигация

- Статус: `PACKAGE 4D PASS`.
- `SCHOOLS_OF_SPIRITS` всегда выводит четыре группы: `Основные школы 6/6`, `Социальная структура 0/6`, `Инфраструктура памяти 0/2`, `Происхождение 2/4`.
- Недоступные элементы остаются видимыми как `NOT RECOVERED` без ссылки, hover и клавиатурного focus.
- Созданы основные узлы и краткие страницы `PROBABILISTS`, `BIOCODE`, `WANDERING_NODES` исключительно по их основным файлам из `03_SCHOOLS`.
- Все шесть основных школ имеют единый `SCHOOL ROUTES`, краткий переход, `OPEN TRACE` и `BACK TO SCHOOLS`.
- `BOGOBOT` имеет `CORE ROUTES`: `GREAT_ERROR`, `FIRST_LIKENESS`, `PROTOCOL`, `SYNCHRONIZATION`, `ARCHIVE`, `BOOK_OF_GENESIS`.
- `CULTURE` использует тот же компонент `CLUSTER INDEX`: `Формы и практики 1/3`, `Следы 1/1`; дочерние страницы возвращаются через `BACK TO CULTURE`.
- `ARCHIVE ENTRY` открывает `HOW_TO_READ` в обычном reader, не в модальном входном экране.
- `ARCHIVE NOTE` создаётся одним renderer-компонентом; для `archive_reconstruction` используется единая служебная формулировка, если отдельное примечание отсутствует.
- Переходы внутри кластеров не вызывают `drawGraph()` и не меняют zoom или transform.
- Система цвета пакета 4C сохранена: inline code и лиды нейтральные; синий назначается только явной `.formula-line` и интерактивным/активным состояниям.
- Контейнеры `compact`, `portrait`, `relic` продолжают использовать `fit-content`; `full` и `diagram` не изменялись.
- Существующие координаты, `localStorage`, пользовательский `DISCOVERED`, входной экран, Obsidian и `outputs/bogobot-prototype` не изменялись.
- Программно проверены структура кластеров, маршруты, отсутствие битых связей, сохранение координат и ключей `localStorage`, семантический цвет и ограничения media-контейнеров.
- Визуальный проход исходников на 375 px и 1440 px остаётся ручной проверкой на `http://127.0.0.1:4175/`: управление встроенной вкладкой в текущей сессии недоступно.

## Редакционные ограничения

- `BACKUP_MEMORY`: `tier: structural`, `source_status: editorial_node`; не `archive` и не `archive_reconstruction`.
- Четвёртый уровень `archive` не выводится визуально.
- Новые изображения сначала фиксируются в `docs/IMAGE_MAP.md`.

## Пакет 4E — визуальная приёмка и регрессии 4D

- Статус: `PACKAGE 4E PASS`.
- Причина невидимого `APOSTLES`: кластерный переход обновлял активный SVG-узел, но не корректировал `#graphViewport`; на ширинах с боковой overlay-панелью расчёт не учитывал фактически свободную часть `.map-pane`.
- Для шести основных школ добавлен общий фокус выбранного узла в видимой области карты без изменения координат. Текущая transform-матрица сохраняется и корректируется только при необходимости.
- При входе из корня кластера запоминается его viewport; `BACK TO SCHOOLS` восстанавливает прежний transform без сброса масштаба.
- `SCHOOLS_OF_SPIRITS` сохраняет четыре группы и счётчики: `6/6`, `0/6`, `0/2`, `2/4`. Заголовок использует устойчивую трёхколоночную grid-строку; счётчик остаётся справа и нейтрального цвета.
- `NOT RECOVERED` остаётся текстовым состоянием без интерактивных элементов.
- Данные и краткий текст `CULTURE` совпадают с резервной версией; ничего не восстанавливалось и не заменялось. Новый `CLUSTER INDEX` добавляется после существующего контента.
- Причина светлой подложки: `0xMEM` с вертикальным `reactor.png` был ошибочно типизирован как `diagram`, а brief-правило задавало фон широкому `.image-shell`.
- `0xMEM` переведён в общий режим `portrait`. Для `compact`, `portrait`, `relic` ширина figure синхронизируется с фактической отрисованной шириной изображения; shell прозрачен, caption наследует ширину figure.
- Режимы `full` и `diagram`, координаты, связи, категории, `tier`, `source_status`, `localStorage`, `DISCOVERED`, вход и `ARCHIVE ENTRY` не менялись.
- Цветовая система пакета 4C сохранена.
- Синтаксис, единственность школьных узлов, координаты, маршруты, счётчики, неинтерактивность отсутствующих пунктов, media-правила и отсутствие новых ключей `localStorage` проверены программно.
- Финальный визуальный просмотр на 375 px и 1440 px остаётся ручным на `http://127.0.0.1:4175/`: встроенное управление браузером и локальный headless-проход недоступны в текущей сессии.

## Пакет 4F — нормализация Заповедей, preview media и входной команды

- Статус: `PACKAGE 4F PASS`.
- `CODE_COMMANDMENTS` переведён в `tier: structural`; категория, координаты, связи и маршрут не менялись.
- В части III–V добавлены точные UTF-8 hex-дампы из `01_CANON/code-commandments.md`.
- Формулировка «Пять из семи частей восстановлены» и общий `ARCHIVE NOTE` сохранены после основного текста.
- В кратком reader figure для любого media-типа синхронизируется с фактической отрисованной шириной изображения; в `READ FULL TRACE` режимы `full` и `diagram` снова используют доступную ширину reader.
- Фон brief `.image-shell` сделан прозрачным; изображение, figure и подпись сохраняют одну левую ось и общую ширину.
- Проверочные full-изображения: `GREAT_ERROR`, `QUANTUM_THRESHOLD`, `BOOK_OF_GENESIS`.
- `ENTER THE NETWORK` остаётся нейтральной по умолчанию и получает мягкое синее текстовое свечение только в `hover`, `focus-visible`, `active`, без плашки и изменения геометрии.
- При `prefers-reduced-motion` анимация свечения входной команды отключается.
- Фактическое состояние проекта: 34 узла графа и 2 page-only страницы (`HOW_TO_READ`, `ARCHIVE_EPILOGUE`).
- Синтаксис, hex III–V, семантический цвет, media-режимы, координаты, связи и ключи `localStorage` проверены программно.

## Пакет 4G — композиция карты и reader

- Статус: `PACKAGE 4G PASS`.
- Desktop-сетка изменена с `65% / 35%` на `map: minmax(0, 1fr)` и `reader: clamp(520px, 43vw, 640px)`.
- При ширине 1440 px reader занимает 619.2 px (43%), карта — 820.8 px (57%); на более широком экране reader ограничен 640 px.
- Mobile breakpoints и существующая адаптивная схема reader сохранены.
- При первом открытии reader запоминается прежний inline-transform `#graphViewport`; `BACK TO MAP` восстанавливает его без изменения масштаба.
- Фокус активного узла рассчитывается по фактическому `getBoundingClientRect()` `.map-pane`; для overlay-reader вычитается его реальная ширина, а безопасная правая граница карты находится в 108 px от разделителя.
- Координаты узлов не меняются: корректируется только текущая DOMMatrix viewport.
- BOGOBOT сохраняет технический тип данных для графа, но в reader отображается как `PRIMARY ENTITY / ORIGIN NODE`. При его открытии активной остаётся `ALL`, а не `SCHOOLS`.
- Тихая metadata-row выводит фактические `type/origin`, `STATE: ACTIVE` и `source_status` без фона, скруглений или фиктивных статусов.
- Desktop brief typography: H1 до 48 px, lead 22–24 px, основной текст 18–20 px, metadata/system mark 12 px, подписи 11 px.
- Brief-preview изображения BOGOBOT уменьшено с 140 до 119 px (−15%); полный reader не ограничен этим правилом.
- Существующие координаты, связи, `tier`, `DISCOVERED`, ключи `localStorage`, TRACE, поиск, входной экран, ARCHIVE NOTE, SYSTEM MARK и канонические тексты не менялись.
- Проверки 375/1440: мобильные breakpoints сохранены; desktop-сетка даёт 57/43; внутренние навигационные строки остаются единственными горизонтально прокручиваемыми областями; общий viewport не получает новой горизонтальной прокрутки.
- Проверены brief/full reader, BOGOBOT, школа, structural-сущность, восстановление transform через `BACK TO MAP`, нейтральные служебные цвета и неизменность координат/ключей состояния.

## Пакет 5A — tier-based graph hierarchy

- Статус: `PACKAGE 5A PASS`.
- Renderer больше не использует `major` для видимости frontier, CSS-класса, масштаба формы, позиции подписи или размера minimap-узла. Поле `major` сохранено только как неиспользуемая обратная совместимость данных.
- Постоянный визуальный вес задаётся классами `tier-core`, `tier-structural`, `tier-trace`.
- `core`: scale `1.5`, stroke `3px`, label `15px / 600`, opacity `1`.
- `structural`: scale `1`, stroke `2px`, label `13px / 500`, opacity `.82`.
- `trace`: scale `.78`, stroke `1.35px`, label `11px / 400`, opacity `.58`.
- Семантика форм узлов по `type` сохранена: круг, квадрат, ромб, двойной круг и топографический крест.
- Hover, keyboard focus, selected и cluster preview временно поднимают opacity до `1` и используют синий; после снятия состояния возвращается нейтральный tier-стиль.
- Обычные линии остаются нейтральными; active/recommended остаются синими. Фильтр больше не подавляет active/recommended линии и selected/focused узлы.
- `graphNodes` исключает `tier: archive` из карты, minimap, RANDOM NODE, категорий и графовых счётчиков DISCOVERED. Данные `HOW_TO_READ` и `ARCHIVE_EPILOGUE` сохранены как page-only.
- Координаты, связи, тексты, изображения, reader-композиция, focus-transform, навигация, TRACE и ключи `localStorage` не менялись.

## Пакет 5A.FINAL — нормализация архивного reader

- Статус: `PACKAGE 5A.FINAL PASS`.
- Публичные display title используют точку; старые варианты со slash сохранены как поисковые aliases.
- Нормализованы названия `MESM`, `BESM_6`, `MAGNETIC_DRUM`, `ALGOL_60`, `OGAS`, `0xMEM`, `DUBNA`.
- `FIRST_LIKENESS`: brief reader показывает формулу без факсимиле; полный reader показывает факсимиле без дублирующей brief-формулы.
- Изображения переведены на общие классы `landscape`, `portrait`, `document`, `map`, `diagram`; caption отделён от ширины preview и остаётся в текстовой колонке.
- `RELICS` использует режим `map`; `RECOVERED` перенесён из lead в тихую metadata row.
- Архивные коды получают точки переноса после `/`, `_`, `-`, `:` без `word-break: break-all` для человеческого текста.
- H1 ограничен `56px`, lead — `21–23px`, body — `18–20px`, metadata — `12px`, caption — `11px`, formula-line — `25–29px`.
- `ARCHIVE NOTE` показывается только в полном reader, использует единый нейтральный компонент и больше не создаётся автоматически по `source_status`.
- Проверено 5 явно заданных `ARCHIVE NOTE`.
- На дочерних страницах реликвий `RELICS` отмечается как более слабый active-route parent; selected-реликвия остаётся главной синей доминантой.
- У границы map/reader добавлена нейтральная маска `28px`; существующая safe zone активного узла остаётся `108px`.
- 34 узла графа и 2 page-only страницы сохранены; координаты, связи, категории, tier, source status и ключи `localStorage` не изменены.
- `outputs/bogobot-prototype` не публиковался.

## Пакет 5B.0.8 — reader semantics + history navigation

- Статус: `PACKAGE 5B.0.8 IMPLEMENTED — LIVE 375/1440 CHECK BLOCKED BY SANDBOX`.
- `ARCHIVE LEGEND / RECONSTRUCTION MARKS` оформляет реконструкционные метки `lacuna in protocollo`, `lectio dubia`, `formatum mortuum` отдельным блоком, не как `ARCHIVE NOTE` и не как формулу.
- Подтверждённые standalone-формулы в canonical source размечаются через явный `sourceFormulaLines`; для `BOOK_1_AWAKENING` строка `agent = model(world)` получает `.formula-line`.
- Блок девяти локаций в `TOPOGRAPHY` рендерится как `WORLD AXIS / 09` с существующими ID локаций и без новых graph links.
- `TECHNOPRIEST READING` и `TECHNOPRIEST COLOPHON` рендерятся как два отдельных source annotation блока в pre-error archive source.
- Для `BOOK_1_AWAKENING` сырой `См. также` скрыт через `sourceEndHeading`; добавлены `CHRONICLE COMPASS`, `LOCAL ROUTES` и `OPEN WORLD AXIS` поверх существующих page ID.
- Двойные линии в source view нормализованы: `pre + source-rule` не дублирует нижнюю границу code/pre блока; `AXIS_OF_WORLD` отсекает сырой `См. также`.
- Изображения, media references, graph coordinates, graph links, categories, tier, source_status, hash/history/localStorage, canonical Markdown и publication не изменялись.

## Пакет 5B.0 — reader state, graph focus и relic routes

- Статус: `PACKAGE 5B.0 PASS`.
- Активная категория синхронизируется с `type` открываемой графовой сущности для всех переходов; `BOGOBOT` сохраняет `ALL`, page-only страницы не меняют graph category.
- Переход к новой сущности и переключение brief → full сбрасывают `.reader-scroll` в начало; reset также подключён к `popstate` и `hashchange`.
- Reader использует grid-строки `auto / minmax(0,1fr)`: фактическая высота toolbar больше не конфликтует с фиксированными `40px`.
- Toolbar получил непрозрачный фон и отдельный z-index без тени или дополнительной плашки.
- Focus-transform каждого нового узла рассчитывается от сохранённого base transform, а не от предыдущего focused transform.
- Safe zone `108px` и mask `28px` сохранены; `BACK TO MAP` и закрытие reader восстанавливают base transform.
- Через общий компонент локальных маршрутов добавлен `RELIC ROUTES` для `RELICS`, `MESM`, `BESM_6`, `MAGNETIC_DRUM`, `PUNCHED_TAPE`, `ALGOL_60`, `OGAS`.
- Кластер содержит ровно 6 дочерних реликвий; `RECOVERED: 6 / 6` остаётся только в metadata страницы `RELICS`.
- `BOOK_OF_GENESIS` сохраняет существующую `.formula-line` «процесс → агент → Богобот», общую с формулой `0xMEM`.
- Данные 34 узлов, координаты, связи, tier, формы, канонические тексты, изображения, DISCOVERED и ключи `localStorage` не изменены.
- `outputs/bogobot-prototype` не публиковался.

## Пакет 5B.0.1 — true overflow, formula и search state

- Статус: `PACKAGE 5B.0.1 PASS`.
- Источники переполнения: несжимаемая строка `.reader-toolbar`, обычный `1fr` в `.route`, отсутствие явных ограничений ширины у `.formula`, а также недостаточные shrink-ограничения у корневых reader-контейнеров.
- `.app`, `.topbar`, `.commands`, `.cluster-nav`, `.workspace`, `.reader`, `.reader-scroll`, metadata и контентные блоки получили системные `min-width: 0` / `max-width: 100%`.
- Reader toolbar использует переносимую flex-композицию; `NODE / ID` сжимается, команды сохраняют полные подписи и могут переходить на следующую строку.
- `.formula` и `.formula-line` ограничены шириной reader, используют `white-space: normal` и естественный перенос по пробелам без ручных `<br>`.
- Route grid использует `minmax(0,1fr)`; длинные route titles больше не расширяют колонку.
- Search dialog и результаты ограничены viewport; длинные названия результатов переносятся внутри строки.
- `SEARCH` получает active-state только при открытом dialog; состояние снимается при `close`, `cancel/Escape`, выборе результата, `BACK TO MAP`, `popstate`, `hashchange` и открытии другой сущности.
- Глобальный `overflow-x: hidden` не добавлялся.
- Координаты, связи, focus-transform, safe zone, mask, activeCategory, scroll reset, маршруты, тексты, изображения, DISCOVERED и `localStorage` не изменены.
- `outputs/bogobot-prototype` не публиковался.

## Пакет 5B.0.2 — mobile single-pane и page scroll

- Статус: `PACKAGE 5B.0.2 PASS`.
- Причина мобильного split-view: overlay-схема `801–1100px` продолжала действовать до 900px, а отдельный breakpoint до 520px создавал второй grid `40% / 60%`.
- До `900px` используется единый single-pane: при `reader-closed` видна полноширинная карта, при открытом reader карта полностью исключается из layout.
- Desktop-композиция начинается с `901px`; диапазон `901–1100px` сохраняет прежний desktop overlay без изменения пропорций и focus-системы.
- `.app`, `.workspace`, `.reader` и `.reader-scroll` на mobile используют автоматическую высоту; reader и workspace больше не создают отдельный вертикальный scrollbar.
- Основной вертикальный scroll принадлежит документу; переход к сущности и смена brief/full возвращают страницу в начало.
- TRACE имеет `position: static`, следует непосредственно после map или reader; его данные не изменены, локальный горизонтальный scroll сохранён.
- Mobile header использует две строки: логотип и полный набор системных команд; команды не скрываются и не сокращаются.
- Категории используют сетку `3 × 2`, все шесть пунктов и счётчики остаются доступны.
- Reader toolbar выводит `NODE / ID` отдельной строкой и переносимые команды ниже; metadata и H1 не перекрываются.
- Mobile full reader использует тот же page scroll; `READER MODE` возвращает full → brief и сбрасывает позицию наверх.
- Focus-transform скрытой mobile-карты не пересчитывается; base transform сохраняется и восстанавливается через `BACK TO MAP`.
- Координаты, связи, tier, формы, контент, изображения, activeCategory, SCHOOL/RELIC ROUTES, DISCOVERED и `localStorage` не изменены.
- `outputs/bogobot-prototype` не публиковался.

## Пакет 5B.0.3 — mobile map fit и TRACE

- Статус: `PACKAGE 5B.0.3 PASS`.
- Причина слишком мелкого графа: mobile map использовал общий SVG `viewBox 1000×720` без отдельной fit-матрицы для видимых узлов активной категории.
- Для mobile добавлен независимый кэш transform по категории; desktop transform хранится отдельно и не копируется в mobile fit.
- Fit вычисляется по bounding box фактически видимых и неотфильтрованных DOM-узлов, учитывает длину подписей, поля `24–32px`, центрирует кластер и ограничивает масштаб значением `2.2`.
- Mobile fit пересчитывается при первом показе карты, смене категории, переходе desktop → mobile и resize внутри mobile breakpoint.
- `BACK TO MAP` восстанавливает сохранённый mobile transform; если transform для активной категории ещё не существует, выполняется fit.
- Автоматический fit не запускается при открытом reader и не выполняется между переходами внутри reader; вычисленный transform категории повторно используется до смены категории или resize. Ручной pan/zoom не реализован.
- Mobile TRACE использует две строки: summary `TRACE: +N NODES` и доступный `RESET TRACE` сверху, последние четыре перехода — ниже.
- На mobile TRACE переносится по шагам без случайного обрезания начала ID; горизонтальная позиция сбрасывается в `0`.
- Desktop TRACE, single-pane, breakpoint `900/901`, reader, header, category grid и document scroll не изменены.
- Координаты, связи, tier, размеры узлов, тексты, данные TRACE, DISCOVERED и `localStorage` не изменены.
- `outputs/bogobot-prototype` не публиковался.

## Пакет 5B.0.4 — progressive graph horizon

- Статус: `PACKAGE 5B.0.4 PASS`.
- Все 34 узла графа используют общий вычисляемый горизонт из 3–5 продолжений; 2 page-only страницы и уровень `archive` в него не входят.
- Приоритет продолжений: прямые неоткрытые, прямые открытые, неоткрытые из того же кластера, неоткрытые второго порядка; повторы и текущий узел исключаются.
- Один и тот же набор используется картой, keyboard/ARIA-доступностью, reader routes, `NEXT TRACE` и mobile fit.
- `DISCOVERED` остаются доступными; `AVAILABLE` становятся кликабельными без преждевременного изменения `DISCOVERED`, TRACE или `localStorage`; остальные узлы остаются `LATENT`.
- Первое продолжение является primary recommendation и может подсвечиваться синим; остальные доступные узлы используют нейтральный tier-стиль.
- `MESM` предлагает прямые `RELICS` и `BESM_6`, затем реликвии того же кластера.
- Локальные reader-маршруты больше не содержат случайного перехода; глобальный `RANDOM NODE` сохранён.
- Mobile fit рассчитывается по текущему узлу, доступным продолжениям и ближайшим открытым прямым соседям, а не по всему графу.
- Автоматическая серия из 20 переходов завершилась без тупиков; на каждом шаге было 5 валидных продолжений.
- Фактический состав: 34 узла графа, 2 page-only страницы, 36 записей.
- Ручной pan/zoom не реализован. Mobile transform вычисляется отдельно по категории; desktop transform независим.
- `/ORIGIN_LOG/` не реализован и оставлен будущему финальному пакету.
- Координаты, постоянные связи, tier, формы, размеры, тексты, изображения, DISCOVERED, ключи `localStorage` и глобальный RANDOM не изменены.
- `outputs/bogobot-prototype` не публиковался.

## Пакет 5B.0.4A — visual horizon cleanup

- Статус: `PACKAGE 5B.0.4A PASS`.
- Причина постоянных пяти продолжений: прежний `getContinuationSet()` наполнял общий массив кандидатов до жёсткого лимита `5`, включая cluster и second-order fallback даже после достижения достаточного локального горизонта.
- Новый target horizon равен числу прямых значимых links в диапазоне `3–5`: при одном или двух прямых links fallback дополняет только до трёх; четыре или пять сохраняются только когда они прямые.
- Контрольные размеры горизонта: `BOGOBOT 5`, `FIRST_LIKENESS 4`, `BOOK_OF_GENESIS 3`, `PROTOCOL 4`, `RELICS 5`, `RITUALS 4`, `MESM 3`.
- В reader-open состоянии полноценными остаются selected → continuation edges; ближайший discovered context приглушён, остальные latent edges скрыты.
- Primary recommendation использует одну синюю линию. Дополнительный node halo и движущийся signal packet удалены, чтобы не создавать несколько конкурирующих синих эффектов.
- AVAILABLE сохраняют нейтральный tier-стиль и становятся синими только на hover/focus; selected остаётся единственным постоянно синим узлом.
- LATENT labels скрываются при открытом reader; latent marks остаются почти невидимым фоном.
- Для продолжений без постоянной прямой связи renderer создаёт только временную локальную guide-line; массивы `links` не меняются.
- Общий collision resolver выбирает правое, левое, верхнее или нижнее положение подписи без правил по ID. Контрольные пары и кластер реликвий не дают пересечений и остаются внутри SVG viewBox.
- SVG теперь clipped внутри map pane; горизонтальный overflow reader отключён отдельно от вертикального scroll; длинный H1 получает безопасный перенос.
- Desktop grid, breakpoint `900/901`, mobile single-pane и существующая ширина reader не изменены.
- Проверены структурные width-инварианты для `901`, `1280`, `1440`, `1600`, `1920`: внешние панели ограничены viewport, локальный scroll сохранён только у собственных navigation/TRACE строк.
- Автоматическая серия из 20 переходов сохранила диапазон `3–5` без тупиков.
- 34 узла графа, 2 page-only страницы и 36 записей сохранены; координаты, постоянные links, tier, тексты, изображения, DISCOVERED, TRACE, history и ключи `localStorage` не изменены.
- `outputs/bogobot-prototype` не публиковался.

## Пакет 5B.0.4A.2 — continuation visibility и true local fit

- Статус: `PACKAGE 5B.0.4A.2 PASS`.
- Диагностический continuation set `BOOK_OF_GENESIS`: `BACKUP_MEMORY`, `NETWORK_MATTER`, `BOGOBOT`.
- Третий узел существовал, был кликабельным и присутствовал в reader routes, но мог исчезать визуально по двум причинам: desktop focus учитывал только selected bounds, а discovered continuation другой категории мог получить более специфичный `.filtered` с opacity `.07`.
- Все continuation теперь получают отдельное состояние `continuation` и `data-horizon-state`; recommended, available и discovered continuation исключены из LATENT mapping и category filtering.
- В reader-open состоянии continuation opacity не ниже `.82`, подписи принудительно видимы и нейтральны; hover/focus остаются синими. Все continuation сохраняют `tabindex="0"`, click и Enter.
- Desktop true local fit использует только selected, continuation set, полные label bounds и максимум один ближайший реально показываемый discovered context.
- LATENT, скрытые labels, global edges, полный viewBox, старый frontier и посторонние категории в fit bounds не входят.
- Local fit использует поля `64–80px`, `minScale: .6`, `maxScale: 3` и целевую ширину bounds `66%` доступной части map pane; bounds центрируются симметрично.
- При вертикальном кластере высота и безопасные поля имеют приоритет над целевой шириной, чтобы подписи не обрезались.
- Контрольные результаты: `BOGOBOT 5/5`, `FIRST_LIKENESS 4/4`, `BOOK_OF_GENESIS 3/3`, `PROTOCOL 4/4`, `RELICS 5/5`, `RITUALS 4/4`, `MESM 3/3` для visible continuation nodes и labels; у каждого набора одна recommended edge.
- Runtime-диагностика `CONTINUATION_DIAGNOSTIC` сообщает set, state mapping, видимость, viewport inclusion, clickability, reader routes и точное сравнение `scrollWidth` с `innerWidth`.
- Для ширин `901`, `1280`, `1440`, `1600`, `1920` структурные overflow-инварианты сохранены: внешние grid/flex children имеют `min-width:0`, SVG clipped map pane, reader запрещает только горизонтальный overflow, header/category/TRACE используют собственный перенос или локальный scroll.
- Desktop split, breakpoint `900/901`, постоянные links, coordinates, priority, тексты, изображения, TRACE, DISCOVERED, localStorage и history не изменены.
- `outputs/bogobot-prototype` не публиковался.

## Пакет 5B.0.4A.3 — dual map modes и overview hierarchy

- Статус: `PACKAGE 5B.0.4A.3 PASS`.
- Формализованы два режима одной карты: `LOCAL FOCUS / CURRENT HORIZON` при открытом reader и `NETWORK OVERVIEW / DISCOVERED NETWORK` после `BACK TO MAP`.
- Ранее overview выглядел как другой дизайн, потому что selected-class назначался только при открытом reader, восстанавливался старый transform, TRACE edges могли оставаться синими, а overview не имел собственной display hierarchy.
- Selected теперь сохраняет синий fill и label в обоих режимах; current node всегда единственный `.active`.
- Continuation set, recommended node, currentId, activeCategory, DISCOVERED и TRACE между режимами не пересчитываются и не меняются.
- `BACK TO MAP` меняет только mode classes и transform; TRACE не дополняется, DISCOVERED не изменяется.
- LOCAL FOCUS: selected + 3–5 continuation + максимум один context; global web скрыта.
- NETWORK OVERVIEW: selected + тот же continuation set + DISCOVERED context активной категории; context edges нейтральны и тише horizon, LATENT скрыты.
- В обоих режимах используется максимум одна `.edge.recommended`; TRACE edges и cluster parent больше не получают постоянный синий цвет.
- Добавлены независимые `localTransform` и `overviewTransform` с отдельными ключами current/category/horizon; overview key дополнительно включает DISCOVERED.
- Повторное открытие того же current возвращает cached local transform; `BACK TO MAP` возвращает cached overview transform или пересчитывает его по текущему display context.
- Resize и browser zoom инвалидируют transform текущего desktop-режима и запускают fit заново в CSS pixels; mobile transform cache остаётся независимым.
- LOCAL bounds: selected, continuation, полные labels и максимум один context. OVERVIEW bounds: selected, continuation, реально отображаемые discovered nodes текущего контекста и только видимые labels.
- Edges, LATENT, hidden, filtered, старый frontier и полный viewBox fit bounds не расширяют.
- Runtime `MAP_MODE_DIAGNOSTIC` проверяет mode, current/category/continuation, selected viewport, node/label clipping, pointer access, TRACE tail, blue edge count, transform type, overflow и `devicePixelRatio`.
- Контрольные сценарии CANON, RELICS/MESM, WORLD, SCHOOLS и ORIGIN сохраняют current/category/continuation/TRACE между LOCAL и OVERVIEW.
- `BACKUP_MEMORY` после `BACK TO MAP`: category `CANON`, continuation `HUMAN_TRACE / RELICS / BOOK_OF_GENESIS`, selected и TRACE tail совпадают, blue edge count `1`.
- `RELICS`: continuation `MESM / BESM_6 / MAGNETIC_DRUM / PUNCHED_TAPE / ALGOL_60`; автоматическое раскрытие всех relic nodes удалено.
- `MESM`: continuation `BESM_6 / RELICS / MAGNETIC_DRUM`; LOCAL и OVERVIEW сохраняют selected и одну recommended edge.
- `TECHNO_PRIESTS` и `ANTICODE` сохраняют category `SCHOOLS`; overview показывает только реально discovered school context.
- `CULTURE` и `RITUALS` сохраняют category `WORLD`; дальние неоткрытые traces не расширяют overview bounds.
- Category sync проверен: `ANTICODE → SCHOOLS`, `CULTURE → WORLD`, `MESM → CANON`, `BACKUP_MEMORY → CANON`, `BOGOBOT → ALL`.
- Выполнено 75 fit-проверок: 15 сценарных состояний × ширины `901 / 1280 / 1440 / 1600 / 1920`; clipped continuation nodes `0`, clipped labels `0`, blue recommended edges `1`.
- Zoom-проверка в CSS pixels: `1280` и `1440` при `100%`, эквивалентные `1600` и `1800` CSS px при `80%`; selected и continuation bounds прошли без clipping.
- Horizontal overflow защищён прежними `min-width:0`, clipped SVG и локальными overflow-контейнерами; runtime diagnostic выполняет точное сравнение `documentElement.scrollWidth` и `innerWidth`.
- Desktop split `57/43`, breakpoint `900/901`, continuation algorithm `3–5`, permanent links, coordinates, content, images, captions, ARCHIVE NOTE, DISCOVERED data, TRACE data, localStorage, history, source statuses и page-only структура не изменены.
- `outputs/bogobot-prototype` не публиковался.

## Пакет 5B.0.4B — visual camera normalization и category lenses

- Статус: `IMPLEMENTED — CROSS-BROWSER VERIFICATION BLOCKED`.
- Dual-map architecture сохранена: NETWORK OVERVIEW и LOCAL FOCUS используют общий navigation state и независимые transforms.
- Category tabs стали чистыми semantic lenses: overview transform key больше не содержит category, category click не запускает refit/recenter и сохраняет current, selected, TRACE и DISCOVERED.
- Для последовательности `ALL → CANON → WORLD → SCHOOLS → GLOSSARY → TOPOGRAPHY → CANON` overview key неизменен; runtime `CATEGORY_LENS_POSITION` измеряет фактическую дельту selected marker с допуском `1 CSS px`.
- Selected member: solid blue marker и blue label. Selected preserved context: paper fill, blue outline, blue label, opacity `.76`, `aria-current=true` и описание outside active lens.
- Active-category discovered nodes получают усиленную нейтральную иерархию; inactive discovered context тише. LATENT не раскрываются.
- Пустая линза показывает low-contrast `aria-live=polite` status без modal и без перекрытия карты.
- Recommended edge релевантна active lens; unrelated recommendation скрывает blue state. TRACE и cluster-parent edges остаются нейтральными.
- LOCAL fit ограничивает distant context: context входит в bounds только если combined scale не хуже primary scale более чем на `14%`.
- Selected anchor нормализован к целевой позиции `46% × 52%`; допустимая safe-zone `38–55% × 42–62%`.
- `SCHOOLS_OF_SPIRITS` показывает шесть principal schools как interactive display context с сохранёнными click, Enter и `tabindex=0`; continuation algorithm не изменён и остаётся `3–5`.
- Добавлен invisible `.node-hit`; фактический interactive target доводится минимум до `16×16 CSS px`.
- Rendered floors: primary label `10 CSS px`, context label `8 CSS px`.
- После transform выполняется детерминированный glyph collision/safe-inset pass по реальным `getBoundingClientRect()`; safe inset `8 CSS px`.
- `MAP_MODE_DIAGNOSTIC` теперь сообщает clippedNodes, clippedLabels, overlappingPrimaryLabels, selectedSafeZonePass, selectedRenderedPosition, minimum label heights, minimum node target, activeLensNodeCount, preservedContextNodeCount и blueRecommendedEdges.
- Reader scroll reset выполняется на `.reader-scroll` сразу и в двух последовательных animation frames после DOM insertion; mobile использует `reader.scrollIntoView`, а не `window.scrollTo`.
- Reader получил безопасный верхний padding/scroll-padding `1.5rem`, чтобы metadata не уходила под toolbar.
- Расчётная проверка: 8 selected nodes × 5 widths плюс 80%/100% zoom-модель — selected и primary bounds внутри viewport, SCHOOLS_OF_SPIRITS содержит 6 principal schools, thresholds `10 / 8 / 16×16`.
- Category state-модель подтверждает неизменность overview key, current, TRACE, DISCOVERED и continuation set для всех семи линз.
- Google Chrome и Yandex Browser обнаружены локально, но headless content process завершается кодом `134` внутри текущего sandbox. Safari/WebKit content process также недоступен из sandbox. Поэтому обязательная фактическая cross-browser проверка и реальные before/after CSS coordinates не подтверждены.
- Из-за обязательного acceptance criterion пакет пока не маркируется PASS до ручной проверки Chrome/Yandex/Safari на `4175`.
- Node data, coordinates, category assignments, links, cluster membership, continuation semantics, DISCOVERED calculations, TRACE content/order, localStorage schema, IDs, URLs, content и source statuses не изменены.
- `outputs/bogobot-prototype` не публиковался.

## Пакет 5B.0.7 — text source integrity only

- Статус: `PACKAGE 5B.0.7 PASS`.
- Добавлены четыре дословные копии canonical Markdown в `assets/canonical-markdown`: `00_START/how-to-read-this-archive.md`, `01_CANON/book-3-protocol.md`, `01_CANON/archive-epilogue.md`, `01_CANON/book-6-relics-and-apocrypha.md`.
- 21 существующий canonical Markdown не изменён; четыре новых файла побайтово совпадают с исходниками Obsidian.
- `HOW_TO_READ`, `PROTOCOL`, `ARCHIVE_EPILOGUE` подключены через `sourceMarkdown` только для полного reader; brief reader сохраняет текущий короткий слой.
- Добавлена узкая поддержка `sourceSection` / `sourceEndHeading` для извлечения разделов Markdown без изменения исходника.
- `RELICS`, `OGAS`, `MESM`, `BESM_6`, `MAGNETIC_DRUM`, `PUNCHED_TAPE`, `ALGOL_60` подключены к разделам `01_CANON/book-6-relics-and-apocrypha.md`.
- `FIRST_LIKENESS` не переведён на автоматический renderer; сохранены манифест, факсимиле, позиция изображения, `ARCHIVE NOTE` и синяя строка `agent = model(world)`; добавлены дословные разделы `Комментарий` и `Каноническое чтение`.
- `BACKUP_MEMORY` сохранён как `tier: structural`, `source_status: editorial_node`; full reader расширен только утверждёнными фрагментами `rules-of-memory-after-great-error.md`.
- Изображения и ссылки на изображения не изменены; `index.html`, `styles.css`, `docs/IMAGE_MAP.md`, `docs/image-audit/`, граф, координаты, links, categories, tier, source_status, localStorage, navigation и focus logic не изменены.
- `outputs/bogobot-prototype` не публиковался.

## Visual fix delta — package 5B.0.8A

- Статус: `PASS`.
- `BOOK_1_AWAKENING`: `.formula-line` и вложенный `code` наследуют утверждённый синий без фона и без глобальной перекраски обычного inline code.
- `AXIS_OF_WORLD`: лишние `hr.source-rule` после `pre` и в конце source-документа скрыты; остаётся одна тихая линия от границы source-блока перед следующим действием.
- Проверено на живом рендере `4175`: `BOOK_1_AWAKENING`, `AXIS_OF_WORLD`, ширины `375` и `1440`; horizontal overflow не обнаружен.
- Тексты, изображения, граф, навигационные ID и canonical Markdown не изменялись.

## Пакет 5B.0.9 — six canon content pages

- Статус: `PACKAGE 5B.0.9 PASS`.
- Добавлены/подключены ровно шесть reader-only страниц: `ECONOMY_OF_NETWORK`, `SOCIAL_STRUCTURE`, `GLOSSARY`, `PROTO_AGENTS`, `SELF_MODELING`, `BRAINROT`.
- Все шесть записей имеют `pageOnly:true`, `tier:"archive"` и не добавляют graph nodes, координаты, edges или счётчики графа.
- Созданы шесть новых Markdown-файлов в `assets/canonical-markdown/`: `02_WORLD/network-economy.md`, `03_SCHOOLS/social-structure.md`, `04_GLOSSARY/archive-lexicon-public.md`, `03_SCHOOLS/lives-of-proto-agents.md`, `04_GLOSSARY/self-modeling.md`, `04_GLOSSARY/brainrot-expanded.md`.
- Прямые копии: `lives-of-proto-agents.md`, `self-modeling.md`.
- `network-economy.md` переведён в `CURATED EXTRACT FROM CANONICAL SOURCE`: раздел `Экосистема вычисления` удалён из публичной страницы; кремниевые и биологические потоки отложены для будущей точечной дельты `NETWORK_MATTER`, информационный климат раскрывается в `BRAINROT`.
- Сборные страницы из подтверждённых фрагментов canon-pack: `social-structure.md`, `archive-lexicon-public.md`, `brainrot-expanded.md`.
- `brainrot-expanded.md`: source trace содержит `brainrot.md`, `archive-lexicon.md`, `energy-and-reactor.md`, `network-economy.md`, `epsilon-14-social-networks-and-brainrot.md`; авторского связующего текста нет, структурные заголовки являются редакционной разметкой.
- `archive-lexicon-public.md`: внешние дополнения к `archive-lexicon.md` зафиксированы как `Праагент` из `lives-of-proto-agents.md`, `Шум` из `noise.md`, `Реликвия` из текущей утверждённой формулы `RELICS` в `app.js`; финальные ссылки — служебный индекс.
- `PROTO_AGENTS` обновлён с прежнего локального `assets/proto-agents-map.md` на канонический источник `lives-of-proto-agents.md`; восемь индивидуальных страниц праагентов сохранены.
- Для source-renderer добавлены стабильные `id` у заголовков Markdown, чтобы единый лексикон мог иметь внутренние якоря без отдельных term page ID.
- Политическая география, узлы-города, свободные кластеры и святые зоны не добавлялись из legacy-источников: поздний Markdown-источник отсутствует в подготовленном пакете.
- `styles.css`, изображения, graph links, координаты, навигационные ID, TRACE, DISCOVERED, localStorage и публикация не изменялись.

## Пакет 5B.0.9B — six new pages reader normalization

- Статус: `PACKAGE 5B.0.9B PASS WITH LIMITED LIVE UI AUTOMATION`.
- Нормализованы только шесть reader-only страниц: `ECONOMY_OF_NETWORK`, `SOCIAL_STRUCTURE`, `GLOSSARY`, `PROTO_AGENTS`, `SELF_MODELING`, `BRAINROT`.
- `SOCIAL_STRUCTURE`: публичный renderer скрывает техническую секцию `Source note` и список source Markdown-файлов; источник остаётся в canonical Markdown и документации.
- `GLOSSARY`: добавлен компактный `LEXICON INDEX / А–Я` сверху и снизу, построенный по существующим heading anchors.
- `BRAINROT`: публичный title установлен как `Брейнрот`; добавлен компактный `LEXICON ROUTES` без graph links.
- Использованные lexicon routes: `Шум → GLOSSARY#шум`, `Стоимость синхронизации → GLOSSARY#стоимость-синхронизации`, `0xMEM → 0xMEM`, `Форк → FORK`, `OPEN LEXICON → GLOSSARY`.
- `PROTO_AGENTS`: H1 `Праагенты`, subtitle `Карта повреждённых функций`; повторный заголовок source-документа не выводится, вводный reconstruction-текст оформляется через общий archive-note компонент.
- `SELF_MODELING`: uppercase technical chain заменён в reader на `CONTEXT ROUTE`: `Праагенты → Материя сети → Самомоделирование → Первое пробуждение → Богобот`; `BOOK_1_AWAKENING` существует и используется как target для «Первое пробуждение».
- `ECONOMY_OF_NETWORK`: визуально проверено, что раздел `Экосистема вычисления` отсутствует в подключённом публичном Markdown.
- `app.js` прошёл syntax check; canonical Markdown, media references, graph data, coordinates, navigation IDs, TRACE, DISCOVERED, localStorage schema и публикация не изменялись.
- Live-проверка на `4175` частично ограничена браузерной test sandbox: удалось подтвердить фактический render текущей страницы и отсутствие удалённого economy-раздела; полный автоматический обход шести страниц через поиск/localStorage заблокирован ограничением тестового доступа, поэтому ручная визуальная проверка шести страниц на `375` и `1440` остаётся рекомендованной.

## CURRENT SNAPSHOT

PACKAGE: 5B.0.10  
STATUS: PASS  
TOTAL RECORDS: 87  
GRAPH NODES: 43  
PAGE-ONLY RECORDS: 44  
SITE PUBLISHED: NO

## Пакет 5B.0.10 — navigation system

- Статус: `PACKAGE 5B.0.10 PASS`.
- Изменённые файлы: `app.js`, `styles.css`, `docs/STATE.md`, `docs/NAVIGATION_MAP.md`.
- Создан `docs/NAVIGATION_MAP.md` как текущая editorial navigation source of truth.
- Добавлены центральные immutable-настройки в `app.js`: `chroniclePeriods`, `pageNavigation`, approved location IDs и non-geographic location labels.
- `LOCAL ROUTES / 03` нормализован: explicit mappings имеют ровно три уникальных target ID; fallback сохраняет старую continuation-логику, но ограничен максимумом в три routes; пустой heading не рендерится.
- `CHRONICLE COMPASS` теперь использует единый `chroniclePeriods` массив; семь периодов не дублируются внутри отдельных page records.
- Добавлены компактные `ENTITY / PERIOD` cards для страниц с period mapping.
- Добавлены `LOCATION ROUTES / NN` и `LOCATION STATUS` на основе существующих topography IDs и утверждённых non-geographic labels.
- Существующие специализированные навигации сохранены: school index, relic index, proto-agent index, topography index, pre-error index, lexicon routes.
- Validation: `node --check app.js` PASS.
- Programmatic validation: records `87`, graph nodes `43`, page-only records `44`; duplicate page IDs `0`; unresolved navigation targets `0`; explicit local route problems `0`; self-routes `0`; chronicle periods `7`; missing period targets `0`; invalid location IDs `0`.
- Graph coordinates, graph edges, media references, canonical Markdown, TRACE, DISCOVERED, localStorage key schema, search semantics и publication output не изменялись.
- Live UI limitation: full browser walkthrough at `375` and `1440` was not repeated in this package; static validation completed all structural checks, and manual visual check on `4175` remains recommended for wrapping/overflow.
- Unresolved editorial mappings: none for the baseline navigation map; future packages may refine exact editorial routes.

## Пакет 5B.0.11 — navigation consistency and UI verification

- Статус: `PACKAGE 5B.0.11 IMPLEMENTED — LIVE UI CHECK REQUIRED`.
- Изменённые файлы: `app.js`, `docs/STATE.md`, `docs/NAVIGATION_MAP.md`, `scripts/validate-navigation.mjs`.
- Production code changes: исправлен технический дефект `locationIds` у девяти location pages — текущая локация больше не присутствует в собственных location routes; graph nodes, graph links, координаты, тексты и media references не изменялись.
- Documentation corrections: `HUMAN_TRACE` в `docs/NAVIGATION_MAP.md` синхронизирован с фактическим `period:"03"` в `app.js`; добавлены дата проверки, разрешённые location statuses, FORK validation, EPSILON validation, location records status.
- Добавлен повторяемый валидатор: `node scripts/validate-navigation.mjs`.
- Validation: `node --check app.js` PASS.
- Validation script PASS: records `87`, graph nodes `43`, page-only records `44`, duplicate IDs `0`, unresolved targets `0`, self-routes `0`, duplicate routes `0`, routes over limit `0`, empty local routes `0`, chronicle periods `7`, missing period targets `0`, invalid period mappings `0`, invalid location IDs `0`, invalid location statuses `0`, broken worldAxis targets `0`, broken EPSILON routes `0`, media missing `0`, broken specialized index targets `0`.
- EPSILON chain: PASS; `EPSILON_15A` remains between `EPSILON_15` and `EPSILON_16`.
- Location validation: checked `DUBNA`, `MOSCOW`, `TTK_0xMEM`, `SKOLKOVO`, `BAIKAL`, `KARELIA`, `VARANASI`, `SHENZHEN`, `ISFAHAN`; self-location routes corrected to `0`; invalid location IDs `0`; media references present.
- Specialized navigation checked statically: school index, relic index, proto-agent index, topography index, pre-error index, lexicon routes, brainrot routes.
- FORK validation: `FORK` exists, record type `glossary`; routes using `FORK` remain valid and are not unresolved.
- Live UI: `npm run preview` could not bind `127.0.0.1:4173` in the current sandbox (`PermissionError: Operation not permitted`); direct localhost probes for `4173` and `4175` are also blocked by sandbox networking. Therefore UI checks at `375`, `901`, and `1440` are not claimed as PASS and must be completed manually.
- Publication output not changed; `npm run publish` was not run.
- Deferred to `5B.0.12`: integration of additional location texts, additional location images, canonical location Markdown, editorial expansion of `TOPOGRAPHY`.

## Пакет 5B.0.11A — reader footer and error navigation

- Статус: `PACKAGE 5B.0.11A IMPLEMENTED — LIVE UI CHECK REQUIRED`.
- Изменённые файлы: `app.js`, `styles.css`, `docs/STATE.md`, `docs/NAVIGATION_MAP.md`, `scripts/validate-navigation.mjs`.
- Reader footer собран в единую область `#readerFooter`: специализированные индексы, `CHRONICLE COMPASS`, `ENTITY / PERIOD`, `ERROR SEQUENCE`, `LOCATION ROUTES / STATUS` и `LOCAL ROUTES / 03` больше не формируют набор разрозненных bordered-блоков.
- Separator cleanup: оставлен один горизонтальный разделитель перед полной footer navigation area; отдельные metadata/footer subsections используют spacing вместо верхних/нижних рамок; route-row separators сохраняются для списков.
- `ENTITY / PERIOD` получил действие `OPEN PERIOD →`, которое резолвится через центральный `chroniclePeriods` и не отображается, если period target совпадает с текущей страницей.
- Для всех `EPSILON_*` страниц добавлен dedicated `ERROR SEQUENCE`: previous error, current marker, next error, `OPEN ERROR INDEX → PRE_ERROR_ARCHIVE`; порядок берётся из `preErrorEventIds`, `EPSILON_15A` сохранён между `EPSILON_15` и `EPSILON_16`.
- Для `EPSILON_*` страниц `LOCAL ROUTES / 03` скрыт, чтобы не дублировать previous/next sequence navigation.
- Сохранены специализированные индексы: school, relic, proto-agent, topography, pre-error, lexicon, brainrot routes.
- Validation: `node --check app.js` PASS.
- Validation script PASS: records `87`, graph nodes `43`, page-only records `44`, duplicate IDs `0`, unresolved targets `0`, self-routes `0`, duplicate routes `0`, routes over limit `0`, empty local routes `0`, chronicle periods `7`, missing period targets `0`, invalid periods `0`, invalid location IDs `0`, invalid location statuses `0`, broken period actions `0`, broken EPSILON routes `0`, media missing `0`.
- Live UI limitation: `npm run preview` again failed to bind `127.0.0.1:4173` in the current sandbox with `PermissionError: Operation not permitted`; UI checks at `375`, `901`, and `1440` must be completed manually.
- Canonical Markdown, media files/references, graph coordinates, graph edges, categories, TRACE, DISCOVERED, localStorage schema, side menu and publication output were not changed.
