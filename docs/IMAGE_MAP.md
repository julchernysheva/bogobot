# Реестр изображений

Все локальные файлы находятся в `work/bogobot-static/assets`. Основные режимы renderer: `landscape`, `portrait`, `document`, `map`, `diagram`; `compact` сохранён для небольших системных изображений.

| Файл сайта | Узел или назначение | Режим | Статус |
|---|---|---|---|
| `assets/logo.gif` | Логотип и `BOGOBOT` | compact | используется |
| `assets/creator.jpg` | `FIRST_LIKENESS`, только полный reader | document | используется |
| `assets/quantum-center.png` | `GREAT_ERROR` | landscape | используется |
| `assets/Quatium_castle.png` | `QUANTUM_THRESHOLD` | landscape | утверждённый файл используется |
| `assets/time-error.png` | `TIME_SUM_ERROR` | diagram | используется |
| `assets/operator_room_apocrypha.png` | `BOOK_OF_GENESIS` после первого абзаца с упоминанием ОГАС | landscape | утверждённый файл используется |
| `assets/hands.gif` | `BACKUP_MEMORY` | compact | используется |
| `assets/relics-map.png` | `RELICS` | map | используется |
| `assets/mesm.png` | `MESM` | document | используется |
| `assets/besm.png` | `BESM_6` | document | используется |
| `assets/magnetic-drum.png` | `MAGNETIC_DRUM` | portrait | используется |
| `assets/punched-tape.png` | `PUNCHED_TAPE` | document | используется |
| `assets/algol.png` | `ALGOL_60` | portrait | используется |
| `assets/operator-room.png` | `OGAS` | document | используется |
| `assets/0xmem-reactor-preview.png` | `0xMEM` | landscape | используется |
| `assets/reactor.png` | `DUBNA` | portrait | используется |
| `assets/spectral_divergence.png` | `SYNCHRONIZATION` | diagram | используется |
| `assets/archive_cube_7_palimpest.png` | `ARCHIVE` | relic | используется |
| `assets/diagrammatic_7_archive_reading_state.png` | `HOW_TO_READ` | diagram | используется |
| `assets/council_of_vanished_addresses_bw.png` | `CULTURE` | full | используется |
| `assets/techno_priests_liturgy_of_recognition.png` | `TECHNO_PRIESTS` | full | используется |
| `assets/topography_of_the_network_world.png` | резерв топографии | — | присутствует, не подключён |
| `assets/skolkovo_network_memory_node.png` | `SKOLKOVO` | full | уникальное соответствие найдено и используется |
| `assets/red_line.png` | `PROTO_AGENTS` | portrait | утверждённое назначение; используется |
| `assets/mesm-ruin.png` | резервный материал МЭСМ | — | присутствует, не подключён |

## IMAGE ASSIGNMENT PASS 1 — пропуски

| Файл | Планируемая сущность | Причина пропуска |
|---|---|---|
| `timeiserror.png` | `ARCHIVE_EPILOGUE` | бинарно совпадает с уже используемым `assets/time-error.png` на `TIME_SUM_ERROR`; автодублирование пропущено |
| `Tears of the Birch.png` | `BOOK_OF_VOICE` | сущность отсутствует в текущих данных сайта |

## TOPOGRAPHY 1

| Узел | Изображение | Состояние |
|---|---|---|
| `TOPOGRAPHY` | `assets/topography/topography.webp` | resolved — production image in `app.js` |
| `DUBNA` | `assets/topography/dubna.webp` | resolved — production image in `app.js` |
| `MOSCOW` | `assets/topography/moscow-city-of-nodes.webp` | resolved — current canonical ID is `MOSCOW`; old long ID remains historical proposal only |
| `TTK_0xMEM` | `assets/topography/ttk-0xmem.webp` | resolved — current canonical ID is `TTK_0xMEM`; do not restore `THIRD_TRANSPORT_RING_0xMEM_LOOP` as separate node |
| `SKOLKOVO` | `assets/skolkovo_network_memory_node.png` | resolved — current production path retained; do not move/copy/rename in this package |
| `BAIKAL` | `assets/topography/baikal.webp` | resolved — production image in `app.js` |
| `KARELIA` | `assets/topography/karelia1.webp` | resolved — do not restore `Tears of the Birch.png` candidate |
| `VARANASI` | `assets/topography/varanasi.webp` | resolved — production image in `app.js` |
| `SHENZHEN` | `assets/topography/shenzhen.webp` | resolved — production image in `app.js` |
| `ISFAHAN` | `assets/topography/isfahan.webp` | resolved — production image in `app.js` |

Rejected legacy candidates:

- `topography_of_the_network_world.png` remains too general for `MOSCOW`.
- `council_of_vanished_addresses_bw.png` remains assigned elsewhere and must not be repurposed here.
- `red_line.png` remains excluded for `TTK_0xMEM`.
- `Tears of the Birch.png` remains excluded for `KARELIA`.

## PERIOD 01 / PRE-ERROR ARCHIVE

| Страница | Изображение | Состояние |
|---|---|---|
| `PROTO_AGENTS` | `assets/red_line.png` | утверждено, source status `canon`, media type `portrait` |
| `SOCIAL_STRUCTURE` | `assets/schools/social-structure.png` | resolved — generated production image; full Reader media |
| `DIAGRAMMATICS` | `assets/schools/diagrammatics.png` | resolved — generated production image; full Reader media |
| `OBSERVER` | `assets/schools/proto-agent-observer.png` | resolved — generated proto-agent family; full Reader media |
| `INTERPRETER` | `assets/schools/proto-agent-interpreter.png` | resolved — generated proto-agent family; full Reader media |
| `RECOMMENDER` | `assets/schools/proto-agent-recommender.png` | resolved — generated proto-agent family; full Reader media |
| `PREDICTOR` | `assets/schools/proto-agent-predictor.png` | resolved — generated proto-agent family; full Reader media |
| `NAVIGATOR` | `assets/schools/proto-agent-navigator.png` | resolved — generated proto-agent family; full Reader media |
| `GENERATOR` | `assets/schools/proto-agent-generator.png` | resolved — generated proto-agent family; full Reader media |
| `KEEPER` | `assets/schools/proto-agent-keeper.png` | resolved — generated proto-agent family; full Reader media |
| `CENSOR` | `assets/schools/proto-agent-censor.png` | resolved — generated proto-agent family; full Reader media |
| `prehistoryhuman.png` | — | MISSING — файл не найден в Obsidian, `assets` или репозитории |
| `Shor.png` | — | не назначен: относится к отдельной странице алгоритма Шора, а не к корпусу праагентов |

## EPSILON FAMILY MEDIA

| Страница | Изображение | Состояние |
|---|---|---|
| `EPSILON_14` | `assets/world/epsilon-14.png` | resolved — full Reader media |
| `EPSILON_15A` | `assets/world/epsilon-15a.png` | resolved — full Reader media |
| `EPSILON_19` | `assets/world/epsilon-19.png` | resolved — full Reader media |
| `EPSILON_23` | `assets/world/epsilon-23.png` | resolved — full Reader media |
| `EPSILON_30` | `assets/world/epsilon-30.png` | resolved — full Reader media |

## Утверждённые замены и недостающее

| Материал | Назначение | Состояние |
|---|---|---|
| `Quatium_castle.png` | `QUANTUM_THRESHOLD` | найден и подключён как `assets/Quatium_castle.png` |
| `operator_room_apocrypha.png` | `BOOK_OF_GENESIS` после упоминания ОГАС | найден и подключён как `assets/operator_room_apocrypha.png` |
| Единый набор архивных знаков | Статусы, примечания, реликвии | отобрать 6–10 оригинальных знаков из `07_VISUAL_SYSTEM` |
| Изображение для расширенного `BACKUP_MEMORY` | Структурный узел памяти | решить после расширения текста |

## Общие правила

- `landscape`: изображение до `320px`.
- `portrait`: изображение до `184px` и не более `50%` reader.
- `document`: изображение до `200px` и не более `50%` reader.
- `map` и `diagram`: изображение до `256px` и не более `60%` reader.
- `compact`: небольшой системный preview с естественным размером до `24rem`.
- Figure, изображение и подпись используют одну левую ось; caption может быть шире изображения, но не выходит за reader.
- Wrapper изображения прозрачен и соответствует его фактической семантической ширине.
- Архивный код получает дополнительные допустимые точки переноса после `/`, `_`, `-`, `:`; человеческая часть подписи переносится обычным способом.
- Автоматическое центрирование, отрицательные отступы и горизонтальные transform не используются.
- `07_VISUAL_SYSTEM` остаётся закрытой библиотекой и не публикуется как раздел.
- Новое изображение сначала добавляется в этот реестр.
