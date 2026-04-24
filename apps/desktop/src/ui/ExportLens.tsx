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
    (count, job) => count + job.artifactPaths.length,
    0
  );

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
        <div className="theme-stack">
          {filteredJobs.map((job) => (
            <article key={job.id} className="theme-card is-active">
              <strong>{job.kind}</strong>
              <span>{job.status}</span>
              <span>{job.targetPath}</span>
              <span className="scene-card-meta">
                <span>{job.createdAt}</span>
                <span>{job.artifactPaths.length} files</span>
              </span>
              {job.artifactPaths.length ? (
                <ul
                  className="asset-manifest"
                  aria-label={`artifacts ${job.id}`}
                >
                  {job.artifactPaths.map((artifactPath) => (
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
