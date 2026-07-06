import sqlite3
from datetime import datetime, timedelta
from typing import Optional
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "picks.db")


def init_db():
    """Initialize the database with the picks table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS picks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            sport TEXT NOT NULL,
            league TEXT,
            pick_text TEXT NOT NULL,
            matchup TEXT NOT NULL,
            odds INTEGER NOT NULL,
            confidence INTEGER NOT NULL CHECK(confidence >= 1 AND confidence <= 5),
            tier TEXT NOT NULL CHECK(tier IN ('free', 'tier1', 'tier2')),
            event_id TEXT,
            commence_time TIMESTAMP,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'won', 'lost', 'push', 'void')),
            settled_at TIMESTAMP,
            posted_by TEXT NOT NULL,
            discord_message_id TEXT
        )
    """)

    # Create index on status for faster queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_picks_status ON picks(status)
    """)

    # Create index on created_at for time-range queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_picks_created_at ON picks(created_at)
    """)

    conn.commit()
    conn.close()


def add_pick(
    sport: str,
    league: str,
    pick_text: str,
    matchup: str,
    odds: int,
    confidence: int,
    tier: str,
    posted_by: str,
    event_id: Optional[str] = None,
    commence_time: Optional[str] = None,
    discord_message_id: Optional[str] = None,
) -> int:
    """
    Add a new pick to the database.

    Args:
        sport: Sport name (e.g., 'NFL', 'NBA')
        league: League name
        pick_text: The pick description (e.g., "Chiefs ML")
        matchup: The matchup (e.g., "Chiefs vs Ravens")
        odds: American odds (e.g., -110, +150)
        confidence: Confidence level (1-5)
        tier: 'free', 'tier1', or 'tier2'
        posted_by: Discord username or ID of who posted it
        event_id: Optional external event ID
        commence_time: Optional timestamp when the event starts
        discord_message_id: Optional Discord message ID for reference

    Returns:
        The ID of the inserted pick
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO picks (
            sport, league, pick_text, matchup, odds, confidence, tier,
            posted_by, event_id, commence_time, discord_message_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        sport, league, pick_text, matchup, odds, confidence, tier,
        posted_by, event_id, commence_time, discord_message_id
    ))

    pick_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return pick_id


def get_pending() -> list:
    """Get all pending picks."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM picks WHERE status = 'pending' ORDER BY created_at DESC
    """)

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def settle_pick(pick_id: int, status: str) -> bool:
    """
    Settle a pick with a status (won, lost, push, void).

    Args:
        pick_id: The ID of the pick to settle
        status: Settlement status ('won', 'lost', 'push', 'void')

    Returns:
        True if successful, False if pick not found
    """
    if status not in ("won", "lost", "push", "void"):
        raise ValueError(f"Invalid status: {status}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE picks SET status = ?, settled_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (status, pick_id))

    success = cursor.rowcount > 0
    conn.commit()
    conn.close()

    return success


def get_record(days: Optional[int] = None) -> dict:
    """
    Get record statistics for picks.

    Args:
        days: Number of days to look back (None = all time)

    Returns:
        Dict with: wins, losses, pushes, voids, win_pct, net_units
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    where_clause = ""
    params = []

    if days:
        where_clause = "WHERE created_at >= datetime('now', ?)"
        params = [f"-{days} days"]
    else:
        where_clause = "WHERE status IN ('won', 'lost', 'push', 'void')"

    # Get settled picks
    cursor.execute(f"""
        SELECT * FROM picks {where_clause}
    """, params)

    picks = [dict(row) for row in cursor.fetchall()]
    conn.close()

    wins = sum(1 for p in picks if p["status"] == "won")
    losses = sum(1 for p in picks if p["status"] == "lost")
    pushes = sum(1 for p in picks if p["status"] == "push")
    voids = sum(1 for p in picks if p["status"] == "void")

    total_decisive = wins + losses
    win_pct = (wins / total_decisive * 100) if total_decisive > 0 else 0

    # Calculate net units: +profit for wins, -1u for losses
    net_units = 0.0
    for pick in picks:
        if pick["status"] == "won":
            # American odds to units profit at 1u stake
            odds = pick["odds"]
            if odds > 0:
                profit = (odds / 100)
            else:
                profit = (100 / abs(odds))
            net_units += profit
        elif pick["status"] == "lost":
            net_units -= 1.0

    return {
        "wins": wins,
        "losses": losses,
        "pushes": pushes,
        "voids": voids,
        "win_pct": round(win_pct, 1),
        "net_units": round(net_units, 2),
    }


if __name__ == "__main__":
    # Initialize the database
    init_db()
    print(f"Database initialized at {DB_PATH}")
