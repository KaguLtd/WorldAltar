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
- wiki lens: type template fill can seed summary/body scaffolds without leaving studio
- wiki lens: spotlight + grouped cards + quick jump hover
- detail panel: quick linked create for region/location seeds
- detail panel: local asset path attach for cover/thumbnail
- detail panel: quick relation link save for typed links
- detail panel: local draft assists can fill empty summary, append type structure, and append scene cues
- detail panel: asset path preset button for canonical local layout
- detail panel: source path import can copy asset into world package
- detail panel: editor/facts split
- timeline lens: spotlight summary
- manuscript lens: facts + mentions rhythm
- manuscript lens: local chapter + scene create flow under same deferred seam
- manuscript lens: new scene create can seed selected world context as first mention
- manuscript lens: selected entity can also prefill a new scene draft shell before create
- manuscript lens: selected entity can also offer reusable scene scaffold and linked-thread continuation cues before create
- manuscript lens: linked scene continuity buttons may prefill follow-up drafts from explicit backlink context
- manuscript lens: selected world context may also expose chapter affinity picks for scene create
- manuscript lens: selected chapter may expose next-scene rhythm cues and a chapter-beat scaffold for scene create
- manuscript lens: scene create may expose composition mode state for free, opening, and continuation drafting
- manuscript lens: composition mode may also expose short writing guides without creating a second planning model
- manuscript lens: composition guide may also expose applyable authoring deck actions for free/opening/continuation drafts
- manuscript lens: composition deck may also expose a compact ledger for active mode, chapter, anchor, and entity
- manuscript lens: composition mode may also expose applyable beat buttons that append scene-specific prompts into the draft body
- manuscript lens: composition mode may also expose scaffold block cards that show ready/pending structure and append missing draft sections
- manuscript lens: composition queue may expose chapter opener and follow-up routing cues that prefill the same local draft form
- manuscript lens: composition queue may also expose queue lanes and a reserve slot so chapter rhythm can hold flexible scene space without new persistence
- manuscript lens: chapter ordering cards and closing-beat queueing may stay local and prefill the same draft form
- manuscript lens: scene lane cards may mirror queue decisions and trigger the same local draft prefills
- manuscript lens: scene sequence cards may expose next, closing, and aftermath slots while still driving the same local draft prefills
- manuscript lens: scene outline cards may anchor previous, next, and aftermath positions without opening a second outline model
- manuscript lens: scene storyboard cards may compress outline/sequence into previous-current-aftermath frames while reusing the same local prefills
- manuscript lens: scene planning strip may compress the same chapter plan into a compact previous/current/aftermath command row
- manuscript lens: scene planning desk may restate that plan as compact lane cards without opening a second planning model
- manuscript lens: scene planning HUD may compress the same chapter plan into a tiny previous/current/after command row
- manuscript lens: scene planning commands may restate opener/reserve/close/after actions as the most compact command row
- manuscript lens: scene launch bar may reflect chapter/title/body readiness and current composition mode next to create
- manuscript lens: scene launch receipt may keep the last submitted scene title/chapter/mode/seed visible after create
- manuscript lens: last launch metadata may also surface in chapter headers and world-link bridge without a second submit model
- manuscript tree: last launch metadata may also mark the matching scene card inline
- manuscript detail: last launch metadata may also surface when the matching scene is selected
- manuscript detail: matching launch receipt may also re-seed the create form through a reuse action
- manuscript launch receipt: matching created scene may also be focused back into selected scene detail
- manuscript detail: selected scene may also hand off a continuation draft into the same create form
- manuscript detail: selected scene handoff may also queue the next chapter slot into the same create form
- manuscript detail: selected scene handoff may also queue a chapter closing slot into the same create form
- manuscript detail: selected scene handoff may also queue a chapter opening slot into the same create form
- manuscript detail: selected scene handoff may also expose a compact handoff queue for opening, next-slot, closing, and follow-up planning
- manuscript tree: chapter and scene cards may expose backlink-derived continuity chips for the selected world context
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
- map lens: scope strip can locally spotlight all layers or one visible entity type
- map lens: year resonance card keeps dominant layer and ongoing count visible for current scope
- map lens: year shift strip keeps opening/closing/anchored span visible for current year
- map lens: spatial ledger keeps region/event/place/geocoded pressure readable without leaving map
- map lens: territory bands summarize region-centered pressure using existing typed world links
- map lens: selected strip may also expose territory focus chips for host place/region context
- map lens: overlay stack may compress selected territory context into short horizon chips
- map lens: selected strip may also narrate the territory path for location/event context
- map lens: selected strip may expose territory route buttons for host region/place jumps
- map lens: region selection may expose territory chain chips for core, child, and spread context
- map lens: selected strip may expose territory pulse metrics for region/location/event context
- map lens: selected strip may expose a compact region focus summary through territory host chains
- map lens: selected strip may expose a region-first focus rail that compresses route and pulse context
- map lens: territory desk may combine region focus rail and territory chain into one region-first reading panel
- map lens: relation ledger reads typed spatial ties for selected entity without opening second data model
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
- wiki detail can draft a new scene from selected entity into manuscript seam
- wiki detail can also draft explicit follow-up scenes from backlink continuity into same manuscript seam
- relations lens groups backlink scenes by chapter from same payload
- export lens groups jobs by artifact kind and spotlights latest artifact from same queue payload
- export jobs carry explicit primary artifact path alongside companion artifacts
- export lens derives artifact counts and bundle rows from primary + companion paths together
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
- export lens also exposes bundle contents from same queue payload
- manuscript preview also exposes folio strip and page ribbon as presentation-only premium layer
- detail panel also exposes luxury strip chips as presentation-only premium layer
- hover preview also exposes premium strip chips as presentation-only premium layer

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
