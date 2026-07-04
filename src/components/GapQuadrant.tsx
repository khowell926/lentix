import type { GapMarket } from "@/types";
import { gapScore } from "@/lib/gapScoring";
import { tierFor, TIER_COLOR, formatCompact } from "@/lib/scoring";

const W = 920;
const H = 400;
const PAD = { top: 26, right: 24, bottom: 42, left: 64 };

const X_MAX = 15; // adoption %
const Y_MIN = Math.log10(15_000_000_000);
const Y_MAX = Math.log10(450_000_000_000);

function x(adoptionPct: number): number {
  const t = Math.min(1, adoptionPct / X_MAX);
  return PAD.left + t * (W - PAD.left - PAD.right);
}

function y(marketSizeUSD: number): number {
  const t = (Math.log10(marketSizeUSD) - Y_MIN) / (Y_MAX - Y_MIN);
  const clamped = Math.max(0, Math.min(1, t));
  return H - PAD.bottom - clamped * (H - PAD.top - PAD.bottom);
}

function r(avgDealSizeUSD: number): number {
  const MIN_D = 2_000;
  const MAX_D = 13_000;
  const t =
    (Math.sqrt(Math.max(MIN_D, Math.min(MAX_D, avgDealSizeUSD))) - Math.sqrt(MIN_D)) /
    (Math.sqrt(MAX_D) - Math.sqrt(MIN_D));
  return 8 + t * 14;
}

interface Props {
  markets: GapMarket[];
  selectedId: string | null;
  onSelect: (m: GapMarket) => void;
}

/**
 * Adoption-vs-market-size quadrant. The goldmine is top-left:
 * huge market, almost nobody using AI yet.
 */
export function GapQuadrant({ markets, selectedId, onSelect }: Props) {
  const midX = x(6);
  const midY = y(100_000_000_000);

  const xTicks = [0, 3, 6, 9, 12, 15];
  const yTicks = [20_000_000_000, 50_000_000_000, 100_000_000_000, 200_000_000_000, 400_000_000_000];

  return (
    <div className="quadrant-panel">
      <svg viewBox={`0 0 ${W} ${H}`} className="quadrant-svg" role="img" aria-label="AI adoption vs market size quadrant chart">
        {/* grid + axes */}
        {xTicks.map((t) => (
          <g key={`xt-${t}`}>
            <line x1={x(t)} y1={PAD.top} x2={x(t)} y2={H - PAD.bottom} className="q-grid" />
            <text x={x(t)} y={H - PAD.bottom + 18} className="q-tick" textAnchor="middle">
              {t}%
            </text>
          </g>
        ))}
        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line x1={PAD.left} y1={y(t)} x2={W - PAD.right} y2={y(t)} className="q-grid" />
            <text x={PAD.left - 8} y={y(t) + 4} className="q-tick" textAnchor="end">
              ${formatCompact(t)}
            </text>
          </g>
        ))}

        {/* quadrant midlines */}
        <line x1={midX} y1={PAD.top} x2={midX} y2={H - PAD.bottom} className="q-mid" />
        <line x1={PAD.left} y1={midY} x2={W - PAD.right} y2={midY} className="q-mid" />

        {/* quadrant labels */}
        <text x={PAD.left + 10} y={PAD.top + 16} className="q-label q-label-gold">
          ◆ GOLDMINE — big market, nobody's home
        </text>
        <text x={W - PAD.right - 10} y={PAD.top + 16} className="q-label" textAnchor="end">
          big but waking up
        </text>
        <text x={PAD.left + 10} y={H - PAD.bottom - 10} className="q-label">
          niche &amp; wide open
        </text>
        <text x={W - PAD.right - 10} y={H - PAD.bottom - 10} className="q-label" textAnchor="end">
          smaller &amp; contested
        </text>

        {/* axis titles */}
        <text x={(PAD.left + W - PAD.right) / 2} y={H - 6} className="q-axis" textAnchor="middle">
          FIRMS USING AI TODAY →
        </text>
        <text
          x={16}
          y={(PAD.top + H - PAD.bottom) / 2}
          className="q-axis"
          textAnchor="middle"
          transform={`rotate(-90 16 ${(PAD.top + H - PAD.bottom) / 2})`}
        >
          US MARKET SIZE →
        </text>

        {/* bubbles */}
        {markets.map((m) => {
          const tier = tierFor(gapScore(m));
          const selected = m.id === selectedId;
          return (
            <g
              key={m.id}
              className={`q-bubble ${selected ? "selected" : ""}`}
              onClick={() => onSelect(m)}
            >
              <circle
                cx={x(m.aiAdoptionPct)}
                cy={y(m.marketSizeUSD)}
                r={r(m.avgDealSizeUSD)}
                fill={TIER_COLOR[tier]}
                fillOpacity={selected ? 0.85 : 0.55}
                stroke={TIER_COLOR[tier]}
                strokeWidth={selected ? 3 : 1.5}
              />
              <title>{`${m.name} — ${m.aiAdoptionPct}% adoption · $${formatCompact(m.marketSizeUSD)} market · gap score ${gapScore(m)}`}</title>
            </g>
          );
        })}
      </svg>
      <p className="quadrant-caption">
        Bubble size = typical vendor contract value · color = gap-score tier · click a bubble to open
        its playbook
      </p>
    </div>
  );
}
