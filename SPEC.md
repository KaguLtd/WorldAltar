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
- wiki lens: create entity studio, type-first quick authoring
- wiki lens: selected card can seed create studio presets
- wiki lens: spotlight + grouped cards + quick jump hover
- detail panel: quick linked create for region/location seeds
- detail panel: local asset path attach for cover/thumbnail
- detail panel: quick relation link save for typed links
- detail panel: asset path preset button for canonical local layout
- detail panel: source path import can copy asset into world package
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
- map lens: geocoded summary rail + quick focus rows
- map lens: visible/geocoded/type summary strip
- map lens: hover popover can jump direct to wiki or timeline
- map lens: hover popover can pin selected marker into detail panel without leaving map
- map lens: selected marker strip keeps title, summary, coords, and lens jumps visible
- map lens: type strip shows visible-set counts and can jump to first record of that type
- map lens: marker legend keeps per-type color/count reading visible
- map lens: overlay chips expose short type/count semantic tags
- map lens: year context stays visible in overlay and selected strip copy
- wiki spotlight: selected card can fire linked create without leaving card surface
- manuscript bridge: selected entity may stage mention insert and jump to wiki/timeline from same scene surface
- manuscript mention picker: current visible set may seed quick scene mentions
- manuscript timeline context: scene mentions may reopen same entities in timeline lens
- manuscript mention insert is caret-aware inside current scene draft body
- wiki detail shows scene-context summary from same backlink seam
- relations lens groups backlink scenes by chapter from same payload
- export lens groups jobs by artifact kind and spotlights latest artifact from same queue payload
- export lens also exposes manuscript artifact metadata from same queue payload
- export lens also exposes package root/job/file summary from same queue payload paths
- export lens also exposes curated output lanes from same queue payload
- export lens also exposes reusable bundle readiness from same queue payload
- export lens also exposes reference sheets from same queue payload
- export lens also exposes asset manifest digest from same queue payload
- export lens also exposes lane history from same queue payload
- export lens also exposes delivery checklist from same queue payload
- export lens also exposes format readiness from same queue payload
- export lens also exposes target roots from same queue payload

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
