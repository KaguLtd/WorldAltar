# ARCHITECTURE

## Main Branch Shape

Monorepo root:
- `apps/desktop`: Tauri shell + React renderer
- `packages/config`: shared config

Core Rust chain:
- `projects -> database -> entity_model -> time_engine`

Core frontend active MVP lenses:
- `projects`
- `wiki`
- `search`
- `timeline`
- `map`

Frontend export surfaces:
- `src/modules/mvp-lenses.ts`: active MVP lens contracts
- `src/modules/deferred-lenses.ts`: parked future lens contracts
- `src/modules/features.ts`: deferred lens enable flags

Support seams allowed on `main` but non-core:
- `manuscript`
- `export`
- `canvas`
- `relations`

Kural:
- bunlar repo icinde durabilir
- default flag `off`
- ama MVP boot path sahibi olamaz
- core wiki/search/map acilisini bloklayamaz
- geri acilan her lens lazy-load ve explicit toggle ile gelir

## Dependency Direction

Core:
- `projects -> database -> entity_model -> time_engine`

Active MVP:
- `timeline -> wiki/search/map`
- `wiki/search/map -> entity-model + time-engine`
- `ui/card-grid -> same entity spine, grouped presentation only`
- `ui/detail-panel -> same entity spine, editor/facts split only`

Deferred / optional:
- `manuscript -> entity-model`
- `export -> canonical db reads`
- `canvas -> entity-model + manuscript + time-engine`
- `relations -> stable id seam only`

Current controlled reopen state:
- `manuscript`: lazy mount, scene edit, autosave, mention/backlink
- `canvas`: lazy mount, local derived visible-set board
- `export`: lazy mount, queue/jobs read
- `relations`: lazy mount, stable-id backlink seam

Current presentation uplift state:
- wiki: grouped cards by type, selected spotlight
- hover preview: wiki/timeline/map quick jump
- timeline: selected spotlight with start/end chips
- manuscript: scene facts and mention block
- manuscript studio: derived chapter/order/word stats from same selected scene payload
- manuscript preview: book pages derive from current scene draft only, no second writing store
- canvas: board views and links derive from visible entity set only
- export: queue filters and artifact list derive from same export jobs payload only
- deferred shells: canvas/export/relations spotlight summary
- motion/theme: command chips and cards get restrained sheen/hover, with reduced-motion fallback
- side rails: theme and asset panels expose presentation metadata only, never new domain state

## Runtime Rules

- canonical DB tek kaynak
- stable id degismez
- search kendi time mantigini yazmaz
- map kendi visibility mantigini yazmaz
- startup recovery deterministic olur
- optional lens fail => MVP outage degil
- deferred lens load sadece secilince baslar

## Offline Map Contract

MVP karari:
- local offline map contract `MapLibre + bundled local raster tiles`

PMTiles su an `main` MVP zorunlulugu degil.
Ileride geri acilabilir ama mevcut contract bu degil.
