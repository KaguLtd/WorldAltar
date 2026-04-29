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

### D-121 Bundle contents stay job-derived
Export lens bundle icerik satirlarini ayni export jobs payload'indeki artifact path'lerden turetir.
Reason: paket icerigi gorunsun ama ayri bundle-content registry acilmasin.

### D-122 Manuscript folio strip stays presentation-only
Manuscript split/book preview folio strip ve page ribbon gosterebilir ama mevcut scene/chapter/mention verisini yalnizca sunum icin kullanir.
Reason: premium kitap hissi artsin ama ikinci reading model ya da pagination state acilmasin.

### D-123 Detail luxury strip stays presentation-only
Detail panel type/year/cover/theme chiplerini premium strip olarak gosterebilir ama mevcut entity verisini yalnizca sunum icin kullanir.
Reason: detail panel daha zengin hissetsin ama ikinci entity summary modeli acilmasin.

### D-124 Hover preview strip stays presentation-only
Hover preview id/year/cover chiplerini premium strip olarak gosterebilir ama mevcut hovered entity verisini yalnizca sunum icin kullanir.
Reason: hover preview daha zengin hissetsin ama ikinci hover modeli ya da cache acilmasin.

### D-125 Manuscript authoring reopens with real create flow
Deferred manuscript lens chapter ve scene create akislarini ayni manuscript repository boundary uzerinden geri acti.
Reason: writing lensi sadece seeded demo okuma yuzeyi olarak kalmamali; gercek authoring'e tekrar yaklasmali.

### D-126 Export job artifact truth is explicit
Export job payload'i primary deliverable artifact'i acik alan olarak tasir; companion artifact listesi bunu tamamlar.
Reason: target path, ana deliverable ve manifest gibi yan artifact'lar ayni alanda anlamsal olarak birbirine karismamali.

### D-127 Create studio templates stay local and type-bound
Create Entity Studio summary/body scaffold butonlari secili entity baglamini veya secili type'i kullanarak yalnizca local draft alanlarini doldurur.
Reason: authoring hizi artsin ama yeni draft store, second create path veya canonical command boundary disi state acilmasin.

### D-128 Map scope strip stays local and visible-set bound
Map lens `All / Character / Region / Event / Place` scope strip'i yalnizca mevcut visible set uzerinde lokal filtre uygular.
Reason: Faz 3 mekansal okuma derinlessin ama map ayri repository query, ikinci lens state'i ya da yeni canonical filter seam'i acmasin.

### D-129 Map year resonance stays derived
Map lens dominant layer ve ongoing count ozetini yalnizca mevcut scoped visible set ve aktif yil bilgisinden turetir.
Reason: yil baglamli mekansal his artsin ama ayri analytics cache, ikinci timeline state'i ya da exportable metric modeli acilmasin.

### D-130 Manuscript scene create may seed selected context
Deferred manuscript lens yeni scene create ederken secili entity'yi istege bagli ilk mention olarak ayni create scene command payload'ine tasiyabilir.
Reason: writing ve worldbuilding arasindaki kopru hizlansin ama ikinci scene-context store'u, ayri create path'i ya da canonical mention seam disi metadata acilmasin.

### D-131 Export UI artifact truth stays normalized
Export lens artifact sayimlari, bundle satirlari ve manifest ozetleri `primaryArtifactPath` ile companion `artifactPaths` listesini birlikte normalize ederek turetir.
Reason: done ve queued export job'larinda deliverable truth tek hatta kalsin; UI eski `artifactPaths` varsayimi yuzunden yanlis file count veya eksik bundle gorunumu uretmesin.

### D-132 Detail draft assists stay local and type-derived
Detail panel local draft assist butonlari secili entity type'i ve mevcut backlink baglamini kullanarak summary/body alanlarini doldurur veya genisletir.
Reason: Faz 2 authoring hizi artsin ama UI ikinci entity editor modeli, ayri draft store'u ya da canonical entity command boundary disi yazma yolu acmasin.

### D-133 Map year shift stays derived
Map lens opening/closing/anchored year strip'ini yalnizca mevcut scoped visible set ve aktif yil bilgisinden turetir.
Reason: Faz 3 yil degisimi haritada anlamsal fark yaratsin ama ayri timeline cache'i, ikinci year engine'i ya da exportable analytics modeli acilmasin.

### D-134 Map spatial ledger stays count-semantic
Map lens spatial ledger satirlari region, event, place ve geocoded marker basincini yalnizca mevcut scoped visible set sayimlarindan uretir.
Reason: mekansal okuma derinlessin ama territory editoru, ikinci relation store'u ya da yeni geometry schema erken acilmasin.

### D-135 Map relation ledger stays typed-link derived
Map lens selected entity relation ledger'ini mevcut typed link alanlarindan (`regionId`, `parentRegionId`, `locationId`) ve canonical visible/entity set'ten turetir.
Reason: Faz 3 mekansal baglar okunur olsun ama ayri map graph store'u, ikinci territory registry'si ya da yeni spatial persistence modeli acilmasin.

### D-146 Map territory bands stay typed-link derived
Map lens territory bands satirlari region, location ve event typed link'lerinden territory pressure ozetleri uretebilir; secili region varsa onun cekirdegi, yoksa visible set icinde en yuklu region bantlari gosterilir.
Reason: Faz 3 overlay/territory hissi artsin ama ayri geometry layer'i, territory cache'i ya da yeni spatial persistence seam'i acilmasin.

### D-147 Map territory focus stays selected-strip derived
Map lens selected strip location ve event secimlerinde host place/region context'ini territory focus chip'leri olarak gosterebilir; bunlar mevcut typed link alanlarindan turetilir.
Reason: Faz 3 territory okumasi secili kayit uzerinde de netlessin ama ayri territory sidebar modeli, ikinci selected-state cache'i ya da yeni persistence seam'i acilmasin.

### D-148 Map territory horizon stays overlay-derived
Map lens overlay stack secili kayit icin territory context'ini kisa horizon chip'lerine sikistirabilir; bunlar territory focus bilgisinin ayni typed-link derive hattindan gelir.
Reason: Faz 3 territory hissi dogrudan map yuzeyine tasinsin ama ayri overlay registry'si, ikinci map cache'i ya da yeni spatial metadata seam'i acilmasin.

### D-149 Map territory status stays selected-strip derived
Map lens selected strip location ve event secimlerinde territory path anlatisini ve gerekirse pressure seat bilgisini gosterebilir; bunlar ayni typed-link derive hattindan gelir.
Reason: Faz 3 mekansal baglam sadece chip seviyesinde kalmasin ama ayri territory-detail modeli, ikinci strip cache'i ya da yeni persistence seam'i acilmasin.

### D-150 Map territory route stays selected-strip derived
Map lens selected strip location ve event secimlerinde territory route butonlari gosterebilir; bunlar host region/place zincirini ayni typed-link derive hattindan cikarir ve mevcut `onSelect` seam'i ile ziplatir.
Reason: Faz 3 territory baglami aksiyona donussun ama ayri route persistence'i, ikinci map navigation modeli ya da yeni command seam'i acilmasin.

### D-151 Map territory chain stays selected-strip derived
Map lens region secimlerinde parent/core/child/spread baglamini territory chain chip'leri olarak gosterebilir; bunlar ayni typed-link derive hattindan gelir ve varsa region secimine geri ziplatabilir.
Reason: Faz 3 territory okuması region seviyesinde daha yapisal olsun ama ayri territory tree modeli, ikinci region cache'i ya da yeni persistence seam'i acilmasin.

### D-152 Map territory pulse stays selected-strip derived
Map lens selected strip region/location/event secimlerinde territory pulse metrikleri gosterebilir; bunlar ayni typed-link derive hattindan place/event/year sayisi olarak uretilir.
Reason: Faz 3 territory okuması daha nicel hissetsin ama ayri analytics layer'i, ikinci strip cache'i ya da yeni persistence seam'i acilmasin.

### D-153 Map region focus stays selected-strip derived
Map lens selected strip region/location/event secimlerinde compact region focus ozeti gosterebilir; bu ozet territory host zincirinden region cekirdegi ve pressure/spread sayilarini turetir.
Reason: Faz 3 territory bilgisi daha birlesik hissedilsin ama ayri region-summary modeli, ikinci map cache'i ya da yeni persistence seam'i acilmasin.

### D-154 Map region focus rail stays selected-strip derived
Map lens selected strip region-first focus rail gosterebilir; bu rail region focus, territory route ve territory pulse bilgisini ayni typed-link derive hattindan sıkıştırır.
Reason: Faz 3 region-first okuma daha tek bakista gelsin ama ayri focus-rail modeli, ikinci map summary cache'i ya da yeni persistence seam'i acilmasin.

### D-155 Map territory desk stays derived
Map lens territory desk bolumu region focus rail ve territory chain satirlarini ayni typed-link derive hattindan birlestirebilir.
Reason: Faz 3 map reasoning daha masaustu hissi versin ama ayri territory workspace modeli, ikinci desk cache'i ya da yeni persistence seam'i acilmasin.

### D-136 Detail-to-manuscript scene draft stays command-routed
Wiki detail panel secili entity'den yeni scene draft baslatabilir ama bunu ayni manuscript chapter/scene command boundary uzerinden ve canonical mention seam'i ile yapar.
Reason: Faz 4 worldbuilding-to-writing koprusu merkezilessin ama ikinci scene draft modeli, ayri scene queue'su ya da UI-yalniz manuscript store'u acilmasin.

### D-137 Manuscript scene prefill stays selected-entity derived
Manuscript create scene yuzeyi secili entity'den title/summary/body icin local draft iskeleti doldurabilir, fakat create aninda yine ayni canonical scene command yolunu kullanir.
Reason: scene authoring hizi artsin ama ayri precompose store'u, ikinci manuscript editor modeli ya da command disi persistence acilmasin.

### D-138 Manuscript scene scaffolds stay local and selected-context derived
Manuscript create scene yuzeyi secili entity ve varsa en son backlink baglamindan reusable scene scaffold ve linked-thread continuation cue'lari uretebilir, fakat bunlar yalnizca local draft alanlarini doldurur.
Reason: Faz 4 worldbuilding-to-writing akisi hizlansin ama ayri scene-planning modeli, ikinci manuscript draft store'u ya da command disi persistence seam'i acilmasin.

### D-139 Manuscript continuity picks stay backlink-derived
Manuscript create scene yuzeyi explicit backlink satirlarindan secilebilir continuity butonlari gosterebilir ve secilen scene/chapter baglamindan follow-up draft doldurabilir.
Reason: writing koprusu daha somut olsun ama ayri continuity registry'si, scene-outline persistence'i ya da second planning model'i acilmasin.

### D-140 Detail follow-up drafting stays command-routed and backlink-derived
Wiki detail panel explicit backlink continuity butonlari gosterebilir ve secilen backlink sahnesinden follow-up scene draft'ini ayni manuscript create command boundary uzerinden baslatabilir.
Reason: Faz 4 koprusu detail tarafinda da iki yonlu hissetsin ama ayri detail-to-scene planner modeli, ek queue ya da command disi manuscript state acilmasin.

### D-141 Manuscript tree continuity chips stay backlink-derived
Manuscript tree chapter ve scene kartlari secili entity icin backlink-derived continuity chip'leri gosterebilir; chapter bazinda linked count, scene bazinda linked scene etiketi ayni backlink payload'inden turetilir.
Reason: writing desk daha okunur olsun ama ayri tree annotation store'u, ikinci manuscript cache'i ya da scene metadata persistence'i acilmasin.

### D-142 Manuscript chapter affinity picks stay backlink-derived
Manuscript create scene yuzeyi secili entity'nin backlink baglamindan chapter affinity butonlari gosterebilir ve scene create chapter secimini oradan hizlandirabilir.
Reason: Faz 4 authoring ritmi hizlansin ama ayri chapter-recommendation modeli, ikinci manuscript planner cache'i ya da command disi state acilmasin.

### D-143 Manuscript chapter rhythm stays tree-derived
Manuscript create scene yuzeyi secili chapter icin next-scene slot, linked count ve chapter-beat scaffold'u ayni manuscript tree ve backlink baglamindan turetebilir.
Reason: Faz 4 scene authoring daha ritimli olsun ama ayri chapter-outline modeli, ikinci planning store'u ya da command disi persistence acilmasin.

### D-144 Manuscript composition mode stays local
Manuscript create scene yuzeyi `free`, `opening` ve `continuation` composition mode'larini local UI state olarak gosterebilir; bu modlar mevcut scaffold secimlerinden turetilir ve create payload'ine yeni metadata yazmaz.
Reason: Faz 4 authoring niyeti daha okunur olsun ama ayri composition registry'si, ikinci manuscript mode store'u ya da persistence seam'i acilmasin.

### D-145 Manuscript composition guides stay prompt-only
Manuscript create scene yuzeyi aktif composition mode'a gore kisa writing guide kartlari gosterebilir; bu kartlar secili entity ve chapter baglamindan turetilir ama yeni persistence ya da planner modeli acmaz.
Reason: Faz 4 drafting yonlendirmesi artsin ama ayri outlining sistemi, second prompt cache'i ya da command disi manuscript metadata'si dogmasin.

### D-156 Manuscript composition deck stays local and applyable
Manuscript create scene yuzeyi `free`, `opening` ve `continuation` niyetleri icin applyable composition deck butonlari gosterebilir; bunlar yalnizca local form alanlarini doldurur ve create payload'ine yeni metadata yazmaz.
Reason: Faz 4 authoring niyeti daha eyleme donuk olsun ama ayri composition workflow store'u, ikinci planner modeli ya da persistence seam'i acilmasin.

### D-157 Manuscript composition ledger stays local
Manuscript create scene yuzeyi aktif composition mode, secili chapter, continuation anchor ve secili entity icin compact bir composition ledger gosterebilir; bu yalnizca mevcut local state'i okur.
Reason: Faz 4 authoring karari daha okunur olsun ama ayri ledger persistence'i, ikinci composition cache'i ya da yeni metadata seam'i acilmasin.

### D-158 Manuscript composition blocks stay local and scaffold-derived
Manuscript create scene yuzeyi aktif composition mode icin ready/pending scaffold block kartlari gosterebilir; bu kartlar ayni local draft body uzerinde eksik satirlari append eder ve create payload'ine yeni metadata yazmaz.
Reason: Faz 4 authoring yapisi daha gorunur olsun ama ayri outline persistence'i, ikinci scaffold store'u ya da planner seam'i acilmasin.

### D-159 Manuscript composition queue stays local and chapter-derived
Manuscript create scene yuzeyi secili chapter, next-scene slot, backlink anchor ve linked load bilgisinden local bir composition queue gosterebilir; queue aksiyonlari ayni draft formunu opener veya follow-up niyetiyle doldurur.
Reason: Faz 4 create karari daha ritimli ve chapter-aware olsun ama ayri scheduling modeli, ikinci queue store'u ya da persistence seam'i acilmasin.

### D-160 Manuscript reserve slot stays local and queue-derived
Manuscript composition queue chapter icinde reserve slot lane'i gosterebilir ve bunu free-mode draft olarak ayni local create formuna doldurabilir.
Reason: Faz 4 scene backlog hissi artsin ama ayri backlog persistence'i, ikinci planning board'u ya da yeni command seam'i acilmasin.

### D-161 Manuscript chapter ordering stays local and queue-derived
Manuscript composition queue current slot, closing pressure ve after-slot ordering kartlari gosterebilir; closing-beat aksiyonu da ayni local draft formunu doldurur.
Reason: Faz 4 chapter sequencing daha okunur olsun ama ayri ordering persistence'i, ikinci outline modeli ya da yeni planner seam'i acilmasin.

### D-162 Manuscript scene lanes stay local and queue-mirrored
Manuscript create scene yuzeyi opening, reserve, closing ve follow-up lane kartlari gosterebilir; bu kartlar composition queue ile ayni local prefill aksiyonlarini tekrar kullanir.
Reason: Faz 4 chapter-flow kararlarini daha dogrudan okunur kilalim ama ayri lane persistence'i, ikinci storyboard modeli ya da yeni command seam'i acilmasin.

### D-163 Manuscript scene sequence stays local and chapter-derived
Manuscript create scene yuzeyi chapter icindeki latest scene ve sonraki slotlardan local bir scene sequence gosterebilir; next, closing ve aftermath kartlari ayni local prefill aksiyonlarini tetikler.
Reason: Faz 4 sequence hissi artsin ama ayri outline persistence'i, ikinci sequence store'u ya da yeni planner seam'i acilmasin.

### D-164 Manuscript scene outline stays local and chapter-derived
Manuscript create scene yuzeyi previous, next ve aftermath outline kartlari gosterebilir; bunlar mevcut chapter scene listesi ve backlink anchor'larindan turetilir ve ayni local prefill aksiyonlarini kullanir.
Reason: Faz 4 chapter akisi daha net okunsun ama ayri outline persistence'i, ikinci scene-board modeli ya da yeni planner seam'i acilmasin.

### D-165 Manuscript scene storyboard stays local and outline-mirrored
Manuscript create scene yuzeyi previous/current/aftermath storyboard kartlari gosterebilir; bunlar outline ve sequence baglamini sIkistirir ve ayni local prefill aksiyonlarini tekrar kullanir.
Reason: Faz 4 authoring ritmi daha tek bakista gorunsun ama ayri storyboard persistence'i, ikinci planning board'u ya da yeni command seam'i acilmasin.

### D-166 Manuscript scene planning strip stays local and storyboard-derived
Manuscript create scene yuzeyi previous/current/aftermath planning strip'i gosterebilir; bu strip storyboard baglamini daha kompakt bir command row'a sikistirir ve ayni local prefill aksiyonlarini kullanir.
Reason: Faz 4 chapter planlamasi tek satirda da okunabilsin ama ayri strip persistence'i, ikinci quick-planner modeli ya da yeni command seam'i acilmasin.

### D-167 Manuscript scene planning desk stays local and strip-derived
Manuscript create scene yuzeyi previous/current/aftermath planning desk kartlari gosterebilir; bu kartlar planning strip baglamini biraz daha okunur lane kartlarina tasir ve ayni local prefill aksiyonlarini kullanir.
Reason: Faz 4 planning hissi daha masaustu gibi olsun ama ayri planning persistence'i, ikinci desk modeli ya da yeni command seam'i acilmasin.

### D-168 Manuscript scene planning HUD stays local and desk-derived
Manuscript create scene yuzeyi previous/current/after planning HUD gosterebilir; bu HUD planning desk baglamini daha da kompakt bir command row'a indirir ve ayni local prefill aksiyonlarini kullanir.
Reason: Faz 4 scene planlamasi tek bakista da okunabilsin ama ayri HUD persistence'i, ikinci quick-command modeli ya da yeni command seam'i acilmasin.

### D-169 Manuscript scene planning commands stay local and HUD-derived
Manuscript create scene yuzeyi opener/reserve/close/after komutlarini en kompakt satirda gosterebilir; bu komutlar ayni local prefill aksiyonlarini tekrar kullanir.
Reason: Faz 4 authoring aksiyonlari tek bakista calistirilabilsin ama ayri command persistence'i, ikinci quick-action modeli ya da yeni seam acilmasin.

### D-170 Manuscript scene launch bar stays local and form-derived
Manuscript create scene yuzeyi chapter/title/summary/body readiness, mode ve seed durumunu create butonuna yakin bir launch bar olarak gosterebilir; bu yalnizca mevcut local form state'ini okur.
Reason: Faz 4 create karari submit noktasinda daha okunur olsun ama ayri validation persistence'i, ikinci launch modeli ya da yeni command seam'i acilmasin.

### D-171 Manuscript scene launch receipt stays local and submit-derived
Manuscript create scene yuzeyi son submit edilen scene icin title/chapter/mode/seed bilgisini local bir launch receipt olarak gosterebilir; bu yalnizca basarili create aninda mevcut form state'inden uretilir.
Reason: Faz 4 submit sonrasi gorunurluk artsin ama ayri job persistence'i, ikinci receipt store'u ya da yeni event seam'i acilmasin.

### D-172 Manuscript launch followthrough stays local and receipt-derived
Manuscript son launch receipt bilgisini chapter header ve world-link bridge yuzeyinde de gosterebilir; bu yalnizca mevcut local receipt state'ini tekrar kullanir.
Reason: Faz 4 create sonrasi baglam tek noktada kaybolmasin ama ayri submit-history modeli, ikinci followthrough store'u ya da yeni event seam'i acilmasin.

### D-173 Manuscript launch badge stays local and receipt-derived
Manuscript tree son launch receipt ile eslesen scene kartini inline bir launch badge ile isaretleyebilir; bu yalnizca mevcut local receipt state'ini tekrar kullanir.
Reason: Faz 4 create sonrasi yeni sahne tree icinde hemen ayirt edilebilsin ama ayri badge persistence'i, ikinci scene-status modeli ya da yeni event seam'i acilmasin.

### D-174 Manuscript selected launch stays local and receipt-derived
Manuscript detail panel secili scene son launch receipt ile eslesiyorsa ayni receipt bilgisini local olarak gosterebilir; bu yalnizca mevcut local receipt state'ini tekrar kullanir.
Reason: Faz 4 create sonrasi baglam detail okumada da korunabilsin ama ayri detail-history modeli, ikinci receipt store'u ya da yeni event seam'i acilmasin.

### D-175 Manuscript launch reuse stays local and receipt-derived
Manuscript detail panel secili scene son launch receipt ile eslesiyorsa bu receipt create formunu yeniden seed eden bir reuse aksiyonu da sunabilir; bu aksiyon yalnizca mevcut local receipt state'i ve mevcut create form state setter'larini kullanir.
Reason: Faz 4 create sonrasi authoring akisina hizli geri donus olsun ama ayri launch-template persistence'i, ikinci queue modeli ya da yeni submit-history seam'i acilmasin.

### D-176 Manuscript launch focus stays local and receipt-derived
Manuscript launch receipt, olusturulan scene tree icinde bulunabiliyorsa onu yeniden secen bir focus aksiyonu da sunabilir; bu aksiyon yalnizca mevcut local receipt state'i ile mevcut tree/secili-scene seam'ini kullanir.
Reason: Faz 4 create sonrasi kullanici yeni sahneye tek tikla geri donebilsin ama ayri scene-history modeli, ikinci navigation store'u ya da yeni routing seam'i acilmasin.

### D-177 Manuscript scene handoff stays local and scene-derived
Manuscript selected scene detail, mevcut scene ve aktif chapter baglamindan continuation draft'i ayni create formuna handoff edebilir; bu aksiyon yalnizca mevcut scene detail, selected entity ve mevcut create form state setter'larini kullanir.
Reason: Faz 4 writing koprusu sadece world->scene degil scene->next scene ritmini de hizlandirsin ama ayri handoff persistence'i, ikinci planner modeli ya da yeni authoring seam'i acilmasin.

### D-178 Manuscript next-slot handoff stays local and scene-derived
Manuscript selected scene detail, mevcut scene ve aktif chapter sirasindan bir sonraki sahne slotunu da ayni create formuna queue edebilir; bu aksiyon yalnizca mevcut scene detail, active chapter order ve mevcut create form state setter'larini kullanir.
Reason: Faz 4 chapter ritmi selected scene uzerinden de hizlansin ama ayri chapter-queue persistence'i, ikinci slot planner'i ya da yeni sequencing seam'i acilmasin.

### D-179 Manuscript closing-slot handoff stays local and scene-derived
Manuscript selected scene detail, mevcut scene ve aktif chapter sirasindan bir closing slot draft'ini da ayni create formuna queue edebilir; bu aksiyon yalnizca mevcut scene detail, active chapter order ve mevcut create form state setter'larini kullanir.
Reason: Faz 4 chapter kapanis ritmi selected scene uzerinden de hizlansin ama ayri closing-planner persistence'i, ikinci sequence modeli ya da yeni seam acilmasin.

### D-180 Manuscript opening-slot handoff stays local and scene-derived
Manuscript selected scene detail, mevcut scene baglamindan chapter opening draft'ini da ayni create formuna queue edebilir; bu aksiyon yalnizca mevcut scene detail, active chapter baglami ve mevcut create form state setter'larini kullanir.
Reason: Faz 4 chapter opening ritmi selected scene uzerinden de hizlansin ama ayri opener-planner persistence'i, ikinci sequencing modeli ya da yeni seam acilmasin.

### D-181 Manuscript handoff queue stays local and scene-derived
Manuscript selected scene detail, opening/next-slot/closing/follow-up niyetlerini kisa bir handoff queue olarak da gosterebilir; bu queue yalnizca mevcut scene detail ve active chapter sirasindan turetilir.
Reason: Faz 4 scene-to-scene planning tek bakista da okunabilsin ama ayri queue persistence'i, ikinci planning store'u ya da yeni sequencing seam'i acilmasin.

### D-182 Manuscript launch rhythm stays local and handoff-derived
Manuscript create scene launch bar, selected scene handoff queue varsa ayni niyetleri submit noktasina yakin kompakt chip'ler olarak da gosterebilir; bu yalnizca mevcut handoff queue'dan turetilir.
Reason: Faz 4 handoff niyeti create kararina yakin da gorunsun ama ayri launch-planner persistence'i, ikinci launch queue modeli ya da yeni seam acilmasin.

### D-183 Manuscript handoff commands stay local and scene-derived
Manuscript selected scene detail, handoff queue'daki opening/next-slot/closing/follow-up niyetlerini ayni yerde daha kisa command chip'ler olarak da gosterebilir; bu chip'ler yalnizca mevcut scene detail ve handoff queue'dan turetilir.
Reason: Faz 4 selected scene detail daha operasyonel bir planning desk gibi hissedilsin ama ayri command persistence'i, ikinci scene-control modeli ya da yeni seam acilmasin.

### D-184 Manuscript handoff edit cues stay local and scene-derived
Manuscript selected scene detail, ayni handoff niyetlerini aktif scene editor govdesine kisa cue bloklari olarak da ekleyebilir; bu aksiyon yalnizca mevcut scene detail, mevcut draft body state'i ve mevcut setter seam'ini kullanir.
Reason: Faz 4 create planning ile edit ritmi daha yakin dursun ama ayri edit-assist persistence'i, ikinci manuscript editor modeli ya da yeni seam acilmasin.

### D-185 Manuscript handoff summary cue stays local and scene-derived
Manuscript selected scene detail, ayni handoff niyetlerini aktif scene summary alanina tek satirlik bir cue olarak da ekleyebilir; bu aksiyon yalnizca mevcut scene detail, mevcut draft summary state'i ve mevcut setter seam'ini kullanir.
Reason: Faz 4 selected scene edit ritmi summary seviyesinde de hizlansin ama ayri summary-assist persistence'i, ikinci edit modeli ya da yeni seam acilmasin.

### D-186 Manuscript handoff title cue stays local and scene-derived
Manuscript selected scene detail, ayni handoff niyetlerini aktif scene title alanina kisa bir retitling cue olarak da ekleyebilir; bu aksiyon yalnizca mevcut scene detail, mevcut draft title state'i ve mevcut setter seam'ini kullanir.
Reason: Faz 4 selected scene edit ritmi title seviyesinde de hizlansin ama ayri title-assist persistence'i, ikinci edit modeli ya da yeni seam acilmasin.

### D-187 Manuscript handoff edit assist stays local and scene-derived
Manuscript selected scene detail, title/summary/body handoff cue'larini kompakt bir edit-assist yuzeyinde birlikte gosterebilir ve tek tikla hepsini mevcut draft alanlarina uygulayabilir; bu yalnizca mevcut local draft state'leri ve mevcut setter seam'larini kullanir.
Reason: Faz 4 selected scene authoring daha hizli ve daha tek masada hissedilsin ama ayri assist persistence'i, ikinci editor modeli ya da yeni seam acilmasin.

### D-188 Manuscript launch assist stays local and receipt-derived
Manuscript launch receipt ve uygun oldugunda selected launch bolumu, ayni receipt'ten turetilen title/summary/body cue'larini kompakt bir assist yuzeyinde gosterebilir ve tek tikla aktif scene editor alanlarina geri uygulayabilir; bu yalnizca mevcut local receipt state'i ve mevcut draft setter seam'larini kullanir.
Reason: Faz 4 launch followthrough sadece create formuna degil scene edit ritmine de geri aksin ama ayri launch-assist persistence'i, ikinci receipt modeli ya da yeni seam acilmasin.

### D-189 Map region focus deck stays typed-link derived
Map territory desk, mevcut focus/rail/chain/pulse/route turevlerini tek bir region-first focus deck icinde de toplayabilir; bu deck yalnizca mevcut typed link turevlerinden hesaplanir.
Reason: Faz 3 kapanisa giderken harita reasoning katmanlari daha toparli gorunsun ama ayri map-planner persistence'i, yeni territory schema'si ya da ikinci relation store'u acilmasin.

### D-190 Map selected strip can replay the region focus deck
Map selected strip, ayni region-first focus deck'i secili kayit akisinda da kompakt chip'ler olarak gosterebilir; bu replay yalnizca mevcut focus deck'ten turetilir.
Reason: Faz 3 map reasoning sadece alt bantta degil secili kayit akisinda da merkez hissedilsin ama ayri selected-map planner persistence'i, yeni UI store'u ya da ikinci territory seam'i acilmasin.

### D-191 Export delivery receipt stays latest-job derived
Export lens, latest visible job icin hedef root, primary artifact ve artifact sayisini kompakt bir delivery receipt olarak da gosterebilir; bu receipt yalnizca mevcut export job listesinden turetilir.
Reason: Faz 6 artifact hatti daha teslimata yakin hissedilsin ama ayri delivery persistence'i, yeni publish store'u ya da ikinci export planner modeli acilmasin.

### D-192 Export delivery lanes stay history-derived
Export lens, lane history uzerinden her export kind icin latest/prior teslimat ozetini de gosterebilir; bu lanes yalnizca mevcut export job listesi ve zaman sirasindan turetilir.
Reason: Faz 6 teslimat gecmisi daha okunur olsun ama ayri release timeline persistence'i, yeni shipment modeli ya da ikinci export history store'u acilmasin.

### D-193 Export delivery pulse stays status-derived
Export lens, gorunen export job seti icin done/queued/running/failed dagilimini kompakt bir delivery pulse olarak da gosterebilir; bu pulse yalnizca mevcut job status alanlarindan turetilir.
Reason: Faz 6 teslimat ekrani daha operasyonel hissedilsin ama ayri queue monitor persistence'i, yeni runtime dashboard modeli ya da ikinci export state store'u acilmasin.

### D-194 Export recent activity stays job-list derived
Export lens, gorunen export job setinin en son hareketlerini ters kronolojik bir activity listesi olarak da gosterebilir; bu liste yalnizca mevcut export job zaman sirasi ve artifact/target alanlarindan turetilir.
Reason: Faz 6 teslimat akisi daha yasayan bir queue hissi versin ama ayri activity log persistence'i, yeni audit modeli ya da ikinci export event store'u acilmasin.

### D-195 Export queue intent stays filter-and-history derived
Export lens, aktif filter ve gorunen lane history uzerinden bir sonraki mantikli queue yonunu kompakt bir intent olarak da gosterebilir; bu intent yalnizca mevcut filter state'i ve export job listesinden turetilir.
Reason: Faz 6 queue eylemi daha yonlendirici hissedilsin ama ayri recommendation persistence'i, yeni planner modeli ya da ikinci export control store'u acilmasin.

### D-196 Export queue intent can trigger the suggested lane
Export lens, queue intent yuzeyinden ayni onerilen lane'i dogrudan queue edebilir; bu aksiyon yalnizca mevcut `onQueue` seam'ini kullanir.
Reason: Faz 6 export ekraninda onerilen sonraki adim daha dogrudan uygulanabilsin ama ayri intent workflow persistence'i, yeni action store'u ya da ikinci queue seam'i acilmasin.

### D-197 Shell folio strip stays app-state derived
App shell, world slug, aktif lens, secili fokus, tema ve deferred durumunu kompakt bir folio strip olarak da gosterebilir; bu strip yalnizca mevcut app state'ten turetilir.
Reason: Faz 5 premium shell hissi daha erken gelsin ama ayri shell-presentation persistence'i, yeni layout store'u ya da ikinci command seam'i acilmasin.
