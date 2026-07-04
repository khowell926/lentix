import { useMemo, useState } from "react";
import { TODAY_PICKS, LAST_NIGHT } from "./data";
import { hasAccess, activePass, planFor, clearPass } from "./access";
import { PickCard } from "./PickCard";
import { Paywall } from "./Paywall";
import { Record } from "./Record";
import "./picks.css";

type View = "board" | "record";

export function PicksApp() {
  const [view, setView] = useState<View>("board");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [accessTick, setAccessTick] = useState(0);

  const unlocked = useMemo(() => hasAccess(), [accessTick]);
  const pass = useMemo(() => activePass(), [accessTick]);

  const freePicks = TODAY_PICKS.filter((p) => p.tier === "free");
  const premiumPicks = TODAY_PICKS.filter((p) => p.tier === "premium");

  return (
    <div className="lr-app">
      <header className="lr-topbar">
        <div className="lr-brand">
          <span className="lr-mark">🔐</span>
          <span>
            LOCKROOM
            <small>REAL RECEIPTS · REAL RECORD</small>
          </span>
        </div>

        <nav className="lr-tabs">
          <button className={`lr-tab ${view === "board" ? "active" : ""}`} onClick={() => setView("board")}>
            Today's Board
          </button>
          <button className={`lr-tab ${view === "record" ? "active" : ""}`} onClick={() => setView("record")}>
            Track Record
          </button>
        </nav>

        <div className="lr-spacer" />
        {unlocked && pass ? (
          <div className="lr-member">
            <span className="lr-member-badge">✓ {planFor(pass)?.name ?? "Member"}</span>
            <button
              className="lr-signout"
              onClick={() => {
                clearPass();
                setAccessTick((t) => t + 1);
              }}
            >
              reset demo
            </button>
          </div>
        ) : (
          <button className="lr-cta" onClick={() => setPaywallOpen(true)}>
            Unlock Premium
          </button>
        )}
      </header>

      {view === "board" ? (
        <main className="lr-content">
          {/* receipts strip */}
          <section className="lr-hero">
            <h1>
              Last night: <b className="up">+${LAST_NIGHT.totalUSD.toFixed(2)}</b> across{" "}
              {LAST_NIGHT.cashes} cashed tickets
            </h1>
            <p>
              Biggest single payout <b>+${LAST_NIGHT.biggestUSD.toFixed(0)}</b> · every result graded
              on the <button className="lr-link" onClick={() => setView("record")}>public record</button> —
              wins and losses, no deletions.
            </p>
          </section>

          <section>
            <div className="lr-section-head">
              <h2>Free picks</h2>
              <span>on the house — this is the standard</span>
            </div>
            <div className="lr-grid">
              {freePicks.map((p) => (
                <PickCard key={p.id} pick={p} locked={false} onUnlock={() => setPaywallOpen(true)} />
              ))}
            </div>
          </section>

          <section>
            <div className="lr-section-head">
              <h2>Premium board</h2>
              <span>
                {premiumPicks.length} plays · {unlocked ? "unlocked ✓" : "members only"}
              </span>
            </div>
            <div className="lr-grid">
              {premiumPicks.map((p) => (
                <PickCard
                  key={p.id}
                  pick={p}
                  locked={!unlocked}
                  onUnlock={() => setPaywallOpen(true)}
                />
              ))}
            </div>
          </section>
        </main>
      ) : (
        <main className="lr-content">
          <Record />
        </main>
      )}

      <footer className="lr-footer">
        LockRoom sells sports analysis and opinions — information and entertainment, not financial
        advice, and never a guarantee of outcome. Must be 21+ where sports wagering is legal. If
        gambling stops being fun, call or text <b>1-800-GAMBLER</b>.
      </footer>

      {paywallOpen && (
        <Paywall
          onClose={() => setPaywallOpen(false)}
          onPurchased={() => {
            setPaywallOpen(false);
            setAccessTick((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}
