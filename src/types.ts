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

/** Full result returned by the Lead Deep-Dive research agent. */
export interface DeepDiveResult {
  leadId: string;
  company: string;
  generatedAt: string; // ISO
  fields: DeepDiveField[];
  briefing: SalesBriefing;
  sources: SourceReceipt[];
}

/** Progress event emitted while the research agent runs. */
export interface AgentStep {
  label: string;
  status: "pending" | "running" | "done";
}
