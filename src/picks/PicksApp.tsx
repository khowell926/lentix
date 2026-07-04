import { useMemo, useState } from "react";
import type { Pick, PickStatus } from "./types";
import { LAST_NIGHT } from "./data";
import { hasAccess, activePass, planFor, clearPass } from "./access";
import { loadBoard, postPick, gradePick, resetBoard } from "./boardStore";
import { PickCard } from "./PickCard";
import { Paywall } from "./Paywall";
import { PostPick } from "./PostPick";
import { Record } from "./Record";
import "./picks.css";

type View = "board" | "record";

export const BETA_VERSION = "v0.2.0-beta";

export function PicksApp() {
  const [view, setView] = useState<View>("board");
  const [board, setBoard] = useState<Pick[]>(() => loadBoard());
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [capperMode, setCapperMode] = useState(false);
  const [accessTick, setAccessTick] = useState(0);

  const unlocked = useMemo(() => hasAccess(), [accessTick]);
  const pass = useMemo(() => activePass(), [accessTick]);

  const freePicks = board.filter((p) => p.tier === "free");
  const premiumPicks = board.filter((p) => p.tier === "premium");

  const grade = (id: string, status: Exclude<PickStatus, "pending">) =>
    setBoard(gradePick(board, id, status));

  return (
    <div className="lr-app">
      <header className="lr-topbar">
        <div className="lr-brand">
          <span className="lr-mark">🔐</span>
          <span>
            LOCKROOM
            <small>REAL RECEIPTS · REAL RECORD</small>
          </span>
          <span className="lr-beta">{BETA_VERSION.toUpperCase()}</span>
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

        <button
          className={`lr-capper ${capperMode ? "active" : ""}`}
          onClick={() => setCapperMode((c) => !c)}
          title="Capper mode: post and grade picks"
        >
          {capperMode ? "◉ Capper mode" : "○ Capper mode"}
        </button>

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

          {capperMode && (
            <section className="lr-capper-bar">
              <div>
                <b>Capper mode</b> — post tonight's plays and grade them when they settle. Everything
                saves to this browser in the beta; the production build syncs to the database.
              </div>
              <div className="lr-capper-actions">
                <button className="lr-cta" onClick={() => setPostOpen(true)}>
                  + Post a pick
                </button>
                <button className="lr-signout" onClick={() => setBoard(resetBoard())}>
                  reset board
                </button>
              </div>
            </section>
          )}

          <section>
            <div className="lr-section-head">
              <h2>Free picks</h2>
              <span>on the house — this is the standard</span>
            </div>
            <div className="lr-grid">
              {freePicks.map((p) => (
                <PickCard
                  key={p.id}
                  pick={p}
                  locked={false}
                  onUnlock={() => setPaywallOpen(true)}
                  onGrade={capperMode ? grade : undefined}
                />
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
                  locked={!unlocked && !capperMode}
                  onUnlock={() => setPaywallOpen(true)}
                  onGrade={capperMode ? grade : undefined}
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
        <b>LockRoom {BETA_VERSION}</b> — beta build; picks and passes persist in this browser only.
        Found a bug or want in on the beta? Email{" "}
        <a href="mailto:khowell926@gmail.com?subject=LockRoom%20beta%20feedback">the room</a>.
        <br />
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

      {postOpen && (
        <PostPick
          onClose={() => setPostOpen(false)}
          onPost={(pick) => {
            setBoard(postPick(board, pick));
            setPostOpen(false);
          }}
        />
      )}
    </div>
  );
}
