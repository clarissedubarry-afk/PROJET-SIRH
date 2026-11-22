import { Link } from "@tanstack/react-router";
import { Banknote, Briefcase, Clock, FileUp, Users } from "lucide-react";
import type { ReactNode } from "react";
import { APP_NAME, ENTREPRISE } from "@/lib/config";
import { useCollaborateurs } from "@/lib/collaborateurs/store";

const NAV = [
  { to: "/collaborateurs", label: "Collaborateurs", icon: Users },
  { to: "/import", label: "Import CSV", icon: FileUp },
] as const;

// Espaces métier prévus pour les prochaines étapes.
const MODULES_A_VENIR = [
  { label: "GTA — temps & absences", icon: Clock },
  { label: "Paie", icon: Banknote },
  { label: "Recrutement", icon: Briefcase },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { collaborateurs, charge } = useCollaborateurs();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-6 pt-7 pb-8">
          <Link to="/collaborateurs" className="block">
            <span className="font-display text-2xl font-semibold text-sidebar-accent-foreground">
              {APP_NAME}
              <span className="text-sidebar-primary">.</span>
            </span>
            <span className="mt-0.5 block text-xs text-sidebar-foreground/60">{ENTREPRISE}</span>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
            >
              <Icon className="size-4 text-sidebar-foreground/50 group-data-[status=active]:text-sidebar-primary" />
              <span className="flex-1">{label}</span>
              {to === "/collaborateurs" && charge && collaborateurs.length > 0 && (
                <span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-[0.7rem] font-semibold text-sidebar-accent-foreground group-data-[status=active]:bg-sidebar-primary group-data-[status=active]:text-sidebar-primary-foreground">
                  {collaborateurs.length}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-8 px-6">
          <p className="text-[0.68rem] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
            Espaces à venir
          </p>
        </div>
        <ul className="mt-2 flex flex-col gap-1 px-3">
          {MODULES_A_VENIR.map(({ label, icon: Icon }) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/40"
              title="Prévu dans une prochaine étape"
            >
              <Icon className="size-4" />
              <span className="flex-1">{label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto m-3 rounded-xl border border-sidebar-border p-3 text-xs text-sidebar-foreground/60">
          <p className="font-medium text-sidebar-accent-foreground">Étape 1 sur 3</p>
          <p className="mt-0.5">Import et liste. La connexion arrive à l'étape 2.</p>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="sticky top-0 z-20 flex items-center gap-4 overflow-x-auto bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
          <span className="font-display text-lg font-semibold text-sidebar-accent-foreground">
            {APP_NAME}
            <span className="text-sidebar-primary">.</span>
          </span>
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="shrink-0 rounded-md px-2 py-1 text-sm text-sidebar-foreground/70 data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
            >
              {label}
            </Link>
          ))}
        </div>
        <main className="mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">{children}</main>
      </div>
    </div>
  );
}
