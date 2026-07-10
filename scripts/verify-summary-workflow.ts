import assert from "node:assert/strict";

import { persistDocumentUpload } from "../lib/server/document-storage";
import { runSummaryWorkflow, validateIncomingFile } from "../lib/server/document-workflow";

async function main() {
  const content = [
    "BharatPDF helps neighbourhood businesses review contracts faster.",
    "The first release stores uploads locally, extracts text, and produces a concise summary without external services.",
    "Scanned PDFs that require OCR are deferred explicitly so the product does not overstate its capabilities.",
  ].join(" ");

  const file = new File([content], "workflow-sample.txt", { type: "text/plain" });
  validateIncomingFile(file);

  const bytes = Buffer.from(await file.arrayBuffer());
  const stored = await persistDocumentUpload(file, bytes);
  const result = await runSummaryWorkflow({ file, bytes, stored });

  assert.equal(result.status, "completed");
  assert.equal(result.parser, "text");
  assert.ok(result.summaryBullets.length >= 2);
  assert.match(result.previewText, /BharatPDF helps neighbourhood businesses/i);

  console.log("summary workflow verification passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
