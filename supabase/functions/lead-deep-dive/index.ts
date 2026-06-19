// Lentix — lead-deep-dive edge function (Supabase / Deno runtime).
//
// Performs a real research pass on a company:
//   1. Firecrawl scrapes the company website (markdown).
//   2. Firecrawl search gathers licensing / insurance / review signals.
//   3. An LLM (Gemini 2.5 Flash via the Lovable AI Gateway, OpenAI-compatible)
//      extracts a 20-field structured profile + a sales briefing as JSON.
//   4. Every fact is returned with a clickable source receipt + timestamp.
//
// Secrets (NEVER in client code) — set via `supabase secrets set` or the
// Lovable Cloud secret manager:
//   FIRECRAWL_API_KEY   required — https://firecrawl.dev
//   AI_API_KEY          required — Lovable AI Gateway / OpenAI-compatible key
//   AI_GATEWAY_URL      optional — default https://ai.gateway.lovable.dev/v1/chat/completions
//   AI_MODEL            optional — default google/gemini-2.5-flash
//
// Deploy:  supabase functions deploy lead-deep-dive --no-verify-jwt
// Serve:   supabase functions serve lead-deep-dive --env-file supabase/functions/.env

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface LeadInput {
  id: string;
  company: string;
  website?: string;
  zone?: string;
  service?: string[];
  dealValue?: number;
  notes?: string;
}

interface FirecrawlSource {
  label: string;
  url: string;
  verifiedAt: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function env(key: string): string | undefined {
  // deno-lint-ignore no-explicit-any
  return (globalThis as any).Deno?.env?.get(key);
}

// ---- Firecrawl ----------------------------------------------------------

async function firecrawlScrape(url: string, apiKey: string): Promise<{ markdown: string; url: string } | null> {
  try {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const markdown: string = data?.data?.markdown ?? "";
    const finalUrl: string = data?.data?.metadata?.sourceURL ?? url;
    return markdown ? { markdown, url: finalUrl } : null;
  } catch {
    return null;
  }
}

interface SearchHit {
  url: string;
  title: string;
  description: string;
}

async function firecrawlSearch(query: string, apiKey: string, limit = 4): Promise<SearchHit[]> {
  try {
    const res = await fetch(`${FIRECRAWL_BASE}/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const hits: SearchHit[] = (data?.data ?? []).map((d: Record<string, string>) => ({
      url: d.url,
      title: d.title ?? "",
      description: d.description ?? d.markdown ?? "",
    }));
    return hits.filter((h) => h.url);
  } catch {
    return [];
  }
}

// ---- LLM synthesis ------------------------------------------------------

const SYSTEM_PROMPT = `You are Lentix's lead research analyst for a DMV-area fleet-wash and drone-services company.
From the supplied scraped web content, extract a structured business profile and a sales briefing.
Return ONLY valid minified JSON. Do not invent facts — if a field is unknown, set value to "Not found" and confidence to "low".
Always cite the most relevant source URL (from the provided sources) in each field's "sourceUrl".

JSON shape:
{
 "fields": [ // EXACTLY 20 items, in this order:
   {"key":"years","label":"Years in Business","value":"","confidence":"high|medium|low","sourceUrl":""},
   {"key":"legal","label":"Legal Name","value":"","confidence":"","sourceUrl":""},
   {"key":"dba","label":"DBAs","value":"","confidence":"","sourceUrl":""},
   {"key":"principals","label":"Owner / Principals","value":"","confidence":"","sourceUrl":""},
   {"key":"ein","label":"Entity / EIN","value":"","confidence":"","sourceUrl":""},
   {"key":"employees","label":"Headcount","value":"","confidence":"","sourceUrl":""},
   {"key":"mhic","label":"MD MHIC License","value":"","confidence":"","sourceUrl":""},
   {"key":"dpor","label":"VA DPOR License","value":"","confidence":"","sourceUrl":""},
   {"key":"dcra","label":"DC DCRA License","value":"","confidence":"","sourceUrl":""},
   {"key":"gl","label":"General Liability","value":"","confidence":"","sourceUrl":""},
   {"key":"umbrella","label":"Umbrella Policy","value":"","confidence":"","sourceUrl":""},
   {"key":"wc","label":"Workers' Comp","value":"","confidence":"","sourceUrl":""},
   {"key":"area","label":"Service Area","value":"","confidence":"","sourceUrl":""},
   {"key":"specialties","label":"Specialties","value":"","confidence":"","sourceUrl":""},
   {"key":"certs","label":"Certifications","value":"","confidence":"","sourceUrl":""},
   {"key":"awards","label":"Awards","value":"","confidence":"","sourceUrl":""},
   {"key":"google","label":"Google Rating","value":"","confidence":"","sourceUrl":""},
   {"key":"yelp","label":"Yelp Rating","value":"","confidence":"","sourceUrl":""},
   {"key":"bbb","label":"BBB Rating","value":"","confidence":"","sourceUrl":""},
   {"key":"ucc","label":"UCC Filings","value":"","confidence":"","sourceUrl":""}
 ],
 "briefing": {
   "summary":"2-3 sentences",
   "strengths":["..."],
   "weaknesses":["..."],
   "fleetWashAngles":["..."],
   "droneAngles":["..."],
   "openingLines":["2 short, specific cold-open lines"]
 }
}`;

interface LlmField {
  key: string;
  label: string;
  value: string;
  confidence: "high" | "medium" | "low";
  sourceUrl?: string;
}

interface LlmOutput {
  fields: LlmField[];
  briefing: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    fleetWashAngles: string[];
    droneAngles: string[];
    openingLines: string[];
  };
}

async function synthesize(
  lead: LeadInput,
  content: string,
  sources: FirecrawlSource[],
  apiKey: string,
): Promise<LlmOutput> {
  const gatewayUrl = env("AI_GATEWAY_URL") ?? "https://ai.gateway.lovable.dev/v1/chat/completions";
  const model = env("AI_MODEL") ?? "google/gemini-2.5-flash";

  const userPrompt = [
    `Company: ${lead.company}`,
    lead.website ? `Website: ${lead.website}` : "",
    lead.zone ? `Territory: ${lead.zone}` : "",
    lead.service?.length ? `Services of interest: ${lead.service.join(", ")}` : "",
    `Available source URLs: ${sources.map((s) => s.url).join(", ")}`,
    "",
    "SCRAPED CONTENT (truncated):",
    content.slice(0, 18000),
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(gatewayUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as LlmOutput;
}

// ---- Handler ------------------------------------------------------------

async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const firecrawlKey = env("FIRECRAWL_API_KEY");
  const aiKey = env("AI_API_KEY");
  if (!firecrawlKey || !aiKey) {
    return json({ error: "Missing FIRECRAWL_API_KEY or AI_API_KEY secret" }, 500);
  }

  let lead: LeadInput;
  try {
    const body = await req.json();
    lead = body.lead ?? body;
    if (!lead?.company) return json({ error: "lead.company is required" }, 400);
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const nowISO = new Date().toISOString();
  const sources: FirecrawlSource[] = [];

  // 1. Scrape the company website (resolve a URL if only a name was given).
  const siteUrl = lead.website
    ? lead.website.startsWith("http")
      ? lead.website
      : `https://${lead.website}`
    : undefined;

  let content = "";
  if (siteUrl) {
    const scraped = await firecrawlScrape(siteUrl, firecrawlKey);
    if (scraped) {
      content += `# ${lead.company} — website\n${scraped.markdown}\n\n`;
      sources.push({ label: "Company website (Firecrawl)", url: scraped.url, verifiedAt: nowISO });
    }
  }

  // 2. Search the web for licensing / insurance / review signals.
  const searches = [
    `${lead.company} ${lead.zone ?? "DMV"} business license insurance`,
    `${lead.company} reviews Google Yelp BBB`,
  ];
  for (const q of searches) {
    const hits = await firecrawlSearch(q, firecrawlKey, 3);
    for (const h of hits) {
      content += `# ${h.title}\n${h.description}\nSource: ${h.url}\n\n`;
      sources.push({ label: h.title || "Web result", url: h.url, verifiedAt: nowISO });
    }
  }

  if (!content.trim()) {
    return json({ error: "Firecrawl returned no usable content for this company" }, 502);
  }

  // 3. LLM synthesis into the structured profile + briefing.
  let llm: LlmOutput;
  try {
    llm = await synthesize(lead, content, sources, aiKey);
  } catch (e) {
    return json({ error: `Synthesis failed: ${(e as Error).message}` }, 502);
  }

  // 4. Assemble the result with per-field source receipts.
  const fallbackUrl = sources[0]?.url ?? siteUrl ?? "";
  const fields = (llm.fields ?? []).map((f) => ({
    key: f.key,
    label: f.label,
    value: f.value || "Not found",
    confidence: f.confidence ?? "low",
    receipt: {
      label: f.label,
      url: f.sourceUrl || fallbackUrl,
      verifiedAt: nowISO,
    },
  }));

  return json({
    leadId: lead.id,
    company: lead.company,
    generatedAt: nowISO,
    engine: "firecrawl+ai",
    fields,
    briefing: llm.briefing,
    sources,
  });
}

// deno-lint-ignore no-explicit-any
(globalThis as any).Deno?.serve?.(handle);

export { handle };
