import type { Tier } from "@/types";

/**
 * Opportunity tiering thresholds (Module 09 — Opportunity Pulse).
 *   Hot   : 75–100  — pursue now
 *   Warm  : 50–74   — nurture
 *   Watch : 0–49    — monitor
 */
export const TIER_THRESHOLDS = { hot: 75, warm: 50 } as const;

export function tierFor(score: number): Tier {
  if (score >= TIER_THRESHOLDS.hot) return "hot";
  if (score >= TIER_THRESHOLDS.warm) return "warm";
  return "watch";
}

export const TIER_LABEL: Record<Tier, string> = {
  hot: "Hot",
  warm: "Warm",
  watch: "Watch",
};

export const TIER_COLOR: Record<Tier, string> = {
  hot: "#ff4d5e",
  warm: "#ffb020",
  watch: "#38bdf8",
};

/**
 * Map enrollment to a bubble radius (pixels) on a gentle sqrt scale so the
 * area — not the radius — reads proportionally to enrollment.
 */
export function bubbleRadius(enrollment: number): number {
  const MIN_PX = 8;
  const MAX_PX = 34;
  const MIN_E = 200;
  const MAX_E = 3000;
  const clamped = Math.max(MIN_E, Math.min(MAX_E, enrollment));
  const t = (Math.sqrt(clamped) - Math.sqrt(MIN_E)) / (Math.sqrt(MAX_E) - Math.sqrt(MIN_E));
  return Math.round(MIN_PX + t * (MAX_PX - MIN_PX));
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatUSD(n: number): string {
  return usd.format(n);
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
