// Mémoire de l'application : la liste des collaborateurs importés.
// Étape 1 : enregistrée dans le navigateur. Étape 2 : elle passera dans la base de données.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Collaborateur } from "./types";

const CLE_STOCKAGE = "sirh.collaborateurs.v1";

interface EtatCollaborateurs {
  collaborateurs: Collaborateur[];
  charge: boolean; // false tant que le navigateur n'a pas relu les données
  dateImport: string | null;
  parId: (id: string | null) => Collaborateur | undefined;
  remplacer: (liste: Collaborateur[]) => void;
  vider: () => void;
}

const Contexte = createContext<EtatCollaborateurs | null>(null);

export function CollaborateursProvider({ children }: { children: ReactNode }) {
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [dateImport, setDateImport] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE_STOCKAGE);
      if (brut) {
        const donnees = JSON.parse(brut) as { collaborateurs: Collaborateur[]; dateImport: string };
        setCollaborateurs(donnees.collaborateurs);
        setDateImport(donnees.dateImport);
      }
    } catch {
      window.localStorage.removeItem(CLE_STOCKAGE);
    }
    setCharge(true);
  }, []);

  const valeur = useMemo<EtatCollaborateurs>(() => {
    const index = new Map(collaborateurs.map((c) => [c.id, c]));
    return {
      collaborateurs,
      charge,
      dateImport,
      parId: (id) => (id ? index.get(id) : undefined),
      remplacer: (liste) => {
        const date = new Date().toISOString();
        setCollaborateurs(liste);
        setDateImport(date);
        window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify({ collaborateurs: liste, dateImport: date }));
      },
      vider: () => {
        setCollaborateurs([]);
        setDateImport(null);
        window.localStorage.removeItem(CLE_STOCKAGE);
      },
    };
  }, [collaborateurs, charge, dateImport]);

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useCollaborateurs() {
  const ctx = useContext(Contexte);
  if (!ctx) throw new Error("useCollaborateurs doit être utilisé dans CollaborateursProvider");
  return ctx;
}
