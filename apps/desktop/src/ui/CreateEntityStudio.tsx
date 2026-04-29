import { FormEvent, useMemo, useState } from 'react';
import type { CreateEntityInput } from '../modules/entity-model/api';
import type { EntityRecord, EntityType } from '../modules/entity-model/types';

type CreateEntityStudioProps = {
  busy: boolean;
  onCreate: (input: CreateEntityInput) => Promise<void>;
  records: EntityRecord[];
  selectedEntity: EntityRecord | null;
};

const ENTITY_TYPES: EntityType[] = ['character', 'location', 'region', 'event'];

export function CreateEntityStudio({
  busy,
  onCreate,
  records,
  selectedEntity
}: CreateEntityStudioProps) {
  const [entityType, setEntityType] = useState<EntityType>('character');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [culture, setCulture] = useState('');
  const [locationKind, setLocationKind] = useState('');
  const [regionId, setRegionId] = useState('');
  const [parentRegionId, setParentRegionId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const regionOptions = useMemo(
    () => records.filter((record) => record.type === 'region'),
    [records]
  );
  const locationOptions = useMemo(
    () => records.filter((record) => record.type === 'location'),
    [records]
  );
  const selectedContextCopy = selectedEntity
    ? `${selectedEntity.common.title} [${selectedEntity.common.id}]`
    : 'No selected entity';
  const selectedContextYears = selectedEntity
    ? `${selectedEntity.common.startYear ?? 'open'} - ${selectedEntity.common.endYear ?? 'open'}`
    : 'open';

  function applySelectedPreset(kind: 'location_from_region' | 'region_from_region' | 'event_from_location') {
    if (!selectedEntity) {
      return;
    }

    if (kind === 'location_from_region' && selectedEntity.type === 'region') {
      setEntityType('location');
      setRegionId(selectedEntity.common.id);
      setTitle(`New ${selectedEntity.common.title} site`);
      setSummary(`Location linked to ${selectedEntity.common.title}`);
      setBody(
        `A new location seeded from ${selectedEntity.common.title}. Record local geography, factions, and practical notes here.`
      );
      setStartYear(
        selectedEntity.common.startYear !== null
          ? String(selectedEntity.common.startYear)
          : ''
      );
      setEndYear(
        selectedEntity.common.endYear !== null
          ? String(selectedEntity.common.endYear)
          : ''
      );
      return;
    }

    if (kind === 'region_from_region' && selectedEntity.type === 'region') {
      setEntityType('region');
      setParentRegionId(selectedEntity.common.id);
      setTitle(`New ${selectedEntity.common.title} frontier`);
      setSummary(`Region linked to ${selectedEntity.common.title}`);
      setBody(
        `A child region derived from ${selectedEntity.common.title}. Capture borders, pressure lines, and governing identity here.`
      );
      setStartYear(
        selectedEntity.common.startYear !== null
          ? String(selectedEntity.common.startYear)
          : ''
      );
      setEndYear(
        selectedEntity.common.endYear !== null
          ? String(selectedEntity.common.endYear)
          : ''
      );
      return;
    }

    if (kind === 'event_from_location' && selectedEntity.type === 'location') {
      setEntityType('event');
      setLocationId(selectedEntity.common.id);
      setTitle(`New ${selectedEntity.common.title} event`);
      setSummary(`Event linked to ${selectedEntity.common.title}`);
      setBody(
        `An event centered on ${selectedEntity.common.title}. Capture stakes, participants, and aftermath here.`
      );
      setStartYear(
        selectedEntity.common.startYear !== null
          ? String(selectedEntity.common.startYear)
          : ''
      );
      setEndYear(
        selectedEntity.common.endYear !== null
          ? String(selectedEntity.common.endYear)
          : ''
      );
    }
  }

  function applyTypeTemplate(kind: EntityType) {
    if (kind === 'character') {
      setSummary((current) => current || 'Core role, pressure, and presence.');
      setBody((current) =>
        current ||
        'Identity:\nVoice:\nGoal:\nFear:\nKey ties:\nPublic legend:'
      );
      return;
    }

    if (kind === 'location') {
      setSummary((current) => current || 'Spatial anchor, daily use, and mood.');
      setBody((current) =>
        current ||
        'Purpose:\nTerrain:\nPeople:\nThreat:\nSensory details:\nTravel notes:'
      );
      return;
    }

    if (kind === 'region') {
      setSummary((current) => current || 'Large-scale identity and pressure lines.');
      setBody((current) =>
        current ||
        'Borders:\nPower centers:\nCultures:\nConflict lines:\nClimate:\nStrategic value:'
      );
      return;
    }

    setSummary((current) => current || 'A change point in the world timeline.');
    setBody((current) =>
      current ||
      'Trigger:\nParticipants:\nLocation:\nEscalation:\nOutcome:\nLong tail:'
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }

    await onCreate(buildInput());

    setTitle('');
    setSummary('');
    setBody('');
    setStartYear('');
    setEndYear('');
    setCulture('');
    setLocationKind('');
    setRegionId('');
    setParentRegionId('');
    setLocationId('');
    setLatitude('');
    setLongitude('');
  }

  function buildInput(): CreateEntityInput {
    const common = {
      title: title.trim(),
      summary: summary.trim() || undefined,
      body: body.trim() || undefined,
      startYear: parseNumber(startYear),
      endYear: parseNumber(endYear)
    };

    if (entityType === 'character') {
      return {
        type: 'character',
        common,
        fields: {
          culture: culture.trim() || null,
          birthYearLabel: null
        }
      };
    }

    if (entityType === 'location') {
      return {
        type: 'location',
        common: {
          ...common,
          latitude: parseFloatOrNull(latitude),
          longitude: parseFloatOrNull(longitude)
        },
        fields: {
          regionId: regionId || null,
          locationKind: locationKind.trim() || null
        }
      };
    }

    if (entityType === 'region') {
      return {
        type: 'region',
        common,
        fields: {
          parentRegionId: parentRegionId || null
        }
      };
    }

    return {
      type: 'event',
      common,
      fields: {
        locationId: locationId || null
      }
    };
  }

  return (
    <section className="create-studio" aria-label="create entity studio">
      <div className="workspace-head">
        <div>
          <p className="eyebrow">Create Entity</p>
          <p className="copy">Fast authoring. Type-first. Same canonical spine.</p>
        </div>
        <span className="command-chip">{entityType}</span>
      </div>

      <div className="detail-section" aria-label="create context">
        <p className="eyebrow">Selected context</p>
        <strong>{selectedContextCopy}</strong>
        <div className="manuscript-meta">
          <span className="command-chip">
            {selectedEntity ? selectedEntity.type : 'none'}
          </span>
          <span className="command-chip">{selectedContextYears}</span>
        </div>
      </div>

      {selectedEntity ? (
        <div className="create-actions" aria-label="create presets">
          {selectedEntity.type === 'region' ? (
            <>
              <button
                className="button ghost-button"
                onClick={() => applySelectedPreset('location_from_region')}
                type="button"
              >
                New location from selected region
              </button>
              <button
                className="button ghost-button"
                onClick={() => applySelectedPreset('region_from_region')}
                type="button"
              >
                New child region from selected
              </button>
            </>
          ) : null}
          {selectedEntity.type === 'location' ? (
            <button
              className="button ghost-button"
              onClick={() => applySelectedPreset('event_from_location')}
              type="button"
            >
              New event at selected location
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="create-actions" aria-label="create templates">
        <button
          className="button ghost-button"
          onClick={() => applyTypeTemplate(entityType)}
          type="button"
        >
          Fill {entityType} template
        </button>
      </div>

      <form className="create-grid" onSubmit={handleSubmit}>
        <select
          aria-label="create entity type"
          className="input select"
          onChange={(event) => setEntityType(event.target.value as EntityType)}
          value={entityType}
        >
          {ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          aria-label="create entity title"
          className="input"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          value={title}
        />
        <input
          aria-label="create entity summary"
          className="input"
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Summary"
          value={summary}
        />
        <input
          aria-label="create start year"
          className="input"
          onChange={(event) => setStartYear(event.target.value)}
          placeholder="Start year"
          value={startYear}
        />
        <input
          aria-label="create end year"
          className="input"
          onChange={(event) => setEndYear(event.target.value)}
          placeholder="End year"
          value={endYear}
        />

        {entityType === 'character' ? (
          <input
            aria-label="create culture"
            className="input"
            onChange={(event) => setCulture(event.target.value)}
            placeholder="Culture"
            value={culture}
          />
        ) : null}

        {entityType === 'location' ? (
          <>
            <select
              aria-label="create region link"
              className="input select"
              onChange={(event) => setRegionId(event.target.value)}
              value={regionId}
            >
              <option value="">Region link</option>
              {regionOptions.map((record) => (
                <option key={record.common.id} value={record.common.id}>
                  {record.common.title}
                </option>
              ))}
            </select>
            <input
              aria-label="create location kind"
              className="input"
              onChange={(event) => setLocationKind(event.target.value)}
              placeholder="Location kind"
              value={locationKind}
            />
            <input
              aria-label="create latitude"
              className="input"
              onChange={(event) => setLatitude(event.target.value)}
              placeholder="Latitude"
              value={latitude}
            />
            <input
              aria-label="create longitude"
              className="input"
              onChange={(event) => setLongitude(event.target.value)}
              placeholder="Longitude"
              value={longitude}
            />
          </>
        ) : null}

        {entityType === 'region' ? (
          <select
            aria-label="create parent region"
            className="input select"
            onChange={(event) => setParentRegionId(event.target.value)}
            value={parentRegionId}
          >
            <option value="">Parent region</option>
            {regionOptions.map((record) => (
              <option key={record.common.id} value={record.common.id}>
                {record.common.title}
              </option>
            ))}
          </select>
        ) : null}

        {entityType === 'event' ? (
          <select
            aria-label="create event location"
            className="input select"
            onChange={(event) => setLocationId(event.target.value)}
            value={locationId}
          >
            <option value="">Location link</option>
            {locationOptions.map((record) => (
              <option key={record.common.id} value={record.common.id}>
                {record.common.title}
              </option>
            ))}
          </select>
        ) : null}

        <textarea
          aria-label="create entity body"
          className="textarea create-body"
          onChange={(event) => setBody(event.target.value)}
          placeholder="Body"
          value={body}
        />
        <button className="button" disabled={busy} type="submit">
          {busy ? 'Creating...' : `Create ${entityType}`}
        </button>
      </form>
    </section>
  );
}

function parseNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseFloatOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}
