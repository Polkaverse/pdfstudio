import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { getUploadConfig } from "./config";

export type StoredDocument = {
  documentId: string;
  objectKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storedAt: string;
  expiresAt: string;
};

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "document";
}

function getStorageRoot() {
  return path.join(process.cwd(), ".bharatpdf", "uploads");
}

export async function persistDocumentUpload(file: File, bytes: Buffer) {
  const { retentionHours } = getUploadConfig();
  const now = new Date();
  const documentId = randomUUID();
  const extension = path.extname(file.name) || ".bin";
  const baseName = path.basename(file.name, extension);
  const safeName = `${sanitizeSegment(baseName)}${extension.toLowerCase()}`;
  const objectKey = `${documentId}/${safeName}`;
  const rootDir = getStorageRoot();
  const absoluteDir = path.join(rootDir, documentId);
  const absoluteFilePath = path.join(absoluteDir, safeName);
  const storedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + retentionHours * 60 * 60 * 1000).toISOString();

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(absoluteFilePath, bytes);

  const record: StoredDocument = {
    documentId,
    objectKey,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: bytes.byteLength,
    storedAt,
    expiresAt,
  };

  await writeFile(
    path.join(absoluteDir, "record.json"),
    JSON.stringify(record, null, 2),
    "utf8",
  );

  return {
    ...record,
    absoluteFilePath,
  };
}
