/**
 * Client-side export utilities for Excel (XLSX) and CSV.
 *
 * Excel generation uses SheetJS (xlsx) which must be installed as a dependency.
 * CSV generation is dependency-free.
 */

import * as XLSX from 'xlsx';

interface ExcelOptions {
  /** File name without extension */
  fileName: string;
  /** Worksheet tab name */
  sheetName?: string;
  /** Company name rendered as a merged header row */
  companyName?: string;
  /** Optional title row rendered above headers (e.g. report name) */
  title?: string;
  /** Optional report date shown below title */
  reportDate?: string;
}

/**
 * Generate and download an Excel (.xlsx) file from header + row data.
 */
export function exportToExcel(
  headers: string[],
  rows: (string | number)[][],
  options: ExcelOptions,
): void {
  const { fileName, sheetName = 'Sheet1', companyName, title, reportDate } = options;

  const sheetData: (string | number)[][] = [];

  // Company name as top-level header
  if (companyName) {
    sheetData.push([companyName]);
    sheetData.push([]); // blank row after company name
  }

  if (title) {
    sheetData.push([title]);
  }
  if (reportDate) {
    sheetData.push([`Report Date: ${reportDate}`]);
  }
  if (companyName || title || reportDate) {
    sheetData.push([]); // blank separator row
  }

  sheetData.push(headers);
  sheetData.push(...rows);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto-fit column widths based on content
  ws['!cols'] = headers.map((_h, i) => {
    const maxLen = Math.max(
      _h.length,
      ...rows.map((r) => String(r[i] ?? '').length),
    );
    return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
  });

  // Merge company name row across all columns
  if (companyName && headers.length > 1) {
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Generate and download a CSV file from header + row data.
 */
export function exportToCsv(
  headers: string[],
  rows: (string | number)[][],
  fileName: string,
): void {
  const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
  const csvContent = [headers, ...rows]
    .map((row) => row.map(escape).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
