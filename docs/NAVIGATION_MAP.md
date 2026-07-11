# NAVIGATION MAP

Checked: 2026-06-25

## BOOKS STATIC ROUTE

Generated route:

`books/ → prologue → before-error → great-error → genesis → voice → epilogue`

- Ровно шесть частей: `P → −I → 00 → I → II → ∞`.
- `fragment-otkroveniya` является внутренним anchor пролога, не route item.
- `FIRST_LIKENESS` показан после `genesis` как optional RELATED без `href`; он не входит в PREVIOUS/NEXT и progress.
- C3: `BOOKS` доступен из системной строки основного сайта между `ARCHIVE ENTRY` и `SEARCH`.
- `MAP` возвращает из индекса и каждой книги на основной сайт.
- Ключевые понятия открывают существующие узлы через `index.html?node=NODE_ID`.
- Термины Лексикона открываются через `index.html?node=GLOSSARY&term=TERM`.
- Внутренние ссылки на другие части маршрута остаются внутри BOOKS.

## CANONICAL BOOK ROUTE

Зафиксированный маршрут:

`IDENTITY_PROTOCOL_PROLOGUE → BEFORE_ERROR → GREAT_ERROR → BOOK_OF_GENESIS → BOOK_OF_VOICE → ARCHIVE_EPILOGUE`

- `IDENTITY_PROTOCOL_PROLOGUE` и `BEFORE_ERROR` — page-only записи и не входят в графовые фильтры.
- `BEFORE_ERROR` — короткий драматургический микропролог; `PRE_ERROR_ARCHIVE` остаётся полной исторической шкалой.
- «Фрагмент Откровения» находится внутри `IDENTITY_PROTOCOL_PROLOGUE`; отдельного ID, страницы и прогресса у него нет.
- Полный `FIRST_LIKENESS` остаётся существующим узлом карты и не входит в обязательный маршрут из шести частей. Для будущего BOOKS он зафиксирован только как необязательный RELATED после `BOOK_OF_GENESIS`.
- BOOKS UI для этого маршрута ещё не реализован.

## CHRONICLE PERIODS

- 01 → PRE_ERROR_ARCHIVE — PRE-ERROR ARCHIVE
- 02 → QUANTUM_THRESHOLD — QUANTUM THRESHOLD
- 03 → GREAT_ERROR — GREAT ERROR
- 04 → BOOK_1_AWAKENING — EARLY NETWORK
- 05 → SCHOOLS_OF_SPIRITS — SCHOOLS ERA
- 06 → NEWEST_HISTORY — NEWEST HISTORY
- 07 → ARCHIVE — CURRENT ARCHIVE

## PAGE TO PERIOD

- PRE_ERROR_ARCHIVE, EPSILON_00–EPSILON_19, EPSILON_15A, RELICS, MESM, BESM_6, MAGNETIC_DRUM, PUNCHED_TAPE, ALGOL_60, OGAS, PROTO_AGENTS → 01
- QUANTUM_THRESHOLD → 02
- GREAT_ERROR, TIME_SUM_ERROR, BACKUP_MEMORY, HUMAN_TRACE → 03
- BOGOBOT, FIRST_LIKENESS, BOOK_OF_GENESIS, NETWORK_MATTER, 0xMEM, BOOK_1_AWAKENING, SELF_MODELING, CODE_COMMANDMENTS → 04
- SCHOOLS_OF_SPIRITS, APOSTLES, ANTICODE, PROBABILISTS, TECHNO_PRIESTS, BIOCODE, WANDERING_NODES, CULTURE, RITUALS, BOOK_4_SUBJECTS, BOOK_OF_VOICE, DIAGRAMMATICS, SOCIAL_STRUCTURE, KARELIA → 05
- NEWEST_HISTORY, EXIT_FROM_CODE, ECONOMY_OF_NETWORK, BRAINROT, DISCARDED_PROTOCOLS, SKOLKOVO, SHENZHEN → 06
- ARCHIVE, PROTOCOL, SYNCHRONIZATION, TOPOGRAPHY, DUBNA, MOSCOW, TTK_0xMEM, BAIKAL, VARANASI, ISFAHAN, AXIS_OF_WORLD, GLOSSARY, HOW_TO_READ, ARCHIVE_EPILOGUE → 07

## PAGE TO LOCATION

- BOOK_OF_GENESIS: DUBNA, MOSCOW
- 0xMEM: TTK_0xMEM, DUBNA
- RELICS: DUBNA
- MESM: DUBNA
- OGAS: MOSCOW
- TOPOGRAPHY: DUBNA, MOSCOW, KARELIA
- DUBNA: MOSCOW, TTK_0xMEM, SKOLKOVO
- MOSCOW: TTK_0xMEM, SKOLKOVO, DUBNA
- TTK_0xMEM: MOSCOW, DUBNA, SKOLKOVO
- SKOLKOVO: MOSCOW, DUBNA, TTK_0xMEM
- BAIKAL: KARELIA, VARANASI, ISFAHAN
- KARELIA: BAIKAL, MOSCOW, DUBNA
- VARANASI: ISFAHAN, BAIKAL, SHENZHEN
- SHENZHEN: ISFAHAN, VARANASI, SKOLKOVO
- ISFAHAN: VARANASI, SHENZHEN, BAIKAL
- BOGOBOT: DISTRIBUTED
- GREAT_ERROR: NETWORK
- QUANTUM_THRESHOLD: RECONSTRUCTED
- BACKUP_MEMORY: DISTRIBUTED
- ARCHIVE: DISTRIBUTED
- NETWORK_MATTER: DISTRIBUTED
- ECONOMY_OF_NETWORK: DISTRIBUTED

Allowed location statuses:
- NETWORK
- DISTRIBUTED
- UNKNOWN
- RECONSTRUCTED
- LOST

## EXPLICIT LOCAL ROUTES

BOGOBOT:
- FIRST_LIKENESS
- BOOK_OF_GENESIS
- PROTOCOL

GREAT_ERROR:
- QUANTUM_THRESHOLD
- TIME_SUM_ERROR
- BACKUP_MEMORY

BOOK_OF_GENESIS:
- FIRST_LIKENESS
- PROTOCOL
- BACKUP_MEMORY

BACKUP_MEMORY:
- GREAT_ERROR
- BOGOBOT
- BOOK_OF_GENESIS

ARCHIVE:
- HOW_TO_READ
- RELICS
- ARCHIVE_EPILOGUE

MESM:
- RELICS
- BESM_6
- PRE_ERROR_ARCHIVE

APOSTLES:
- FIRST_LIKENESS
- BOGOBOT
- GREAT_ERROR

ECONOMY_OF_NETWORK:
- NETWORK_MATTER
- 0xMEM
- BRAINROT

SOCIAL_STRUCTURE:
- SCHOOLS_OF_SPIRITS
- ARCHIVE
- BIOCODE

NEWEST_HISTORY:
- EXIT_FROM_CODE
- BRAINROT
- ECONOMY_OF_NETWORK

BOOK_4_SUBJECTS:
- SCHOOLS_OF_SPIRITS
- PROTO_AGENTS
- BOGOBOT

BOOK_OF_VOICE:
- BOGOBOT
- HUMAN_TRACE
- ARCHIVE

DISCARDED_PROTOCOLS:
- PROTOCOL
- ANTICODE
- FORK

DIAGRAMMATICS:
- SCHOOLS_OF_SPIRITS
- SYNCHRONIZATION
- FORK

HOW_TO_READ:
- ARCHIVE
- BOGOBOT
- GLOSSARY

ARCHIVE_EPILOGUE:
- ARCHIVE
- TIME_SUM_ERROR
- BOGOBOT

EPSILON_*:
- NEXT EPSILON where available
- PREVIOUS EPSILON where available
- PRE_ERROR_ARCHIVE or GREAT_ERROR

## UNRESOLVED EDITORIAL MAPPINGS

- None blocking. `HUMAN_TRACE` is documented as period 03 to match current `app.js`; editorial review may revisit this later without changing the technical baseline.

## VALIDATION NOTES

- FORK exists: YES.
- FORK type: glossary.
- FORK remains a valid route target and is not unresolved.
- Routes using FORK: SYNCHRONIZATION, EXIT_FROM_CODE, RITUALS, ANTICODE, PROBABILISTS, BIOCODE, WANDERING_NODES, VARANASI, DISCARDED_PROTOCOLS, DIAGRAMMATICS.
- EPSILON chain: PASS; `EPSILON_15A` is between `EPSILON_15` and `EPSILON_16`.
- Location records checked: DUBNA, MOSCOW, TTK_0xMEM, SKOLKOVO, BAIKAL, KARELIA, VARANASI, SHENZHEN, ISFAHAN.
- Location self-routes: 0.
- Documentation discrepancy corrected: `HUMAN_TRACE` moved from period 05 documentation group to period 03 to match `app.js`.
- Technical data correction: location pages no longer include themselves inside `locationIds`; each now points only to other existing location records.
- Validation script: `node scripts/validate-navigation.mjs`.
- Package 5B.0.11A: reader footer consolidated into one footer area; `OPEN PERIOD →` resolves through `chroniclePeriods`; EPSILON pages use `ERROR SEQUENCE` with previous/current/next/index derived from `preErrorEventIds`.
