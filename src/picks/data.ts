import type { Pick, Plan, RecordEntry } from "./types";

/**
 * Seed board + record. In production these come from the capper dashboard /
 * database; the shapes are final, only the transport changes.
 */

/** Last night's cash total shown in the receipts strip (11 winning payouts). */
export const LAST_NIGHT = {
  cashes: 11,
  totalUSD: 666.3,
  biggestUSD: 430.0,
  date: "Jul 4",
};

export const TODAY_PICKS: Pick[] = [
  /* ---- free picks: the hook ---- */
  {
    id: "p-001",
    sport: "MLB",
    league: "MLB",
    event: "Orioles @ Yankees",
    market: "Moneyline",
    selection: "Yankees ML",
    odds: -145,
    units: 1,
    confidence: 3,
    tier: "free",
    analysis:
      "Lefty on the mound for Baltimore and the Yankees have hit lefties at a .285 clip over the last 30 days. Home number is short for a reason — take it early before it moves.",
    startTime: "2026-07-04T23:05:00Z",
    status: "won",
    resultUnits: 0.69,
  },
  {
    id: "p-002",
    sport: "WNBA",
    league: "WNBA",
    event: "Sky @ Fever",
    market: "Total",
    selection: "Over 162.5",
    odds: -110,
    units: 1,
    confidence: 3,
    tier: "free",
    analysis:
      "Both teams top-4 in pace over the last two weeks and this number opened three points lower — the market is chasing it for a reason. Ride the steam.",
    startTime: "2026-07-05T00:00:00Z",
    status: "pending",
  },
  /* ---- premium picks: the product ---- */
  {
    id: "p-101",
    sport: "MLB",
    league: "MLB",
    event: "Nationals @ Mets",
    market: "First 5 innings",
    selection: "Mets -0.5 (F5)",
    odds: -120,
    units: 2,
    confidence: 4,
    tier: "premium",
    analysis:
      "Starter mismatch is the whole card here: Mets ace vs. a spot starter with a 6.1 xFIP. F5 dodges both bullpens, and the Mets' first-time-through-order wOBA differential is the largest on the slate.",
    startTime: "2026-07-04T23:10:00Z",
    status: "won",
    resultUnits: 1.67,
  },
  {
    id: "p-102",
    sport: "MLB",
    league: "MLB",
    event: "Dodgers @ Padres",
    market: "Player prop",
    selection: "Under — starter strikeouts 6.5",
    odds: +105,
    units: 1.5,
    confidence: 4,
    tier: "premium",
    analysis:
      "Padres own the second-lowest K% vs RHP since June 1 and the ump behind the plate has a bottom-decile called-strike rate this season. Plus money on a number that should be -115 the other way.",
    startTime: "2026-07-05T02:10:00Z",
    status: "pending",
  },
  {
    id: "p-103",
    sport: "UFC",
    league: "UFC Fight Night",
    event: "Main card — co-main",
    market: "Method of victory",
    selection: "Fight doesn't go the distance",
    odds: -130,
    units: 1,
    confidence: 3,
    tier: "premium",
    analysis:
      "Both fighters have a combined 84% finish rate and neither has ever won a decision as a favorite. Southpaw counter-striker vs. a chin that's been cracked in two straight.",
    startTime: "2026-07-05T03:00:00Z",
    status: "pending",
  },
  {
    id: "p-104",
    sport: "Tennis",
    league: "Wimbledon",
    event: "Round of 16",
    market: "Match handicap",
    selection: "Favorite -1.5 sets",
    odds: +140,
    units: 1,
    confidence: 3,
    tier: "premium",
    analysis:
      "Opponent has played eleven sets over the last four days including a five-setter; our side has dropped serve four times the entire tournament. Straight sets is live at a plus number.",
    startTime: "2026-07-05T12:30:00Z",
    status: "pending",
  },
  {
    id: "p-105",
    sport: "MLB",
    league: "MLB",
    event: "10-leg ladder — late slate",
    market: "Parlay",
    selection: "Premium ladder (10 legs)",
    odds: +1450,
    units: 0.5,
    confidence: 2,
    tier: "premium",
    analysis:
      "The lottery-ticket build that hit +$430 last night, re-rolled for the late slate: correlated F5 moneylines stacked with two team totals. Strictly a half-unit play — this is the fun money, not the mortgage money.",
    startTime: "2026-07-05T02:00:00Z",
    status: "pending",
  },
];

/**
 * Settled history, oldest → newest (drives the cumulative-units chart).
 * 30 graded plays: 20–10, +15.8u on ~34.5u risked (+46% ROI-per-unit month).
 */
export const RECORD: RecordEntry[] = [
  { date: "2026-06-05", label: "MLB · Braves F5 -0.5", odds: -115, units: 1.5, status: "won", resultUnits: 1.3 },
  { date: "2026-06-06", label: "MLB · Cubs ML", odds: +120, units: 1, status: "lost", resultUnits: -1 },
  { date: "2026-06-07", label: "WNBA · Aces -4.5", odds: -110, units: 1, status: "won", resultUnits: 0.91 },
  { date: "2026-06-08", label: "MLB · Over 9 (COL)", odds: -105, units: 1, status: "won", resultUnits: 0.95 },
  { date: "2026-06-09", label: "Tennis · ML dog", odds: +160, units: 0.5, status: "lost", resultUnits: -0.5 },
  { date: "2026-06-10", label: "MLB · K prop under", odds: -120, units: 1.5, status: "won", resultUnits: 1.25 },
  { date: "2026-06-11", label: "MLB · Phillies ML", odds: -140, units: 2, status: "won", resultUnits: 1.43 },
  { date: "2026-06-12", label: "UFC · Fight u2.5", odds: -125, units: 1, status: "lost", resultUnits: -1 },
  { date: "2026-06-13", label: "WNBA · Over 158.5", odds: -110, units: 1, status: "won", resultUnits: 0.91 },
  { date: "2026-06-14", label: "MLB · Yanks RL -1.5", odds: +150, units: 1, status: "won", resultUnits: 1.5 },
  { date: "2026-06-15", label: "MLB · Sox team total u", odds: -115, units: 1, status: "lost", resultUnits: -1 },
  { date: "2026-06-16", label: "Soccer · BTTS", odds: -105, units: 1, status: "won", resultUnits: 0.95 },
  { date: "2026-06-17", label: "MLB · F5 over 4.5", odds: -110, units: 1.5, status: "won", resultUnits: 1.36 },
  { date: "2026-06-18", label: "WNBA · Liberty -7", odds: -110, units: 1, status: "lost", resultUnits: -1 },
  { date: "2026-06-19", label: "MLB · Guardians ML", odds: +105, units: 1, status: "won", resultUnits: 1.05 },
  { date: "2026-06-20", label: "Tennis · Over 22.5 games", odds: -115, units: 1, status: "won", resultUnits: 0.87 },
  { date: "2026-06-21", label: "MLB · Astros F5 ML", odds: -130, units: 1.5, status: "lost", resultUnits: -1.5 },
  { date: "2026-06-22", label: "UFC · Dog ML", odds: +185, units: 0.5, status: "won", resultUnits: 0.93 },
  { date: "2026-06-23", label: "MLB · Over 8.5 (SEA)", odds: -110, units: 1, status: "won", resultUnits: 0.91 },
  { date: "2026-06-24", label: "WNBA · Mystics +9.5", odds: -110, units: 1, status: "won", resultUnits: 0.91 },
  { date: "2026-06-25", label: "MLB · HR prop", odds: +230, units: 0.5, status: "lost", resultUnits: -0.5 },
  { date: "2026-06-26", label: "MLB · Rays ML", odds: -105, units: 1, status: "won", resultUnits: 0.95 },
  { date: "2026-06-27", label: "Soccer · Draw no bet", odds: -120, units: 1, status: "lost", resultUnits: -1 },
  { date: "2026-06-28", label: "MLB · F5 under 5", odds: -115, units: 1.5, status: "won", resultUnits: 1.3 },
  { date: "2026-06-29", label: "WNBA · Fever ML", odds: +115, units: 1, status: "won", resultUnits: 1.15 },
  { date: "2026-06-30", label: "MLB · Team total o4.5", odds: -125, units: 1, status: "lost", resultUnits: -1 },
  { date: "2026-07-01", label: "Tennis · Fav -1.5 sets", odds: +130, units: 1, status: "won", resultUnits: 1.3 },
  { date: "2026-07-02", label: "MLB · Twins RL +1.5", odds: -150, units: 1.5, status: "won", resultUnits: 1 },
  { date: "2026-07-03", label: "MLB · K prop over", odds: -110, units: 1, status: "lost", resultUnits: -1 },
  { date: "2026-07-04", label: "MLB · late-slate card (11 cashes)", odds: +145, units: 3, status: "won", resultUnits: 4.35 },
];

export const PLANS: Plan[] = [
  {
    id: "day",
    name: "Day Pass",
    priceUSD: 9.99,
    period: "24 hours",
    blurb: "Tonight's full premium board. One night, every play.",
    durationDays: 1,
  },
  {
    id: "month",
    name: "Monthly",
    priceUSD: 49,
    period: "per month",
    blurb: "Every premium pick, every writeup, the full record. Cancel anytime.",
    durationDays: 30,
    featured: true,
  },
  {
    id: "season",
    name: "Full Season",
    priceUSD: 299,
    period: "6 months",
    blurb: "Locked-in rate for the whole season. Two months free vs monthly.",
    durationDays: 183,
  },
];
