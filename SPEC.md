# SPEC

## Product Truth

WorldAltar hedefi:
- local-first desktop worldbuilding workstation
- tek canonical veri omurgasi
- map + time + canon + writing koprusu
- finishable Final Core v1

Resmi primary user loop:

`scan world -> select entity -> inspect in canon/time/map -> edit or create linked entity -> draft scene -> jump back to canon`

Bu loop shell, lens sirasi ve sonraki refactor kararlarini yonetir.

## Final Core v1 Boundary

V1 icine girenler:
- world create/open
- blank production world create
- optional demo world create
- typed entities
- stable ids
- merkezi year visibility
- wiki
- search
- offline map
- manuscript drafting with entity bridge
- autosave + recovery
- deterministic local persistence

V1 disindakiler:
- yeni major lensler
- AI-first yan sistemler
- ornamental feature expansion
- broad export expansion

## Non-Negotiable Invariants

- stable id gercek kimliktir
- title ve slug degisebilir, identity degismez
- wiki/search/map/timeline/manuscript ayni canonical kaynakta kalir
- time visibility merkezi kalir
- newest draft silent kaybolmaz
- optional lens fail etse de core boot kirilmaz
- demo ve production akisları karismaz
- UI domain kurallarini bypass etmez

## Current Execution Order

1. Gate 0: Trust boundary
2. Gate 1: Product definition
3. Phase 1: Shell extraction
4. Phase 2: Wiki lens rebuild
5. Phase 3: Map lens rebuild
6. Phase 4: Manuscript lens rebuild
7. Phase 5: Visual language
8. Phase 6: Technical hardening

## Gate 0 Status

Repo gercegine gore aktif contract:
- entity autosave + recovery var
- manuscript autosave + recovery var
- optional lens boot isolation var
- offline map contract `MapLibre + bundled local raster tiles`
- deferred lensler explicit toggle ile aciliyor

Gate 0 tamam sayilabilmesi icin korunacak cikis kriterleri:
- pending draft silent discard yok
- recovery deterministic ve idempotent
- manuscript/export failure core wiki/search/map boot'unu bloklamaz
- offline map package contract acik ve testli kalir

## Gate 1 Rules

Shell ve lens butceleri:
- 1 hero area
- ayni anda en fazla 1-2 support panel
- kalan her sey drawer, tab, sheet, accordion veya deferred surface

Aktif lensler:
- `Wiki`
- `Map`
- `Timeline`
- `Search`

Deferred ama stratejik lensler:
- `Manuscript`
- `Canvas`
- `Export`
- `Relations`

Deferred lens kuralı:
- default `off`
- explicit local flag ister
- core boot sahibi olamaz
- canonical DB, stable id ve time engine disina cikamaz

## Shell Direction

Phase 1 hedefi:
- `App.tsx` orkestrasyon katmani olsun
- shell anlasilir bloklara bolunsun
- navigation, topbar, workspace ve detail rail ayrissin

Beklenen shell parcasi adlari:
- `AppShell`
- `AppSidebar`
- `AppTopbar`
- `MainWorkspace`
- `DetailRail`
- `DeferredFeaturePanel`

## Release Candidate Ritual

Near-final kabul edilmeden once:
- blank world create
- character/place/region/event create
- map uzerine yerlesim
- year parity kontrolu
- rename sonra reference saglamligi
- entity'den scene draft baslatma
- mention/link bridge kontrolu
- app'i edit sirasinda kapatip recovery kontrolu
- reopen sonra silent loss olmadigini dogrulama
