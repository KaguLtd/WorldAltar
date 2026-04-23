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

Support seams allowed on `main` but non-core:
- `manuscript`
- `export`
- `canvas`
- `relations`

Kural:
- bunlar repo icinde durabilir
- ama MVP boot path sahibi olamaz
- core wiki/search/map acilisini bloklayamaz

## Dependency Direction

Core:
- `projects -> database -> entity_model -> time_engine`

Active MVP:
- `timeline -> wiki/search/map`
- `wiki/search/map -> entity-model + time-engine`

Deferred / optional:
- `manuscript -> entity-model`
- `export -> canonical db reads`
- `canvas -> entity-model + manuscript + time-engine`
- `relations -> stable id seam only`

## Runtime Rules

- canonical DB tek kaynak
- stable id degismez
- search kendi time mantigini yazmaz
- map kendi visibility mantigini yazmaz
- startup recovery deterministic olur
- optional lens fail => MVP outage degil

## Offline Map Contract

MVP karari:
- local offline map contract `MapLibre + bundled local raster tiles`

PMTiles su an `main` MVP zorunlulugu degil.
Ileride geri acilabilir ama mevcut contract bu degil.
