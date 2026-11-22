import { createFileRoute, Link } from "@tanstack/react-router";
import { FileUp, Mail, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ContratPill } from "@/components/hr/contrat-pill";
import { PageHeader } from "@/components/hr/page-header";
import { PersonAvatar } from "@/components/hr/person-avatar";
import { useCollaborateurs } from "@/lib/collaborateurs/store";
import { TYPES_CONTRAT, type Collaborateur } from "@/lib/collaborateurs/types";
import { libelleService } from "@/lib/config";
import { anciennete, anneesEntre, fmtEuros, fmtLongDate, fmtNombre } from "@/lib/format";

export const Route = createFileRoute("/collaborateurs")({
  head: () => ({
    meta: [
      { title: "Collaborateurs — Équipage SIRH" },
      { name: "description", content: "Liste des collaborateurs importés, filtrable par service et par type de contrat." },
      { property: "og:title", content: "Collaborateurs — Équipage SIRH" },
      { property: "og:description", content: "Annuaire des collaborateurs avec filtres par service et type de contrat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PageCollaborateurs,
});

const TOUS = "tous";

function PageCollaborateurs() {
  const { collaborateurs, charge, dateImport, parId } = useCollaborateurs();
  const [recherche, setRecherche] = useState("");
  const [service, setService] = useState(TOUS);
  const [contrat, setContrat] = useState(TOUS);
  const [selection, setSelection] = useState<Collaborateur | null>(null);

  // Liste des services présents dans le fichier, avec le nombre de personnes.
  const services = useMemo(() => {
    const compte = new Map<string, number>();
    collaborateurs.forEach((c) => compte.set(c.codeService, (compte.get(c.codeService) ?? 0) + 1));
    return [...compte.entries()].sort((a, b) => libelleService(a[0]).localeCompare(libelleService(b[0])));
  }, [collaborateurs]);

  const filtres = useMemo(() => {
    const texte = recherche.trim().toLowerCase();
    return collaborateurs.filter((c) => {
      if (service !== TOUS && c.codeService !== service) return false;
      if (contrat !== TOUS && c.typeContrat !== contrat) return false;
      if (!texte) return true;
      return `${c.prenom} ${c.nom} ${c.intitulePoste} ${c.id}`.toLowerCase().includes(texte);
    });
  }, [collaborateurs, recherche, service, contrat]);

  const filtreActif = recherche !== "" || service !== TOUS || contrat !== TOUS;

  if (!charge) {
    return <p className="py-20 text-center text-muted-foreground">Chargement…</p>;
  }

  if (collaborateurs.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Annuaire" title="Collaborateurs" />
        <div className="surface mx-auto max-w-xl p-10 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary">
            <FileUp className="size-6 text-primary" />
          </div>
          <h2 className="mt-5 font-display text-2xl">Aucun collaborateur pour l'instant</h2>
          <p className="mt-2 text-muted-foreground">
            Commencez par importer votre fichier CSV. La liste apparaîtra ici.
          </p>
          <Button asChild className="mt-6">
            <Link to="/import">
              <FileUp /> Importer un fichier
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const aujourdhui = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Annuaire"
        title="Collaborateurs"
        description={`${collaborateurs.length} collaborateurs dans ${services.length} services${
          dateImport ? ` · importés le ${new Date(dateImport).toLocaleDateString("fr-FR")}` : ""
        }.`}
        actions={
          <Button asChild variant="outline">
            <Link to="/import">
              <FileUp /> Nouvel import
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un nom, un poste ou un identifiant…"
            className="h-10 bg-card pl-9"
            aria-label="Rechercher un collaborateur"
          />
        </div>
        <Select value={service} onValueChange={setService}>
          <SelectTrigger className="h-10 bg-card lg:w-64" aria-label="Filtrer par service">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TOUS}>Tous les services</SelectItem>
            {services.map(([code, n]) => (
              <SelectItem key={code} value={code}>
                {libelleService(code)} ({n})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={contrat} onValueChange={setContrat}>
          <SelectTrigger className="h-10 bg-card lg:w-52" aria-label="Filtrer par type de contrat">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TOUS}>Tous les contrats</SelectItem>
            {TYPES_CONTRAT.map((t) => (
              <SelectItem key={t} value={t}>
                {t} ({collaborateurs.filter((c) => c.typeContrat === t).length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtreActif && (
          <Button
            variant="ghost"
            className="h-10"
            onClick={() => {
              setRecherche("");
              setService(TOUS);
              setContrat(TOUS);
            }}
          >
            <X /> Effacer
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {filtres.length} résultat{filtres.length > 1 ? "s" : ""}
        {filtreActif ? ` sur ${collaborateurs.length}` : ""}
      </p>

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left">
                <th className="eyebrow px-5 py-3 font-semibold">Collaborateur</th>
                <th className="eyebrow px-5 py-3 font-semibold">Poste</th>
                <th className="eyebrow px-5 py-3 font-semibold">Service</th>
                <th className="eyebrow px-5 py-3 font-semibold">Contrat</th>
                <th className="eyebrow hidden px-5 py-3 text-right font-semibold md:table-cell">Temps</th>
                <th className="eyebrow hidden px-5 py-3 text-right font-semibold whitespace-nowrap lg:table-cell">CP / RTT</th>
                <th className="eyebrow hidden px-5 py-3 font-semibold xl:table-cell">Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtres.map((c) => {
                const manager = parId(c.idManager);
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelection(c)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <PersonAvatar name={`${c.prenom} ${c.nom}`} />
                        <div className="min-w-0">
                          <p className="font-medium">
                            {c.prenom} {c.nom}
                          </p>
                          <p className="text-xs text-muted-foreground">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p>{c.intitulePoste}</p>
                      {c.niveauClassification && (
                        <p className="text-xs text-muted-foreground">{c.niveauClassification}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">{libelleService(c.codeService)}</td>
                    <td className="px-5 py-3">
                      <ContratPill type={c.typeContrat} />
                    </td>
                    <td className="hidden px-5 py-3 text-right tabular-nums md:table-cell">
                      {fmtNombre(c.tauxTempsTravail)} %
                    </td>
                    <td className="hidden px-5 py-3 text-right whitespace-nowrap tabular-nums lg:table-cell">
                      {fmtNombre(c.soldeCp)} j / {fmtNombre(c.soldeRtt)} j
                    </td>
                    <td className="hidden px-5 py-3 text-muted-foreground xl:table-cell">
                      {manager ? `${manager.prenom} ${manager.nom}` : "—"}
                    </td>
                  </tr>
                );
              })}
              {filtres.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    Aucun collaborateur ne correspond à ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!selection} onOpenChange={(o) => !o && setSelection(null)}>
        <SheetContent className="w-full overflow-y-auto bg-background sm:max-w-md">
          {selection && (
            <FicheCollaborateur
              c={selection}
              manager={parId(selection.idManager)}
              equipe={collaborateurs.filter((x) => x.idManager === selection.id).length}
              aujourdhui={aujourdhui}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const LIBELLE_PROFIL = {
  RH_ADMIN: "Administrateur RH",
  MANAGER: "Manager",
  COLLABORATEUR: "Collaborateur",
} as const;

function FicheCollaborateur({
  c,
  manager,
  equipe,
  aujourdhui,
}: {
  c: Collaborateur;
  manager: Collaborateur | undefined;
  equipe: number;
  aujourdhui: string;
}) {
  return (
    <>
      <SheetHeader className="items-start text-left">
        <PersonAvatar name={`${c.prenom} ${c.nom}`} className="size-16 text-xl" />
        <SheetTitle className="mt-3 font-display text-3xl font-medium">
          {c.prenom} {c.nom}
        </SheetTitle>
        <p className="text-muted-foreground">
          {c.intitulePoste} · {libelleService(c.codeService)}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          <ContratPill type={c.typeContrat} />
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
            {LIBELLE_PROFIL[c.profilAcces]}
          </span>
        </div>
      </SheetHeader>

      <div className="mt-6 space-y-5 px-4 pb-6">
        <p className="flex items-center gap-2 text-sm">
          <Mail className="size-4 text-muted-foreground" /> {c.email}
        </p>

        <Bloc titre="Contrat">
          <Champ label="Identifiant" valeur={c.id} />
          <Champ label="Classification" valeur={c.niveauClassification || "—"} />
          <Champ label="Embauche" valeur={fmtLongDate(c.dateEmbauche)} />
          <Champ label="Ancienneté" valeur={anciennete(c.dateEmbauche, aujourdhui)} />
          <Champ label="Temps de travail" valeur={`${fmtNombre(c.tauxTempsTravail)} %`} />
          <Champ label="Salaire brut mensuel" valeur={fmtEuros(c.salaireBrutMensuel)} />
        </Bloc>

        <Bloc titre="Soldes de congés">
          <Champ label="Congés payés" valeur={`${fmtNombre(c.soldeCp)} jours`} />
          <Champ label="RTT" valeur={`${fmtNombre(c.soldeRtt)} jours`} />
        </Bloc>

        <Bloc titre="Organisation">
          <Champ label="Manager" valeur={manager ? `${manager.prenom} ${manager.nom}` : "—"} />
          <Champ label="Équipe encadrée" valeur={equipe > 0 ? `${equipe} personne${equipe > 1 ? "s" : ""}` : "—"} />
          <Champ label="Naissance" valeur={fmtLongDate(c.dateNaissance)} />
          <Champ label="Âge" valeur={`${anneesEntre(c.dateNaissance, aujourdhui)} ans`} />
        </Bloc>
      </div>
    </>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <p className="eyebrow">{titre}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">{children}</dl>
    </section>
  );
}

function Champ({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{valeur}</dd>
    </div>
  );
}
