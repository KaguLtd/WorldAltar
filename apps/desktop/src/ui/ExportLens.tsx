import { useMemo, useState } from 'react';
import type { ExportJob, ExportKind } from '../modules/export/contracts';

type ExportLensProps = {
  jobs: ExportJob[];
  onQueue: (kind: ExportKind) => void;
  status: string;
};

export function ExportLens({ jobs, onQueue, status }: ExportLensProps) {
  const [kindFilter, setKindFilter] = useState<ExportKind | 'all'>('all');
  const filteredJobs = useMemo(
    () =>
      kindFilter === 'all'
        ? jobs
        : jobs.filter((job) => job.kind === kindFilter),
    [jobs, kindFilter]
  );
  const latestJob = jobs[0] ?? null;
  const visibleLatestJob = filteredJobs[0] ?? latestJob;
  const totalArtifacts = filteredJobs.reduce(
    (count, job) => count + listArtifactPaths(job).length,
    0
  );
  const latestArtifact = visibleLatestJob
    ? getPrimaryArtifactPath(visibleLatestJob)
    : null;
  const kindGroups = buildKindGroups(filteredJobs);
  const latestManuscriptJob =
    filteredJobs.find((job) => job.kind === 'manuscript_pdf') ??
    jobs.find((job) => job.kind === 'manuscript_pdf') ??
    null;
  const packageSummary = buildPackageSummary(filteredJobs);
  const latestPackage = packageSummary[0] ?? null;
  const curatedOutputs = buildCuratedOutputs(filteredJobs, jobs);
  const bundleReadiness = buildBundleReadiness(filteredJobs, jobs);
  const referenceSheets = buildReferenceSheets(filteredJobs, jobs);
  const manifestDigest = buildManifestDigest(filteredJobs, jobs);
  const laneHistory = buildLaneHistory(filteredJobs, jobs);
  const deliveryChecklist = buildDeliveryChecklist(filteredJobs, jobs);
  const formatReadiness = buildFormatReadiness(filteredJobs, jobs);
  const targetRoots = buildTargetRoots(filteredJobs, jobs);
  const bundleContents = buildBundleContents(filteredJobs, jobs);

  return (
    <section className="lens-frame" aria-label="export lens">
      <div className="workspace-head">
        <div>
          <p className="eyebrow">Export</p>
          <p className="copy">Deferred lens. Lazy queue only.</p>
        </div>
        <span className="command-chip">{status}</span>
      </div>

      <article className="timeline-spotlight" aria-label="export spotlight">
        <div className="timeline-spotlight-copy">
          <p className="eyebrow">Export Queue</p>
          <strong>
            {visibleLatestJob ? visibleLatestJob.kind : 'No queued export'}
          </strong>
          <span>{visibleLatestJob ? visibleLatestJob.status : 'Idle'}</span>
        </div>
        <div className="timeline-summary">
          <span className="command-chip">{filteredJobs.length} jobs</span>
          <span className="command-chip">{totalArtifacts} artifacts</span>
        </div>
      </article>

      {visibleLatestJob ? (
        <article className="timeline-spotlight" aria-label="artifact spotlight">
          <div className="timeline-spotlight-copy">
            <p className="eyebrow">Latest artifact</p>
            <strong>{latestArtifact ? latestArtifact.split('/').pop() : 'No artifact yet'}</strong>
            <span>{visibleLatestJob.targetPath.split('/').pop()}</span>
          </div>
          <div className="timeline-summary">
            <span className="command-chip">{visibleLatestJob.kind}</span>
            <span className="command-chip">{visibleLatestJob.status}</span>
          </div>
        </article>
      ) : null}

      {latestManuscriptJob ? (
        <article
          className="timeline-spotlight"
          aria-label="manuscript export metadata"
        >
          <div className="timeline-spotlight-copy">
            <p className="eyebrow">Manuscript artifact</p>
            <strong>{latestManuscriptJob.targetPath.split('/').pop()}</strong>
            <span>
              {getPrimaryArtifactPath(latestManuscriptJob)
                ? getPrimaryArtifactPath(latestManuscriptJob)?.split('/').pop()
                : 'No artifact yet'}
            </span>
          </div>
          <div className="timeline-summary">
            <span className="command-chip">{latestManuscriptJob.status}</span>
            <span className="command-chip">
              {listArtifactPaths(latestManuscriptJob).length} files
            </span>
          </div>
        </article>
      ) : null}

      {latestPackage ? (
        <article className="timeline-spotlight" aria-label="export package">
          <div className="timeline-spotlight-copy">
            <p className="eyebrow">Export package</p>
            <strong>{latestPackage.label}</strong>
            <span>{latestPackage.root}</span>
          </div>
          <div className="timeline-summary">
            <span className="command-chip">{latestPackage.jobs} jobs</span>
            <span className="command-chip">{latestPackage.files} files</span>
          </div>
        </article>
      ) : null}

      {curatedOutputs.length ? (
        <section className="timeline-band" aria-label="curated outputs">
          <div className="timeline-band-head">
            <strong>Curated outputs</strong>
            <span>{curatedOutputs.length} lanes</span>
          </div>
          <div className="theme-stack">
            {curatedOutputs.map((item) => (
              <article key={item.label} className="theme-card is-active">
                <strong>{item.label}</strong>
                <span>{item.fileName}</span>
                <span className="scene-card-meta">
                  <span>{item.status}</span>
                  <span>{item.files} files</span>
                </span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {bundleReadiness ? (
        <article className="timeline-spotlight" aria-label="bundle readiness">
          <div className="timeline-spotlight-copy">
            <p className="eyebrow">Bundle readiness</p>
            <strong>{bundleReadiness.coverage}</strong>
            <span>{bundleReadiness.summary}</span>
          </div>
          <div className="timeline-summary">
            {bundleReadiness.lanes.map((lane) => (
              <span key={lane.label} className="command-chip">
                {lane.label} {lane.ready ? 'ready' : 'pending'}
              </span>
            ))}
          </div>
        </article>
      ) : null}

      {referenceSheets.length ? (
        <section className="timeline-band" aria-label="reference sheets">
          <div className="timeline-band-head">
            <strong>Reference sheets</strong>
            <span>{referenceSheets.length} sheets</span>
          </div>
          <div className="theme-stack">
            {referenceSheets.map((sheet) => (
              <article key={sheet.label} className="theme-card is-active">
                <strong>{sheet.label}</strong>
                <span>{sheet.fileName}</span>
                <span className="scene-card-meta">
                  <span>{sheet.source}</span>
                  <span>{sheet.status}</span>
                </span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {manifestDigest ? (
        <article className="timeline-spotlight" aria-label="export manifest">
          <div className="timeline-spotlight-copy">
            <p className="eyebrow">Asset manifest</p>
            <strong>{manifestDigest.rootLabel}</strong>
            <span>{manifestDigest.summary}</span>
          </div>
          <div className="timeline-summary">
            {manifestDigest.groups.map((group) => (
              <span key={group.label} className="command-chip">
                {group.label} {group.count}
              </span>
            ))}
          </div>
        </article>
      ) : null}

      {laneHistory.length ? (
        <section className="timeline-band" aria-label="export history">
          <div className="timeline-band-head">
            <strong>Export history</strong>
            <span>{laneHistory.length} lanes</span>
          </div>
          <div className="theme-stack">
            {laneHistory.map((lane) => (
              <article key={lane.label} className="theme-card is-active">
                <strong>{lane.label}</strong>
                <span>{lane.lastCreatedAt}</span>
                <span className="scene-card-meta">
                  <span>{lane.lastStatus}</span>
                  <span>{lane.runs} runs</span>
                </span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {deliveryChecklist.length ? (
        <section className="timeline-band" aria-label="delivery checklist">
          <div className="timeline-band-head">
            <strong>Delivery checklist</strong>
            <span>{deliveryChecklist.length} checks</span>
          </div>
          <div className="theme-stack">
            {deliveryChecklist.map((item) => (
              <article key={item.label} className="theme-card is-active">
                <strong>{item.label}</strong>
                <span>{item.state}</span>
                <span className="scene-card-meta">
                  <span>{item.note}</span>
                </span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {formatReadiness.length ? (
        <section className="timeline-band" aria-label="format readiness">
          <div className="timeline-band-head">
            <strong>Format readiness</strong>
            <span>{formatReadiness.length} formats</span>
          </div>
          <div className="theme-stack">
            {formatReadiness.map((item) => (
              <article key={item.label} className="theme-card is-active">
                <strong>{item.label}</strong>
                <span>{item.state}</span>
                <span className="scene-card-meta">
                  <span>{item.note}</span>
                </span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {targetRoots.length ? (
        <section className="timeline-band" aria-label="target roots">
          <div className="timeline-band-head">
            <strong>Target roots</strong>
            <span>{targetRoots.length} roots</span>
          </div>
          <div className="theme-stack">
            {targetRoots.map((item) => (
              <article key={item.root} className="theme-card is-active">
                <strong>{item.root}</strong>
                <span>{item.lastFile}</span>
                <span className="scene-card-meta">
                  <span>{item.jobs} jobs</span>
                  <span>{item.artifacts} artifacts</span>
                </span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {bundleContents.length ? (
        <section className="timeline-band" aria-label="bundle contents">
          <div className="timeline-band-head">
            <strong>Bundle contents</strong>
            <span>{bundleContents.length} files</span>
          </div>
          <div className="theme-stack">
            {bundleContents.map((item) => (
              <article key={item.fileName} className="theme-card is-active">
                <strong>{item.fileName}</strong>
                <span>{item.root}</span>
                <span className="scene-card-meta">
                  <span>{item.kind}</span>
                </span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="toolbar">
        <div className="mode-strip" aria-label="export filters">
          <button
            className={`mode-chip${kindFilter === 'all' ? ' is-active' : ''}`}
            onClick={() => setKindFilter('all')}
            type="button"
          >
            All
          </button>
          <button
            className={`mode-chip${kindFilter === 'pdf_dossier' ? ' is-active' : ''}`}
            onClick={() => setKindFilter('pdf_dossier')}
            type="button"
          >
            Dossier
          </button>
          <button
            className={`mode-chip${kindFilter === 'manuscript_pdf' ? ' is-active' : ''}`}
            onClick={() => setKindFilter('manuscript_pdf')}
            type="button"
          >
            Manuscript
          </button>
        </div>
        <button
          className="button"
          onClick={() => onQueue('pdf_dossier')}
          type="button"
        >
          Queue dossier PDF
        </button>
        <button
          className="button ghost-button"
          onClick={() => onQueue('manuscript_pdf')}
          type="button"
        >
          Queue manuscript PDF
        </button>
      </div>

      {filteredJobs.length ? (
        <div className="theme-stack" aria-label="export groups">
          {kindGroups.map((group) => (
            <section key={group.label} className="timeline-band">
              <div className="timeline-band-head">
                <strong>{group.label}</strong>
                <span>{group.items.length} jobs</span>
              </div>
              <div className="theme-stack">
                {group.items.map((job) => (
                  <article key={job.id} className="theme-card is-active">
                    <strong>{job.kind}</strong>
                    <span>{job.status}</span>
                    <span>{job.targetPath}</span>
                    <span className="scene-card-meta">
                      <span>{job.createdAt}</span>
                      <span>{listArtifactPaths(job).length} files</span>
                    </span>
                    {listArtifactPaths(job).length ? (
                      <ul
                        className="asset-manifest"
                        aria-label={`artifacts ${job.id}`}
                      >
                        {listArtifactPaths(job).map((artifactPath) => (
                          <li key={artifactPath}>
                            <span>Artifact</span>
                            <strong>{artifactPath.split('/').pop()}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}

          <section className="timeline-band" aria-label="export packages">
            <div className="timeline-band-head">
              <strong>Packages</strong>
              <span>{packageSummary.length} roots</span>
            </div>
            <div className="theme-stack">
              {packageSummary.map((item) => (
                <article key={item.root} className="theme-card is-active">
                  <strong>{item.label}</strong>
                  <span>{item.root}</span>
                  <span className="scene-card-meta">
                    <span>{item.jobs} jobs</span>
                    <span>{item.files} files</span>
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="empty-stage lens-empty">
          <p className="eyebrow">Export</p>
          <h2>No jobs.</h2>
          <p className="copy">Core boot disi. Explicit queue ile gelir.</p>
        </section>
      )}
    </section>
  );
}

function buildKindGroups(jobs: ExportJob[]) {
  const bucket = new Map<string, ExportJob[]>();

  jobs.forEach((job) => {
    const label = job.kind === 'pdf_dossier' ? 'Dossier' : 'Manuscript';
    const current = bucket.get(label) ?? [];
    current.push(job);
    bucket.set(label, current);
  });

  return [...bucket.entries()].map(([label, items]) => ({
    label,
    items
  }));
}

function buildPackageSummary(jobs: ExportJob[]) {
  const bucket = new Map<
    string,
    {
      label: string;
      root: string;
      jobs: number;
      files: number;
    }
  >();

  jobs.forEach((job) => {
    const root = dirname(job.targetPath);
    const current = bucket.get(root) ?? {
      label: job.kind === 'pdf_dossier' ? 'Dossier bundle' : 'Manuscript bundle',
      root,
      jobs: 0,
      files: 0
    };
    current.jobs += 1;
    current.files += Math.max(listArtifactPaths(job).length, 1);
    bucket.set(root, current);
  });

  return [...bucket.values()];
}

function dirname(path: string) {
  const normalized = path.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');

  return lastSlash >= 0 ? normalized.slice(0, lastSlash) : normalized;
}

function buildCuratedOutputs(filteredJobs: ExportJob[], jobs: ExportJob[]) {
  const source = filteredJobs.length ? filteredJobs : jobs;
  const lanes: Array<{ kind: ExportKind; label: string }> = [
    { kind: 'pdf_dossier', label: 'Dossier sheet' },
    { kind: 'manuscript_pdf', label: 'Manuscript PDF' }
  ];

  return lanes
    .map((lane) => {
      const job = source.find((item) => item.kind === lane.kind);

      if (!job) {
        return null;
      }

      return {
        label: lane.label,
        fileName: job.targetPath.split('/').pop() ?? job.targetPath,
        status: job.status,
        files: listArtifactPaths(job).length
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function buildBundleReadiness(filteredJobs: ExportJob[], jobs: ExportJob[]) {
  const source = filteredJobs.length ? filteredJobs : jobs;

  if (!source.length) {
    return null;
  }

  const lanes = [
    {
      label: 'Dossier',
      ready: source.some((job) => job.kind === 'pdf_dossier')
    },
    {
      label: 'Manuscript',
      ready: source.some((job) => job.kind === 'manuscript_pdf')
    },
    {
      label: 'Bundle',
      ready: source.some((job) => listArtifactPaths(job).length > 0)
    }
  ];
  const readyCount = lanes.filter((lane) => lane.ready).length;

  return {
    coverage: `${readyCount}/${lanes.length} lanes`,
    summary: readyCount === lanes.length ? 'Reusable world bundle close' : 'Bundle still partial',
    lanes
  };
}

function buildReferenceSheets(filteredJobs: ExportJob[], jobs: ExportJob[]) {
  const source = filteredJobs.length ? filteredJobs : jobs;

  return source
    .map((job) => {
      const fileName =
        getPrimaryArtifactPath(job)?.split('/').pop() ??
        job.targetPath.split('/').pop() ??
        job.targetPath;

      return {
        label: job.kind === 'pdf_dossier' ? 'World dossier' : 'Scene manuscript',
        fileName,
        source: job.kind === 'pdf_dossier' ? 'wiki/map' : 'manuscript',
        status: job.status
      };
    })
    .filter(
      (sheet, index, items) =>
        items.findIndex((item) => item.label === sheet.label) === index
    );
}

function buildManifestDigest(filteredJobs: ExportJob[], jobs: ExportJob[]) {
  const source = filteredJobs.length ? filteredJobs : jobs;

  if (!source.length) {
    return null;
  }

  const rootLabel = dirname(source[0].targetPath);
  const artifactPaths = source.flatMap((job) => listArtifactPaths(job));

  if (!artifactPaths.length) {
    return {
      rootLabel,
      summary: 'No artifact files yet',
      groups: [
        { label: 'PDF', count: 0 },
        { label: 'Other', count: 0 }
      ]
    };
  }

  const groups = [
    {
      label: 'PDF',
      count: artifactPaths.filter((path) => extensionOf(path) === 'pdf').length
    },
    {
      label: 'Other',
      count: artifactPaths.filter((path) => extensionOf(path) !== 'pdf').length
    }
  ];

  return {
    rootLabel,
    summary: `${artifactPaths.length} artifact files`,
    groups
  };
}

function extensionOf(path: string) {
  const normalized = path.replace(/\\/g, '/');
  const lastDot = normalized.lastIndexOf('.');

  return lastDot >= 0 ? normalized.slice(lastDot + 1).toLowerCase() : '';
}

function buildLaneHistory(filteredJobs: ExportJob[], jobs: ExportJob[]) {
  const source = filteredJobs.length ? filteredJobs : jobs;
  const bucket = new Map<
    ExportKind,
    {
      label: string;
      lastCreatedAt: string;
      lastStatus: ExportJob['status'];
      runs: number;
    }
  >();

  source.forEach((job) => {
    const current = bucket.get(job.kind) ?? {
      label: job.kind === 'pdf_dossier' ? 'Dossier lane' : 'Manuscript lane',
      lastCreatedAt: job.createdAt,
      lastStatus: job.status,
      runs: 0
    };
    current.runs += 1;
    if (job.createdAt >= current.lastCreatedAt) {
      current.lastCreatedAt = job.createdAt;
      current.lastStatus = job.status;
    }
    bucket.set(job.kind, current);
  });

  return [...bucket.values()];
}

function buildDeliveryChecklist(filteredJobs: ExportJob[], jobs: ExportJob[]) {
  const source = filteredJobs.length ? filteredJobs : jobs;

  if (!source.length) {
    return [];
  }

  const hasDossier = source.some((job) => job.kind === 'pdf_dossier');
  const hasManuscript = source.some((job) => job.kind === 'manuscript_pdf');
  const hasArtifacts = source.some((job) => listArtifactPaths(job).length > 0);
  const latest = source[0];

  return [
    {
      label: 'Queue',
      state: latest.status,
      note: `${source.length} jobs tracked`
    },
    {
      label: 'Dossier lane',
      state: hasDossier ? 'ready' : 'pending',
      note: hasDossier ? 'world sheet path present' : 'no dossier job'
    },
    {
      label: 'Manuscript lane',
      state: hasManuscript ? 'ready' : 'pending',
      note: hasManuscript ? 'book path present' : 'no manuscript job'
    },
    {
      label: 'Artifacts',
      state: hasArtifacts ? 'ready' : 'pending',
      note: hasArtifacts ? 'artifact files present' : 'artifact files missing'
    }
  ];
}

function buildFormatReadiness(filteredJobs: ExportJob[], jobs: ExportJob[]) {
  const source = filteredJobs.length ? filteredJobs : jobs;

  if (!source.length) {
    return [];
  }

  const hasPdf = source.some(
    (job) => job.kind === 'pdf_dossier' || job.kind === 'manuscript_pdf'
  );
  const hasArtifactPdf = source.some((job) =>
    listArtifactPaths(job).some((path) => extensionOf(path) === 'pdf')
  );

  return [
    {
      label: 'PDF',
      state: hasPdf ? 'ready' : 'pending',
      note: hasArtifactPdf ? 'artifact path present' : 'queue only'
    },
    {
      label: 'EPUB',
      state: 'later',
      note: 'future richer format'
    }
  ];
}

function buildTargetRoots(filteredJobs: ExportJob[], jobs: ExportJob[]) {
  const source = filteredJobs.length ? filteredJobs : jobs;
  const bucket = new Map<
    string,
    {
      root: string;
      lastFile: string;
      jobs: number;
      artifacts: number;
    }
  >();

  source.forEach((job) => {
    const root = dirname(job.targetPath);
    const current = bucket.get(root) ?? {
      root,
      lastFile: job.targetPath.split('/').pop() ?? job.targetPath,
      jobs: 0,
      artifacts: 0
    };
    current.jobs += 1;
    current.artifacts += listArtifactPaths(job).length;
    current.lastFile = job.targetPath.split('/').pop() ?? job.targetPath;
    bucket.set(root, current);
  });

  return [...bucket.values()];
}

function buildBundleContents(filteredJobs: ExportJob[], jobs: ExportJob[]) {
  const source = filteredJobs.length ? filteredJobs : jobs;
  const artifactRows = source.flatMap((job) =>
    listArtifactPaths(job).map((artifactPath) => ({
      fileName: artifactPath.split('/').pop() ?? artifactPath,
      root: dirname(artifactPath),
      kind: job.kind === 'pdf_dossier' ? 'Dossier' : 'Manuscript'
    }))
  );

  return artifactRows.filter(
    (item, index, items) =>
      items.findIndex(
        (current) =>
          current.fileName === item.fileName && current.root === item.root
      ) === index
  );
}

function getPrimaryArtifactPath(job: ExportJob) {
  return (
    listArtifactPaths(job).find((path) => extensionOf(path) === 'pdf') ??
    listArtifactPaths(job)[0] ??
    job.targetPath
  );
}

function listArtifactPaths(job: ExportJob) {
  const paths = [
    job.primaryArtifactPath?.trim() || null,
    ...job.artifactPaths
  ].filter((path): path is string => Boolean(path?.trim()));

  return paths.filter(
    (path, index, items) => items.findIndex((entry) => entry === path) === index
  );
}
