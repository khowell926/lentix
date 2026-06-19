import { TIER_COLOR, TIER_LABEL, TIER_THRESHOLDS, bubbleRadius } from "@/lib/scoring";

export function MapLegend() {
  const sizes = [400, 1200, 2800];
  return (
    <div className="legend">
      <h4>Opportunity Tier</h4>
      <div className="row">
        <span className="swatch" style={{ background: TIER_COLOR.hot }} />
        {TIER_LABEL.hot} · {TIER_THRESHOLDS.hot}–100
      </div>
      <div className="row">
        <span className="swatch" style={{ background: TIER_COLOR.warm }} />
        {TIER_LABEL.warm} · {TIER_THRESHOLDS.warm}–{TIER_THRESHOLDS.hot - 1}
      </div>
      <div className="row">
        <span className="swatch" style={{ background: TIER_COLOR.watch }} />
        {TIER_LABEL.watch} · 0–{TIER_THRESHOLDS.warm - 1}
      </div>
      <div className="sizes">
        {sizes.map((e) => {
          const d = bubbleRadius(e) * 2;
          return (
            <div className="size-item" key={e}>
              <span className="size-bubble" style={{ width: d, height: d }} />
              {e.toLocaleString()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
