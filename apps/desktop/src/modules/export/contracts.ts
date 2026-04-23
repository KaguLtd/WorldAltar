export type ExportKind =
  | 'pdf_dossier'
  | 'manuscript_pdf';

export type ExportRequest = {
  kind: ExportKind;
  targetPath?: string | null;
};

export type ExportJob = {
  id: string;
  kind: ExportKind;
  status: 'idle' | 'queued' | 'running' | 'done' | 'failed';
  targetPath: string;
  artifactPaths: string[];
  createdAt: string;
};

export type ExportLens = {
  queue(request: ExportRequest): Promise<ExportJob>;
  listJobs(): Promise<ExportJob[]>;
};
