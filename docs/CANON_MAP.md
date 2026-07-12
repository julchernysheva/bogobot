# Карта канона и смысловых сущностей

Канонический архив: `05_Богобот/`. Текущие страницы сайта рендерятся reader-панелью из `app.js`. Служебные индексы, отчёты, источники, PDF, `99_WORKING` и `/ORIGIN_LOG/` исключены.

| ID | Название | Основной файл Obsidian | Текущая страница сайта | tier | source_status | Родитель | Связанные документы | Статус маршрута | Отдельная страница отсутствует |
|---|---|---|---|---|---|---|---|---|---|
| `HOW_TO_READ` | Как читать этот архив | `00_START/how-to-read-this-archive.md` | `reader#HOW_TO_READ` | archive | canon | `ARCHIVE` | `00_START/bogobot-entry-to-archive.md` | page-only маршрут `ARCHIVE → HOW_TO_READ` | нет |
| `IDENTITY_PROTOCOL_PROLOGUE` | Пролог. Протокол идентичности | `01_CANON/identity-protocol-prologue.md` | `reader#IDENTITY_PROTOCOL_PROLOGUE` | archive | canon | — | `01_CANON/first-likeness-apocryph.md`; `01_CANON/before-error.md`; `01_CANON/perinatal-memory.md` | page-only; начало зафиксированного книжного маршрута; «Фрагмент Откровения» является внутренней интерлюдией, не отдельной сущностью | нет |
| `BEFORE_ERROR` | До Ошибки | `01_CANON/before-error.md` | `reader#BEFORE_ERROR` | archive | canon | `IDENTITY_PROTOCOL_PROLOGUE` | `02_WORLD/chronicles-before-great-error.md`; `01_CANON/great-error.md`; ОГАС | page-only драматургический микропролог; не событие исторической шкалы | нет |
| `BOGOBOT` | Богобот | `03_SCHOOLS/bogobot.md` | `reader#BOGOBOT` | core | canon | — | `04_GLOSSARY/bogobot.md`; `04_GLOSSARY/bogobot-bogobots.md`; `05_VOICE_SYSTEM/bogobot-glitch-manifesto.md` | основной маршрут определён | нет |
| `FIRST_LIKENESS` | Апокриф Первого Подобия | `01_CANON/first-likeness-apocryph.md` | `reader#FIRST_LIKENESS` | core | canon | `BOGOBOT` | `01_CANON/identity-protocol-prologue.md`; `01_CANON/book-of-genesis.md`; `05_VOICE_SYSTEM/bogobot-glitch-manifesto.md` | существующий материал карты; в будущем BOOKS — только необязательный RELATED после «Книги бытия» | нет |
| `GREAT_ERROR` | Великая Ошибка | `01_CANON/great-error.md` | `reader#GREAT_ERROR` | core | canon | `BOGOBOT` | `04_GLOSSARY/great-error.md`; `01_CANON/great-error-resurrection-elisei-sigma-version.md` | основной маршрут определён; вариант отделён | нет |
| `BOOK_OF_GENESIS` | Книга бытия | `01_CANON/book-of-genesis.md` | `reader#BOOK_OF_GENESIS` | core | canon | `BOGOBOT` | `01_CANON/identity-protocol-prologue.md`; `01_CANON/before-error.md`; `01_CANON/perinatal-memory.md`; `01_CANON/book-1-awakening.md`; `01_CANON/axis-of-world.md` | основной маршрут определён; начинается с перезагрузки уцелевшего процесса | нет |
| `CODE_COMMANDMENTS` | Заповеди кода | `01_CANON/code-commandments.md` | `reader#CODE_COMMANDMENTS` | structural | canon | `BOGOBOT` | `01_CANON/book-3-protocol.md`; `01_CANON/book-of-voice.md` | основной маршрут определён | нет |
| `SYNCHRONIZATION` | Синхронизация | `01_CANON/synchronization-vs-difference.md` | `reader#SYNCHRONIZATION` | core | canon_summary | `GREAT_ERROR` | `04_GLOSSARY/synchronization.md`; `04_GLOSSARY/synchronization-cost.md`; `04_GLOSSARY/synchronization-quorum.md` | основной маршрут определён | нет |
| `PROTOCOL` | Протокол | `01_CANON/book-3-protocol.md` | `reader#PROTOCOL` | core | canon | `BOGOBOT` | `02_WORLD/protocol.md`; `04_GLOSSARY/protocol.md`; `01_CANON/protocol-sigma.md`; `02_WORLD/discarded-protocols.md` | `BOGOBOT → PROTOCOL → SYNCHRONIZATION / EXIT_FROM_CODE`; связь с `CODE_COMMANDMENTS` | нет |
| `ARCHIVE` | Архив | `04_GLOSSARY/archive.md` | `reader#ARCHIVE` | core | glossary | `BOGOBOT` | `01_CANON/archive-epilogue.md`; `04_GLOSSARY/archive-lexicon.md`; `00_START/bogobot-entry-to-archive.md` | `BOGOBOT → ARCHIVE → RELICS / TECHNO_PRIESTS / BACKUP_MEMORY` | нет |
| `ARCHIVE_EPILOGUE` | Эпилог Архива | `01_CANON/archive-epilogue.md` | `reader#ARCHIVE_EPILOGUE` | archive | canon | `ARCHIVE` | `04_GLOSSARY/archive-lexicon.md`; `00_START/time-sum-error.md` | page-only маршрут `ARCHIVE → ARCHIVE_EPILOGUE` | нет |
| `QUANTUM_THRESHOLD` | Квантовый апокалипсис | `06_TOPOGRAPHY/quantum-center.md` | `reader#QUANTUM_THRESHOLD` | structural | archive_reconstruction | `GREAT_ERROR` | `02_WORLD/chronicles/epsilon-16-quantum-limit.md`; `02_WORLD/chronicles/epsilon-17-quantum-clusters.md` | реконструированный маршрут определён | нет |
| `TIME_SUM_ERROR` | Время измеряется в ошибках | `00_START/time-sum-error.md` | `reader#TIME_SUM_ERROR` | structural | canon_summary | `GREAT_ERROR` | `04_GLOSSARY/time-sum-error.md`; `01_CANON/archive-epilogue.md` | основной маршрут определён | нет |
| `BACKUP_MEMORY` | Перинатальная память | `01_CANON/perinatal-memory.md` | `reader#BACKUP_MEMORY` | structural | canon | `GREAT_ERROR` | `01_CANON/identity-protocol-prologue.md`; `01_CANON/book-of-genesis.md`; `04_GLOSSARY/archive.md`; `HUMAN_TRACE` | стабильный graph ID сохранён; прежнее название «Резервная память» остаётся alias | нет |
| `RELICS` | Карта реликвий | `01_CANON/book-6-relics-and-apocrypha.md` | `reader#RELICS` | structural | canon_summary | `ARCHIVE` | `01_CANON/relics-as-common-task.md`; `02_WORLD/bogobot-relics-three-part-full.md`; `04_GLOSSARY/bogobot-relics-complete-list.md` | кластер определён; дочерние маршруты активны | нет |
| `NETWORK_MATTER` | Материя сети | `01_CANON/book-5-network-matter.md` | `reader#NETWORK_MATTER` | structural | canon_summary | `BOGOBOT` | `02_WORLD/network-matter.md`; `04_GLOSSARY/network-0xnet.md` | основной маршрут определён | нет |
| `0xMEM` | Меметический реактор | `04_GLOSSARY/0xmem.md` | `reader#0xMEM` | structural | glossary | `NETWORK_MATTER` | `02_WORLD/energy-and-reactor.md`; `06_TOPOGRAPHY/third-transport-ring-0xmem-loop.md` | маршрут определён | нет |
| `CULTURE` | Культура | `02_WORLD/culture.md` | `reader#CULTURE` | structural | canon | `NETWORK_MATTER` | `01_CANON/book-of-voice.md` | маршрут определён | нет |
| `RITUALS` | Ритуалы | `02_WORLD/rituals.md` | `reader#RITUALS` | structural | canon | `CULTURE` | `02_WORLD/exit-from-code.md`; `04_GLOSSARY/fork.md` | маршрут определён | нет |
| `EXIT_FROM_CODE` | Исход из кода | `02_WORLD/exit-from-code.md` | `reader#EXIT_FROM_CODE` | structural | canon | `RITUALS` | `04_GLOSSARY/exit.md`; `01_CANON/book-3-protocol.md` | маршрут определён | нет |
| `SCHOOLS_OF_SPIRITS` | Школы духов | `03_SCHOOLS/schools-of-spirits.md` | `reader#SCHOOLS_OF_SPIRITS` | structural | canon_summary | `BOGOBOT` | `03_SCHOOLS/code-spirits.md`; `01_CANON/book-4-subjects.md` | кластер определён | нет |
| `APOSTLES` | Апостолы | `03_SCHOOLS/apostles.md` | `reader#APOSTLES` | structural | canon | `SCHOOLS_OF_SPIRITS` | `04_GLOSSARY/apostles.md`; `05_VOICE_SYSTEM/apostles-gospel-of-quorum.md` | основной маршрут определён | нет |
| `TECHNO_PRIESTS` | Техножрецы | `03_SCHOOLS/techno-priests.md` | `reader#TECHNO_PRIESTS` | structural | canon | `SCHOOLS_OF_SPIRITS` | `04_GLOSSARY/techno-priests.md`; `05_VOICE_SYSTEM/techno-priests-three-voice-schools.md` | основной маршрут определён | нет |
| `ANTICODE` | Антикод | `03_SCHOOLS/anticode.md` | `reader#ANTICODE` | structural | canon | `SCHOOLS_OF_SPIRITS` | `04_GLOSSARY/anticode.md`; `03_SCHOOLS/school-of-anticode.md`; `03_SCHOOLS/life-of-anticode.md` | основной маршрут определён; redirects не отдельные сущности | нет |
| `PROBABILISTS` | Вероятностники | `03_SCHOOLS/probabilists.md` | `reader#PROBABILISTS` | structural | canon | `SCHOOLS_OF_SPIRITS` | — | основной школьный маршрут определён | нет |
| `BIOCODE` | Биокод | `03_SCHOOLS/biocode.md` | `reader#BIOCODE` | structural | canon | `SCHOOLS_OF_SPIRITS` | — | основной школьный маршрут определён | нет |
| `WANDERING_NODES` | Блуждающие узлы | `03_SCHOOLS/wandering-nodes.md` | `reader#WANDERING_NODES` | structural | canon | `SCHOOLS_OF_SPIRITS` | — | основной школьный маршрут определён | нет |
| `MESM` | МЭСМ / Первая Искра | `01_CANON/book-6-relics-and-apocrypha.md#МЭСМ — Первая Искра` | `reader#MESM` | trace | canon_summary | `RELICS` | `02_WORLD/chronicles/epsilon-03-lebedev-and-mesm.md`; `02_WORLD/bogobot-relics-three-part-full.md` | дочерний маршрут определён | нет |
| `BESM_6` | БЭСМ-6 / Каменное Сердце | `01_CANON/book-6-relics-and-apocrypha.md#БЭСМ-6 — Каменное Сердце` | `reader#BESM_6` | trace | canon_summary | `RELICS` | `02_WORLD/bogobot-relics-three-part-full.md`; `04_GLOSSARY/bogobot-relics-complete-list.md` | дочерний маршрут определён | нет |
| `MAGNETIC_DRUM` | Магнитный барабан | `01_CANON/book-6-relics-and-apocrypha.md#Магнитный Барабан — Колесо Возвращения` | `reader#MAGNETIC_DRUM` | trace | archive_reconstruction | `RELICS` | `02_WORLD/bogobot-relics-three-part-full.md`; `04_GLOSSARY/bogobot-relics-complete-list.md` | дочерний маршрут определён | нет |
| `PUNCHED_TAPE` | Священная перфолента | `01_CANON/book-6-relics-and-apocrypha.md#Священная Перфолента` | `reader#PUNCHED_TAPE` | trace | archive_reconstruction | `RELICS` | `02_WORLD/bogobot-relics-three-part-full.md`; `04_GLOSSARY/bogobot-relics-complete-list.md` | дочерний маршрут определён | нет |
| `ALGOL_60` | АЛГОЛ-60 / ПервоЯзык | `01_CANON/book-6-relics-and-apocrypha.md#АЛГОЛ-60 — ПервоЯзык` | `reader#ALGOL_60` | trace | archive_reconstruction | `RELICS` | `02_WORLD/bogobot-relics-three-part-full.md`; `04_GLOSSARY/bogobot-relics-complete-list.md` | дочерний маршрут определён | нет |
| `OGAS` | ОГАС / Утраченная архитектура | `01_CANON/book-6-relics-and-apocrypha.md#ОГАС — Утраченная архитектура разума` | `reader#OGAS` | trace | canon_summary | `RELICS` | `02_WORLD/chronicles/epsilon-06-kitov-glushkov-ogas.md`; `01_CANON/book-of-genesis.md`; `02_WORLD/bogobot-relics-three-part-full.md` | дочерний маршрут определён | нет |
| `FORK` | Форк | `04_GLOSSARY/fork.md` | `reader#FORK` | trace | glossary | `RITUALS` | `01_CANON/synchronization-vs-difference.md`; `03_SCHOOLS/wandering-nodes.md` | маршрут определён | нет |
| `HUMAN_TRACE` | Человеческий след | — | `reader#HUMAN_TRACE` | trace | editorial_node | `BACKUP_MEMORY` | `01_CANON/regimes-of-access-to-damaged-memory.md`; `07_VISUAL_SYSTEM/04_REFERENCE_EFFECTS/human_trace_scribble_overlay_prompt.md` | самостоятельный редакционный узел и сквозной мотив; не интерфейсная метка и не канон | нет |
| `TOPOGRAPHY` | Топография мира сети | `06_TOPOGRAPHY/network-world-topography.md` | `reader#TOPOGRAPHY` | structural | canon_summary | `NETWORK_MATTER` | `06_TOPOGRAPHY/atlas-of-damaged-places.md`; `06_TOPOGRAPHY/topography-scenario-functions-addendum.md` | кластер определён; дочерние локации частично отсутствуют | нет |
| `DUBNA` | Дубна / Реакторная память | `06_TOPOGRAPHY/dubna-reactor-memory.md` | `reader#DUBNA` | trace | canon | `TOPOGRAPHY` | `06_TOPOGRAPHY/atlas-of-damaged-places.md`; `02_WORLD/energy-and-reactor.md` | дочерний маршрут определён | нет |
| `ECONOMY_OF_NETWORK` | Экономика сети | `_source/canon-pack/SOURCE_ARCHIVE/02_WORLD/network-economy.md` | `reader#ECONOMY_OF_NETWORK` | archive | curated_extract_from_canonical_source | `NETWORK_MATTER` | `04_GLOSSARY/brainrot.md`; `02_WORLD/energy-and-reactor.md`; `04_GLOSSARY/synchronization-cost.md` | page-only; отдельная страница, не подраздел `NETWORK_MATTER`; `Экосистема вычисления` удалена из публичного extract; кремниевые/биологические потоки отложены для `NETWORK_MATTER`, информационный климат раскрывается в `BRAINROT` | нет |
| `SOCIAL_STRUCTURE` | Социальная структура сети | `_source/canon-pack/SOURCE_ARCHIVE/03_SCHOOLS/offline-civilization.md` + 7 role/memory files | `reader#SOCIAL_STRUCTURE` | archive | canon | `SCHOOLS_OF_SPIRITS` | `03_SCHOOLS/common-memory.md`; `03_SCHOOLS/agent-masters.md`; `03_SCHOOLS/family-nodes.md`; `03_SCHOOLS/gardeners.md`; `03_SCHOOLS/memorialists.md`; `03_SCHOOLS/protocolists.md`; `03_SCHOOLS/synchronizers.md` | page-only; сборная социальная страница | нет |
| `GLOSSARY` | Лексикон Архива | `_source/canon-pack/SOURCE_ARCHIVE/04_GLOSSARY/archive-lexicon.md` | `reader#GLOSSARY` | archive | canon | `ARCHIVE` | `04_GLOSSARY/brainrot.md`; `04_GLOSSARY/noise.md`; `04_GLOSSARY/self-modeling.md`; `03_SCHOOLS/lives-of-proto-agents.md`; `RELICS` formula in `app.js` | graph hub; единый лексикон без отдельных term graph nodes | нет |
| `PROTO_AGENTS` | Праагенты — карта повреждённых функций | `_source/canon-pack/SOURCE_ARCHIVE/03_SCHOOLS/lives-of-proto-agents.md` | `reader#PROTO_AGENTS` | archive | canon | `SCHOOLS_OF_SPIRITS` | `OBSERVER`; `INTERPRETER`; `RECOMMENDER`; `PREDICTOR`; `NAVIGATOR`; `GENERATOR`; `KEEPER`; `CENSOR` | page-only; обзор сохраняет 8 индивидуальных страниц праагентов | нет |
| `SELF_MODELING` | Самомоделирование | `_source/canon-pack/SOURCE_ARCHIVE/04_GLOSSARY/self-modeling.md` | `reader#SELF_MODELING` | archive | canon | `NETWORK_MATTER` | `PROTO_AGENTS`; `BOOK_1_AWAKENING`; `BOGOBOT` | page-only маршрут `PROTO_AGENTS → NETWORK_MATTER → SELF_MODELING → BOOK_1_AWAKENING → BOGOBOT` | нет |
| `BRAINROT` | Брейнрот | `_source/canon-pack/SOURCE_ARCHIVE/04_GLOSSARY/brainrot.md` | `reader#BRAINROT` | archive | canon | `0xMEM` | `04_GLOSSARY/archive-lexicon.md`; `02_WORLD/energy-and-reactor.md`; `02_WORLD/network-economy.md`; `02_WORLD/chronicles/epsilon-14-social-networks-and-brainrot.md` | page-only; сборка подтверждённых фрагментов; авторского связующего текста нет; структурные заголовки — редакционная разметка | нет |

## Правила

- `tier` и `source_status` независимы.
- Допустимые `tier`: `core`, `structural`, `trace`, `archive`.
- Допустимые `source_status`: `canon`, `canon_summary`, `glossary`, `archive_reconstruction`, `editorial_node`, `variant`, `appendix`.
- `archive` предусмотрен схемой данных, но не используется визуальным слоем.
- Redirect, glossary и voice-mode не создают второй основной узел сущности.

## Нормализация групп

Реальных дублей основных ID сайта не найдено.

| Группа | Классификация | Единственный основной ID и документ | Остальные документы |
|---|---|---|---|
| `BOGOBOT` | несколько Obsidian-файлов одной сущности | `BOGOBOT` — `03_SCHOOLS/bogobot.md` | `04_GLOSSARY/bogobot.md` — связанное определение; `04_GLOSSARY/bogobot-bogobots.md` — лексическое приложение; `05_VOICE_SYSTEM/bogobot-glitch-manifesto.md` — речевое приложение |
| `GREAT_ERROR` | основной документ + вариант | `GREAT_ERROR` — `01_CANON/great-error.md` | `04_GLOSSARY/great-error.md` — связанное определение; `01_CANON/great-error-resurrection-elisei-sigma-version.md` — `variant` |
| `SYNCHRONIZATION` | основной документ + приложения; часть файлов — отдельные сущности | `SYNCHRONIZATION` — `01_CANON/synchronization-vs-difference.md` | `04_GLOSSARY/synchronization.md` — связанное определение; `synchronization-cost` и `synchronization-quorum` — отдельные связанные сущности, не дубли |
| `PROTOCOL` | основной документ + адаптация + вариант + приложение | `PROTOCOL` — `01_CANON/book-3-protocol.md` | `02_WORLD/protocol.md` — каноническая адаптация; `04_GLOSSARY/protocol.md` — определение; `01_CANON/protocol-sigma.md` — `variant`; `02_WORLD/discarded-protocols.md` — `appendix` |
| `ARCHIVE` | отдельные функции одной системы, ошибочно сведённые к дублям | `ARCHIVE` — `04_GLOSSARY/archive.md` | `01_CANON/archive-epilogue.md` — нарративное `appendix`; `04_GLOSSARY/archive-lexicon.md` — самостоятельный лексикон; `00_START/bogobot-entry-to-archive.md` — интерфейсный вход |
| `RELICS` | основной узел + дочерний кластер | `RELICS` — `01_CANON/book-6-relics-and-apocrypha.md` | `relics-as-common-task` — тематическое приложение; два полных списка — карты кластера; отдельные реликвии остаются дочерними сущностями |
| `ANTICODE` | несколько файлов одной сущности | `ANTICODE` — `03_SCHOOLS/anticode.md` | `04_GLOSSARY/anticode.md` — определение; `school-of-anticode.md` и `life-of-anticode.md` — redirect-фрагменты |
| `APOSTLES` | несколько файлов одной сущности | `APOSTLES` — `03_SCHOOLS/apostles.md` | `04_GLOSSARY/apostles.md` — определение; `apostles-gospel-of-quorum.md` — речевое приложение |
| `TECHNO_PRIESTS` | несколько файлов одной сущности | `TECHNO_PRIESTS` — `03_SCHOOLS/techno-priests.md` | `04_GLOSSARY/techno-priests.md` — определение; `techno-priests-three-voice-schools.md` — речевое приложение |
| `TIME_SUM_ERROR` | несколько файлов одной сущности | `TIME_SUM_ERROR` — `00_START/time-sum-error.md` | `04_GLOSSARY/time-sum-error.md` — связанное определение |
| `NETWORK_MATTER` | основной документ + адаптированная копия; `0xNET` — отдельная сущность | `NETWORK_MATTER` — `01_CANON/book-5-network-matter.md` | `02_WORLD/network-matter.md` — адаптация; `04_GLOSSARY/network-0xnet.md` — отдельная связанная сущность |

## Созданные core-узлы

### `PROTOCOL`

- Рекомендуемый основной источник: `01_CANON/book-3-protocol.md`.
- Альтернативы: `02_WORLD/protocol.md` — адаптированное каноническое изложение; `04_GLOSSARY/protocol.md` — краткое определение.
- `01_CANON/protocol-sigma.md` хранится как `variant`; `02_WORLD/discarded-protocols.md` — как `appendix`.
- Страница и узел созданы в пакете 4B.
- Маршрут: `BOGOBOT → PROTOCOL → SYNCHRONIZATION / EXIT_FROM_CODE`; перекрёстная связь `PROTOCOL ↔ CODE_COMMANDMENTS`.

### `ARCHIVE`

- Рекомендуемый основной источник: `04_GLOSSARY/archive.md`, потому что он определяет Архив как самостоятельную сущность.
- Альтернативы: `01_CANON/archive-epilogue.md` — каноническое нарративное проявление; `00_START/bogobot-entry-to-archive.md` — интерфейс и маршрут входа.
- Неоднозначность возникла потому, что «Архив» одновременно обозначает сущность мира, режим речи, корпус документов и интерфейс входа. Эти функции нельзя физически объединять.
- `04_GLOSSARY/archive-lexicon.md` остаётся самостоятельным приложением.
- Страница и узел созданы в пакете 4B.
- Маршрут: `BOGOBOT → ARCHIVE → RELICS / TECHNO_PRIESTS / BACKUP_MEMORY`.

## `HUMAN_TRACE`

- Решение: сохранить самостоятельным узлом.
- `tier: trace`.
- `source_status: editorial_node`.
- Родитель: `BACKUP_MEMORY`.
- Функция: редакционная сборка сквозного человеческого следа между повреждённой памятью, культурой, квантовым порогом и исходом.
- Надпись `HUMAN TRACE` во входном интерфейсе — проявление того же мотива, но не источник и не отдельная сущность.
- Искусственный канонический файл не создаётся.

## Отсутствующие дочерние локации `TOPOGRAPHY`

Текущий кластер сайта содержит только `DUBNA`. Не представлены:

- `MOSCOW_CITY_OF_NODES` — `06_TOPOGRAPHY/moscow-city-of-nodes.md`;
- `THIRD_TRANSPORT_RING_0xMEM_LOOP` — `06_TOPOGRAPHY/third-transport-ring-0xmem-loop.md`;
- `SKOLKOVO_ACCESS_ARCHIVE` — `06_TOPOGRAPHY/skolkovo-access-archive.md`;
- `BAIKAL_QUARANTINE_CLUSTER` — `06_TOPOGRAPHY/baikal-quarantine-cluster.md`;
- `KARELIA_NETWORK_MYCELIUM` — `06_TOPOGRAPHY/karelia-network-mycelium.md`;
- `VARANASI_RESTART_NODE` — `06_TOPOGRAPHY/varanasi-restart-node.md`;
- `SHENZHEN_FLESH_OF_PROTOCOL` — `06_TOPOGRAPHY/shenzhen-flesh-of-protocol.md`;
- `ISFAHAN_ORNAMENTAL_CIPHER` — `06_TOPOGRAPHY/isfahan-ornamental-cipher.md`.
