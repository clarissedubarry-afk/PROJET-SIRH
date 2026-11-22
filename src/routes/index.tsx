import { createFileRoute, redirect } from "@tanstack/react-router";

// La page d'accueil renvoie vers la liste des collaborateurs.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/collaborateurs" });
  },
});
