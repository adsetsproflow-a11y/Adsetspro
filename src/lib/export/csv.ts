/**
 * Utility functions for exporting data to CSV format
 * SAAA SaaS Platform - Phase 16
 */

export interface CSVHeaderMapping {
  key: string;
  label: string;
}

/**
 * Escapes a cell value for CSV format (RFC 4180 standard)
 */
function escapeCSVValue(val: any): string {
  if (val === null || val === undefined) {
    return '""';
  }
  const stringVal = String(val);
  // If value contains comma, double-quote, or newline, wrap in quotes and escape internal quotes
  if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n') || stringVal.includes('\r')) {
    return `"${stringVal.replace(/"/g, '""')}"`;
  }
  return `"${stringVal}"`;
}

/**
 * Converts an array of objects to a CSV formatted string
 * @param data Array of records
 * @param headers Optional array of header definitions or string keys
 */
export function convertToCSV(
  data: Record<string, any>[],
  headers?: (string | CSVHeaderMapping)[]
): string {
  if (!data || data.length === 0) {
    return '';
  }

  let resolvedHeaders: { key: string; label: string }[] = [];

  if (headers && headers.length > 0) {
    resolvedHeaders = headers.map((h) => {
      if (typeof h === 'string') {
        return { key: h, label: h };
      }
      return h;
    });
  } else {
    // Infer headers from first object
    const keys = Object.keys(data[0]);
    resolvedHeaders = keys.map((k) => ({
      key: k,
      label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }

  // 1. Header row
  const headerRow = resolvedHeaders.map((h) => escapeCSVValue(h.label)).join(',');

  // 2. Data rows
  const rows = data.map((item) => {
    return resolvedHeaders
      .map((h) => {
        const val = item[h.key];
        return escapeCSVValue(val);
      })
      .join(',');
  });

  return [headerRow, ...rows].join('\r\n');
}

/**
 * Triggers browser download of a CSV file
 * @param filename File name (e.g. "task_report.csv")
 * @param csvContent String content in CSV format
 */
export function downloadCSV(filename: string, csvContent: string): void {
  if (typeof window === 'undefined') return;

  const finalName = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', finalName);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
