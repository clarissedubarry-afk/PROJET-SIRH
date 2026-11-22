import { describe, expect, it } from "vitest";
import { countWorkingDays } from "./leave";

describe("countWorkingDays", () => {
  it("compte une semaine complète du lundi au vendredi comme 5 jours", () => {
    expect(countWorkingDays("2026-11-23", "2026-11-27")).toBe(5);
  });

  it("exclut le week-end", () => {
    expect(countWorkingDays("2026-11-20", "2026-11-23")).toBe(2);
  });

  it("exclut les jours fériés (11 novembre)", () => {
    expect(countWorkingDays("2026-11-09", "2026-11-13")).toBe(4);
  });

  it("renvoie 0 si la date de fin précède la date de début", () => {
    expect(countWorkingDays("2026-11-27", "2026-11-23")).toBe(0);
  });
});
