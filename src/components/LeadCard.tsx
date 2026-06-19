import type { Lead } from "@/types";
import { TIER_COLOR, formatUSD, tierFor } from "@/lib/scoring";

const SERVICE_LABEL: Record<Lead["service"][number], string> = {
  "fleet-wash": "Fleet Wash",
  "drone-recon": "Drone Recon",
  "social-content": "Social",
};

interface Props {
  lead: Lead;
  onDeepDive: (lead: Lead) => void;
  hasCachedBrief: boolean;
}

function ScoreBlock({ label, value }: { label: string; value: number }) {
  const color = TIER_COLOR[tierFor(value)];
  return (
    <div className="lc-score">
      <div className="k">{label}</div>
      <div className="v">{value}</div>
      <div className="bar">
        <i style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export function LeadCard({ lead, onDeepDive, hasCachedBrief }: Props) {
  return (
    <div className="lead-card">
      <div className="lc-top">
        <div>
          <div className="lc-company">{lead.company}</div>
          <div className="lc-contact">
            {lead.contact} · {lead.title}
          </div>
        </div>
        <span className="lc-stage">{lead.stage}</span>
      </div>

      <div className="lc-scores">
        <ScoreBlock label="Lead score" value={lead.leadScore} />
        <ScoreBlock label="Opportunity" value={lead.opportunityScore} />
      </div>

      <div className="lc-deal">
        <span className="amount">{formatUSD(lead.dealValue)}</span>
        <span className="label">{lead.zone}</span>
      </div>

      <div className="lc-tags">
        {lead.service.map((s) => (
          <span key={s} className="lc-service">
            {SERVICE_LABEL[s]}
          </span>
        ))}
        {lead.tags.map((t) => (
          <span key={t} className="lc-tag">
            {t}
          </span>
        ))}
      </div>

      <div className="lc-receipt">
        <span className="ok">✓</span> {lead.source} · verified {lead.verifiedAt}
      </div>

      <div className="lc-actions">
        <button className="btn-primary btn" onClick={() => onDeepDive(lead)}>
          ⚡ {hasCachedBrief ? "View Deep-Dive" : "AI Deep-Dive"}
        </button>
        {lead.website && (
          <a
            className="btn"
            href={`https://${lead.website}`}
            target="_blank"
            rel="noreferrer"
            title="Open website"
          >
            ↗
          </a>
        )}
      </div>
    </div>
  );
}
