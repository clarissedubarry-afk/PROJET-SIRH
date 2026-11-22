const courte = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const longue = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const fmtDate = (iso: string) => courte.format(d(iso));
export const fmtLongDate = (iso: string) => longue.format(d(iso));
export const fmtEuros = (n: number) => euros.format(n);
export const fmtNombre = (n: number) => nombre.format(n);

/** Nombre d'années pleines entre deux dates (âge, ancienneté). */
export function anneesEntre(debutIso: string, finIso: string) {
  const a = d(debutIso);
  const b = d(finIso);
  let ans = b.getUTCFullYear() - a.getUTCFullYear();
  if (b.getUTCMonth() < a.getUTCMonth() || (b.getUTCMonth() === a.getUTCMonth() && b.getUTCDate() < a.getUTCDate())) ans--;
  return ans;
}

export function anciennete(debutIso: string, aujourdhuiIso: string) {
  const ans = anneesEntre(debutIso, aujourdhuiIso);
  if (ans < 1) return "Moins d'un an";
  return `${ans} an${ans > 1 ? "s" : ""}`;
}
