import { useEffect, useState } from "react";
import type { AgentStep, DeepDiveResult, Lead } from "@/types";
import { formatUSD } from "@/lib/scoring";
import { PIPELINE_STEPS, cachedResult, isLiveEnabled, runDeepDive } from "@/lib/deepDiveAgent";

interface Props {
  lead: Lead;
  onClose: () => void;
}

const SERVICE_LABEL: Record<string, string> = {
  "fleet-wash": "Fleet Wash",
  "drone-recon": "Drone Recon",
  "social-content": "Social Content",
};

function DealColumn({ lead }: { lead: Lead }) {
  return (
    <div>
      <div className="dd-col-title">▣ Deal Data</div>
      <div className="deal-card">
        <div className="dc-company">{lead.company}</div>
        <div style={{ height: 10 }} />
        <div className="dc-row">
          <span className="k">Contact</span>
          <span className="v">{lead.contact}</span>
        </div>
        <div className="dc-row">
          <span className="k">Title</span>
          <span className="v">{lead.title}</span>
        </div>
        <div className="dc-row">
          <span className="k">Stage</span>
          <span className="v" style={{ textTransform: "capitalize" }}>
            {lead.stage}
          </span>
        </div>
        <div className="dc-row">
          <span className="k">Zone</span>
          <span className="v">{lead.zone}</span>
        </div>
        <div className="dc-row">
          <span className="k">Lead score</span>
          <span className="v">{lead.leadScore}/100</span>
        </div>
        <div className="dc-row">
          <span className="k">Opportunity</span>
          <span className="v">{lead.opportunityScore}/100</span>
        </div>
        <div className="dc-row">
          <span className="k">Deal value</span>
          <span className="v">{formatUSD(lead.dealValue)}</span>
        </div>
        <div className="dc-row">
          <span className="k">Services</span>
          <span className="v">{lead.service.map((s) => SERVICE_LABEL[s]).join(", ")}</span>
        </div>
        <div className="dc-row">
          <span className="k">Source</span>
          <span className="v">{lead.source}</span>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>
          {lead.notes}
        </div>
      </div>
    </div>
  );
}

function ResearchColumn({ result }: { result: DeepDiveResult }) {
  const b = result.briefing;
  return (
    <div>
      <div className="dd-meta">
        <span>
          <span className={`engine-badge ${result.engine === "firecrawl+ai" ? "live" : "sim"}`}>
            {result.engine === "firecrawl+ai" ? "● LIVE · Firecrawl + AI" : "◌ Simulated"}
          </span>{" "}
          · Generated {new Date(result.generatedAt).toLocaleString()} · {result.fields.length} fields
        </span>
        <div className="dd-sources">
          {result.sources.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <div className="dd-col-title">◎ Structured Profile · 20 fields</div>
      <div className="dd-fields">
        {result.fields.map((f) => (
          <div className="dd-field" key={f.key}>
            <div className="k">
              {f.label}
              <span className={`conf conf-${f.confidence}`}>{f.confidence}</span>
            </div>
            <div className="v">{f.value}</div>
            {f.receipt && (
              <a className="src" href={f.receipt.url} target="_blank" rel="noreferrer">
                <span className="ok">✓</span> source receipt
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="briefing">
        <div className="dd-col-title">✦ AI Sales Briefing</div>
        <div className="briefing-card">
          <div className="b-summary">{b.summary}</div>

          <div className="brief-grid" style={{ marginTop: 14 }}>
            <div className="brief-section">
              <h4>▲ Strengths</h4>
              <ul>
                {b.strengths.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="brief-section">
              <h4>▼ Weaknesses</h4>
              <ul>
                {b.weaknesses.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="brief-grid">
            <div className="brief-section">
              <h4>⊚ Fleet-Wash Angles</h4>
              <ul>
                {b.fleetWashAngles.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="brief-section">
              <h4>⌖ Drone Angles</h4>
              <ul>
                {b.droneAngles.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="brief-section">
            <h4>✉ Opening Lines</h4>
            {b.openingLines.map((x, i) => (
              <div className="opening-line" key={i}>
                {x}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentProgress({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="agent-run">
      <h3>⚡ Running Lead Deep-Dive</h3>
      <p className="sub">
        {isLiveEnabled()
          ? "Firecrawl is scraping the company site + web; the AI then synthesizes a 20-field profile and a pitch-ready briefing. Every fact gets a source receipt."
          : "Running the built-in simulation (no live endpoint configured). Set VITE_DEEP_DIVE_URL to run real Firecrawl + AI research. Every fact still gets a source receipt."}
      </p>
      <div className="steps">
        {steps.map((s) => (
          <div className={`step ${s.status}`} key={s.label}>
            <span className="ic">{s.status === "done" ? "✓" : ""}</span>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeepDiveDrawer({ lead, onClose }: Props) {
  const [result, setResult] = useState<DeepDiveResult | null>(() => cachedResult(lead.id));
  const [steps, setSteps] = useState<AgentStep[]>(
    PIPELINE_STEPS.map((label) => ({ label, status: "pending" })),
  );
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (result) return; // already cached — show immediately
    setRunning(true);
    runDeepDive(lead, { onProgress: (s) => !cancelled && setSteps(s) })
      .then((r) => {
        if (!cancelled) {
          setResult(r);
          setRunning(false);
        }
      })
      .catch(() => !cancelled && setRunning(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  const rerun = () => {
    setResult(null);
    setRunning(true);
    setSteps(PIPELINE_STEPS.map((label) => ({ label, status: "pending" })));
    runDeepDive(lead, { refresh: true, onProgress: setSteps }).then((r) => {
      setResult(r);
      setRunning(false);
    });
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <h2>Lead Deep-Dive</h2>
            <div className="sub">{lead.company}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {result && !running && (
              <button className="btn" onClick={rerun}>
                ↻ Re-run
              </button>
            )}
            <button className="drawer-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="drawer-body">
          {running || !result ? (
            <AgentProgress steps={steps} />
          ) : (
            <div className="dd-split">
              <DealColumn lead={lead} />
              <ResearchColumn result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
