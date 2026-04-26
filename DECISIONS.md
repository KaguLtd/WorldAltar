# DECISIONS

## 2026-04-23

### D-001 Faz 0 monorepo cut

Use workspace root with `apps/desktop` and `packages/config`.
Reason: keep shell isolated, share config without early domain split.

### D-002 Hand-made skeleton

Scaffold by direct files, not generator output.
Reason: current workspace empty; minimal diff easier to audit.

### D-003 Tauri shell only

Tauri Rust layer stays bootstrap-only in Faz 0.
Reason: Faz 1+ owns local filesystem and SQLite work.

### D-004 Tooling floor

Baseline is ESLint + Prettier + Vitest + TypeScript.
Reason: satisfies Faz 0 CI/local script requirement with minimal surface.

### D-005 World root placement

World storage root is `Documents/WorldAltar/worlds`.
Reason: matches binding doc and keeps local-first path explicit.

### D-006 Metadata split

Project metadata lives in `project.json`; DB keeps only app bootstrap metadata.
Reason: portable world identity stays file-visible without pulling domain schema into Faz 1.

### D-007 Migration shape

Use embedded SQL migration files executed on world creation.
Reason: smallest stable path to versioned SQLite bootstrap in Faz 1.

### D-008 Faz A module cut

Name and place core modules now: Projects, Database, Entity Model, Time Engine.
Reason: binding doc requires future lenses to hang on stable core seams, not ad-hoc files.

### D-009 UI dependency rule

Desktop React layer talks to Projects boundary only.
Reason: keep path/bootstrap policy and future core fan-out behind one module edge.

### D-010 Stable entity IDs

Entity ids use type-prefixed counters in DB metadata: `char_001`, `loc_001`, `reg_001`, `evt_001`.
Reason: rename must change title/slug only, never technical identity.

### D-011 Entity persistence shape

Use one canonical `entities` table for common fields plus typed `extra_json`.
Reason: Faz 2 needs typed schema surface without exploding table count before real repository usage proves shape.

### D-012 Search index floor

Use SQLite FTS5 virtual table `entity_search` synced by repository writes.
Reason: Faz 2 requires indexed search now; year-aware filtering stays Faz 3.

### D-013 Time visibility source

Single pure function `is_visible_at_year()` owns year visibility rules.
Reason: search and list must not drift into separate time logic.

### D-014 Faz B lens activation

Activate only Search, Wiki, Timeline, Map seams in repo layout.
Reason: Faz B opens first product lenses without dragging Faz C/D modules into active surface.

### D-015 Timeline dependency rule

Timeline owns global year seam; Search, Wiki, Map consume that seam.
Reason: one year source prevents lens drift.

### D-016 Lens leakage block

No active Faz B lens may own DB rules, time rules, or import Manuscript/Canvas/Export seams.
Reason: lenses present product views; core stays below them.

### D-017 Faz 4 map floor

Use zero-network local map lens with real lat/lon projection and local render surface.
Reason: Faz 4 requires offline map opening now; premium basemap pipeline can wait.

### D-018 Faz 4 shared year state

Wiki list/detail and map markers consume one timeline year state in React.
Reason: year change must update both lenses together.

### D-019 Faz V1 shell hierarchy

Use three-part shell: left lens rail, center card workspace, right context stack with fixed year dock.
Reason: reduce CRUD feel without adding new product scope.

### D-020 V1 card rhythm

Wiki list moves from plain list to compact card grid with stable cover/badge/year rhythm.
Reason: V1 asks for card-first feel, not premium feature expansion.

### D-021 V2 token layer

Add named color tokens for bronze, indigo, teal, parchment, and line strengths.
Reason: V2 needs identity surface without changing product behavior.

### D-022 V2 type identity

Entity types get badge + icon + placeholder treatment keyed by type.
Reason: V2 asks for readable identity cues even when real assets are absent.

### D-023 Autosave cadence

Autosave runs only for dirty selected entity drafts and waits 5 seconds before write.
Reason: binding doc requires 5 second autosave and no useless writes.

### D-024 Recovery shape

Autosave writes pending snapshot file before DB transaction, commits SQLite update, then promotes last-success snapshot and clears pending file.
Reason: crash must not let half-written draft overwrite canonical entity state.

### D-025 Faz 4 offline basemap

Replace fake grid with real MapLibre render using bundled local raster tiles.
Reason: Faz 4 contract requires local offline map opening through actual map renderer.

### D-026 Faz C asset floor

Add local fallback asset pack and asset resolver seam under dedicated module.
Reason: Faz C needs asset discipline and non-broken no-asset experience without touching core data rules.

### D-027 Faz C theme floor

Add minimal theme module with shell-level theme switch only.
Reason: visual identity should stay modular and should not leak into entity or DB logic.

### D-028 Faz C lens transition

Lens rail becomes active state that switches center workspace between Wiki, Map, Timeline, Search.
Reason: product should read as multi-lens system, not one CRUD slab.

### D-029 Faz P1 manuscript data floor

Add dedicated manuscript tables for chapter/scene tree and mention rows.
Reason: writing foundation must stay id-bound and isolated from entity core tables.

### D-030 Faz P1 manuscript mention rule

Mention rows store `entity_id` as canonical link, label only as display text.
Reason: rename must not break writing references.

### D-031 Faz P1 manuscript autosave

Scene autosave mirrors entity autosave with pending file, transactional DB write, success snapshot, startup recovery.
Reason: writing drafts need same crash discipline as entity editing.

### D-032 Faz P2 manuscript modes

Book experience stays same manuscript lens with mode switch: Draft, Split, Book, Print.
Reason: preview modes must reuse same scene state, not fork separate writing surfaces.

### D-033 Faz P2 chapter break rule

Each chapter starts with dedicated break page before scene flow pages.
Reason: book spread and print preview need stable chapter opening rhythm.

### D-034 Faz P2 print trim

Preview trim stays local UI parameter only: A5, Trade, Royal.
Reason: P2 needs page style simulation, not export pipeline.

### D-035 Faz D active lens surface

Activate manuscript, canvas, relations, export as named frontend seams.
Reason: expanding product lenses need explicit modules before deeper implementation.

### D-036 Faz D dependency guard

Canvas may depend on manuscript/relations/time-engine; export may depend on canonical DB outputs; relations stay below presentation lenses.
Reason: preserve one data spine and prevent lens-level rule drift.

### D-037 Faz D stable-link rule

Manuscript mentions, canvas nodes, relation edges, and export requests bind through stable ids or canonical DB reads only.
Reason: rename-safe and portable expansion path.

### D-038 Faz V3 hover preview

Wiki/search cards open lightweight hover preview with lens jump actions.
Reason: V3 needs richer interaction without changing canonical data flow.

### D-039 Faz V3 map popover

Map hover uses marker-derived popover card, not separate map-side data store.
Reason: enrich map reading while preserving one entity source.

### D-040 Faz V3 drag-drop scope

Drag-drop stays local presentation reorder inside manuscript tree only.
Reason: V3 asks for tactile movement, not persistence schema change.

### D-041 Faz P3 derived canvas

Advanced canvas boards derive from canonical entities and manuscript scenes before dedicated persistence lands.
Reason: open world lenses now without forking a second graph database.

### D-042 Faz P3 timeline views

Timeline adds list, bands, and chain views over same visible entity set.
Reason: richer chronology views must stay on one time-filtered result source.

### D-043 Faz P3 map overlays

Map overlays stay lightweight visible-set chips, not new geometry schema.
Reason: richer map reading now, heavier territory/route data later.

### D-044 Faz P4 export source

Manuscript PDF and dossier export read canonical SQLite-backed manuscript/entity repositories only.
Reason: export must not fork second interpretation layer.

### D-045 Faz P4 asset manifest

Each export run also writes derived `asset-manifest.json` into world export folder.
Reason: advanced asset pipeline starts as deterministic canonical-data manifest, not separate asset database.

### D-046 Faz P4 sync queue

Export queue stays synchronous file generation with persisted job manifest.
Reason: P4 needs durable artifacts and visible history, not background worker complexity.

### D-047 Faz V4 manuscript skin

Premium manuscript feel stays CSS and markup skin over existing manuscript editor and preview nodes.
Reason: V4 asks for luxury reading surface without adding new writing core.

### D-048 Faz V4 folio illusion

Two-page book feel uses visual folio cues, page tilt, sheen, and corner details only.
Reason: keep existing preview pagination logic and avoid second layout engine.

### D-049 Faz V4 gallery polish

Detail/gallery and hover/theme panels gain richer frame treatment from existing entity visuals and theme tokens.
Reason: premium feel should come from current asset/theme layers, not new data or panel systems.

### D-050 Startup isolation

Recovery, manuscript tree load, and export queue load bind to project database change only; year refresh only reloads visible entities.
Reason: startup side effects must not rerun on lens-year interaction.

### D-051 Recovery cleanup-only

Autosave recovery treats pending files as reconcile targets only: same-as-DB means recover snapshot, different-or-bad means discard and continue.
Reason: canonical DB stays source of truth while startup recovery remains deterministic.

### D-052 Strict runtime gate

Fix is not accepted unless typecheck, frontend tests, Rust tests, and build pass; missing toolchain reports as blocked gate, not pass.
Reason: autosave/recovery regressions need runtime proof, not static confidence only.

### D-053 Recovery conflict preserve

Startup recovery no longer deletes mismatched pending drafts; it moves them into conflict snapshots and reports conflict count.
Reason: crash sonrası en yeni draft silent discard ile kaybolmamalı.

### D-054 Optional lens boot isolation

Manuscript and export startup work is best-effort only; failures degrade optional lens state but do not block entity/wiki/search/map boot.
Reason: post-MVP lens arızası MVP outage yaratmamalı.

### D-055 Main branch product truth

main branch resmi urun daraltilmis MVP olarak sabitlendi; manuscript/canvas/export/premium alanlar deferred sayildi.
Reason: repo hikayesi once guvenilir MVP cekirdegini temsil etmeli.

### D-056 Offline map MVP contract

MVP offline map contract MapLibre + bundled local raster tiles olarak kabul edildi.
Reason: kod tabani bu yolda; PMTiles kararsizligi acik MVP blocker olmaktan cikarildi.

### D-057 Faz 1 active lens cut

Main shell active lens set Wiki, Map, Timeline, Search ile sinirlandi; manuscript/canvas/export main boot ve nav disina alindi.
Reason: daraltilmis MVP shell yalniz cekirdek lensleri gostermeli.

### D-058 Faz 1 shell split

Main app shell kucuk orchestration dosyasina indirildi; card grid, timeline, detail panel, lens rail, year dock ayri UI parcasi oldu.
Reason: boot/path ve MVP lens davranisi buyuk App.tsx icinde gomulu kalmamali.

### D-059 Search type filter repo-side

Search type filter UI lokal kirpma yerine repository command contractina indirildi.
Reason: search parity ve visible-set kurali backend kontrat seviyesinde kalmali.

### D-060 Tauri Windows icon hard requirement

Windows Rust gate icin `src-tauri/icons/icon.ico` zorunlu olarak repoda tutulur ve `tauri.conf.json` icinde acik referanslanir.
Reason: tauri-build Windows resource adiminda icon yoksa compile gate duser.

### D-061 Recovery tests file-backed

Entity ve manuscript recovery testleri in-memory repo yerine gercek file-backed SQLite path uzerinden kosar.
Reason: recovery kodu autosave dosyasi ve DB path ile calisir; in-memory test bu kontrati sahte gecirir.

### D-062 Empty world is production default

`create_world` artik seed/demo veri yuklemez; yeni world bos baslar.
Reason: production world create ile demo bootstrap ayni akis olmamali.

### D-063 Demo world is explicit path

Sample entity/manuscript verisi sadece `create_demo_world` ile acik istek uzerine yuklenir.
Reason: test, demo ve gercek urun davranisi birbirinden ayrilmali.

### D-064 Desktop formatting scope

Desktop Prettier kontrolu `dist`, `src-tauri/target` ve `src-tauri/gen` disini resmi format yuzeyi sayar.
Reason: generated/build ciktilari gate gurultusu yaratmamali; format gercek kaynak dosyalar icin kilitlenmeli.

### D-065 MVP and deferred lens exports split

Frontend lens contract export yuzeyi `mvp-lenses.ts` ve `deferred-lenses.ts` olarak ayrildi.
Reason: aktif MVP import yolu ile parked future lens yolu ayni dosyada karismamali.

### D-066 Dead lens aggregator removed

Kullanilmayan `src/modules/lenses.ts` kaldirildi.
Reason: tek satirlik ama bos aggregator aktif import yuzeyini bulandiriyordu.

### D-067 Deferred lenses require explicit flags

Deferred lensler repo icinde kalir ama `src/modules/features.ts` icindeki flag kapisi olmadan aktif shell'e giremez.
Reason: Faz 5 geri acma kontrollu, reversible ve MVP-safe olmali.

### D-068 Manuscript reopens as lazy deferred lens

Ilk geri acilan deferred lens `manuscript` oldu; explicit UI toggle ile acilir ve ancak lens secilince yuklenir.
Reason: Faz 5 geri acma sirasinda boot coupling geri gelmemeli.

### D-069 Manuscript edit returns with local autosave

Deferred `manuscript` lens geri acildiginda ilk aktif davranis scene title/summary/body edit ve 5 saniye autosave oldu.
Reason: lens geri aciliyorsa salt-okuma degil, mevcut writing omurgasi ile faydali minimum akis vermeli.

### D-070 Mention and backlink bridge stays entity-id based

Deferred `manuscript` lens mention gecisi ve wiki detail backlink gecisi `entity_id` ve `node_id` uzerinden kuruldu.
Reason: title/slug rename olsa bile reference guvenligi stable id ile korunmali.

### D-071 Deferred toggles are symmetric

`manuscript`, `canvas`, `export` ve `relations` lensleri ayni local flag mekanigi ile acilir ve nav'a ancak flag `on` ise girer.
Reason: Faz 5 kontrollu geri acma tek lens icin ozel-case degil, genel ve reversible olmali.

### D-072 Deferred shells stay secondary

`canvas`, `export` ve `relations` lensleri geri acildi ama lazy shell olarak kaldi; core startup, wiki/search/map ve DB bootstrap bunlara baglanmadi.
Reason: plan v2 tamamlansa da `main` branch resmi urun hikayesi hala dar MVP'dir.

### D-073 Offline map strategy is explicit package contract

Map lens artik `OFFLINE_MAP_PACKAGE` sabiti ve `public/offline-map/manifest.json` ile resmi MVP paket stratejisini acikca ilan eder: `bundled_raster`, `world-low-zoom`, `z0-z1`.
Reason: map var ama contract belirsiz kalirsa Faz 6 tekrar sislenir; package truth kod icinde tek yerde durmali.

### D-074 Wiki lens presentation now groups by type
Wiki/Search kart listesi type bazli gruplandi, grup ici title sirasi kullanildi ve secili entity icin spotlight panel eklendi.
Reason: Phase 7 ilk UX gecisinde yeni veri modeli yazmadan taranabilirlik ve urun ritmi artmali.

### D-075 Detail and timeline use spotlight/facts split
Detail panel editor/facts bloklarina ayrildi; timeline lens secili entity icin spotlight ve start/end chip gosterir.
Reason: ayni canonical veriyi daha okunur sunmak, fakat core davranis kontratini degistirmemek.

### D-076 Manuscript rhythm stays informational
Manuscript lens scene id/slug/updatedAt icin facts strip ve mention bolumu ile ritim kazandi.
Reason: deferred lens geri acik olsa da yapisal sade, stable-id odakli ve referans-guvenli kalmali.

### D-077 Deferred shells get summary spotlight, not new logic
`canvas`, `export` ve `relations` lenslerine summary spotlight eklendi; secili node/job/backlink sayisi daha okunur gosterilir ama yeni veri akisi veya yeni persistence yazilmaz.
Reason: UX ritim artarken deferred shelller hala hafif ve reversible kalmali.

### D-078 Phase 7 polish stays CSS-only
Phase 7 derin polish command chip, wiki card ve panel hareketini sadece CSS hover/sheen katmaninda artirir; `prefers-reduced-motion` ile geri cekilir.
Reason: gorsel kalite artsin ama yeni state, veri yolu veya ikinci UI davranis katmani acilmasin.

### D-079 Theme and asset side rails stay descriptive
Theme kartlari palette swatch gosterir, asset panel cover/logo/motif manifestini gosterir; ikisi de mevcut secili entity ve mevcut theme option uzerinden turetilir.
Reason: premium polish hissi gelsin ama yeni asset pipeline, schema ya da yan state acilmasin.

### D-080 Manuscript studio depth stays derived
Manuscript lens chapter count, scene order, word count, read-time ve mention count gibi studio yardimci bloklarini sadece secili scene ve tree verisinden turetir.
Reason: studio hissi artsin ama yeni manuscript schema, secondary cache ya da ikinci editor state acilmasin.

### D-081 Two-page manuscript preview stays local
Manuscript lens `Draft / Split / Book` modlari ile ayni draft state uzerinden iki sayfali preview uretir; chapter break ve scene body ayni secili scene verisinden gelir.
Reason: book urun hissi gelsin ama ikinci manuscript store, export layout engine ya da yeni persistence acilmasin.

### D-082 Advanced canvas stays derived
Canvas lens `Relations / Family / Chain` board switch ile ayni visible entity setten node ve edge turetir; secili entity merkez olur, link labeli view turune gore degisir.
Reason: richer board hissi gelsin ama graph persistence, layout engine ya da ikinci relation modeli acilmasin.

### D-083 Export depth stays job-derived
Export lens kind filtresi, artifact sayisi ve artifact listesi ayni `ExportJob[]` yukunden turetilir; yeni export store ya da artifact index acilmaz.
Reason: export shell daha urun gibi olsun ama backend contract buyumesin.

### D-084 Full recheck gate is green
Current desktop state icin typecheck, vitest, vite build, cargo test ve cargo build tekrar kosuldu ve gecti.
Reason: kalan deferred isler kapaninca repo durumu tekrar olculmeli; aktif blocker kalmadi.

### D-085 Vite vendor chunks are explicit
Desktop build `maplibre`, `react-vendor` ve genel `vendor` chunk'lara ayrilir.
Reason: tek buyuk frontend bundle warningini dusurmek ve build ciktisini daha stabil tutmak.

### D-086 MapLibre chunk warning limit is intentional
Vite `chunkSizeWarningLimit` 1200 oldu.
Reason: offline map icin MapLibre chunk'i bilerek repoda tutuluyor; warning gurultusu gercek blocker degil.

### D-087 Authoring velocity starts in wiki lens
Create Entity Studio wiki lens icine type-first hizli create panel olarak gelir ve mevcut `create_entity_command` uzerinden yazar.
Reason: Faz 2 hizli authoring once ayni canonical entity omurgasi uzerinde baslamali; yeni side-store acilmamali.

### D-088 Detail authoring stays command-routed
Detail panel location ve region secimlerinde hizli linked create butonlari verir; bunlar da yine ayni `create_entity_command` uzerinden yazar.
Reason: authoring hizi artsin ama UI core kurali bypass etmesin.

### D-089 Asset attach stays entity-routed
Detail panel cover/thumbnail path alanlari ayni entity command boundary uzerinden kaydedilir.
Reason: asset authoring hizlansin ama UI ikinci metadata kaynagi yaratmasin.

### D-090 Quick relation entry stays typed
Detail panel relation save location/region/event icin typed link alanlarini ayni entity command boundary uzerinden yazar.
Reason: hizli relation authoring gelsin ama serbest-form yan metadata ya da ikinci relation store acilmasin.

### D-091 Selected entity seeds studio presets
Create Entity Studio secili region/location kartini soft context olarak kullanip hizli preset acabilir.
Reason: authoring hizi artsin ama submit yine ayni canonical create command uzerinden gitsin.

### D-092 Asset preset stays local and deterministic
Detail panel secili entity slug/type bilgisinden canonical local asset path presetleri uretebilir.
Reason: asset authoring hizi artsin ama picker zorunlulugu veya ikinci metadata mantigi acilmasin.

### D-093 Asset import copies into world package
Detail panel source asset pathini world icindeki `assets/entities/<type>/<slug>/...` agacina kopyalayip sonra entity media yolunu gunceller.
Reason: asset attach portable olmali; source diski gecici olsa bile world paketi kendi kopyasini tasimali.

### D-094 Map focus rail stays visible-set derived
Map lens geocoded quick-focus rail ve overlay chip secimleri yalnizca mevcut visible setten turetilir.
Reason: Faz 3 map derinligi artsin ama map kendi ayri search/index/state mantigini kurmasin.

### D-095 Map summary strip stays count-only
Map lens visible/geocoded/type summary strip yalnizca mevcut visible set sayimlari ve secili id'yi gosterir.
Reason: mekansal lens daha okunur olsun ama yeni analytics/state katmani acilmasin.

### D-096 Map popover jump stays id-routed
Map hover popover yalnizca secili entity id'yi koruyup wiki veya timeline lensine ziplayabilir.
Reason: Faz 3 lens gecisi hizlansin ama map ikinci detail/store/state omurgasi kurmasin.

### D-097 Map detail shortcut stays selection-only
Map hover popover `Show detail` ile yalnizca mevcut secili entity id'yi degistirir; ayri map-detail state acmaz.
Reason: Faz 3 map authoring/reading hizi artsin ama detail panel ayni secim omurgasinda kalsin.

### D-098 Map selected strip stays persistent and derived
Map lens secili marker icin kalici strip gosterir; title/summary/coords ve lens jump aksiyonlari ayni selected entity state'ten turetilir.
Reason: Faz 3 map daha urun gibi olsun ama ikinci overlay/detail store acilmasin.

### D-099 Map type strip stays visible-set bound
Map lens character/region/event/place chipleri yalnizca mevcut visible set sayimlarini gosterir ve varsa ilk kaydi yeniden secer.
Reason: Faz 3 semantik filtre hissi gelsin ama map ayri filter state ya da secondary query katmani kurmasin.

### D-100 Map legend stays derived
Map lens renk/type/count legend'i yalnizca mevcut visible setten turetilir.
Reason: marker anlami daha acik olsun ama ayri map registry ya da manual sync isi dogmasin.

### D-101 Map overlay chips stay semantic-only
Map overlay chipleri `Geo / R / E / P` gibi kisa sayi semantiklerini yalnizca mevcut visible setten uretir.
Reason: Faz 3 map okumasi hizlansin ama chipler ayri filter/query state sahibi olmasin.

### D-102 Map year copy stays presentation-only
Map overlay ve selected strip mevcut yil bilgisini yalnizca gorunur micro-copy olarak tasiyabilir.
Reason: Faz 3 zaman baglami daha acik olsun ama map tarafinda ikinci year state acilmasin.

### D-103 Wiki spotlight stays command-routed
Wiki spotlight secili location veya region icin linked create butonlari gosterebilir ama submit yine ayni create entity command yolundan gecer.
Reason: kart authoring primitive olsun ama ikinci local create mantigi acilmasin.

### D-104 Manuscript bridge stays selected-entity routed
Manuscript lens secili entity'yi scene yuzeyine tasiyip mention insert ve wiki/timeline jump saglayabilir ama ayni selected entity omurgasini kullanir.
Reason: writing ile worldbuilding baglansin ama ikinci entity-context ya da second scene bridge store acilmasin.

### D-105 Manuscript mention picker stays visible-set bound
Manuscript quick mention picker yalnizca mevcut visible entity setten okur ve mention staging icin ayni scene draft state'ini kullanir.
Reason: hizli writing akisina yardim etsin ama ayri search/index/store acmasin.

### D-106 Manuscript timeline context stays mention-derived
Manuscript scene timeline context yalnizca mevcut mention id'lerini ayni entity spine uzerinden cozup timeline lensine geri acar.
Reason: scene ve timeline baglansin ama ikinci scene-timeline cache ya da graph katmani acilmasin.

### D-107 Manuscript mention insert stays caret-aware only
Manuscript mention insert body icindeki mevcut caret/selection noktasini kullanabilir ama bu bilgi yalnizca gecici UI state'tir.
Reason: writing hizi artsin ama ikinci draft modeli ya da editor engine acilmasin.

### D-108 Wiki scene-context stays backlink-derived
Wiki detail panel scene-context ozetini ayni backlink payload'inden kurar ve relations/manuscript gecisini oradan acar.
Reason: worldbuilding ile writing baglansin ama ikinci scene summary cache acilmasin.

### D-109 Relations grouping stays backlink-derived
Relations lens backlink satirlarini chapter bazli gruplayabilir ama ayni backlink listesi disinda yeni graph/read model kurmaz.
Reason: scene agi daha okunur olsun ama second relation cache acilmasin.

### D-110 Export artifact grouping stays job-derived
Export lens artifact spotlight ve kind grouping kurabilir ama ayni export jobs payload'i disinda ikinci artifact index kurmaz.
Reason: artifact katmani daha okunur olsun ama queue truth source tek kalsin.

### D-111 Manuscript export metadata stays job-derived
Export lens manuscript artifact metadata gosterebilir ama bunu ayni export jobs payload'inden turetir.
Reason: manuscript artifact durumu gorunur olsun ama ayri manuscript-export registry acilmasin.

### D-112 Export package summary stays path-derived
Export lens package root ve file/job ozetini ayni export jobs payload'indeki target/artifact path'lerden turetir.
Reason: bundle hissi gorunsun ama ayri package registry ya da artifact index acilmasin.

### D-113 Curated outputs stay job-derived
Export lens curated output lane'lerini ayni export jobs payload'indeki latest kind kayitlarindan turetir.
Reason: publish hissi artsin ama ayri publication index ya da sheet registry acilmasin.

### D-114 Bundle readiness stays job-derived
Export lens reusable bundle hazirlik durumunu ayni export jobs payload'indeki kind ve artifact varligindan turetir.
Reason: package olgunlugu gorunsun ama ayri reusable-world registry acilmasin.

### D-115 Reference sheets stay job-derived
Export lens reference sheet satirlarini ayni export jobs payload'indeki target ve artifact path'lerden turetir.
Reason: curated sheet hissi artsin ama ayri sheet cache ya da export-side registry acilmasin.

### D-116 Export manifest digest stays job-derived
Export lens asset manifest ozetini ayni export jobs payload'indeki artifact path uzantilarindan turetir.
Reason: manifest hissi gorunsun ama ayri asset-manifest index acilmasin.

### D-117 Export history stays job-derived
Export lens lane history ozetini ayni export jobs payload'indeki createdAt ve status alanlarindan turetir.
Reason: run gecmisi gorunsun ama ayri history store acilmasin.

### D-118 Delivery checklist stays job-derived
Export lens delivery checklist satirlarini ayni export jobs payload'indeki kind, status ve artifact varligindan turetir.
Reason: publish hazirligi gorunsun ama ayri publish-state registry acilmasin.

### D-119 Format readiness stays job-derived
Export lens PDF ve ilerideki richer format hazirlik satirlarini ayni export jobs payload'indeki mevcut kind ve artifact varligindan turetir.
Reason: ileriki format yolu gorunsun ama ayri format registry acilmasin.

### D-120 Target roots stay job-derived
Export lens hedef klasor koklerini ayni export jobs payload'indeki target path'lerden turetir.
Reason: package/target dagilimi gorunsun ama ayri target-root registry acilmasin.
