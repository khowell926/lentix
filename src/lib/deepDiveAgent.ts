import type {
  AgentStep,
  DeepDiveField,
  DeepDiveResult,
  Lead,
  SalesBriefing,
  SourceReceipt,
} from "@/types";
import { readJSON, writeJSON } from "@/lib/storage";

/**
 * Lead Deep-Dive research agent (Module 05).
 *
 * In production this calls the `lead-deep-dive` edge function: Firecrawl (site +
 * web) + state license registries (MD MHIC, VA DPOR, DC DCRA) + corporate
 * registry (MD SDAT, VA SCC, DC CCA) + reviews, synthesized by Gemini 2.5 Flash
 * via the Lovable AI Gateway, with a clickable source receipt + verified
 * timestamp on every fact.
 *
 * This client build ships a deterministic simulation behind the same async
 * contract so the UI is fully exercised without server secrets. Swap
 * `runResearch` for a real `fetch('/functions/lead-deep-dive')` call and the
 * components are unchanged.
 */

const CACHE_PREFIX = "lentix.deepdive.";

const PIPELINE_STEPS = [
  "Resolving legal entity & DBAs",
  "Pulling state license registries",
  "Checking insurance & bonding",
  "Scanning corporate registry (SDAT / SCC / CCA)",
  "Aggregating reviews (Google / Yelp / BBB / Angi)",
  "Synthesizing AI sales briefing",
] as const;

function nowISO(): string {
  return new Date().toISOString();
}

/** Small deterministic hash so simulated facts are stable per company. */
function seed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], s: number): T {
  return arr[s % arr.length];
}

function receipt(label: string, slug: string, source: string): SourceReceipt {
  return {
    label,
    url: `https://lentix.example/receipts/${slug}/${source}`,
    verifiedAt: nowISO(),
  };
}

function buildFields(lead: Lead): DeepDiveField[] {
  const s = seed(lead.company);
  const slug = lead.company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const years = 6 + (s % 22);
  const employees = 12 + (s % 240);
  const ein = `${20 + (s % 79)}-${1000000 + (s % 8999999)}`;

  const mk = (
    key: string,
    label: string,
    value: string,
    src: string,
    confidence: DeepDiveField["confidence"] = "high",
  ): DeepDiveField => ({ key, label, value, confidence, receipt: receipt(label, slug, src) });

  return [
    mk("years", "Years in Business", `${years} years (est. ${2026 - years})`, "sdat"),
    mk("legal", "Legal Name", `${lead.company}, LLC`, "sdat"),
    mk("dba", "DBAs", `${lead.company.split(" ")[0]} Fleet · ${lead.company.split(" ")[0]} Express`, "sdat", "medium"),
    mk("principals", "Owner / Principals", `${lead.contact} (${lead.title})`, "registry"),
    mk("ein", "Entity / EIN", ein, "registry", "medium"),
    mk("employees", "Headcount", `~${employees} employees`, "web", "medium"),
    mk("mhic", "MD MHIC License", `#${100000 + (s % 899999)} — Active`, "mhic"),
    mk("dpor", "VA DPOR License", `#270${100000 + (s % 89999)} — Active`, "dpor"),
    mk("dcra", "DC DCRA License", pick(["BBL Active", "BBL Pending", "Not required"], s), "dcra", "medium"),
    mk("gl", "General Liability", `$${1 + (s % 2)}M / $${2 + (s % 3)}M aggregate`, "insurance"),
    mk("umbrella", "Umbrella Policy", `$${1 + (s % 5)}M`, "insurance", "medium"),
    mk("wc", "Workers' Comp", "Verified — in force", "insurance"),
    mk("area", "Service Area", `${lead.zone} + adjacent DMV counties`, "web"),
    mk("specialties", "Specialties", lead.service.join(", "), "web"),
    mk("certs", "Certifications", pick(["EPA WaterSense", "ISN Member", "OSHA 30", "Green Seal"], s), "web", "medium"),
    mk("awards", "Awards", pick(["Best of NoVA 2025", "Angi Super Service", "—"], s), "web", "low"),
    mk("google", "Google Rating", `${(3.9 + (s % 11) / 10).toFixed(1)}★ (${50 + (s % 400)} reviews)`, "google"),
    mk("yelp", "Yelp Rating", `${(3.7 + (s % 13) / 10).toFixed(1)}★ (${10 + (s % 120)} reviews)`, "yelp", "medium"),
    mk("bbb", "BBB Rating", pick(["A+", "A", "A-", "Not rated"], s), "bbb", "medium"),
    mk("ucc", "UCC Filings", `${s % 4} active lien(s) — ${pick(["equipment financing", "vehicle leases", "none material"], s)}`, "sdat", "medium"),
  ];
}

function buildBriefing(lead: Lead): SalesBriefing {
  const first = lead.company.split(" ")[0];
  const hasWash = lead.service.includes("fleet-wash");
  const hasDrone = lead.service.includes("drone-recon");
  return {
    summary: `${lead.company} is a ${lead.zone}-based operator with a ${lead.opportunityScore >= 75 ? "high" : lead.opportunityScore >= 50 ? "moderate" : "developing"}-fit profile (opportunity ${lead.opportunityScore}/100). Deal sized at $${lead.dealValue.toLocaleString()} across ${lead.service.length} service line(s).`,
    strengths: [
      "Active, verifiable licensing and insurance — low onboarding friction.",
      `Established footprint in ${lead.zone} aligns with current route density.`,
      lead.tags.includes("renewal-soon")
        ? "Incumbent contract nearing renewal — timing window is open."
        : "Strong public review profile supports a quality-led pitch.",
    ],
    weaknesses: [
      lead.tags.includes("gatekeeper")
        ? "Decision gated by a board/committee — multi-stakeholder cycle."
        : "Procurement cadence not yet confirmed — qualify the timeline.",
      "Price sensitivity likely; lead with TCO and downtime savings, not rate.",
    ],
    fleetWashAngles: hasWash
      ? [
          `Pitch fixed-route mobile wash to cut ${first}'s vehicle downtime vs. drive-to-bay.`,
          "Bundle compliance reporting (water reclamation receipts) for ESG/board optics.",
          "Offer a 30-day pilot on one depot to de-risk the switch.",
        ]
      : ["Fleet-wash not a current line — position as a future cross-sell once trust is built."],
    droneAngles: hasDrone
      ? [
          "Drone-recon for facility/roof/grounds inspection ahead of seasonal work.",
          "Before/after aerial footage doubles as marketing content for their brand.",
        ]
      : ["Introduce drone-recon as a differentiated add-on after the core deal lands."],
    openingLines: [
      `"${lead.contact}, I pulled your ${lead.zone} fleet profile — saw the ${lead.tags[0]} signal and have a 2-minute idea."`,
      `"We help DMV ${first}-type operators cut wash downtime ~30%. Worth a quick look at your numbers?"`,
    ],
  };
}

function buildSources(lead: Lead): SourceReceipt[] {
  const slug = lead.company.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return [
    receipt("Company website (Firecrawl)", slug, "site"),
    receipt("MD SDAT corporate registry", slug, "sdat"),
    receipt("VA SCC business entity", slug, "scc"),
    receipt("State license lookup", slug, "license"),
    receipt("Review aggregation", slug, "reviews"),
  ];
}

export interface RunOptions {
  /** Force a fresh run, ignoring cache. */
  refresh?: boolean;
  /** Called as each pipeline step transitions. */
  onProgress?: (steps: AgentStep[]) => void;
  /** Per-step delay (ms) for the simulated pipeline. */
  stepDelayMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function cachedResult(leadId: string): DeepDiveResult | null {
  return readJSON<DeepDiveResult | null>(CACHE_PREFIX + leadId, null);
}

/**
 * Runs the research agent for a lead, emitting progress, and resolving with the
 * structured Deep-Dive result. Results are cached per-company in localStorage.
 */
export async function runDeepDive(lead: Lead, opts: RunOptions = {}): Promise<DeepDiveResult> {
  const { refresh = false, onProgress, stepDelayMs = 520 } = opts;

  if (!refresh) {
    const cached = cachedResult(lead.id);
    if (cached) {
      onProgress?.(PIPELINE_STEPS.map((label) => ({ label, status: "done" as const })));
      return cached;
    }
  }

  const steps: AgentStep[] = PIPELINE_STEPS.map((label) => ({ label, status: "pending" as const }));
  for (let i = 0; i < steps.length; i++) {
    steps[i] = { ...steps[i], status: "running" };
    onProgress?.(steps.map((s) => ({ ...s })));
    await sleep(stepDelayMs);
    steps[i] = { ...steps[i], status: "done" };
    onProgress?.(steps.map((s) => ({ ...s })));
  }

  const result: DeepDiveResult = {
    leadId: lead.id,
    company: lead.company,
    generatedAt: nowISO(),
    fields: buildFields(lead),
    briefing: buildBriefing(lead),
    sources: buildSources(lead),
  };

  writeJSON(CACHE_PREFIX + lead.id, result);
  return result;
}

export { PIPELINE_STEPS };
