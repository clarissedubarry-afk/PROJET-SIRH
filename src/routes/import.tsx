import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Trash2, Upload, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContratPill } from "@/components/hr/contrat-pill";
import { PageHeader } from "@/components/hr/page-header";
import { analyserCsv, lireFichierTexte, type Probleme, type ResultatImport } from "@/lib/collaborateurs/import-csv";
import { useCollaborateurs } from "@/lib/collaborateurs/store";
import { COLONNES_CSV } from "@/lib/collaborateurs/types";
import { libelleService } from "@/lib/config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Import CSV — Équipage SIRH" },
      { name: "description", content: "Importez le fichier CSV des collaborateurs : vérification ligne par ligne avant l'import." },
      { property: "og:title", content: "Import CSV — Équipage SIRH" },
      { property: "og:description", content: "Import du fichier des collaborateurs avec contrôle des erreurs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PageImport,
});

const AIDE_COLONNES: Record<(typeof COLONNES_CSV)[number], string> = {
  id_collaborateur: "Identifiant unique (ex. C001)",
  nom: "Nom de famille",
  prenom: "Prénom",
  email: "Adresse e-mail",
  date_naissance: "JJ/MM/AAAA ou AAAA-MM-JJ",
  date_embauche: "JJ/MM/AAAA ou AAAA-MM-JJ",
  type_contrat: "CDI, CDD, Alternance, Stage ou Freelance",
  code_service: "Code du service (ex. RH, SI)",
  intitule_poste: "Intitulé du poste",
  niveau_classification: "Ex. Cadre, Employé (facultatif)",
  salaire_brut_mensuel: "En euros (ex. 2500 ou 2500,50)",
  taux_temps_travail: "En % (100, 80…) ou 1 / 0,8",
  solde_cp: "Jours de congés payés restants",
  solde_rtt: "Jours de RTT restants",
  id_manager: "Identifiant du manager (vide si aucun)",
  profil_acces: "RH_ADMIN, MANAGER ou COLLABORATEUR",
};

function PageImport() {
  const { collaborateurs, remplacer, vider } = useCollaborateurs();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [survol, setSurvol] = useState(false);
  const [nomFichier, setNomFichier] = useState<string | null>(null);
  const [resultat, setResultat] = useState<ResultatImport | null>(null);

  async function traiterFichier(fichier: File | undefined) {
    if (!fichier) return;
    if (!/\.(csv|txt)$/i.test(fichier.name)) {
      toast.error("Choisissez un fichier .csv");
      return;
    }
    const texte = await lireFichierTexte(fichier);
    setNomFichier(fichier.name);
    setResultat(analyserCsv(texte));
  }

  function confirmerImport() {
    if (!resultat) return;
    remplacer(resultat.collaborateurs);
    toast.success(`${resultat.collaborateurs.length} collaborateurs importés`);
    navigate({ to: "/collaborateurs" });
  }

  function recommencer() {
    setResultat(null);
    setNomFichier(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Données"
        title="Import CSV"
        description="Choisissez votre fichier : chaque ligne est vérifiée avant l'import, rien n'est enregistré tant que vous n'avez pas confirmé."
        actions={
          <Button asChild variant="outline">
            <a href="/exemple-collaborateurs.csv" download>
              <Download /> Fichier d'exemple
            </a>
          </Button>
        }
      />

      <Etapes active={resultat ? 2 : 1} />

      {!resultat && (
        <div className="grid gap-6 lg:grid-cols-5">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setSurvol(true);
            }}
            onDragLeave={() => setSurvol(false)}
            onDrop={(e) => {
              e.preventDefault();
              setSurvol(false);
              void traiterFichier(e.dataTransfer.files[0]);
            }}
            className={cn(
              "flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors lg:col-span-3",
              survol ? "border-primary bg-primary/5" : "border-input bg-card hover:border-primary/60",
            )}
          >
            <div className="flex size-16 items-center justify-center rounded-full bg-secondary">
              <Upload className="size-7 text-primary" />
            </div>
            <p className="mt-5 font-display text-2xl">Déposez votre fichier ici</p>
            <p className="mt-1 text-muted-foreground">ou cliquez pour le choisir sur votre ordinateur</p>
            <p className="mt-4 text-xs text-muted-foreground">
              Format .csv · séparateur « ; » ou « , » · export Excel accepté
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              aria-label="Choisir un fichier CSV"
              onChange={(e) => void traiterFichier(e.target.files?.[0])}
            />
          </label>

          <div className="surface p-6 lg:col-span-2">
            <h2 className="font-display text-xl">Colonnes attendues</h2>
            <p className="mt-1 text-sm text-muted-foreground">La première ligne du fichier doit contenir ces 16 noms.</p>
            <ul className="mt-4 space-y-2 text-sm">
              {COLONNES_CSV.map((c) => (
                <li key={c} className="flex flex-col">
                  <code className="font-mono text-xs font-semibold text-primary">{c}</code>
                  <span className="text-xs text-muted-foreground">{AIDE_COLONNES[c]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {resultat && <Verification resultat={resultat} nomFichier={nomFichier} />}

      {resultat && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-lift">
          <p className="text-sm">
            {resultat.collaborateurs.length > 0 ? (
              <>
                <span className="font-semibold">{resultat.collaborateurs.length} collaborateurs</span> prêts à être
                importés
                {collaborateurs.length > 0 && (
                  <span className="text-muted-foreground"> · remplaceront les {collaborateurs.length} actuels</span>
                )}
              </>
            ) : (
              <span className="text-destructive">Aucune ligne valide à importer.</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={recommencer}>
              Choisir un autre fichier
            </Button>
            <Button onClick={confirmerImport} disabled={resultat.collaborateurs.length === 0}>
              <CheckCircle2 /> Importer
            </Button>
          </div>
        </div>
      )}

      {!resultat && collaborateurs.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 text-sm">
          <p className="text-muted-foreground">
            {collaborateurs.length} collaborateurs sont actuellement enregistrés dans ce navigateur.
          </p>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (window.confirm("Supprimer tous les collaborateurs importés ?")) {
                vider();
                toast("Données supprimées");
              }
            }}
          >
            <Trash2 /> Tout supprimer
          </Button>
        </div>
      )}
    </div>
  );
}

function Etapes({ active }: { active: 1 | 2 }) {
  const etapes = ["Choisir le fichier", "Vérifier", "Importer"];
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {etapes.map((e, i) => {
        const n = i + 1;
        return (
          <li key={e} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                n <= active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              {n}
            </span>
            <span className={n <= active ? "font-medium" : "text-muted-foreground"}>{e}</span>
            {n < etapes.length && <span className="mx-2 h-px w-8 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

function Verification({ resultat, nomFichier }: { resultat: ResultatImport; nomFichier: string | null }) {
  if (resultat.colonnesManquantes.length > 0) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <h2 className="font-display text-xl">Le fichier ne contient pas toutes les colonnes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Colonnes manquantes dans « {nomFichier} » (vérifiez l'orthographe de la première ligne) :
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {resultat.colonnesManquantes.map((c) => (
                <code key={c} className="rounded-md bg-card px-2 py-1 font-mono text-xs text-destructive">
                  {c}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const lignesEnErreur = new Set(resultat.erreurs.map((e) => e.ligne)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileSpreadsheet className="size-4" /> {nomFichier}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Compteur label="Lignes lues" valeur={resultat.totalLignes} />
        <Compteur label="Lignes valides" valeur={resultat.collaborateurs.length} ton="succes" />
        <Compteur label="Lignes écartées" valeur={lignesEnErreur} ton={lignesEnErreur ? "erreur" : undefined} />
        <Compteur
          label="Avertissements"
          valeur={resultat.avertissements.length}
          ton={resultat.avertissements.length ? "alerte" : undefined}
        />
      </div>

      {resultat.erreurs.length > 0 && (
        <ListeProblemes
          titre="Erreurs — ces lignes ne seront pas importées"
          problemes={resultat.erreurs}
          icone={<XCircle className="size-5 text-destructive" />}
        />
      )}
      {resultat.avertissements.length > 0 && (
        <ListeProblemes
          titre="Avertissements — ces lignes seront importées, à vérifier"
          problemes={resultat.avertissements}
          icone={<AlertTriangle className="size-5 text-warning" />}
        />
      )}

      {resultat.collaborateurs.length > 0 && (
        <div className="surface overflow-hidden">
          <div className="border-b border-border p-5">
            <h2 className="font-display text-xl">Aperçu</h2>
            <p className="text-sm text-muted-foreground">
              Les {Math.min(8, resultat.collaborateurs.length)} premières lignes valides
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 text-left">
                  <th className="eyebrow px-5 py-2.5 font-semibold">ID</th>
                  <th className="eyebrow px-5 py-2.5 font-semibold">Nom</th>
                  <th className="eyebrow px-5 py-2.5 font-semibold">Poste</th>
                  <th className="eyebrow px-5 py-2.5 font-semibold">Service</th>
                  <th className="eyebrow px-5 py-2.5 font-semibold">Contrat</th>
                  <th className="eyebrow px-5 py-2.5 font-semibold">Profil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resultat.collaborateurs.slice(0, 8).map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-2.5 text-muted-foreground">{c.id}</td>
                    <td className="px-5 py-2.5 font-medium">
                      {c.prenom} {c.nom}
                    </td>
                    <td className="px-5 py-2.5">{c.intitulePoste}</td>
                    <td className="px-5 py-2.5">{libelleService(c.codeService)}</td>
                    <td className="px-5 py-2.5">
                      <ContratPill type={c.typeContrat} />
                    </td>
                    <td className="px-5 py-2.5 text-xs text-muted-foreground">{c.profilAcces}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Compteur({ label, valeur, ton }: { label: string; valeur: number; ton?: "succes" | "erreur" | "alerte" | undefined }) {
  return (
    <div className="surface p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-4xl font-medium",
          ton === "succes" && "text-success",
          ton === "erreur" && "text-destructive",
          ton === "alerte" && "text-warning",
        )}
      >
        {valeur}
      </p>
    </div>
  );
}

function ListeProblemes({ titre, problemes, icone }: { titre: string; problemes: Probleme[]; icone: React.ReactNode }) {
  const MAX = 50;
  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border p-5">
        {icone}
        <h2 className="font-display text-xl">{titre}</h2>
      </div>
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted">
            <tr className="text-left">
              <th className="eyebrow w-20 px-5 py-2.5 font-semibold">Ligne</th>
              <th className="eyebrow w-48 px-5 py-2.5 font-semibold">Colonne</th>
              <th className="eyebrow px-5 py-2.5 font-semibold">Problème</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {problemes.slice(0, MAX).map((p, i) => (
              <tr key={i}>
                <td className="px-5 py-2.5 tabular-nums">{p.ligne}</td>
                <td className="px-5 py-2.5">
                  <code className="font-mono text-xs">{p.colonne}</code>
                </td>
                <td className="px-5 py-2.5">{p.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {problemes.length > MAX && (
          <p className="p-4 text-center text-sm text-muted-foreground">… et {problemes.length - MAX} autres</p>
        )}
      </div>
    </div>
  );
}
