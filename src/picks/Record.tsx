import { useMemo } from "react";
import { RECORD } from "./data";
import { formatOdds } from "./access";

const W = 920;
const H = 260;
const PAD = { top: 38, right: 18, bottom: 26, left: 46 };

/** Track-record page: the transparency that sells the subscription. */
export function Record() {
  const stats = useMemo(() => {
    const wins = RECORD.filter((r) => r.status === "won").length;
    const losses = RECORD.filter((r) => r.status === "lost").length;
    const risked = RECORD.reduce((s, r) => s + r.units, 0);
    const net = RECORD.reduce((s, r) => s + r.resultUnits, 0);
    let running = 0;
    const curve = RECORD.map((r) => (running += r.resultUnits));
    return {
      wins,
      losses,
      winPct: Math.round((wins / (wins + losses)) * 100),
      net,
      roi: Math.round((net / risked) * 100),
      curve,
    };
  }, []);

  const { curve } = stats;
  const min = Math.min(0, ...curve);
  const max = Math.max(...curve);
  const x = (i: number) => PAD.left + (i / (curve.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) =>
    H - PAD.bottom - ((v - min) / (max - min)) * (H - PAD.top - PAD.bottom);
  const path = curve.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${path} L${x(curve.length - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`;

  return (
    <div className="record-page">
      <div className="record-stats">
        <div className="rstat">
          <div className="k">Record (30 days)</div>
          <div className="v">
            {stats.wins}–{stats.losses}
          </div>
        </div>
        <div className="rstat">
          <div className="k">Win rate</div>
          <div className="v">{stats.winPct}%</div>
        </div>
        <div className="rstat">
          <div className="k">Net units</div>
          <div className="v up">+{stats.net.toFixed(1)}u</div>
        </div>
        <div className="rstat">
          <div className="k">ROI per unit risked</div>
          <div className="v up">+{stats.roi}%</div>
        </div>
      </div>

      <div className="record-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cumulative units won over the last 30 graded picks">
          <line x1={PAD.left} y1={y(0)} x2={W - PAD.right} y2={y(0)} className="rc-zero" />
          {[5, 10, 15].map((v) =>
            v <= max ? (
              <g key={v}>
                <line x1={PAD.left} y1={y(v)} x2={W - PAD.right} y2={y(v)} className="rc-grid" />
                <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" className="rc-tick">
                  +{v}u
                </text>
              </g>
            ) : null
          )}
          <path d={area} className="rc-area" />
          <path d={path} className="rc-line" />
          <circle cx={x(curve.length - 1)} cy={y(curve[curve.length - 1])} r={5} className="rc-dot" />
          <text
            x={x(curve.length - 1) - 10}
            y={y(curve[curve.length - 1]) - 12}
            textAnchor="end"
            className="rc-final"
          >
            +{curve[curve.length - 1].toFixed(1)}u
          </text>
        </svg>
        <p className="rc-caption">Cumulative units — every graded pick from the last 30 days, no deletions</p>
      </div>

      <div className="record-table">
        <div className="rt-row rt-head">
          <span>Date</span>
          <span>Play</span>
          <span>Odds</span>
          <span>Risk</span>
          <span>Result</span>
        </div>
        {[...RECORD].reverse().map((r) => (
          <div className={`rt-row rt-${r.status}`} key={`${r.date}-${r.label}`}>
            <span>{new Date(`${r.date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span className="rt-label">{r.label}</span>
            <span>{formatOdds(r.odds)}</span>
            <span>{r.units}u</span>
            <span className={r.resultUnits >= 0 ? "up" : "down"}>
              {r.resultUnits >= 0 ? "+" : ""}
              {r.resultUnits.toFixed(2)}u
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
