import type { ExportJob, ExportKind } from '../modules/export/contracts';

type ExportLensProps = {
  jobs: ExportJob[];
  onQueue: (kind: ExportKind) => void;
  status: string;
};

export function ExportLens({ jobs, onQueue, status }: ExportLensProps) {
  return (
    <section className="lens-frame" aria-label="export lens">
      <div className="workspace-head">
        <div>
          <p className="eyebrow">Export</p>
          <p className="copy">Deferred lens. Lazy queue only.</p>
        </div>
        <span className="command-chip">{status}</span>
      </div>

      <div className="toolbar">
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

      {jobs.length ? (
        <div className="theme-stack">
          {jobs.map((job) => (
            <article key={job.id} className="theme-card is-active">
              <strong>{job.kind}</strong>
              <span>{job.status}</span>
              <span>{job.targetPath}</span>
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
