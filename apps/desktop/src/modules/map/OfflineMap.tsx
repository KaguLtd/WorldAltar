import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSourceSpecification, type LngLatLike, type Map as MapLibreMap } from 'maplibre-gl';
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { EntityRecord } from '../entity-model/types';

type OfflineMapProps = {
  records: EntityRecord[];
  selectedEntityId: string | null;
  onSelect: (id: string) => void;
};

const GEOJSON_SOURCE_ID = 'worldaltar-markers';
const CIRCLE_LAYER_ID = 'worldaltar-markers-circle';
const LABEL_LAYER_ID = 'worldaltar-markers-label';
const OFFLINE_STYLE_URL = '/offline-map/style.json';

export function OfflineMap({ records, selectedEntityId, onSelect }: OfflineMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const loadedRef = useRef(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const markers = useMemo(() => buildMarkerGeoJson(records, selectedEntityId), [records, selectedEntityId]);
  const focus = markers.features.find((feature) => feature.properties.selected) ?? markers.features[0] ?? null;
  const hoveredRecord =
    records.find((record) => record.common.id === hoveredId) ??
    records.find((record) => record.common.id === selectedEntityId) ??
    null;
  const overlays = useMemo(
    () => ({
      regions: records.filter((record) => record.type === 'region').slice(0, 3),
      events: records.filter((record) => record.type === 'event').slice(0, 3),
      locations: records.filter((record) => record.type === 'location').slice(0, 3)
    }),
    [records]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OFFLINE_STYLE_URL,
      center: [20, 40],
      zoom: 1.2,
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
  }, [focus, markers, onSelect]);

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
      </div>
      <div className="map-frame">
        <div ref={containerRef} className="map-canvas" role="img" aria-label="offline world map" />
        {hoveredRecord ? (
          <div className="map-popover" aria-label="map hover preview">
            <span className={`type-badge type-${hoveredRecord.type}`}>{hoveredRecord.type}</span>
            <strong>{hoveredRecord.common.title}</strong>
            <span>{hoveredRecord.common.summary || 'No summary'}</span>
            <span>
              {hoveredRecord.common.startYear ?? 'open'} - {hoveredRecord.common.endYear ?? 'open'}
            </span>
          </div>
        ) : null}
        <div className="map-overlay-stack" aria-label="map overlays">
          {overlays.regions.map((record) => (
            <span key={record.common.id} className="map-overlay-chip">
              Region {record.common.title}
            </span>
          ))}
          {overlays.events.map((record) => (
            <span key={record.common.id} className="map-overlay-chip is-event">
              Event {record.common.title}
            </span>
          ))}
          {overlays.locations.map((record) => (
            <span key={record.common.id} className="map-overlay-chip is-location">
              Place {record.common.title}
            </span>
          ))}
        </div>
      </div>
      <p className="map-focus">
        Focus: {focus ? `${focus.properties.title} (${focus.properties.id})` : 'No geocoded entity'}
      </p>
    </section>
  );
}

type MarkerProperties = {
  id: string;
  title: string;
  selected: boolean;
};

function buildMarkerGeoJson(
  records: EntityRecord[],
  selectedEntityId: string | null
): FeatureCollection<Point, MarkerProperties> {
  return {
    type: 'FeatureCollection',
    features: records
      .filter((record) => record.common.latitude !== null && record.common.longitude !== null)
      .map(
        (record): Feature<Point, MarkerProperties> => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [record.common.longitude as number, record.common.latitude as number]
          },
          properties: {
            id: record.common.id,
            title: record.common.title,
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
      'circle-color': ['case', ['==', ['get', 'selected'], true], '#77d0ff', '#c89b65'],
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

function syncMarkerSource(map: MapLibreMap, markers: FeatureCollection<Point, MarkerProperties>) {
  const source = map.getSource(GEOJSON_SOURCE_ID) as
    | { setData: (data: FeatureCollection<Point, MarkerProperties>) => void }
    | undefined;
  source?.setData(markers);
}

function focusMap(map: MapLibreMap, focus: Feature<Point, MarkerProperties> | null) {
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
