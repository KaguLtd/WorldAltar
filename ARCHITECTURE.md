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
- wiki authoring: create studio writes through official entity command only
- wiki authoring: selected entity may seed studio presets, but submit still goes through same command boundary
- wiki: grouped cards by type, selected spotlight
- detail authoring: linked create buttons still route through official entity command only
- asset attach: detail panel writes media paths through official entity command boundary, not local side cache
- asset preset: UI may prefill canonical local asset paths, but persisted write still uses same entity command boundary
- asset import: source file may be copied into world asset tree before same entity media command state is updated
- relation entry: detail panel writes typed link ids through official entity command boundary
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
- map focus rail: geocoded quick-focus rows derive only from current visible set
- map summary strip: counts and selected id derive only from current visible set
- map popover jump: map lens may swap to wiki or timeline only by reusing same selected entity id
- map detail shortcut: map popover may only promote hovered marker into existing selected entity state
- map selected strip: persistent selected-marker panel derives only from same selected entity state
- map type strip: type chips derive only from same visible set and may only reselect first record of that type
- map legend: color/type/count legend derives only from same visible set, no second marker registry
- map overlay chips: short semantic counts derive from same visible set, no local overlay query state
- map year copy: current year may be shown in map overlay/selected strip but never becomes separate map state
- wiki spotlight actions: card-level linked create still routes through same entity command boundary
- manuscript bridge: selected entity stays single spine; scene may stage mention insert and lens jump without second context store
- manuscript mention picker only reads current visible records; it does not own separate entity search state
- manuscript timeline context derives from current scene mention ids against same entity spine, no separate timeline cache
- manuscript mention insert may read textarea selection only as ephemeral UI state; canonical mention payload still autosave pathinda uretilir
- wiki detail scene-context panel reads same backlink payload; no second scene-summary store
- relations lens chapter grouping derives from same backlink list; no relation graph cache
- export artifact spotlight/grouping derives from same export jobs payload; no second artifact index
- manuscript export metadata strip also derives from same export jobs payload; no manuscript-export side cache
- export package summary also derives from same export jobs payload paths; no bundle registry
- curated output lanes also derive from same export jobs payload; no publication index
- bundle readiness strip also derives from same export jobs payload; no reusable-world registry
- reference sheets also derive from same export jobs payload; no export-side sheet cache
- export manifest digest also derives from same export jobs payload; no asset-manifest side index
- export lane history also derives from same export jobs payload; no run-history side store
- export delivery checklist also derives from same export jobs payload; no publish-state registry
- export format readiness also derives from same export jobs payload; no future-format registry
- export target roots also derive from same export jobs payload; no target-root registry

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
