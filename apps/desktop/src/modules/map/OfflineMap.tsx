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

type OfflineMapProps = {
  records: EntityRecord[];
  selectedEntityId: string | null;
  year: number;
  onSelect: (id: string) => void;
  onJump: (lens: 'Wiki' | 'Timeline', id: string) => void;
};

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
  const [mapPackage, setMapPackage] =
    useState<OfflineMapPackage>(OFFLINE_MAP_PACKAGE);
  const [mapPackageSource, setMapPackageSource] = useState<
    'manifest' | 'fallback'
  >('fallback');
  const markers = useMemo(
    () => buildMarkerGeoJson(records, selectedEntityId),
    [records, selectedEntityId]
  );
  const focus =
    markers.features.find((feature) => feature.properties.selected) ??
    markers.features[0] ??
    null;
  const geocodedRecords = records.filter(
    (record) =>
      record.common.latitude !== null && record.common.longitude !== null
  );
  const hoveredRecord =
    records.find((record) => record.common.id === hoveredId) ??
    records.find((record) => record.common.id === selectedEntityId) ??
    null;
  const overlays = useMemo(
    () => ({
      regions: records.filter((record) => record.type === 'region').slice(0, 3),
      events: records.filter((record) => record.type === 'event').slice(0, 3),
      locations: records
        .filter((record) => record.type === 'location')
        .slice(0, 3)
    }),
    [records]
  );
  const selectedRecord =
    records.find((record) => record.common.id === selectedEntityId) ?? null;
  const overlayCounts = useMemo(
    () => ({
      regions: records.filter((record) => record.type === 'region').length,
      events: records.filter((record) => record.type === 'event').length,
      locations: records.filter((record) => record.type === 'location').length
    }),
    [records]
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
          <strong>{records.length}</strong>
        </div>
        <div className="map-summary-card">
          <span>Geocoded</span>
          <strong>{geocodedRecords.length}</strong>
        </div>
        <div className="map-summary-card">
          <span>Events</span>
          <strong>{records.filter((record) => record.type === 'event').length}</strong>
        </div>
        <div className="map-summary-card">
          <span>Places</span>
          <strong>
            {records.filter((record) => record.type === 'location').length}
          </strong>
        </div>
        <div className="map-summary-card">
          <span>Selected</span>
          <strong>{selectedRecord?.common.id ?? 'none'}</strong>
        </div>
      </section>
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
