import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Money helpers. The backend stores money as integer minor units (kobo for NGN)
 * and returns them as strings (BigInt-safe). Reports return a `{ minor, major }`
 * MoneyField. These helpers normalize both into human-readable strings.
 */

export type MoneyField = { minor: string; major: number };

/** Coerce a money value (string | number | bigint | MoneyField) to minor units. */
export function toMinor(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'object' && value !== null && 'minor' in value) {
    return Number((value as MoneyField).minor);
  }
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Convert minor units to major units (e.g. 125050 kobo -> 1250.50 NGN). */
export function toMajor(value: unknown): number {
  const m = toMinor(value);
  return m / 100;
}

/** Format money from minor units into a localized currency string. */
export function formatMoney(
  value: unknown,
  currency = 'NGN',
  options: { compact?: boolean; signDisplay?: 'auto' | 'always' | 'never' } = {},
): string {
  const minor = toMinor(value);
  const major = minor / 100;
  const currencySymbol = currencySymbolFor(currency);
  if (options.compact && Math.abs(major) >= 1_000_000) {
    return `${major < 0 ? '-' : ''}${currencySymbol}${(Math.abs(major) / 1_000_000).toFixed(2)}M`;
  }
  if (options.compact && Math.abs(major) >= 100_000) {
    return `${major < 0 ? '-' : ''}${currencySymbol}${(Math.abs(major) / 1000).toFixed(1)}k`;
  }
  const fractionDigits = major % 1 === 0 ? 0 : 2;
  const abs = Math.abs(major);
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${major < 0 ? '-' : ''}${currencySymbol}${formatted}`;
}

/** Format a "major units" decimal value as money (used for inputs / reports). */
export function formatMajorMoney(major: number, currency = 'NGN'): string {
  return formatMoney(Math.round(major * 100), currency);
}

/** Convert a major-units number (e.g. user-typed price) to minor units string. */
export function majorToMinorString(major: number | string): string {
  const n = typeof major === 'string' ? parseFloat(major) : major;
  if (!Number.isFinite(n)) return '0';
  return String(Math.round(n * 100));
}

/** Return the currency symbol for an ISO code. */
export function currencySymbolFor(currency = 'NGN'): string {
  const symbols: Record<string, string> = {
    NGN: '\u20A6',
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    GHS: '\u20B5',
    KES: 'KSh',
    ZAR: 'R',
  };
  return symbols[currency.toUpperCase()] ?? currency + ' ';
}

/** Parse an ISO date string (or Date) and format it. Returns '-' on invalid. */
export function formatDate(
  date: string | Date | null | undefined,
  pattern = 'dd MMM yyyy',
): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, pattern);
}

/** Format a date-time, e.g. "12 Jan 2025, 14:30". */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd MMM yyyy, HH:mm');
}

/** Relative time, e.g. "3 hours ago". */
export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return formatDistanceToNow(d, { addSuffix: true });
}

/** Percentage formatter. Input is a 0-100 number (or fraction if < 1). */
export function formatPercent(value: number, fractionDigits = 1): string {
  const v = Math.abs(value) < 1 && value !== 0 ? value * 100 : value;
  return `${v.toFixed(fractionDigits)}%`;
}

/** Generate a pseudo receipt number for display. */
export function shortId(id: string | null | undefined): string {
  if (!id) return '-';
  return id.slice(-8).toUpperCase();
}
