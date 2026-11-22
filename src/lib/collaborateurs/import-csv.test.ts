import { describe, expect, it } from "vitest";
import { analyserCsv, parseDate, parseNombre, parseTauxTemps } from "./import-csv";

const ENTETE =
  "id_collaborateur;nom;prenom;email;date_naissance;date_embauche;type_contrat;code_service;intitule_poste;niveau_classification;salaire_brut_mensuel;taux_temps_travail;solde_cp;solde_rtt;id_manager;profil_acces";

const ligne = (surcharges: Partial<Record<string, string>> = {}) => {
  const base: Record<string, string> = {
    id_collaborateur: "C001",
    nom: "Durand",
    prenom: "Alice",
    email: "alice.durand@exemple.fr",
    date_naissance: "1990-04-12",
    date_embauche: "2020-09-01",
    type_contrat: "CDI",
    code_service: "RH",
    intitule_poste: "Chargée RH",
    niveau_classification: "Cadre",
    salaire_brut_mensuel: "3200",
    taux_temps_travail: "100",
    solde_cp: "12,5",
    solde_rtt: "4",
    id_manager: "",
    profil_acces: "RH_ADMIN",
    ...surcharges,
  };
  return ENTETE.split(";").map((c) => base[c]).join(";");
};

describe("import CSV des collaborateurs", () => {
  it("importe une ligne valide séparée par des points-virgules", () => {
    const r = analyserCsv(`${ENTETE}\n${ligne()}`);
    expect(r.erreurs).toEqual([]);
    expect(r.collaborateurs).toHaveLength(1);
    expect(r.collaborateurs[0]?.soldeCp).toBe(12.5);
  });

  it("accepte aussi un fichier séparé par des virgules", () => {
    const csv = `${ENTETE.replaceAll(";", ",")}\n${ligne({ solde_cp: "12" }).replaceAll(";", ",")}`;
    expect(analyserCsv(csv).collaborateurs).toHaveLength(1);
  });

  it("accepte les 5 types de contrat CDI, CDD, Alternance, Stage et Freelance", () => {
    const types = ["CDI", "CDD", "Alternance", "Stage", "Freelance"];
    const csv = [ENTETE, ...types.map((t, i) => ligne({ id_collaborateur: `C${i}`, email: `p${i}@x.fr`, type_contrat: t }))].join("\n");
    expect(analyserCsv(csv).collaborateurs.map((c) => c.typeContrat)).toEqual(types);
  });

  it("refuse un type de contrat inconnu", () => {
    const r = analyserCsv(`${ENTETE}\n${ligne({ type_contrat: "Intérim" })}`);
    expect(r.collaborateurs).toHaveLength(0);
    expect(r.erreurs[0]?.colonne).toBe("type_contrat");
  });

  it("n'accepte que les profils RH_ADMIN, MANAGER et COLLABORATEUR", () => {
    const ok = analyserCsv(`${ENTETE}\n${ligne({ profil_acces: "MANAGER" })}`);
    const ko = analyserCsv(`${ENTETE}\n${ligne({ profil_acces: "DIRECTEUR" })}`);
    expect(ok.collaborateurs).toHaveLength(1);
    expect(ko.erreurs[0]?.colonne).toBe("profil_acces");
  });

  it("signale les colonnes manquantes", () => {
    const r = analyserCsv("id_collaborateur;nom\nC1;Durand");
    expect(r.colonnesManquantes).toContain("email");
    expect(r.colonnesManquantes).toContain("profil_acces");
  });

  it("refuse un identifiant en double", () => {
    const r = analyserCsv(`${ENTETE}\n${ligne()}\n${ligne({ email: "autre@x.fr" })}`);
    expect(r.collaborateurs).toHaveLength(1);
    expect(r.erreurs[0]?.ligne).toBe(3);
  });

  it("avertit quand le manager n'existe pas dans le fichier", () => {
    const r = analyserCsv(`${ENTETE}\n${ligne({ id_manager: "C999" })}`);
    expect(r.collaborateurs).toHaveLength(1);
    expect(r.avertissements[0]?.colonne).toBe("id_manager");
  });
});

describe("conversions", () => {
  it("lit les nombres à la française", () => {
    expect(parseNombre("2 500,50")).toBe(2500.5);
    expect(parseNombre("abc")).toBeNull();
  });

  it("convertit le temps de travail en pourcentage", () => {
    expect(parseTauxTemps("80")).toBe(80);
    expect(parseTauxTemps("0,8")).toBe(80);
    expect(parseTauxTemps("80%")).toBe(80);
    expect(parseTauxTemps("120")).toBeNull();
  });

  it("lit les dates JJ/MM/AAAA et refuse les dates impossibles", () => {
    expect(parseDate("12/04/1990")).toBe("1990-04-12");
    expect(parseDate("1990-04-12")).toBe("1990-04-12");
    expect(parseDate("31/02/2020")).toBeNull();
  });
});
