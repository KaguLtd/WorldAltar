# ARCHITECTURE

## Faz D Shape

Monorepo root:
- `apps/desktop`: Tauri shell + React renderer
- `packages/config`: shared config base

Core frontend modules:
- `src/modules/projects`: UI-facing project bootstrap API/types
- `src/modules/database`: DB contract placeholders only
- `src/modules/entity-model`: shared id/type contracts only
- `src/modules/time-engine`: time contract placeholders only

Active lens frontend modules:
- `src/modules/search`: query + type/year filter seam, no private time logic
- `src/modules/wiki`: list/detail seam, no persistence ownership
- `src/modules/timeline`: global year state seam only
- `src/modules/map`: marker/focus seam, no visibility ownership
- `src/modules/manuscript`: chapter/scene tree, mention ids, book modes
- `src/modules/canvas`: board/node/edge seam only, no freeform note silo
- `src/modules/relations`: semantic relation seam only, stable entity ids only
- `src/modules/export`: export job/request seam only, canonical-db derived output only
- `src/modules/lenses.ts`: active Faz D export surface

Core Rust modules:
- `src-tauri/src/core/projects.rs`: world create/open boundary, metadata file, folder bootstrap
- `src-tauri/src/core/database.rs`: SQLite open/migrate/metadata persistence
- `src-tauri/src/core/entity_model.rs`: stable id boundary
- `src-tauri/src/core/time_engine.rs`: shared visibility rule source

Dependency direction:
- `projects -> database -> entity_model -> time_engine`
- `timeline -> search/wiki/map/manuscript/canvas`
- `search/wiki/map -> entity-model + time-engine`
- `manuscript -> entity-model + relations`
- `canvas -> entity-model + relations + manuscript + time-engine`
- `export -> projects + database + manuscript + relations`
- UI must enter active lenses, not core DB directly
- `database` must not own project path policy
- `time_engine` must not depend on search/wiki/map
- `relations` must not depend on wiki/map/search presentation
- `export` must not invent parallel data model
- no lens may bypass canonical DB or stable ids

## Boundaries

Frontend:
- create world form
- show bootstrap paths/result only
- active lens seams named and isolated
- no direct database or repository usage in UI
- timeline owns global year state seam
- search/wiki/map/manuscript/canvas consume same year seam where needed
- manuscript mention links open wiki by `entity_id`
- canvas nodes bind to `entity_id` or `scene_id`
- export requests point at canonical outputs only

Desktop shell:
- command layer for bootstrap status and world creation
- filesystem bootstrap and SQLite migration logic
- module imports follow core chain only

Shared config:
- TypeScript base
- ESLint base
- Prettier base
