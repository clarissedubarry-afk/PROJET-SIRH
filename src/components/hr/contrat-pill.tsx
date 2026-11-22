import { StatusPill, type PillTone } from "./status-pill";
import type { TypeContrat } from "@/lib/collaborateurs/types";

const TON: Record<TypeContrat, PillTone> = {
  CDI: "success",
  CDD: "warning",
  Alternance: "info",
  Stage: "accent",
  Freelance: "neutral",
};

export function ContratPill({ type }: { type: TypeContrat }) {
  return <StatusPill tone={TON[type]}>{type}</StatusPill>;
}
