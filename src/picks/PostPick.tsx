import { useState, type FormEvent } from "react";
import type { Pick, Sport } from "./types";

const SPORTS: Sport[] = ["MLB", "WNBA", "UFC", "Tennis", "Soccer"];

interface Props {
  onPost: (pick: Pick) => void;
  onClose: () => void;
}

/** Capper-mode form for posting a new pick to the board. */
export function PostPick({ onPost, onClose }: Props) {
  const [sport, setSport] = useState<Sport>("MLB");
  const [event, setEvent] = useState("");
  const [market, setMarket] = useState("");
  const [selection, setSelection] = useState("");
  const [odds, setOdds] = useState("-110");
  const [units, setUnits] = useState("1");
  const [confidence, setConfidence] = useState("3");
  const [tier, setTier] = useState<Pick["tier"]>("premium");
  const [analysis, setAnalysis] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsedOdds = Number(odds);
    const parsedUnits = Number(units);
    if (!event.trim() || !selection.trim() || !Number.isFinite(parsedOdds) || parsedOdds === 0) return;
    onPost({
      id: `p-${Date.now()}`,
      sport,
      league: sport,
      event: event.trim(),
      market: market.trim() || "Moneyline",
      selection: selection.trim(),
      odds: parsedOdds,
      units: Math.max(0.25, Math.min(5, parsedUnits || 1)),
      confidence: Math.max(1, Math.min(5, Number(confidence) || 3)) as Pick["confidence"],
      tier,
      analysis: analysis.trim() || "Writeup coming — pick released early for line value.",
      startTime: new Date().toISOString(),
      status: "pending",
    });
  };

  return (
    <div className="paywall-overlay" onClick={onClose}>
      <form className="paywall postpick" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <button type="button" className="paywall-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>Post a pick</h2>
        <p className="paywall-sub">Goes live on the board instantly. Grade it from the card once it settles.</p>

        <div className="pp-grid">
          <label>
            Sport
            <select value={sport} onChange={(e) => setSport(e.target.value as Sport)}>
              {SPORTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Tier
            <select value={tier} onChange={(e) => setTier(e.target.value as Pick["tier"])}>
              <option value="premium">Premium</option>
              <option value="free">Free</option>
            </select>
          </label>
          <label className="pp-wide">
            Matchup / event
            <input value={event} onChange={(e) => setEvent(e.target.value)} placeholder="Orioles @ Yankees" required />
          </label>
          <label>
            Market
            <input value={market} onChange={(e) => setMarket(e.target.value)} placeholder="Moneyline" />
          </label>
          <label>
            Odds (American)
            <input value={odds} onChange={(e) => setOdds(e.target.value)} placeholder="-110" required />
          </label>
          <label className="pp-wide">
            The play
            <input value={selection} onChange={(e) => setSelection(e.target.value)} placeholder="Yankees ML" required />
          </label>
          <label>
            Units (0.25–5)
            <input value={units} onChange={(e) => setUnits(e.target.value)} placeholder="1" />
          </label>
          <label>
            Confidence (1–5)
            <input value={confidence} onChange={(e) => setConfidence(e.target.value)} placeholder="3" />
          </label>
          <label className="pp-wide">
            Writeup
            <textarea
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              rows={3}
              placeholder="Why this play wins — this is what they're paying for."
            />
          </label>
        </div>

        <button type="submit" className="plan-buy pp-submit">
          Post to the board
        </button>
      </form>
    </div>
  );
}
