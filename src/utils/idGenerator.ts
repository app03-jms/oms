/**
 * Universal AppSheet-like Unique ID Generator.
 * Uses crypto.randomUUID() when available, falls back to high-entropy random.
 * Enforces prefix convention across ALL app models.
 */

const PREFIX_LENGTH = 8;

function randomSuffix(length: number): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, length);
  }
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function generateUniqueId(prefix?: string): string {
  const p = prefix ? `${prefix}_` : '';
  return `${p}${randomSuffix(PREFIX_LENGTH)}`;
}

// ── Typed prefix helpers ──────────────────────────────────────
export const ID = {
  hotel: () => generateUniqueId('htl'),
  user: () => generateUniqueId('usr'),
  mapping: () => generateUniqueId('map'),
  attendance: () => generateUniqueId('att'),
  schedule: () => generateUniqueId('sch'),
  closure: () => generateUniqueId('cls'),
  employee: () => generateUniqueId('emp'),
  department: () => generateUniqueId('dep'),
  shift: () => generateUniqueId('shf'),
  role: () => generateUniqueId('role'),
} as const;
