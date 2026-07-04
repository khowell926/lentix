import { useMemo, useState } from "react";
import type { GapMarket, GapSector } from "@/types";
import { GAP_MARKETS } from "@/data/gapMarkets";
import { gapScore, COMPETITION_LABEL } from "@/lib/gapScoring";
import { tierFor, TIER_LABEL, TIER_COLOR, formatCompact, formatUSD } from "@/lib/scoring";
import { GapQuadrant } from "@/components/GapQuadrant";
import { GapDrawer } from "@/components/GapDrawer";
import "./gap.css";

type SortKey = "score" | "size" | "adoption";

const SORT_LABEL: Record<SortKey, string> = {
  score: "Gap score",
  size: "Market size",
  adoption: "Least AI first",
};

export function GapRadar() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<GapSector | "all">("all");
  const [sort, setSort] = useState<SortKey>("score");
  const [selected, setSelected] = useState<GapMarket | null>(null);

  const sectors = useMemo(
    () => [...new Set(GAP_MARKETS.map((m) => m.sector))].sort(),
    []
  );

  const markets = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = GAP_MARKETS.filter(
      (m) =>
        (sector === "all" || m.sector === sector) &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          m.painPoints.some((p) => p.toLowerCase().includes(q)) ||
          m.aiPlays.some((p) => p.name.toLowerCase().includes(q)))
    );
    return list.sort((a, b) => {
      if (sort === "size") return b.marketSizeUSD - a.marketSizeUSD;
      if (sort === "adoption") return a.aiAdoptionPct - b.aiAdoptionPct;
      return gapScore(b) - gapScore(a);
    });
  }, [query, sector, sort]);

  const totalTAM = useMemo(
    () => markets.reduce((sum, m) => sum + m.marketSizeUSD, 0),
    [markets]
  );

  return (
    <div className="gap-page">
      <div className="pipeline-head">
        <h2>AI Gap Radar</h2>
        <p>
          Markets where the money is real and the AI adoption isn't. Find the gap, open the
          playbook, go sell.
        </p>
        <div className="gap-stats">
          <span className="chip">
            {markets.length} markets · ${formatCompact(totalTAM)} combined revenue
          </span>
        </div>
      </div>

      {/* filter bar */}
      <div className="gap-filters">
        <input
          className="gap-search"
          placeholder="Search markets, pains, plays…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="gap-sector-chips">
          <button
            className={`gap-chip ${sector === "all" ? "active" : ""}`}
            onClick={() => setSector("all")}
          >
            All sectors
          </button>
          {sectors.map((s) => (
            <button
              key={s}
              className={`gap-chip ${sector === s ? "active" : ""}`}
              onClick={() => setSector(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="gap-sort">
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            <button
              key={k}
              className={`gap-chip ${sort === k ? "active" : ""}`}
              onClick={() => setSort(k)}
            >
              {SORT_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <GapQuadrant markets={markets} selectedId={selected?.id ?? null} onSelect={setSelected} />

      {/* market cards */}
      <div className="lead-grid">
        {markets.map((m) => {
          const score = gapScore(m);
          const tier = tierFor(score);
          return (
            <div className="lead-card gap-card" key={m.id} onClick={() => setSelected(m)}>
              <div className="lc-top">
                <div>
                  <div className="lc-company">{m.name}</div>
                  <div className="lc-contact">{m.sector}</div>
                </div>
                <span className={`chip tier-${tier}`}>
                  <span className={`dot dot-${tier}`} />
                  {TIER_LABEL[tier]} · {score}
                </span>
              </div>

              <div className="lc-scores">
                <div className="lc-score">
                  <div className="k">Market / yr</div>
                  <div className="v">${formatCompact(m.marketSizeUSD)}</div>
                </div>
                <div className="lc-score">
                  <div className="k">Using AI</div>
                  <div className="v">~{m.aiAdoptionPct}%</div>
                  <div className="bar">
                    <i
                      style={{
                        width: `${Math.min(100, m.aiAdoptionPct * (100 / 15))}%`,
                        background: TIER_COLOR[tier],
                      }}
                    />
                  </div>
                </div>
                <div className="lc-score">
                  <div className="k">Avg contract</div>
                  <div className="v">{formatUSD(m.avgDealSizeUSD)}</div>
                </div>
              </div>

              <div className="lc-tags">
                <span className="lc-tag">{COMPETITION_LABEL[m.competition]}</span>
                {m.aiPlays.map((p) => (
                  <span className="lc-service" key={p.name}>
                    {p.name}
                  </span>
                ))}
              </div>

              <div className="lc-actions">
                <button
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(m);
                  }}
                >
                  Open playbook →
                </button>
              </div>
            </div>
          );
        })}
        {markets.length === 0 && (
          <p className="gap-empty">No markets match — clear a filter and try again.</p>
        )}
      </div>

      {selected && <GapDrawer market={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
