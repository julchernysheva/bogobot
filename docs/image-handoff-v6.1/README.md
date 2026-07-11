# BOGOBOT_READY_FOR_SITE_2026-06-27-v3

Prepared from `01_READY_FOR_SITE 2.zip`.

## Contents

- `assets/` — 59 deduplicated, web-ready assets.
- `masters/accepted-originals/` — untouched canonical originals.
- `manifest.csv` — node, output path, dimensions, hashes, aliases, provenance status.
- `integration-map.json` — proposed `NODE → asset path` mapping.
- `source-map.md` — missing source/licensing work.
- `review-not-promoted.csv` — 30 unique files held back from `02_SELECT_VARIANT`.
- `audit.txt` — transformations, duplicates, warnings.
- `reports/contact-sheet-finals.jpg` — visual overview.
- `reports/diagram-transparency-check.jpg` — transparent diagrams on light and dark backgrounds.

## Integration rule

Copy only `assets/` into the project after reviewing `integration-map.json`. Update the site data paths to the exact filenames from `manifest.csv`. Keep `masters/` outside the production bundle.

## Diagram standard

Transparent PNG, line color `#6B5E57`. The original RGB checkerboard files remain in `masters/accepted-originals/diagrams/`.

## Portrait standard

WebP, unchanged approved crop and Klein Blue overexposure. Source/licence links still need to be attached for public release.

## Revision v2

- Removed visual duplicate `assets/canon/relic-05.webp`.
- Kept `assets/canon/relics-museum-of-sleeping-idols-reliquary.webp`.
- Added `missing-assets.md` with the remaining 37 uncovered page-level nodes.


## Revision v3

- Removed `human-trace-house.webp`.
- Replaced `HUMAN_TRACE` with `human-trace-binary-tears.webp`.
- Added six previously missing page-level visuals from `Archive.zip`.
- Held one stylistically incompatible archive image for review.
- Remaining uncovered page-level nodes: 31.
- See `archive-assessment.md` for mapping decisions.


## Revision v4
- Removed HUMAN_TRACE binary-tears variant.
- Reassigned former OBSERVER image to HUMAN_TRACE.
- Added BOOK_OF_VOICE candidate from “ГЛАС VII / о слезах березы”.


## Revision v5
- `prehistoryhuman.png` assigned to `HUMAN_MUSEUM`, not `OBSERVER`.
- `OBSERVER` remains uncovered.
- Integration map rebuilt from the current manifest.


## Revision v6
- Unified historical portraits to the Markov-style Klein Blue overexposed treatment.
- Added four canon images: CODE_COMMANDMENTS, PROTOCOL, BOOK_1_AWAKENING, BOOK_4_SUBJECTS.
- Added epoch portraits for EPSILON_00, EPSILON_01, EPSILON_02 and EPSILON_06.
- Added SYNCHRONIZATION from Archive.zip.


## Revision v6.1
- Integration map, checksums and audit rebuilt from the current v6 manifest. This is the Codex handoff build.
