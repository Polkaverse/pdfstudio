import path from "node:path";

import { getUploadConfig } from "./config";

export type WorkflowTask = "summary";

export type WorkflowResult = {
  documentId: string;
  objectKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  retentionHours: number;
  storedAt: string;
  expiresAt: string;
  task: WorkflowTask;
  status: "completed" | "deferred";
  parser: "text" | "pdf";
  summaryBullets: string[];
  previewText: string;
  extractedCharacters: number;
  pageCount: number | null;
  diagnostics: string[];
  deferredReason: string | null;
};

const supportedExtensions = new Set([".pdf", ".txt", ".md"]);
const stopWords = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "this",
  "from",
  "have",
  "will",
  "your",
  "into",
  "their",
  "there",
  "about",
  "would",
  "could",
  "shall",
  "should",
  "where",
  "when",
  "which",
  "page",
  "each",
  "been",
  "than",
  "were",
  "are",
  "was",
  "had",
  "has",
]);

export function validateIncomingFile(file: File) {
  const { uploadMaxBytes } = getUploadConfig();
  const extension = path.extname(file.name).toLowerCase();

  if (!supportedExtensions.has(extension)) {
    throw new Error("Only PDF, TXT, and MD uploads are supported in this first pipeline slice.");
  }

  if (file.size === 0) {
    throw new Error("The uploaded file is empty.");
  }

  if (file.size > uploadMaxBytes) {
    throw new Error(`File exceeds the ${Math.round(uploadMaxBytes / (1024 * 1024))} MB upload limit.`);
  }
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 24);
}

function buildKeywordBullet(text: string) {
  const counts = new Map<string, number>();

  for (const token of text.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? []) {
    if (stopWords.has(token)) {
      continue;
    }

    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const topKeywords = [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 4)
    .map(([keyword]) => keyword);

  return topKeywords.length > 0
    ? `Frequent terms: ${topKeywords.join(", ")}.`
    : "Frequent terms were not stable enough to surface.";
}

function summarizeText(text: string) {
  const normalized = normalizeWhitespace(text);

  if (!normalized) {
    return {
      summaryBullets: [] as string[],
      previewText: "",
      extractedCharacters: 0,
    };
  }

  const sentences = splitSentences(normalized);
  const longestSentence = sentences.reduce<string>(
    (longest, current) => (current.length > longest.length ? current : longest),
    "",
  );
  const distinctSentences = [sentences[0], longestSentence, sentences.at(-1)]
    .filter((sentence): sentence is string => Boolean(sentence))
    .filter((sentence, index, all) => all.indexOf(sentence) === index)
    .slice(0, 3);

  const summaryBullets = distinctSentences.length > 0
    ? distinctSentences
    : [normalized.slice(0, 220)];

  summaryBullets.push(buildKeywordBullet(normalized));

  return {
    summaryBullets,
    previewText: normalized.slice(0, 1200),
    extractedCharacters: normalized.length,
  };
}

async function extractTextFromPdf(bytes: Buffer) {
  const pdfParseModule = await import("pdf-parse");
  const pdfParse = "default" in pdfParseModule ? pdfParseModule.default : pdfParseModule;
  const parsed = await pdfParse(bytes);

  return {
    text: normalizeWhitespace(parsed.text ?? ""),
    pageCount: typeof parsed.numpages === "number" ? parsed.numpages : null,
  };
}

export async function runSummaryWorkflow(args: {
  file: File;
  bytes: Buffer;
  stored: {
    documentId: string;
    objectKey: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storedAt: string;
    expiresAt: string;
  };
}): Promise<WorkflowResult> {
  const { retentionHours } = getUploadConfig();
  const extension = path.extname(args.file.name).toLowerCase();
  const diagnostics: string[] = [
    "Upload stored locally under a reversible object-key boundary.",
    "No external OCR or LLM dependency is required for this first workflow slice.",
  ];

  let parser: WorkflowResult["parser"] = "text";
  let extractedText = "";
  let pageCount: number | null = null;

  if (extension === ".pdf") {
    parser = "pdf";
    const pdfData = await extractTextFromPdf(args.bytes);
    extractedText = pdfData.text;
    pageCount = pdfData.pageCount;
  } else {
    extractedText = normalizeWhitespace(args.bytes.toString("utf8"));
  }

  const summary = summarizeText(extractedText);

  if (!summary.previewText) {
    diagnostics.push("The file uploaded successfully, but no embedded text was available for summary extraction.");

    return {
      ...args.stored,
      retentionHours,
      task: "summary",
      status: "deferred",
      parser,
      summaryBullets: [],
      previewText: "",
      extractedCharacters: 0,
      pageCount,
      diagnostics,
      deferredReason:
        "This file appears to need OCR. Scan/image OCR is still deferred, so only text-based PDFs and text files complete today.",
    };
  }

  diagnostics.push(
    parser === "pdf"
      ? "PDF text was extracted from the embedded text layer."
      : "Plain text was extracted directly from the uploaded file.",
  );

  return {
    ...args.stored,
    retentionHours,
    task: "summary",
    status: "completed",
    parser,
    summaryBullets: summary.summaryBullets,
    previewText: summary.previewText,
    extractedCharacters: summary.extractedCharacters,
    pageCount,
    diagnostics,
    deferredReason: null,
  };
}
