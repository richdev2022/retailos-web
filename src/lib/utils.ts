import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with conditional logic, de-duplicating conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Generate a reasonably-unique id (used for client-side keys / syncIds). */
export function uid(prefix = ''): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${time}${rnd}`;
}

/** Sleep helper for mock latency. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Format a number with thousands separators (no currency). */
export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('en-NG', { maximumFractionDigits }).format(value);
}

/** Truncate a string to `len` chars with ellipsis. */
export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + '…';
}

/** Return initials from a full name (max 2 chars). */
export function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/** Debounce a function. */
export function debounce<T extends (...args: never[]) => void>(fn: T, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Build query string from an object, omitting undefined/null/empty values. */
export function toQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    sp.append(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/** Trigger a browser file download from a blob/string. */
export function downloadFile(filename: string, content: string, type = 'text/csv'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Convert an array of rows to a CSV string. */
export function toCsv(rows: Array<Record<string, unknown>>, columns?: string[]): string {
  if (rows.length === 0) return '';
  const cols = columns ?? Object.keys(rows[0]!);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(',');
  const body = rows.map((r) => cols.map((c) => escape(r[c])).join(',')).join('\r\n');
  return `${header}\r\n${body}`;
}
