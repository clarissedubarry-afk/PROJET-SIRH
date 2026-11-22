// Réglages généraux de l'application (nom, entreprise fictive, libellés des services).
export const APP_NAME = "Équipage";
export const ENTREPRISE = "Atelier Norde";

/** Libellés lisibles des codes service. Un code inconnu s'affiche tel quel. */
export const LIBELLES_SERVICES: Record<string, string> = {
  DIR: "Direction",
  RH: "Ressources humaines",
  FIN: "Finance",
  COM: "Commercial",
  MKT: "Marketing",
  SI: "Systèmes d'information",
  PROD: "Production",
  LOG: "Logistique",
};

export function libelleService(code: string) {
  return LIBELLES_SERVICES[code] ?? code;
}
