const FALLBACK_UPLOAD_MAX_MB = 25;
const FALLBACK_RETENTION_HOURS = 24;

function parsePositiveNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getUploadConfig() {
  const uploadMaxMb = parsePositiveNumber(
    process.env.UPLOAD_MAX_MB,
    FALLBACK_UPLOAD_MAX_MB,
  );
  const retentionHours = parsePositiveNumber(
    process.env.RETENTION_HOURS,
    FALLBACK_RETENTION_HOURS,
  );

  return {
    uploadMaxMb,
    uploadMaxBytes: uploadMaxMb * 1024 * 1024,
    retentionHours,
  };
}
