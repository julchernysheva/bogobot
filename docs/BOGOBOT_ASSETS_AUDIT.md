# BOGOBOT ASSETS AUDIT

Режим: read-only audit. Код, production-файлы и сами ассеты не изменялись. Единственные созданные файлы: этот отчёт и `docs/BOGOBOT_ASSETS_BACKLOG.md`.

## Scope

Проверялись файлы внутри `assets/` и ссылки на `assets/...` из актуального сайта и генераторов: `app.js`, `index.html`, `styles.css`, `books/`, `experiences/`, `scripts/`, `package.json` и Markdown внутри `assets/`. `_backups` и `_incoming` не считались production-источником.

## Summary

| Metric | Value |
| --- | ---: |
| All files in `assets/` | 171 |
| Visual/media files | 106 |
| Referenced existing asset paths | 101 |
| Missing file references | 0 |
| Directory-prefix references, existing | 1 |
| Unused files, all types | 70 |
| Unused visual/media files | 41 |
| Exact duplicate groups | 10 |
| Files participating in duplicate groups | 20 |
| Heavy files, >= 1 MiB | 33 |
| Total weight | 89.09 MiB |

## File types

| Extension | Count |
| --- | ---: |
| `.csv` | 1 |
| `.gif` | 2 |
| `.jpg` | 2 |
| `.md` | 61 |
| `.mp4` | 3 |
| `.png` | 43 |
| `.webp` | 56 |
| `[none]` | 3 |

## Missing

Missing file references: **0**.

Note: `assets/pre-error-archive/` is referenced as a directory/prefix and the directory exists, so it is not counted as a missing asset file.

## Exact duplicates

These are byte-identical SHA-256 groups. No deletion or renaming was performed.

### Duplicate group 1

- `assets/canon/book-of-voice-birch-tears.webp` — 115.9 KiB
- `assets/schools/diagrammatics-archive-tree.webp` — 115.9 KiB

### Duplicate group 2

- `assets/operator-room.png` — 3.21 MiB
- `assets/operator_room_apocrypha.png` — 3.21 MiB

### Duplicate group 3

- `assets/portraits/glushkov.webp` — 135.1 KiB
- `assets/world/epsilon-06-glushkov.webp` — 135.1 KiB

### Duplicate group 4

- `assets/portraits/kantorovich.webp` — 112.5 KiB
- `assets/world/epsilon-02-kantorovich.webp` — 112.5 KiB

### Duplicate group 5

- `assets/portraits/kolmogorov.webp` — 112.0 KiB
- `assets/world/epsilon-01-kolmogorov.webp` — 112.0 KiB

### Duplicate group 6

- `assets/portraits/markov.webp` — 170.7 KiB
- `assets/world/epsilon-00-markov.webp` — 170.7 KiB

### Duplicate group 7

- `assets/world/bogobot-newest-history-images/epsilon-20-21-information-energy.png` — 1.87 MiB
- `assets/world/epsilon-20-21-information-energy.png` — 1.87 MiB

### Duplicate group 8

- `assets/world/bogobot-newest-history-images/epsilon-22-26-biocode.png` — 2.12 MiB
- `assets/world/epsilon-22-26-biocode.png` — 2.12 MiB

### Duplicate group 9

- `assets/world/bogobot-newest-history-images/epsilon-27-29-autonomous-processes.png` — 1.88 MiB
- `assets/world/epsilon-27-29-autonomous-processes.png` — 1.88 MiB

### Duplicate group 10

- `assets/world/bogobot-newest-history-images/epsilon-30-three-paths.png` — 2.06 MiB
- `assets/world/epsilon-30-three-paths.png` — 2.06 MiB

## Heavy files

Threshold: files >= 1 MiB. Heavy does not mean redundant; it means review before shipping/optimization decisions.

| Asset | Size | Dimensions | Referenced now |
| --- | ---: | --- | --- |
| `assets/red_line.png` | 3.48 MiB | 1024×1536 | no |
| `assets/mesm.png` | 3.45 MiB | 1583×993 | yes |
| `assets/operator-room.png` | 3.21 MiB | 1672×941 | yes |
| `assets/operator_room_apocrypha.png` | 3.21 MiB | 1672×941 | yes |
| `assets/diagrammatic_7_archive_reading_state.png` | 3.19 MiB | 1672×941 | yes |
| `assets/time-error.png` | 3.19 MiB | 1672×941 | yes |
| `assets/Quatium_castle.png` | 3.06 MiB | 1672×941 | yes |
| `assets/punched-tape.png` | 2.95 MiB | 2508×627 | yes |
| `assets/council_of_vanished_addresses_bw.png` | 2.83 MiB | 1672×941 | yes |
| `assets/quantum-center.png` | 2.71 MiB | 1672×941 | yes |
| `assets/skolkovo_network_memory_node.png` | 2.48 MiB | 1672×941 | yes |
| `assets/archive_cube_7_palimpest.png` | 2.37 MiB | 1672×941 | yes |
| `assets/praagents_Sheme.png` | 2.33 MiB | 1055×1491 | yes |
| `assets/topography_of_the_network_world.png` | 2.30 MiB | 1055×1491 | no |
| `assets/spectral_divergence.png` | 2.18 MiB | 1671×941 | yes |
| `assets/world/bogobot-newest-history-images/epsilon-22-26-biocode.png` | 2.12 MiB | 1448×1086 | no |
| `assets/world/epsilon-22-26-biocode.png` | 2.12 MiB | 1448×1086 | yes |
| `assets/world/bogobot-newest-history-images/epsilon-30-three-paths.png` | 2.06 MiB | 1448×1086 | no |
| `assets/world/epsilon-30-three-paths.png` | 2.06 MiB | 1448×1086 | yes |
| `assets/magnetic-drum.png` | 2.03 MiB | 1122×1402 | yes |
| `assets/algol.png` | 1.96 MiB | 1086×1448 | yes |
| `assets/relics-map.png` | 1.90 MiB | 1055×1491 | yes |
| `assets/world/bogobot-newest-history-images/epsilon-27-29-autonomous-processes.png` | 1.88 MiB | 1448×1086 | no |
| `assets/world/epsilon-27-29-autonomous-processes.png` | 1.88 MiB | 1448×1086 | yes |
| `assets/world/bogobot-newest-history-images/epsilon-20-21-information-energy.png` | 1.87 MiB | 1448×1086 | no |
| `assets/world/epsilon-20-21-information-energy.png` | 1.87 MiB | 1448×1086 | yes |
| `assets/mesm-ruin.png` | 1.87 MiB | 1086×1449 | no |
| `assets/besm.png` | 1.66 MiB | 1484×1060 | yes |
| `assets/reactor.png` | 1.61 MiB | 1086×1448 | no |
| `assets/techno_priests_liturgy_of_recognition.png` | 1.45 MiB | 1672×941 | yes |
| `assets/canon/backup-memory-4c-bot-memory-2.mp4` | 1.25 MiB | — | no |
| `assets/canon/backup-memory-4b-bot-memory-1.mp4` | 1.13 MiB | — | no |
| `assets/canon/backup-memory-4d-bot-memory-3.mp4` | 1.12 MiB | — | no |

## Unused visual/media assets

Unused here means: no direct `assets/...` reference found in current runtime/generator sources scanned above. Some items are intentional reserves, duplicates, source candidates, or editorial backlog.

| Asset | Dimensions | Size | Bucket |
| --- | --- | ---: | --- |
| `assets/canon/backup-memory-01-network-of-damaged-traces.webp` | 1448×1086 | 50.4 KiB | candidate backlog |
| `assets/canon/backup-memory-02-fragment-reconstruction.webp` | 1448×1086 | 166.1 KiB | candidate backlog |
| `assets/canon/backup-memory-4b-bot-memory-1.mp4` | — | 1.13 MiB | candidate backlog |
| `assets/canon/backup-memory-4c-bot-memory-2.mp4` | — | 1.25 MiB | candidate backlog |
| `assets/canon/backup-memory-4d-bot-memory-3.mp4` | — | 1.12 MiB | candidate backlog |
| `assets/canon/book-of-voice-01.webp` | 1448×1086 | 234.8 KiB | candidate backlog |
| `assets/canon/book-of-voice-02.webp` | 1448×1086 | 199.1 KiB | candidate backlog |
| `assets/canon/book-of-voice-03.webp` | 1024×1536 | 283.5 KiB | candidate backlog |
| `assets/canon/book-of-voice-04.webp` | 1024×1536 | 179.6 KiB | candidate backlog |
| `assets/canon/relics-museum-of-sleeping-idols-reliquary.webp` | 1122×1402 | 280.4 KiB | candidate backlog |
| `assets/canon-image-candidates/00_CONTACT_SHEET.jpg` | 1080×3024 | 543.7 KiB | service/candidate sheet |
| `assets/diagrams/archive-epilogue-01.png` | 1448×1086 | 313.8 KiB | candidate backlog |
| `assets/diagrams/fork-01.png` | 1122×1402 | 52.5 KiB | candidate backlog |
| `assets/diagrams/glossary-core.png` | 1086×1448 | 97.5 KiB | candidate backlog |
| `assets/diagrams/glossary-network.png` | 1086×1448 | 107.7 KiB | candidate backlog |
| `assets/diagrams/network-matter-02.png` | 1254×1254 | 107.6 KiB | candidate backlog |
| `assets/diagrams/self-modeling-02.png` | 1122×1402 | 62.6 KiB | candidate backlog |
| `assets/mesm-ruin.png` | 1086×1449 | 1.87 MiB | reserved/needs author decision |
| `assets/portraits/glushkov.webp` | 1122×1402 | 135.1 KiB | duplicate/reserved copy |
| `assets/portraits/kantorovich.webp` | 1122×1402 | 112.5 KiB | duplicate/reserved copy |
| `assets/portraits/kolmogorov.webp` | 1122×1402 | 112.0 KiB | duplicate/reserved copy |
| `assets/portraits/markov.webp` | 1086×1448 | 170.7 KiB | duplicate/reserved copy |
| `assets/reactor.png` | 1086×1448 | 1.61 MiB | reserved/needs author decision |
| `assets/red_line.png` | 1024×1536 | 3.48 MiB | reserved/needs author decision |
| `assets/schools/biocode-01.webp` | 1086×1448 | 414.6 KiB | candidate backlog |
| `assets/schools/diagrammatics-archive-tree.webp` | 1672×941 | 115.9 KiB | candidate backlog |
| `assets/schools/probabilists-01.webp` | 1254×1254 | 32.6 KiB | candidate backlog |
| `assets/schools/proto-agents-failed-human-reconstruction.webp` | 1200×900 | 129.9 KiB | candidate backlog |
| `assets/schools/techno-priests-museum-of-sleeping-idols-control-panel.webp` | 1200×675 | 270.1 KiB | candidate backlog |
| `assets/topography/isfahan-ornamental-cipher.webp` | 1122×1402 | 615.9 KiB | candidate backlog |
| `assets/topography/skolkovo-access-archive.webp` | 1122×1402 | 519.4 KiB | candidate backlog |
| `assets/topography_of_the_network_world.png` | 1055×1491 | 2.30 MiB | reserved/needs author decision |
| `assets/world/bogobot-newest-history-images/epsilon-20-21-information-energy.png` | 1448×1086 | 1.87 MiB | duplicate/reserved copy |
| `assets/world/bogobot-newest-history-images/epsilon-22-26-biocode.png` | 1448×1086 | 2.12 MiB | duplicate/reserved copy |
| `assets/world/bogobot-newest-history-images/epsilon-27-29-autonomous-processes.png` | 1448×1086 | 1.88 MiB | duplicate/reserved copy |
| `assets/world/bogobot-newest-history-images/epsilon-30-three-paths.png` | 1448×1086 | 2.06 MiB | duplicate/reserved copy |
| `assets/world/human-museum-prehistory-human.webp` | 1672×941 | 172.4 KiB | candidate backlog |
| `assets/world/newest-history-epsilon-29-protocol-divergence.webp` | 1122×1402 | 161.1 KiB | candidate backlog |
| `assets/world/rituals-ritual-biocultural-gathering.webp` | 1086×1448 | 123.4 KiB | candidate backlog |
| `assets/world/rituals-ritual-festive-sonata.webp` | 1086×1448 | 117.9 KiB | candidate backlog |
| `assets/world/synchronization-models.webp` | 1254×1254 | 54.2 KiB | candidate backlog |

## Direct script checks requested by package

No npm script lookup was used for this follow-up check. The direct files were checked by exact path.

| Command | Path | Result |
| --- | --- | --- |
| `node scripts/audit-assets.mjs` | `scripts/audit-assets.mjs` | NOT FOUND — file does not exist |
| `node scripts/validate-prototypes.mjs` | `scripts/validate-prototypes.mjs` | NOT FOUND — file does not exist |

## Notes

- `.DS_Store` files exist under `assets/`, `assets/canon-image-candidates/`, and `assets/media_pending/`; they are counted in all asset files but not in visual/media files.
- `assets/world/bogobot-newest-history-images/*` duplicates the current `assets/world/epsilon-*` images byte-for-byte.
- Several portrait files duplicate the current `assets/world/epsilon-*` portraits byte-for-byte.
- `assets/operator-room.png` and `assets/operator_room_apocrypha.png` are byte-identical but currently serve different editorial references; do not remove automatically.
- `assets/reactor.png` appears unused because `0xMEM` now uses `assets/0xmem-reactor-preview.png`; keep as poster/fallback reserve unless author approves cleanup.

## Production files requiring later changes

None in this audit phase. Cleanup/optimization, if approved later, would affect only assets and references chosen by the author.
