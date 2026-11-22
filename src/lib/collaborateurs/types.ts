// La « forme » d'un collaborateur dans l'application, et les valeurs autorisées.

export const TYPES_CONTRAT = ["CDI", "CDD", "Alternance", "Stage", "Freelance"] as const;
export type TypeContrat = (typeof TYPES_CONTRAT)[number];

export const PROFILS_ACCES = ["RH_ADMIN", "MANAGER", "COLLABORATEUR"] as const;
export type ProfilAcces = (typeof PROFILS_ACCES)[number];

/** Colonnes attendues dans le fichier CSV, dans l'ordre. */
export const COLONNES_CSV = [
  "id_collaborateur",
  "nom",
  "prenom",
  "email",
  "date_naissance",
  "date_embauche",
  "type_contrat",
  "code_service",
  "intitule_poste",
  "niveau_classification",
  "salaire_brut_mensuel",
  "taux_temps_travail",
  "solde_cp",
  "solde_rtt",
  "id_manager",
  "profil_acces",
] as const;
export type ColonneCsv = (typeof COLONNES_CSV)[number];

export interface Collaborateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  dateNaissance: string; // AAAA-MM-JJ
  dateEmbauche: string; // AAAA-MM-JJ
  typeContrat: TypeContrat;
  codeService: string;
  intitulePoste: string;
  niveauClassification: string;
  salaireBrutMensuel: number; // en euros
  tauxTempsTravail: number; // en %, de 1 à 100
  soldeCp: number; // en jours
  soldeRtt: number; // en jours
  idManager: string | null;
  profilAcces: ProfilAcces;
}
