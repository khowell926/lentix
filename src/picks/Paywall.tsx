import { useState } from "react";
import type { Plan } from "./types";
import { PLANS } from "./data";
import { purchase } from "./access";

interface Props {
  onClose: () => void;
  onPurchased: () => void;
}

export function Paywall({ onClose, onPurchased }: Props) {
  const [processing, setProcessing] = useState<Plan | null>(null);

  const buy = async (plan: Plan) => {
    if (processing) return;
    setProcessing(plan);
    await purchase(plan);
    onPurchased();
  };

  return (
    <div className="paywall-overlay" onClick={() => !processing && onClose()}>
      <div className="paywall" onClick={(e) => e.stopPropagation()}>
        <button className="paywall-close" onClick={onClose} disabled={!!processing} aria-label="Close">
          ✕
        </button>
        <h2>Unlock the premium board</h2>
        <p className="paywall-sub">
          Every play, full writeups, and the live-graded record. Last night the room cashed{" "}
          <b>11 tickets for +$666</b>.
        </p>

        <div className="paywall-plans">
          {PLANS.map((plan) => (
            <div className={`plan ${plan.featured ? "featured" : ""}`} key={plan.id}>
              {plan.featured && <div className="plan-tag">MOST POPULAR</div>}
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">
                ${plan.priceUSD}
                <span> / {plan.period}</span>
              </div>
              <p className="plan-blurb">{plan.blurb}</p>
              <button
                className="plan-buy"
                onClick={() => buy(plan)}
                disabled={!!processing}
              >
                {processing?.id === plan.id ? "Processing…" : `Get ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <p className="paywall-fine">
          Demo checkout — no card charged. Production build drops Stripe Checkout in behind the
          same button. Picks are information and entertainment, not financial advice. 21+ only ·
          please play responsibly · 1-800-GAMBLER.
        </p>
      </div>
    </div>
  );
}
