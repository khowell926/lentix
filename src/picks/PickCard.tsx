import type { Pick, PickStatus } from "./types";
import { formatOdds } from "./access";

const STATUS_LABEL: Record<Pick["status"], string> = {
  pending: "LIVE BOARD",
  won: "CASHED ✓",
  lost: "MISSED",
  push: "PUSH",
};

interface Props {
  pick: Pick;
  locked: boolean;
  onUnlock: () => void;
  /** Present only in capper mode: grade a pending pick. */
  onGrade?: (id: string, status: Exclude<PickStatus, "pending">) => void;
}

export function PickCard({ pick, locked, onUnlock, onGrade }: Props) {
  const time = new Date(pick.startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={`pick-card ${locked ? "locked" : ""} status-${pick.status}`}>
      <div className="pk-top">
        <span className="pk-sport">{pick.sport}</span>
        <span className="pk-event">{pick.event}</span>
        <span className={`pk-status pk-status-${pick.status}`}>{STATUS_LABEL[pick.status]}</span>
      </div>

      <div className="pk-market">
        {pick.market} · {time}
      </div>

      <div className="pk-body">
        {locked ? (
          <>
            <div className="pk-blur" aria-hidden>
              <div className="pk-selection">████ ██ █████</div>
              <p className="pk-analysis">
                ██████ ███ ████████ █████ ██ ████ ███████ ██████ █████████ ████ ██████ ███ █████
                ████████ ██████.
              </p>
            </div>
            <div className="pk-lock">
              <div className="pk-lock-icon">🔒</div>
              <button className="pk-unlock-btn" onClick={onUnlock}>
                Unlock this pick
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="pk-selection">{pick.selection}</div>
            <p className="pk-analysis">{pick.analysis}</p>
          </>
        )}
      </div>

      <div className="pk-foot">
        <span className="pk-odds">{formatOdds(pick.odds)}</span>
        <span className="pk-units">{pick.units}u</span>
        <span className="pk-conf" title={`Confidence ${pick.confidence}/5`}>
          {"🔥".repeat(pick.confidence)}
        </span>
        {pick.status !== "pending" && pick.resultUnits !== undefined && (
          <span className={`pk-result ${pick.resultUnits >= 0 ? "up" : "down"}`}>
            {pick.resultUnits >= 0 ? "+" : ""}
            {pick.resultUnits.toFixed(2)}u
          </span>
        )}
        {pick.tier === "free" && <span className="pk-free">FREE PICK</span>}
      </div>

      {onGrade && pick.status === "pending" && (
        <div className="pk-grade">
          <span>Grade:</span>
          <button className="pk-grade-btn won" onClick={() => onGrade(pick.id, "won")}>
            Won
          </button>
          <button className="pk-grade-btn lost" onClick={() => onGrade(pick.id, "lost")}>
            Lost
          </button>
          <button className="pk-grade-btn push" onClick={() => onGrade(pick.id, "push")}>
            Push
          </button>
        </div>
      )}
    </div>
  );
}
