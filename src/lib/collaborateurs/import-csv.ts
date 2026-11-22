// Lecture et vérification du fichier CSV des collaborateurs.
// Chaque ligne est contrôlée : les lignes en erreur sont écartées, les autres sont importées.
import Papa from "papaparse";
import {
  COLONNES_CSV,
  PROFILS_ACCES,
  TYPES_CONTRAT,
  type Collaborateur,
  type ProfilAcces,
  type TypeContrat,
} from "./types";

export interface Probleme {
  ligne: number; // numéro de ligne dans le fichier (l'en-tête est la ligne 1)
  colonne?: string;
  message: string;
}

export interface ResultatImport {
  collaborateurs: Collaborateur[];
  erreurs: Probleme[];
  avertissements: Probleme[];
  colonnesManquantes: string[];
  totalLignes: number;
}

/* ---------- Petites fonctions de conversion ---------- */

function normaliserEntete(h: string) {
  return h
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

/** "2 500,50 €" → 2500.5 ; renvoie null si ce n'est pas un nombre. */
export function parseNombre(valeur: string): number | null {
  const v = valeur.replace(/[\s\u00a0\u202f€%]/g, "").replace(",", ".");
  if (v === "" || !/^-?\d+(\.\d+)?$/.test(v)) return null;
  return Number(v);
}

/** Taux de temps de travail en % : "80", "80%", "0,8" et "0.8" donnent tous 80. */
export function parseTauxTemps(valeur: string): number | null {
  const n = parseNombre(valeur);
  if (n === null) return null;
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  if (pct <= 0 || pct > 100) return null;
  return Math.round(pct * 100) / 100;
}

/** Accepte AAAA-MM-JJ ou JJ/MM/AAAA et renvoie AAAA-MM-JJ, ou null si la date n'existe pas. */
export function parseDate(valeur: string): string | null {
  const v = valeur.trim();
  let a: number, m: number, j: number;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v);
  if (match) {
    [a, m, j] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    match = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(v);
    if (!match) return null;
    [j, m, a] = [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  const d = new Date(Date.UTC(a, m - 1, j));
  if (d.getUTCFullYear() !== a || d.getUTCMonth() !== m - 1 || d.getUTCDate() !== j) return null;
  return d.toISOString().slice(0, 10);
}

/** "cdi" ou "Cdi" → "CDI". */
export function normaliserTypeContrat(valeur: string): TypeContrat | null {
  const v = valeur.trim().toLowerCase();
  return TYPES_CONTRAT.find((t) => t.toLowerCase() === v) ?? null;
}

/** "rh admin" ou "Rh_Admin" → "RH_ADMIN". */
export function normaliserProfil(valeur: string): ProfilAcces | null {
  const v = valeur.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return PROFILS_ACCES.find((p) => p === v) ?? null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- Analyse complète du fichier ---------- */

export function analyserCsv(texte: string): ResultatImport {
  const resultat = Papa.parse<Record<string, string>>(texte.replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normaliserEntete,
  });

  const entetes = resultat.meta.fields ?? [];
  const colonnesManquantes = COLONNES_CSV.filter((c) => !entetes.includes(c));
  const lignes = resultat.data;

  if (colonnesManquantes.length > 0) {
    return { collaborateurs: [], erreurs: [], avertissements: [], colonnesManquantes, totalLignes: lignes.length };
  }

  const erreurs: Probleme[] = [];
  const avertissements: Probleme[] = [];
  const collaborateurs: Collaborateur[] = [];
  const idsVus = new Set<string>();
  const emailsVus = new Set<string>();

  lignes.forEach((brute, index) => {
    const ligne = index + 2;
    const val = (c: string) => (brute[c] ?? "").trim();
    const erreursLigne: Probleme[] = [];
    const erreur = (colonne: string, message: string) => erreursLigne.push({ ligne, colonne, message });

    const id = val("id_collaborateur");
    if (!id) erreur("id_collaborateur", "Identifiant manquant");
    else if (idsVus.has(id)) erreur("id_collaborateur", `Identifiant « ${id} » en double`);

    const nom = val("nom");
    const prenom = val("prenom");
    if (!nom) erreur("nom", "Nom manquant");
    if (!prenom) erreur("prenom", "Prénom manquant");

    const email = val("email").toLowerCase();
    if (!EMAIL_REGEX.test(email)) erreur("email", `Adresse e-mail invalide « ${val("email")} »`);

    const dateNaissance = parseDate(val("date_naissance"));
    if (!dateNaissance) erreur("date_naissance", `Date invalide « ${val("date_naissance")} »`);
    const dateEmbauche = parseDate(val("date_embauche"));
    if (!dateEmbauche) erreur("date_embauche", `Date invalide « ${val("date_embauche")} »`);
    if (dateNaissance && dateEmbauche && dateEmbauche <= dateNaissance) {
      erreur("date_embauche", "La date d'embauche est avant la date de naissance");
    }

    const typeContrat = normaliserTypeContrat(val("type_contrat"));
    if (!typeContrat) {
      erreur("type_contrat", `Contrat « ${val("type_contrat")} » inconnu (attendu : ${TYPES_CONTRAT.join(", ")})`);
    }

    const codeService = val("code_service").toUpperCase();
    if (!codeService) erreur("code_service", "Code service manquant");

    const intitulePoste = val("intitule_poste");
    if (!intitulePoste) erreur("intitule_poste", "Intitulé de poste manquant");

    const salaire = parseNombre(val("salaire_brut_mensuel"));
    if (salaire === null || salaire < 0) erreur("salaire_brut_mensuel", `Salaire invalide « ${val("salaire_brut_mensuel")} »`);

    const taux = parseTauxTemps(val("taux_temps_travail"));
    if (taux === null) erreur("taux_temps_travail", `Taux invalide « ${val("taux_temps_travail")} » (entre 1 et 100 %)`);

    const soldeCp = val("solde_cp") === "" ? 0 : parseNombre(val("solde_cp"));
    if (soldeCp === null) erreur("solde_cp", `Solde CP invalide « ${val("solde_cp")} »`);
    const soldeRtt = val("solde_rtt") === "" ? 0 : parseNombre(val("solde_rtt"));
    if (soldeRtt === null) erreur("solde_rtt", `Solde RTT invalide « ${val("solde_rtt")} »`);

    const profil = normaliserProfil(val("profil_acces"));
    if (!profil) {
      erreur("profil_acces", `Profil « ${val("profil_acces")} » inconnu (attendu : ${PROFILS_ACCES.join(", ")})`);
    }

    if (erreursLigne.length > 0) {
      erreurs.push(...erreursLigne);
      return;
    }

    if (emailsVus.has(email)) {
      avertissements.push({ ligne, colonne: "email", message: `E-mail « ${email} » déjà utilisé par un autre collaborateur` });
    }
    idsVus.add(id);
    emailsVus.add(email);

    collaborateurs.push({
      id,
      nom,
      prenom,
      email,
      dateNaissance: dateNaissance!,
      dateEmbauche: dateEmbauche!,
      typeContrat: typeContrat!,
      codeService,
      intitulePoste,
      niveauClassification: val("niveau_classification"),
      salaireBrutMensuel: salaire!,
      tauxTempsTravail: taux!,
      soldeCp: soldeCp!,
      soldeRtt: soldeRtt!,
      idManager: val("id_manager") || null,
      profilAcces: profil!,
    });
  });

  // Vérifie que chaque manager existe bien dans le fichier.
  const ids = new Set(collaborateurs.map((c) => c.id));
  collaborateurs.forEach((c, i) => {
    if (!c.idManager) return;
    const ligne = lignes.findIndex((l) => (l["id_collaborateur"] ?? "").trim() === c.id) + 2 || i + 2;
    if (c.idManager === c.id) {
      avertissements.push({ ligne, colonne: "id_manager", message: "Le collaborateur est indiqué comme son propre manager" });
    } else if (!ids.has(c.idManager)) {
      avertissements.push({ ligne, colonne: "id_manager", message: `Manager « ${c.idManager} » introuvable dans le fichier` });
    }
  });

  avertissements.sort((a, b) => a.ligne - b.ligne);
  return { collaborateurs, erreurs, avertissements, colonnesManquantes: [], totalLignes: lignes.length };
}

/** Lit le fichier choisi : UTF-8 si possible, sinon l'encodage d'Excel (Windows-1252). */
export async function lireFichierTexte(fichier: File): Promise<string> {
  const buffer = await fichier.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}
