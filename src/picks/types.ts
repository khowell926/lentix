/* ============================================================
   LockRoom — pay-for-picks platform types
   ============================================================ */

export type Sport = "MLB" | "WNBA" | "UFC" | "Tennis" | "Soccer";

export type PickStatus = "pending" | "won" | "lost" | "push";

export type PickTier = "free" | "premium";

/** A single released pick on the board. */
export interface Pick {
  id: string;
  sport: Sport;
  league: string;
  /** e.g. "Orioles @ Yankees" */
  event: string;
  /** e.g. "Moneyline", "Run line -1.5", "Over 8.5" */
  market: string;
  /** The actual play — hidden behind the paywall on premium picks. */
  selection: string;
  /** American odds, e.g. -110, +145 */
  odds: number;
  /** Stake in units (1u = 1% of bankroll). */
  units: number;
  /** 1–5 flame confidence. */
  confidence: 1 | 2 | 3 | 4 | 5;
  tier: PickTier;
  /** The writeup — the product. Hidden on locked premium picks. */
  analysis: string;
  startTime: string; // ISO
  status: PickStatus;
  /** Realized profit in units once settled (negative on a loss). */
  resultUnits?: number;
}

/** One settled pick in the historical record (drives the units chart). */
export interface RecordEntry {
  date: string; // ISO date
  label: string;
  odds: number;
  units: number;
  status: Exclude<PickStatus, "pending">;
  resultUnits: number;
}

export type PlanId = "day" | "month" | "season";

export interface Plan {
  id: PlanId;
  name: string;
  priceUSD: number;
  period: string;
  blurb: string;
  durationDays: number;
  featured?: boolean;
}

/** An active paid pass stored client-side (MVP; server-issued in prod). */
export interface AccessPass {
  plan: PlanId;
  purchasedAt: string; // ISO
  expiresAt: string; // ISO
}
