import { readJSON, writeJSON } from "@/lib/storage";
import type { Pick, PickStatus } from "./types";
import { TODAY_PICKS } from "./data";

/**
 * Beta board store: the seed board hydrates localStorage once, then the
 * capper's own posts/grades own the data. Production swap: replace these
 * three functions with API calls — the component layer doesn't change.
 */
const BOARD_KEY = "lockroom.board";
const BOARD_SEED_KEY = "lockroom.board.seedVersion";
const BOARD_SEED_VERSION = "2026-07-04.1";

export function loadBoard(): Pick[] {
  if (window.localStorage.getItem(BOARD_SEED_KEY) !== BOARD_SEED_VERSION) {
    window.localStorage.setItem(BOARD_SEED_KEY, BOARD_SEED_VERSION);
    writeJSON(BOARD_KEY, TODAY_PICKS);
    return TODAY_PICKS;
  }
  return readJSON<Pick[]>(BOARD_KEY, TODAY_PICKS);
}

export function saveBoard(board: Pick[]): void {
  writeJSON(BOARD_KEY, board);
}

/** Post a new pick to the top of the board. */
export function postPick(board: Pick[], pick: Pick): Pick[] {
  const next = [pick, ...board];
  saveBoard(next);
  return next;
}

/** Winner profit in units for American odds. */
export function profitUnits(odds: number, units: number): number {
  return odds > 0 ? (units * odds) / 100 : (units * 100) / -odds;
}

/** Grade a pending pick and persist the result. */
export function gradePick(board: Pick[], id: string, status: Exclude<PickStatus, "pending">): Pick[] {
  const next = board.map((p) => {
    if (p.id !== id) return p;
    const resultUnits =
      status === "won" ? profitUnits(p.odds, p.units) : status === "lost" ? -p.units : 0;
    return { ...p, status, resultUnits: Math.round(resultUnits * 100) / 100 };
  });
  saveBoard(next);
  return next;
}

export function resetBoard(): Pick[] {
  writeJSON(BOARD_KEY, TODAY_PICKS);
  return TODAY_PICKS;
}
