import type { GapMarket } from "@/types";
import { gapScore, COMPETITION_LABEL, EFFORT_LABEL } from "@/lib/gapScoring";
import { tierFor, TIER_LABEL, formatCompact, formatUSD } from "@/lib/scoring";

interface Props {
  market: GapMarket;
  onClose: () => void;
}

/** Playbook drawer: why the market is stuck + what to build and sell into it. */
export function GapDrawer({ market: m, onClose }: Props) {
  const score = gapScore(m);
  const tier = tierFor(score);

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <h2>{m.name}</h2>
            <div className="sub">{m.sector} · market playbook</div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="drawer-body">
          <div className="dd-split">
            {/* left: the numbers */}
            <div>
              <div className="dd-col-title">Market vitals</div>
              <div className="deal-card">
                <div className="dc-company">
                  Gap Score {score}
                  <span className={`chip tier-${tier}`} style={{ marginLeft: 8 }}>
                    <span className={`dot dot-${tier}`} />
                    {TIER_LABEL[tier]}
                  </span>
                </div>
                <div className="dc-row">
                  <span className="k">US market size</span>
                  <span className="v">${formatCompact(m.marketSizeUSD)}/yr</span>
                </div>
                <div className="dc-row">
                  <span className="k">Firms using AI</span>
                  <span className="v">~{m.aiAdoptionPct}%</span>
                </div>
                <div className="dc-row">
                  <span className="k">Digital readiness</span>
                  <span className="v">{m.digitalReadiness}/100</span>
                </div>
                <div className="dc-row">
                  <span className="k">Typical contract</span>
                  <span className="v">{formatUSD(m.avgDealSizeUSD)}/yr</span>
                </div>
                <div className="dc-row">
                  <span className="k">Vendor landscape</span>
                  <span className="v">{COMPETITION_LABEL[m.competition]}</span>
                </div>
                <div className="dc-row">
                  <span className="k">Adoption source</span>
                  <span className="v gap-source">{m.sourceNote}</span>
                </div>
              </div>
            </div>

            {/* right: the playbook */}
            <div>
              <div className="dd-col-title">Why they're stuck</div>
              <ul className="gap-pains">
                {m.painPoints.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>

              <div className="dd-col-title" style={{ marginTop: 18 }}>
                What to build
              </div>
              <div className="gap-plays">
                {m.aiPlays.map((play) => (
                  <div className="gap-play" key={play.name}>
                    <div className="gp-top">
                      <b>{play.name}</b>
                      <span className={`chip effort-${play.effort.replace(/[^a-z0-9]+/gi, "-")}`}>
                        {EFFORT_LABEL[play.effort]}
                      </span>
                    </div>
                    <p>{play.what}</p>
                    <div className="gp-money">💰 {play.monetization}</div>
                  </div>
                ))}
              </div>

              <div className="dd-col-title" style={{ marginTop: 18 }}>
                The opener
              </div>
              <blockquote className="gap-pitch">“{m.pitchLine}”</blockquote>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
