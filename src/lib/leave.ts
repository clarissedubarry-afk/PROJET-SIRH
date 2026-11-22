// Règles de calcul des congés (jours ouvrés, France).

/** Jours fériés français 2026 (format AAAA-MM-JJ). */
export const FRENCH_HOLIDAYS_2026 = [
  "2026-01-01",
  "2026-04-06",
  "2026-05-01",
  "2026-05-08",
  "2026-05-14",
  "2026-05-25",
  "2026-07-14",
  "2026-08-15",
  "2026-11-01",
  "2026-11-11",
  "2026-12-25",
];

/** Droit annuel aux congés payés, en jours ouvrés. */
export const ANNUAL_PAID_LEAVE_DAYS = 25;

function toKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parse(iso: string) {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Nombre de jours ouvrés entre deux dates incluses :
 * exclut samedis, dimanches et jours fériés.
 */
export function countWorkingDays(startIso: string, endIso: string, holidays = FRENCH_HOLIDAYS_2026) {
  const start = parse(startIso);
  const end = parse(endIso);
  if (end < start) return 0;
  const set = new Set(holidays);
  let count = 0;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const wd = d.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    if (set.has(toKey(d))) continue;
    count++;
  }
  return count;
}

/** L'absence couvre-t-elle cette date ? */
export function coversDate(startIso: string, endIso: string, dayIso: string) {
  return startIso <= dayIso && dayIso <= endIso;
}
