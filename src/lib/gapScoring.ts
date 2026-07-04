import type { CompetitionLevel, GapMarket } from "@/types";

/**
 * Gap Score — how attractive a lagging market is to an AI builder, 0–100.
 *
 * Blend of four signals:
 *   gap        (35%) — how far behind the market is (100 − adoption %)
 *   size       (25%) — log-scaled US market revenue
 *   readiness  (25%) — buyers digitized enough to actually purchase
 *   openness   (15%) — inverse of vendor competition
 *
 * A huge market nobody has touched but that can't buy software scores
 * lower than a mid-size market that's reachable today — reachability is
 * the whole game for a small team.
 */
const WEIGHTS = { gap: 0.35, size: 0.25, readiness: 0.25, openness: 0.15 } as const;

/** Log-normalize market size between $10B and $500B. */
function sizeScore(marketSizeUSD: number): number {
  const MIN = Math.log10(10_000_000_000);
  const MAX = Math.log10(500_000_000_000);
  const v = Math.log10(Math.max(1, marketSizeUSD));
  return Math.max(0, Math.min(1, (v - MIN) / (MAX - MIN))) * 100;
}

const OPENNESS: Record<CompetitionLevel, number> = { low: 100, medium: 55, high: 20 };

export function gapScore(m: GapMarket): number {
  const gap = 100 - m.aiAdoptionPct;
  const score =
    gap * WEIGHTS.gap +
    sizeScore(m.marketSizeUSD) * WEIGHTS.size +
    m.digitalReadiness * WEIGHTS.readiness +
    OPENNESS[m.competition] * WEIGHTS.openness;
  return Math.round(score);
}

export const COMPETITION_LABEL: Record<CompetitionLevel, string> = {
  low: "Wide open",
  medium: "Some vendors",
  high: "Crowded",
};

export const EFFORT_LABEL: Record<string, string> = {
  "weekend-mvp": "Weekend MVP",
  "1-3 months": "1–3 months",
  "serious build": "Serious build",
};
