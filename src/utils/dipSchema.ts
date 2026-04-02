/**
 * Zod schema for .dip (DataInsight Project) file validation.
 * Falls back to lightweight manual validation if zod is unavailable.
 */

let z: any = null;

// Dynamically attempt to load zod
try {
  z = require('zod');
} catch {
  // zod not available – use manual validation below
}

export interface ValidationResult {
  success: boolean;
  error?: string;
}

// ── Manual fallback validation ────────────────────────────────────────────────
function validateManual(data: any): ValidationResult {
  if (typeof data !== 'object' || data === null) {
    return { success: false, error: 'File is not a valid JSON object.' };
  }
  if (data.schemaVersion !== '1.0') {
    return { success: false, error: `Unknown schema version: "${data.schemaVersion}". Expected "1.0".` };
  }
  if (typeof data.projectName !== 'string') {
    return { success: false, error: 'Missing or invalid "projectName" field.' };
  }
  if (!Array.isArray(data.history)) {
    return { success: false, error: 'Missing or invalid "history" array.' };
  }
  if (!Array.isArray(data.charts)) {
    return { success: false, error: 'Missing or invalid "charts" array.' };
  }
  if (!Array.isArray(data.mlResults)) {
    return { success: false, error: 'Missing or invalid "mlResults" array.' };
  }
  if (typeof data.createdAt !== 'string') {
    return { success: false, error: 'Missing or invalid "createdAt" field.' };
  }
  // Validate processedDataset structure if present
  if (data.processedDataset !== null && typeof data.processedDataset === 'object') {
    if (!Array.isArray(data.processedDataset.rows)) {
      return { success: false, error: 'processedDataset.rows must be an array.' };
    }
    if (!Array.isArray(data.processedDataset.columns)) {
      return { success: false, error: 'processedDataset.columns must be an array.' };
    }
  }
  return { success: true };
}

// ── Zod-based validation (when available) ─────────────────────────────────────
function validateWithZod(data: any): ValidationResult {
  const { z: zod } = z;

  const DatasetColumnSchema = zod.object({
    name: zod.string(),
    type: zod.enum(['string', 'number', 'date', 'boolean', 'unknown']),
    nullable: zod.boolean(),
  }).passthrough();

  const DatasetSchema = zod.object({
    id: zod.string(),
    name: zod.string(),
    rows: zod.array(zod.any()),
    columns: zod.array(DatasetColumnSchema),
    originalFormat: zod.enum(['csv', 'excel', 'json', 'unknown']),
    originalFilename: zod.string(),
  }).passthrough().nullable();

  const HistoryEntrySchema = zod.object({
    id: zod.string(),
    action: zod.string(),
    description: zod.string(),
    details: zod.record(zod.any()),
    timestamp: zod.number(),
  });

  const ChartConfigSchema = zod.object({
    id: zod.string(),
    chartType: zod.enum(['bar', 'line', 'pie', 'scatter']),
    xAxis: zod.string(),
    yAxis: zod.string(),
    groupBy: zod.string(),
    title: zod.string(),
    savedAt: zod.number(),
  });

  const DIPSchema = zod.object({
    schemaVersion: zod.literal('1.0'),
    projectName: zod.string().min(1),
    originalDataset: DatasetSchema,
    processedDataset: DatasetSchema,
    history: zod.array(HistoryEntrySchema),
    charts: zod.array(ChartConfigSchema),
    analysisResults: zod.array(zod.any()),
    mlResults: zod.array(zod.any()),
    exportSettings: zod.object({
      defaultFormat: zod.enum(['csv', 'xlsx', 'json']),
      includeHeaders: zod.boolean(),
      fileNamePrefix: zod.string(),
    }),
    createdAt: zod.string(),
    lastModified: zod.string(),
    versions: zod.array(zod.any()),
  });

  const result = DIPSchema.safeParse(data);
  if (result.success) {
    return { success: true };
  }
  const firstError = result.error.errors[0];
  return {
    success: false,
    error: `Invalid .dip file: ${firstError.path.join('.')} — ${firstError.message}`,
  };
}

/**
 * Validate a parsed JSON object against the .dip schema.
 * Uses Zod if available, otherwise falls back to manual validation.
 */
export function validateDIPProject(data: any): ValidationResult {
  if (z && z.z) {
    try {
      return validateWithZod(data);
    } catch {
      // Fall through to manual
    }
  }
  return validateManual(data);
}
