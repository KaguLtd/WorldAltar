import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, {
  type GeoJSONSourceSpecification,
  type LngLatLike,
  type Map as MapLibreMap
} from 'maplibre-gl';
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { EntityRecord } from '../entity-model/types';
import {
  loadOfflineMapPackage,
  OFFLINE_MAP_PACKAGE,
  type OfflineMapPackage
} from './contracts';
import {
  buildTerritoryBands,
  buildTerritoryChain,
  buildTerritoryFocus,
  buildTerritoryHorizon,
  buildTerritoryPulse,
  buildRegionFocus,
  buildRegionFocusRail,
  buildTerritoryRoute,
  buildTerritoryStatus
} from './territory';

type OfflineMapProps = {
  records: EntityRecord[];
  selectedEntityId: string | null;
  year: number;
  onSelect: (id: string) => void;
  onJump: (lens: 'Wiki' | 'Timeline', id: string) => void;
};

type MapScope = 'all' | EntityRecord['type'];

const GEOJSON_SOURCE_ID = 'worldaltar-markers';
const CIRCLE_LAYER_ID = 'worldaltar-markers-circle';
const LABEL_LAYER_ID = 'worldaltar-markers-label';
export function OfflineMap({
  records,
  selectedEntityId,
  year,
  onSelect,
  onJump
}: OfflineMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const loadedRef = useRef(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [scope, setScope] = useState<MapScope>('all');
  const [mapPackage, setMapPackage] =
    useState<OfflineMapPackage>(OFFLINE_MAP_PACKAGE);
  const [mapPackageSource, setMapPackageSource] = useState<
    'manifest' | 'fallback'
  >('fallback');
  const scopedRecords = useMemo(
    () =>
      scope === 'all'
        ? records
        : records.filter((record) => record.type === scope),
    [records, scope]
  );
  const markers = useMemo(
    () => buildMarkerGeoJson(scopedRecords, selectedEntityId),
    [scopedRecords, selectedEntityId]
  );
  const focus =
    markers.features.find((feature) => feature.properties.selected) ??
    markers.features[0] ??
    null;
  const geocodedRecords = scopedRecords.filter(
    (record) =>
      record.common.latitude !== null && record.common.longitude !== null
  );
  const hoveredRecord =
    scopedRecords.find((record) => record.common.id === hoveredId) ??
    scopedRecords.find((record) => record.common.id === selectedEntityId) ??
    records.find((record) => record.common.id === selectedEntityId) ??
    null;
  const overlays = useMemo(
    () => ({
      regions: scopedRecords
        .filter((record) => record.type === 'region')
        .slice(0, 3),
      events: scopedRecords.filter((record) => record.type === 'event').slice(0, 3),
      locations: scopedRecords
        .filter((record) => record.type === 'location')
        .slice(0, 3)
    }),
    [scopedRecords]
  );
  const selectedRecord =
    scopedRecords.find((record) => record.common.id === selectedEntityId) ??
    records.find((record) => record.common.id === selectedEntityId) ??
    null;
  const overlayCounts = useMemo(
    () => ({
      regions: scopedRecords.filter((record) => record.type === 'region').length,
      events: scopedRecords.filter((record) => record.type === 'event').length,
      locations: scopedRecords.filter((record) => record.type === 'location').length
    }),
    [scopedRecords]
  );
  const typeStrip = useMemo(
    () => [
      {
        key: 'character',
        label: 'Characters',
        records: records.filter((record) => record.type === 'character')
      },
      {
        key: 'region',
        label: 'Regions',
        records: records.filter((record) => record.type === 'region')
      },
      {
        key: 'event',
        label: 'Events',
        records: records.filter((record) => record.type === 'event')
      },
      {
        key: 'location',
        label: 'Places',
        records: records.filter((record) => record.type === 'location')
      }
    ],
    [records]
  );
  const yearResonance = useMemo(() => {
    const typedCounts = {
      character: scopedRecords.filter((record) => record.type === 'character')
        .length,
      region: scopedRecords.filter((record) => record.type === 'region').length,
      event: scopedRecords.filter((record) => record.type === 'event').length,
      location: scopedRecords.filter((record) => record.type === 'location')
        .length
    };
    const dominant = (Object.entries(typedCounts) as Array<
      [EntityRecord['type'], number]
    >).sort((left, right) => right[1] - left[1])[0];
    const ongoingCount = scopedRecords.filter((record) => record.common.isOngoing)
      .length;

    return {
      dominantLabel:
        dominant && dominant[1] > 0
          ? `${dominant[0]} focus`
          : 'No dominant layer',
      dominantCount: dominant?.[1] ?? 0,
      ongoingCount
    };
  }, [scopedRecords]);
  const yearShift = useMemo(() => {
    const openingCount = scopedRecords.filter(
      (record) => record.common.startYear === year
    ).length;
    const closingCount = scopedRecords.filter(
      (record) => record.common.endYear === year
    ).length;
    const anchoredCount = scopedRecords.filter(
      (record) => record.common.startYear !== null || record.common.endYear !== null
    ).length;

    return {
      openingCount,
      closingCount,
      anchoredCount
    };
  }, [scopedRecords, year]);
  const spatialLedger = useMemo(
    () => [
      {
        label: 'Regions',
        count: scopedRecords.filter((record) => record.type === 'region').length,
        note: 'territory memory'
      },
      {
        label: 'Events',
        count: scopedRecords.filter((record) => record.type === 'event').length,
        note: 'geography pressure'
      },
      {
        label: 'Places',
        count: scopedRecords.filter((record) => record.type === 'location').length,
        note: 'travel anchors'
      },
      {
        label: 'Geocoded',
        count: geocodedRecords.length,
        note: 'marker surface'
      }
    ],
    [geocodedRecords.length, scopedRecords]
  );
  const relationLedger = useMemo(
    () => buildRelationLedger(selectedRecord, records),
    [records, selectedRecord]
  );
  const territoryBands = useMemo(
    () => buildTerritoryBands(scopedRecords, records, selectedRecord),
    [records, scopedRecords, selectedRecord]
  );
  const territoryFocus = useMemo(
    () => buildTerritoryFocus(selectedRecord, records),
    [records, selectedRecord]
  );
  const territoryHorizon = useMemo(
    () => buildTerritoryHorizon(selectedRecord, records),
    [records, selectedRecord]
  );
  const territoryStatus = useMemo(
    () => buildTerritoryStatus(selectedRecord, records),
    [records, selectedRecord]
  );
  const territoryRoute = useMemo(
    () => buildTerritoryRoute(selectedRecord, records),
    [records, selectedRecord]
  );
  const territoryChain = useMemo(
    () => buildTerritoryChain(selectedRecord, records),
    [records, selectedRecord]
  );
  const territoryPulse = useMemo(
    () => buildTerritoryPulse(selectedRecord, records),
    [records, selectedRecord]
  );
  const regionFocus = useMemo(
    () => buildRegionFocus(selectedRecord, records),
    [records, selectedRecord]
  );
  const regionFocusRail = useMemo(
    () => buildRegionFocusRail(selectedRecord, records),
    [records, selectedRecord]
  );

  useEffect(() => {
    let cancelled = false;

    loadOfflineMapPackage()
      .then((pkg) => {
        if (!cancelled) {
          setMapPackage(pkg);
          setMapPackageSource('manifest');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMapPackage(OFFLINE_MAP_PACKAGE);
          setMapPackageSource('fallback');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapPackage.styleUrl,
      center: [20, 40],
      zoom: 1.2,
      minZoom: mapPackage.minZoom,
      maxZoom: 3.2,
      attributionControl: false
    });

    map.on('load', () => {
      loadedRef.current = true;
      ensureMarkerLayers(map);
      syncMarkerSource(map, markers);
      focusMap(map, focus);
    });

    map.on('click', CIRCLE_LAYER_ID, (event) => {
      const id = event.features?.[0]?.properties?.id;
      if (typeof id === 'string') {
        onSelect(id);
      }
    });

    map.on('mousemove', CIRCLE_LAYER_ID, (event) => {
      const id = event.features?.[0]?.properties?.id;
      setHoveredId(typeof id === 'string' ? id : null);
    });

    map.on('mouseleave', CIRCLE_LAYER_ID, () => {
      setHoveredId(null);
    });

    mapRef.current = map;

    return () => {
      loadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, [focus, mapPackage.minZoom, mapPackage.styleUrl, markers, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) {
      return;
    }

    syncMarkerSource(map, markers);
    focusMap(map, focus);
  }, [focus, markers]);

  return (
    <section className="map-panel">
      <div className="map-header">
        <p className="eyebrow">Offline Map</p>
        <p className="map-copy">MapLibre + bundled local raster tiles.</p>
        <div className="map-overlay-stack" aria-label="map package status">
          <span className="map-overlay-chip">{mapPackage.mode}</span>
          <span className="map-overlay-chip">{mapPackage.coverage}</span>
          <span className="map-overlay-chip">
            z{mapPackage.minZoom}-{mapPackage.maxZoom}
          </span>
          <span className="map-overlay-chip">
            {mapPackageSource === 'manifest' ? 'manifest ok' : 'fallback'}
          </span>
        </div>
      </div>
      <section className="map-summary" aria-label="map summary">
        <div className="map-summary-card">
          <span>Visible</span>
          <strong>{scopedRecords.length}</strong>
        </div>
        <div className="map-summary-card">
          <span>Geocoded</span>
          <strong>{geocodedRecords.length}</strong>
        </div>
        <div className="map-summary-card">
          <span>Events</span>
          <strong>{scopedRecords.filter((record) => record.type === 'event').length}</strong>
        </div>
        <div className="map-summary-card">
          <span>Places</span>
          <strong>
            {scopedRecords.filter((record) => record.type === 'location').length}
          </strong>
        </div>
        <div className="map-summary-card">
          <span>Selected</span>
          <strong>{selectedRecord?.common.id ?? 'none'}</strong>
        </div>
      </section>
      <section className="map-type-strip" aria-label="map scope strip">
        <button
          className={`map-type-chip${scope === 'all' ? ' is-active' : ''}`}
          onClick={() => setScope('all')}
          type="button"
        >
          <span>All layers</span>
          <strong>{records.length}</strong>
        </button>
        <button
          className={`map-type-chip${scope === 'character' ? ' is-active' : ''}`}
          onClick={() => setScope('character')}
          type="button"
        >
          <span>Characters</span>
          <strong>{records.filter((record) => record.type === 'character').length}</strong>
        </button>
        <button
          className={`map-type-chip${scope === 'region' ? ' is-active' : ''}`}
          onClick={() => setScope('region')}
          type="button"
        >
          <span>Regions</span>
          <strong>{records.filter((record) => record.type === 'region').length}</strong>
        </button>
        <button
          className={`map-type-chip${scope === 'event' ? ' is-active' : ''}`}
          onClick={() => setScope('event')}
          type="button"
        >
          <span>Events</span>
          <strong>{records.filter((record) => record.type === 'event').length}</strong>
        </button>
        <button
          className={`map-type-chip${scope === 'location' ? ' is-active' : ''}`}
          onClick={() => setScope('location')}
          type="button"
        >
          <span>Places</span>
          <strong>{records.filter((record) => record.type === 'location').length}</strong>
        </button>
      </section>
      <article className="timeline-spotlight" aria-label="map year resonance">
        <div className="timeline-spotlight-copy">
          <p className="eyebrow">Year resonance</p>
          <strong>{yearResonance.dominantLabel}</strong>
          <span>
            Scope {scope === 'all' ? 'all layers' : scope} at {year}
          </span>
        </div>
        <div className="timeline-summary">
          <span className="command-chip">{yearResonance.dominantCount} in layer</span>
          <span className="command-chip">{yearResonance.ongoingCount} ongoing</span>
        </div>
      </article>
      <section className="timeline-band" aria-label="map year shift">
        <div className="timeline-band-head">
          <strong>Year shift</strong>
          <span>{year}</span>
        </div>
        <div className="theme-stack">
          <article className="theme-card is-active">
            <strong>Opening</strong>
            <span>{yearShift.openingCount} begin this year</span>
          </article>
          <article className="theme-card is-active">
            <strong>Closing</strong>
            <span>{yearShift.closingCount} end this year</span>
          </article>
          <article className="theme-card is-active">
            <strong>Anchored</strong>
            <span>{yearShift.anchoredCount} carry dated span</span>
          </article>
        </div>
      </section>
      <section className="timeline-band" aria-label="map spatial ledger">
        <div className="timeline-band-head">
          <strong>Spatial ledger</strong>
          <span>{scope === 'all' ? 'all layers' : scope}</span>
        </div>
        <div className="theme-stack">
          {spatialLedger.map((entry) => (
            <article key={entry.label} className="theme-card is-active">
              <strong>{entry.label}</strong>
              <span>{entry.count}</span>
              <span className="scene-card-meta">
                <span>{entry.note}</span>
              </span>
            </article>
          ))}
        </div>
      </section>
      {territoryBands.length ? (
        <section className="timeline-band" aria-label="map territory bands">
          <div className="timeline-band-head">
            <strong>Territory bands</strong>
            <span>{selectedRecord?.common.id ?? scope}</span>
          </div>
          <div className="theme-stack">
            {territoryBands.map((entry) => (
              <article key={entry.label} className="theme-card is-active">
                <strong>{entry.label}</strong>
                <span>{entry.value}</span>
                <span className="scene-card-meta">
                  <span>{entry.note}</span>
                </span>
                {entry.targetId ? (
                  <button
                    className="button ghost-button"
                    onClick={() => onSelect(entry.targetId as string)}
                    type="button"
                  >
                    Open band
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {relationLedger.length ? (
        <section className="timeline-band" aria-label="map relation ledger">
          <div className="timeline-band-head">
            <strong>Relation ledger</strong>
            <span>{selectedRecord?.common.id ?? 'none'}</span>
          </div>
          <div className="theme-stack">
            {relationLedger.map((entry) => (
              <article key={entry.label} className="theme-card is-active">
                <strong>{entry.label}</strong>
                <span>{entry.value}</span>
                <span className="scene-card-meta">
                  <span>{entry.note}</span>
                </span>
                {entry.targetId ? (
                  <button
                    className="button ghost-button"
                    onClick={() => onSelect(entry.targetId as string)}
                    type="button"
                  >
                    Open link
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {regionFocusRail.length || territoryChain.length ? (
        <section className="timeline-band" aria-label="map territory desk">
          <div className="timeline-band-head">
            <strong>Territory desk</strong>
            <span>{selectedRecord?.common.id ?? 'none'}</span>
          </div>
          <div className="theme-stack">
            {regionFocusRail.map((entry) => (
              <article
                key={`${entry.label}-${entry.value}`}
                className="theme-card is-active"
              >
                <strong>{entry.label}</strong>
                <span>{entry.value}</span>
              </article>
            ))}
            {territoryChain.map((entry) => (
              <article
                key={`${entry.label}-${entry.value}`}
                className="theme-card is-active"
              >
                <strong>{entry.label}</strong>
                <span>{entry.value}</span>
                {entry.targetId ? (
                  <button
                    className="button ghost-button"
                    onClick={() => onSelect(entry.targetId as string)}
                    type="button"
                  >
                    Open chain
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <section className="map-type-strip" aria-label="map type strip">
        {typeStrip.map((entry) => (
          <button
            key={entry.key}
            className={`map-type-chip${selectedRecord?.type === entry.key ? ' is-active' : ''}`}
            onClick={() => entry.records[0] && onSelect(entry.records[0].common.id)}
            type="button"
          >
            <span>{entry.label}</span>
            <strong>{entry.records.length}</strong>
          </button>
        ))}
      </section>
      <section className="map-legend" aria-label="map legend">
        <div className="map-legend-item">
          <span className="map-legend-dot is-character" />
          <span>Character</span>
          <strong>{records.filter((record) => record.type === 'character').length}</strong>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot is-region" />
          <span>Region</span>
          <strong>{records.filter((record) => record.type === 'region').length}</strong>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot is-event" />
          <span>Event</span>
          <strong>{records.filter((record) => record.type === 'event').length}</strong>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot is-location" />
          <span>Place</span>
          <strong>{records.filter((record) => record.type === 'location').length}</strong>
        </div>
      </section>
      <div className="map-frame">
        <div
          ref={containerRef}
          className="map-canvas"
          role="img"
          aria-label="offline world map"
        />
        {hoveredRecord ? (
          <div className="map-popover" aria-label="map hover preview">
            <span className={`type-badge type-${hoveredRecord.type}`}>
              {hoveredRecord.type}
            </span>
            <strong>{hoveredRecord.common.title}</strong>
            <span>{hoveredRecord.common.summary || 'No summary'}</span>
            <span>
              {hoveredRecord.common.startYear ?? 'open'} -{' '}
              {hoveredRecord.common.endYear ?? 'open'}
            </span>
            <div className="hover-actions">
              <button
                className="button ghost-button"
                onClick={() => onSelect(hoveredRecord.common.id)}
                type="button"
              >
                Show detail
              </button>
              <button
                className="button ghost-button"
                onClick={() => onJump('Wiki', hoveredRecord.common.id)}
                type="button"
              >
                Open wiki
              </button>
              <button
                className="button ghost-button"
                onClick={() => onJump('Timeline', hoveredRecord.common.id)}
                type="button"
              >
                Open timeline
              </button>
            </div>
          </div>
        ) : null}
        <div className="map-overlay-stack" aria-label="map overlays">
          <button
            className={`map-overlay-chip${focus ? ' is-active' : ''}`}
            onClick={() => focus && onSelect(focus.properties.id)}
            type="button"
          >
            Geo {geocodedRecords.length} @ {year}
          </button>
          {overlays.regions.map((record) => (
            <button
              key={record.common.id}
              className={`map-overlay-chip${record.common.id === selectedEntityId ? ' is-active' : ''}`}
              onClick={() => onSelect(record.common.id)}
              type="button"
            >
              R:{overlayCounts.regions} {record.common.title}
            </button>
          ))}
          {overlays.events.map((record) => (
            <button
              key={record.common.id}
              className={`map-overlay-chip is-event${record.common.id === selectedEntityId ? ' is-active' : ''}`}
              onClick={() => onSelect(record.common.id)}
              type="button"
            >
              E:{overlayCounts.events} {record.common.title}
            </button>
          ))}
          {overlays.locations.map((record) => (
            <button
              key={record.common.id}
              className={`map-overlay-chip is-location${record.common.id === selectedEntityId ? ' is-active' : ''}`}
              onClick={() => onSelect(record.common.id)}
              type="button"
            >
              P:{overlayCounts.locations} {record.common.title}
            </button>
          ))}
          {territoryHorizon.map((entry) => (
            <button
              key={`${entry.label}-${entry.value}`}
              className={`map-overlay-chip${entry.targetId ? ' is-active' : ''}`}
              onClick={() => entry.targetId && onSelect(entry.targetId)}
              type="button"
            >
              {entry.label}:{entry.value}
            </button>
          ))}
        </div>
      </div>
      <section className="map-focus-rail" aria-label="map focus rail">
        {geocodedRecords.length ? (
          geocodedRecords.slice(0, 5).map((record) => (
            <button
              key={record.common.id}
              className={`map-focus-row${record.common.id === selectedEntityId ? ' is-active' : ''}`}
              onClick={() => onSelect(record.common.id)}
              type="button"
            >
              <span className={`type-badge type-${record.type}`}>
                {record.type}
              </span>
              <strong>{record.common.title}</strong>
              <span>
                {record.common.latitude}, {record.common.longitude}
              </span>
            </button>
          ))
        ) : (
          <p className="empty">No geocoded entity</p>
        )}
      </section>
      {selectedRecord ? (
        <section className="map-selected-strip" aria-label="map selected strip">
          <p className="eyebrow">Visible at {year}</p>
          <span className={`type-badge type-${selectedRecord.type}`}>
            {selectedRecord.type}
          </span>
          <strong>{selectedRecord.common.title}</strong>
          <span>{selectedRecord.common.summary || 'No summary'}</span>
          <span>
            {selectedRecord.common.latitude ?? 'open'}, {' '}
            {selectedRecord.common.longitude ?? 'open'}
          </span>
          <div className="hover-actions">
            <button
              className="button ghost-button"
              onClick={() => onJump('Wiki', selectedRecord.common.id)}
              type="button"
            >
              Open wiki
            </button>
            <button
              className="button ghost-button"
              onClick={() => onJump('Timeline', selectedRecord.common.id)}
              type="button"
            >
              Open timeline
            </button>
          </div>
          {territoryFocus.length ? (
            <div className="map-overlay-stack" aria-label="map territory focus">
              {territoryFocus.map((entry) => (
                <button
                  key={entry.label}
                  className={`map-overlay-chip${entry.targetId ? ' is-active' : ''}`}
                  onClick={() => entry.targetId && onSelect(entry.targetId)}
                  type="button"
                >
                  {entry.label}: {entry.value}
                </button>
              ))}
            </div>
          ) : null}
          {territoryStatus.length ? (
            <div className="map-overlay-stack" aria-label="map territory status">
              {territoryStatus.map((entry) => (
                <span key={`${entry.label}-${entry.value}`} className="map-overlay-chip">
                  {entry.label}: {entry.value}
                </span>
              ))}
            </div>
          ) : null}
          {territoryRoute.length > 1 ? (
            <div className="hover-actions" aria-label="map territory route">
              {territoryRoute.map((entry) => (
                <button
                  key={`${entry.label}-${entry.targetId}`}
                  className="button ghost-button"
                  onClick={() => onSelect(entry.targetId)}
                  type="button"
                >
                  {entry.label}
                </button>
              ))}
            </div>
          ) : null}
          {territoryChain.length ? (
            <div className="map-overlay-stack" aria-label="map territory chain">
              {territoryChain.map((entry) =>
                entry.targetId ? (
                  <button
                    key={`${entry.label}-${entry.value}`}
                    className="map-overlay-chip is-active"
                    onClick={() => onSelect(entry.targetId as string)}
                    type="button"
                  >
                    {entry.label}: {entry.value}
                  </button>
                ) : (
                  <span
                    key={`${entry.label}-${entry.value}`}
                    className="map-overlay-chip"
                  >
                    {entry.label}: {entry.value}
                  </span>
                )
              )}
            </div>
          ) : null}
          {territoryPulse.length ? (
            <div className="map-overlay-stack" aria-label="map territory pulse">
              {territoryPulse.map((entry) => (
                <span
                  key={`${entry.label}-${entry.value}`}
                  className="map-overlay-chip"
                >
                  {entry.label}: {entry.value}
                </span>
              ))}
            </div>
          ) : null}
          {regionFocus.length ? (
            <div className="map-overlay-stack" aria-label="map region focus">
              {regionFocus.map((entry) => (
                <span
                  key={`${entry.label}-${entry.value}`}
                  className="map-overlay-chip"
                >
                  {entry.label}: {entry.value}
                </span>
              ))}
            </div>
          ) : null}
          {regionFocusRail.length ? (
            <div className="map-overlay-stack" aria-label="map region focus rail">
              {regionFocusRail.map((entry) => (
                <span
                  key={`${entry.label}-${entry.value}`}
                  className="map-overlay-chip"
                >
                  {entry.label}: {entry.value}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      <p className="map-focus">
        Focus:{' '}
        {focus
          ? `${focus.properties.title} (${focus.properties.id})`
          : 'No geocoded entity'}
      </p>
    </section>
  );
}

type MarkerProperties = {
  id: string;
  title: string;
  type: EntityRecord['type'];
  selected: boolean;
};

function buildMarkerGeoJson(
  records: EntityRecord[],
  selectedEntityId: string | null
): FeatureCollection<Point, MarkerProperties> {
  return {
    type: 'FeatureCollection',
    features: records
      .filter(
        (record) =>
          record.common.latitude !== null && record.common.longitude !== null
      )
      .map(
        (record): Feature<Point, MarkerProperties> => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [
              record.common.longitude as number,
              record.common.latitude as number
            ]
          },
          properties: {
            id: record.common.id,
            title: record.common.title,
            type: record.type,
            selected: record.common.id === selectedEntityId
          }
        })
      )
  };
}

function ensureMarkerLayers(map: MapLibreMap) {
  if (map.getSource(GEOJSON_SOURCE_ID)) {
    return;
  }

  map.addSource(GEOJSON_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  } satisfies GeoJSONSourceSpecification);

  map.addLayer({
    id: CIRCLE_LAYER_ID,
    type: 'circle',
    source: GEOJSON_SOURCE_ID,
    paint: {
      'circle-radius': ['case', ['==', ['get', 'selected'], true], 9, 6],
      'circle-color': [
        'case',
        ['==', ['get', 'selected'], true],
        '#77d0ff',
        '#c89b65'
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#10161d'
    }
  });

  map.addLayer({
    id: LABEL_LAYER_ID,
    type: 'symbol',
    source: GEOJSON_SOURCE_ID,
    layout: {
      'text-field': ['get', 'title'],
      'text-size': 11,
      'text-offset': [0, 1.25],
      'text-anchor': 'top'
    },
    paint: {
      'text-color': '#ece4d5',
      'text-halo-color': '#11161d',
      'text-halo-width': 1
    }
  });
}

function syncMarkerSource(
  map: MapLibreMap,
  markers: FeatureCollection<Point, MarkerProperties>
) {
  const source = map.getSource(GEOJSON_SOURCE_ID) as
    | { setData: (data: FeatureCollection<Point, MarkerProperties>) => void }
    | undefined;
  source?.setData(markers);
}

function focusMap(
  map: MapLibreMap,
  focus: Feature<Point, MarkerProperties> | null
) {
  if (!focus) {
    return;
  }

  map.easeTo({
    center: focus.geometry.coordinates as LngLatLike,
    zoom: 3.2,
    duration: 420,
    essential: true
  });
}

function buildRelationLedger(
  selectedRecord: EntityRecord | null,
  records: EntityRecord[]
) {
  if (!selectedRecord) {
    return [];
  }

  if (selectedRecord.type === 'region') {
    const parent =
      selectedRecord.fields.parentRegionId
        ? records.find(
            (record) => record.common.id === selectedRecord.fields.parentRegionId
          ) ?? null
        : null;
    const childRegions = records.filter(
      (record) =>
        record.type === 'region' &&
        record.fields.parentRegionId === selectedRecord.common.id
    );
    const places = records.filter(
      (record) =>
        record.type === 'location' &&
        record.fields.regionId === selectedRecord.common.id
    );

    return [
      {
        label: 'Parent region',
        value: parent?.common.title ?? 'No parent region',
        note: 'territory chain',
        targetId: parent?.common.id ?? null
      },
      {
        label: 'Child regions',
        value: String(childRegions.length),
        note: 'nested geography',
        targetId: childRegions[0]?.common.id ?? null
      },
      {
        label: 'Mapped places',
        value: String(places.length),
        note: 'settlement spread',
        targetId: places[0]?.common.id ?? null
      }
    ];
  }

  if (selectedRecord.type === 'location') {
    const region =
      selectedRecord.fields.regionId
        ? records.find((record) => record.common.id === selectedRecord.fields.regionId) ??
          null
        : null;
    const events = records.filter(
      (record) =>
        record.type === 'event' &&
        record.fields.locationId === selectedRecord.common.id
    );

    return [
      {
        label: 'Host region',
        value: region?.common.title ?? 'No host region',
        note: 'territory anchor',
        targetId: region?.common.id ?? null
      },
      {
        label: 'Anchored events',
        value: String(events.length),
        note: 'story pressure',
        targetId: events[0]?.common.id ?? null
      },
      {
        label: 'Location kind',
        value: selectedRecord.fields.locationKind ?? 'unspecified',
        note: 'place identity',
        targetId: null
      }
    ];
  }

  if (selectedRecord.type === 'event') {
    const location =
      selectedRecord.fields.locationId
        ? records.find(
            (record) => record.common.id === selectedRecord.fields.locationId
          ) ?? null
        : null;
    const region =
      location && location.type === 'location' && location.fields.regionId
        ? records.find((record) => record.common.id === location.fields.regionId) ??
          null
        : null;

    return [
      {
        label: 'Event site',
        value: location?.common.title ?? 'No linked place',
        note: 'story geography',
        targetId: location?.common.id ?? null
      },
      {
        label: 'Host region',
        value: region?.common.title ?? 'No host region',
        note: 'territory context',
        targetId: region?.common.id ?? null
      },
      {
        label: 'Time anchor',
        value:
          selectedRecord.common.startYear !== null
            ? String(selectedRecord.common.startYear)
            : 'open',
        note: 'event year seam',
        targetId: null
      }
    ];
  }

  return [
    {
      label: 'Map anchor',
      value:
        selectedRecord.common.latitude !== null &&
        selectedRecord.common.longitude !== null
          ? 'Geocoded'
          : 'No coordinates',
      note: 'character surface',
      targetId: null
    },
    {
      label: 'Time span',
      value:
        selectedRecord.common.startYear !== null
          ? `${selectedRecord.common.startYear} - ${selectedRecord.common.endYear ?? 'open'}`
          : 'open',
      note: 'timeline bridge',
      targetId: null
    },
    {
      label: 'Spatial ties',
      value: 'No typed territory link',
      note: 'world link can grow later',
      targetId: null
    }
  ];
}
