"use client";

import { useState, useTransition } from "react";

type TaskId = "compress" | "ocr" | "summary" | "translate" | "template" | "sign";

type Task = {
  id: TaskId;
  label: string;
  detail: string;
  eta: string;
  retention: string;
  formats: string;
  availability: "live" | "queued";
};

type WorkflowResult = {
  documentId: string;
  objectKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  retentionHours: number;
  storedAt: string;
  expiresAt: string;
  task: "summary";
  status: "completed" | "deferred";
  parser: "text" | "pdf";
  summaryBullets: string[];
  previewText: string;
  extractedCharacters: number;
  pageCount: number | null;
  diagnostics: string[];
  deferredReason: string | null;
};

const tasks: Task[] = [
  {
    id: "summary",
    label: "Summarize",
    detail: "Upload a text PDF or text file and get a concise review immediately.",
    eta: "Usually under 20 seconds",
    retention: "Auto-delete in 24 hours",
    formats: "PDF, TXT, MD",
    availability: "live",
  },
  {
    id: "ocr",
    label: "Scan to Text",
    detail: "Image OCR and searchable PDF export are queued behind the storage boundary added here.",
    eta: "Deferred",
    retention: "Auto-delete in 24 hours",
    formats: "PDF, JPG, PNG",
    availability: "queued",
  },
  {
    id: "translate",
    label: "Translate",
    detail: "Translation remains queued until OCR and clean extraction are stable.",
    eta: "Deferred",
    retention: "Auto-delete in 24 hours",
    formats: "PDF",
    availability: "queued",
  },
  {
    id: "compress",
    label: "Quick PDF",
    detail: "Compression and merge/split will reuse the same upload and storage primitives.",
    eta: "Deferred",
    retention: "Auto-delete in 24 hours",
    formats: "PDF",
    availability: "queued",
  },
  {
    id: "template",
    label: "Create from Template",
    detail: "Template generation stays out of the first functional slice to keep the pipeline honest.",
    eta: "Deferred",
    retention: "Save only after download",
    formats: "PDF export",
    availability: "queued",
  },
  {
    id: "sign",
    label: "Send and Sign",
    detail: "Signing will follow once document persistence and preview flows are hardened.",
    eta: "Deferred",
    retention: "Share links expire in 15 minutes",
    formats: "PDF",
    availability: "queued",
  },
];

const pipelineSteps = [
  "Upload arrives through a multipart API route with file-size and extension validation.",
  "The server stores the original file inside a local object-key boundary under `.bharatpdf/uploads`.",
  "A reversible processor extracts embedded text from PDFs or reads plain text directly.",
  "A local heuristic summarizer returns bullets and preview text without requiring secrets or external services.",
];

const deferredCapabilities = [
  "Scanned/image PDFs that require OCR return an explicit deferred state instead of fake text.",
  "Translation, signing, and template creation remain queued behind this upload and processing seam.",
  "The API never returns raw filesystem paths, only document ids and object keys.",
];

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MvpShell() {
  const [selectedTask, setSelectedTask] = useState<TaskId>("summary");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("No file selected");
  const [isPending, startTransition] = useTransition();

  const selectedTaskDetails = tasks.find((task) => task.id === selectedTask) ?? tasks[0];
  const liveTask = selectedTaskDetails.id === "summary";

  function handleSubmit(formData: FormData) {
    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/workflows/summary", {
          method: "POST",
          body: formData,
        });
        const payload = (await response.json()) as
          | { result: WorkflowResult }
          | { error: string };

        if (!response.ok || !("result" in payload)) {
          throw new Error("error" in payload ? payload.error : "Workflow failed.");
        }

        setResult(payload.result);
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Workflow failed.",
        );
      }
    });
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">BharatPDF AI MVP</p>
          <h1>Ship the first honest document pipeline before the rest of the suite.</h1>
          <p className="lede">
            This baseline now includes a real upload, storage, extraction, and summary path
            for text-based PDFs and text files. OCR-heavy scans still surface as deferred work
            instead of pretending they are finished.
          </p>
          <div className="trust-strip" aria-label="Trust signals">
            <span>No login for this workflow</span>
            <span>Local retention boundary</span>
            <span>Explicit deferred OCR</span>
          </div>
        </div>

        <div className="hero-panel">
          <div className="task-tabs" role="tablist" aria-label="Primary tasks">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                role="tab"
                aria-selected={selectedTask === task.id}
                className={selectedTask === task.id ? "task-tab active" : "task-tab"}
                onClick={() => setSelectedTask(task.id)}
              >
                {task.label}
              </button>
            ))}
          </div>

          <div className="upload-panel">
            <div>
              <p className="section-kicker">Selected task</p>
              <h2>{selectedTaskDetails.label}</h2>
              <p>{selectedTaskDetails.detail}</p>
            </div>

            <dl className="upload-meta">
              <div>
                <dt>Formats</dt>
                <dd>{selectedTaskDetails.formats}</dd>
              </div>
              <div>
                <dt>ETA</dt>
                <dd>{selectedTaskDetails.eta}</dd>
              </div>
              <div>
                <dt>Retention</dt>
                <dd>{selectedTaskDetails.retention}</dd>
              </div>
            </dl>

            {liveTask ? (
              <form
                className="workflow-form"
                action={handleSubmit}
              >
                <label className="file-picker">
                  <span>Choose a PDF, TXT, or MD file</span>
                  <input
                    name="file"
                    type="file"
                    accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                    onChange={(event) =>
                      setSelectedFileName(event.currentTarget.files?.[0]?.name ?? "No file selected")
                    }
                  />
                </label>
                <div className="form-helper-row">
                  <span className="status-pill ready">{selectedFileName}</span>
                  <button type="submit" className="primary-cta" disabled={isPending}>
                    {isPending ? "Processing..." : "Upload and summarize"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="deferred-panel">
                <span className="status-pill uploading">Queued next</span>
                <p>
                  This task now has a real backend seam to plug into, but the user-facing workflow
                  is not implemented in this slice.
                </p>
              </div>
            )}

            {error ? <p className="form-error">{error}</p> : null}

            <article className="result-card">
              <div className="file-card-header">
                <div>
                  <h3>Latest pipeline result</h3>
                  <p>
                    {result
                      ? `${result.originalName} • ${formatBytes(result.sizeBytes)}`
                      : "Run the summarize workflow to see stored metadata and extracted output."}
                  </p>
                </div>
                <span className={`status-pill ${result?.status === "completed" ? "scanned" : "ready"}`}>
                  {result?.status ?? "idle"}
                </span>
              </div>

              {result ? (
                <div className="result-stack">
                  <div className="result-meta-grid">
                    <div>
                      <strong>Document id</strong>
                      <span>{result.documentId}</span>
                    </div>
                    <div>
                      <strong>Object key</strong>
                      <span>{result.objectKey}</span>
                    </div>
                    <div>
                      <strong>Parser</strong>
                      <span>{result.parser}</span>
                    </div>
                    <div>
                      <strong>Pages</strong>
                      <span>{result.pageCount ?? "n/a"}</span>
                    </div>
                  </div>

                  {result.status === "completed" ? (
                    <>
                      <div className="result-section">
                        <p className="section-kicker">Summary bullets</p>
                        <ul className="timeline-list">
                          {result.summaryBullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="result-section">
                        <p className="section-kicker">Preview text</p>
                        <textarea readOnly value={result.previewText} aria-label="Preview text" />
                      </div>
                    </>
                  ) : (
                    <div className="deferred-panel">
                      <span className="status-pill uploading">Deferred</span>
                      <p>{result.deferredReason}</p>
                    </div>
                  )}

                  <div className="result-section">
                    <p className="section-kicker">Diagnostics</p>
                    <ul className="timeline-list">
                      {result.diagnostics.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </article>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <article className="surface-card">
          <div className="card-header">
            <div>
              <p className="section-kicker">Server pipeline</p>
              <h2>Storage and processing boundaries now exist in code</h2>
            </div>
          </div>

          <div className="timeline-panel">
            <ul className="timeline-list">
              {pipelineSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </article>

        <article className="surface-card">
          <div className="card-header">
            <div>
              <p className="section-kicker">Deferred work</p>
              <h2>What remains intentionally unfinished</h2>
            </div>
          </div>

          <div className="timeline-panel">
            <ul className="timeline-list">
              {deferredCapabilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>
    </main>
  );
}
