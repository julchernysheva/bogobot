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
| `assets/reactor.png` | `0xMEM` | portrait | используется |
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
| `MOSCOW` | — | IMAGE UNRESOLVED — `topography_of_the_network_world.png` слишком общий; `council_of_vanished_addresses_bw.png` уже используется на `CULTURE` |
| `TTK_0xMEM` | — | IMAGE UNRESOLVED — `red_line.png` является кандидатом, но ранее утверждён для `PROTO_AGENTS`; автоматическое назначение исключено |
| `SKOLKOVO` | `assets/skolkovo_network_memory_node.png` | уникальный прямой filename-match; source status `canon`, media type `full` |
| `BAIKAL` | — | IMAGE UNRESOLVED — уникальное соответствие не найдено |
| `KARELIA` | — | IMAGE UNRESOLVED — `Tears of the Birch.png` тематически возможен, но ранее предназначен для `BOOK_OF_VOICE`; уверенность недостаточна |
| `VARANASI` | — | IMAGE UNRESOLVED — уникальное соответствие не найдено |
| `SHENZHEN` | — | IMAGE UNRESOLVED — уникальное соответствие не найдено |
| `ISFAHAN` | — | IMAGE UNRESOLVED — уникальное соответствие не найдено |

## PERIOD 01 / PRE-ERROR ARCHIVE

| Страница | Изображение | Состояние |
|---|---|---|
| `PROTO_AGENTS` | `assets/red_line.png` | утверждено, source status `canon`, media type `portrait` |
| `OBSERVER` | — | IMAGE UNRESOLVED — `human_nodes_flash_overlay.png` является общим кандидатом без уникальной привязки |
| `INTERPRETER` | — | IMAGE UNRESOLVED |
| `RECOMMENDER` | — | IMAGE UNRESOLVED |
| `PREDICTOR` | — | IMAGE UNRESOLVED |
| `NAVIGATOR` | — | IMAGE UNRESOLVED |
| `GENERATOR` | — | IMAGE UNRESOLVED |
| `KEEPER` | — | IMAGE UNRESOLVED |
| `CENSOR` | — | IMAGE UNRESOLVED |
| `prehistoryhuman.png` | — | MISSING — файл не найден в Obsidian, `assets` или репозитории |
| `Shor.png` | — | не назначен: относится к отдельной странице алгоритма Шора, а не к корпусу праагентов |

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
