# SPEC

## Active Product

`main` branch resmi urun: daraltilmis MVP.

Aktif kapsam:
- local-first Tauri desktop app
- world create/open
- `Documents/WorldAltar/worlds` klasor yapisi
- SQLite migration + project metadata
- typed entities
- stable ids
- merkezi `is_visible_at_year()` kurali
- minimal wiki list/detail
- minimal search
- minimal offline map
- year slider
- autosave + recovery

Aktif olmayan ama repoda izi bulunabilen alanlar:
- manuscript studio
- book preview
- canvas
- export pipeline
- premium visual polish

Bu alanlar MVP contract degildir.

UI reality on `main`:
- wiki lens: spotlight + grouped cards + quick jump hover
- detail panel: editor/facts split
- timeline lens: spotlight summary
- manuscript lens: facts + mentions rhythm
- manuscript studio: chapter count + scene meta + word/read stats
- manuscript preview: local Draft / Split / Book switch with two-page preview shell
- canvas lens: local Relations / Family / Chain board switch with derived links
- export lens: filterable queue + artifact list from same export jobs payload
- deferred shells: canvas/export/relations spotlight summary
- deeper polish: restrained hover/sheen motion + reduced-motion fallback
- side rails: theme palette swatches + asset manifest chips
- bunlar UX ritim iyilestirmesidir, core contract degisikligi degildir

Frontend contract export kural:
- aktif lens contractlari `src/modules/mvp-lenses.ts`
- deferred lens contractlari `src/modules/deferred-lenses.ts`
- deferred lens acma kapisi `src/modules/features.ts`, default `off`
- kontrollu geri acilan lensler:
  - `manuscript`: edit + autosave + mention/backlink
  - `canvas`: local derived board
  - `export`: lazy queue
  - `relations`: stable-id reference seam
- bunlar explicit toggle ister, core boot sahibi degildir

## MVP Acceptance

- yeni world localde acilir
- db ve klasorler olusur
- entity create/list/search calisir
- rename teknik id bozmaz
- wiki/search/map ayni visible set mantigi ile calisir
- year degisince wiki/search/map birlikte guncellenir
- autosave crash sonrasi pending draft silent kaybolmaz

## Explicit Non-Scope

- active manuscript workflow
- active canvas workflow
- active export workflow
- premium encyclopedia/manuscript hissi
- deep asset pipeline
- post-MVP relation genislemesi

## Deferred Lens Rule

Deferred lensler repoda calisabilir ama:
- MVP contract sayilmaz
- startup boot path bloklayamaz
- explicit local flag ister
- canonical DB, stable id ve time engine disina cikamaz
