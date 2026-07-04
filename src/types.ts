/* ============================================================
   Core domain types for Lentix Opportunity Intelligence
   ============================================================ */

export type Tier = "hot" | "warm" | "watch";

/** A county / territory zone in the DMV service area. */
export type Zone =
  | "Prince George's"
  | "Fairfax"
  | "Arlington"
  | "Loudoun"
  | "Prince William"
  | "Montgomery"
  | "DC";

/** A school plotted on the Opportunity Map. */
export interface School {
  id: string;
  name: string;
  district: string;
  zone: Zone;
  lat: number;
  lng: number;
  /** Total student enrollment — drives bubble size. */
  enrollment: number;
  /** 0–100 composite opportunity score — drives Hot/Warm/Watch color. */
  opportunityScore: number;
  /** Number of fleet vehicles (buses/service) — a fleet-wash signal. */
  fleetVehicles: number;
  /** Estimated annual contract value in USD. */
  estAnnualValue: number;
  /** Has an active or recently expired services contract up for renewal. */
  contractStatus: "open-rfp" | "renewal-soon" | "incumbent-locked" | "no-contract";
  lastSignal: string; // human-readable recency note
}

/** A commercial pipeline lead (the deal data shown on a lead card). */
export interface Lead {
  id: string;
  company: string;
  contact: string;
  title: string;
  zone: Zone;
  stage: "prospect" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  leadScore: number; // 0-100
  opportunityScore: number; // 0-100
  dealValue: number; // USD
  service: ("fleet-wash" | "drone-recon" | "social-content")[];
  tags: string[];
  website?: string;
  source: string;
  sourceUrl: string;
  verifiedAt: string; // ISO date
  notes: string;
}

/** A single verifiable source receipt attached to a researched fact. */
export interface SourceReceipt {
  label: string;
  url: string;
  verifiedAt: string; // ISO
}

/** One field in the 20-field structured Deep-Dive profile. */
export interface DeepDiveField {
  key: string;
  label: string;
  value: string;
  receipt?: SourceReceipt;
  confidence: "high" | "medium" | "low";
}

/** AI sales briefing produced alongside the structured profile. */
export interface SalesBriefing {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  fleetWashAngles: string[];
  droneAngles: string[];
  openingLines: string[];
}

/** How a Deep-Dive result was produced. */
export type DeepDiveEngine = "firecrawl+ai" | "simulated";

/** Full result returned by the Lead Deep-Dive research agent. */
export interface DeepDiveResult {
  leadId: string;
  company: string;
  generatedAt: string; // ISO
  engine: DeepDiveEngine;
  fields: DeepDiveField[];
  briefing: SalesBriefing;
  sources: SourceReceipt[];
}

/** Progress event emitted while the research agent runs. */
export interface AgentStep {
  label: string;
  status: "pending" | "running" | "done";
}

/* ============================================================
   AI Gap Radar — markets behind in AI adoption
   ============================================================ */

/** Broad sector bucket used by the Gap Radar filter bar. */
export type GapSector =
  | "Trades & Field Services"
  | "Logistics"
  | "Healthcare"
  | "Professional Services"
  | "Hospitality & Consumer"
  | "Industrial";

/** How crowded the AI-vendor landscape already is for this market. */
export type CompetitionLevel = "low" | "medium" | "high";

/** A concrete AI product/service you could sell into a lagging market. */
export interface AiPlay {
  name: string;
  /** What the product does, in one sentence. */
  what: string;
  /** How it makes money (pricing model + realistic price point). */
  monetization: string;
  /** Build difficulty for a small team. */
  effort: "weekend-mvp" | "1-3 months" | "serious build";
}

/** An industry vertical scored for its AI-adoption gap. */
export interface GapMarket {
  id: string;
  name: string;
  sector: GapSector;
  /** Estimated US annual industry revenue, USD. */
  marketSizeUSD: number;
  /** Estimated share of firms actively using AI, percent (0–100). */
  aiAdoptionPct: number;
  /** 0–100: how digitized / reachable the buyers already are. */
  digitalReadiness: number;
  /** Typical annual contract value for a software/AI vendor, USD. */
  avgDealSizeUSD: number;
  competition: CompetitionLevel;
  /** Why this market is stuck (the pain you sell against). */
  painPoints: string[];
  /** Concrete products you could ship into the gap. */
  aiPlays: AiPlay[];
  /** One-line opener for a cold pitch into this market. */
  pitchLine: string;
  /** Where the adoption estimate comes from. */
  sourceNote: string;
}
