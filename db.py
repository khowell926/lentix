import sqlite3
from datetime import datetime, timedelta
from typing import Optional
import os
import logging
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

DB_PATH = os.path.join(os.path.dirname(__file__), "picks.db")
BACKUP_DIR = os.path.join(os.path.dirname(__file__), "backups")


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
) -> Optional[int]:
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
        The ID of the inserted pick, or None if failed
    """
    try:
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

        logger.info(f"Pick {pick_id} added: {sport} {pick_text} @ {odds}")
        return pick_id

    except sqlite3.Error as e:
        logger.error(f"Database error in add_pick: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in add_pick: {e}")
        return None


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
        True if successful, False if pick not found or error
    """
    try:
        if status not in ("won", "lost", "push", "void"):
            logger.error(f"Invalid status for pick {pick_id}: {status}")
            return False

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE picks SET status = ?, settled_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, pick_id))

        success = cursor.rowcount > 0
        conn.commit()
        conn.close()

        if success:
            logger.info(f"Pick {pick_id} settled as {status}")
        else:
            logger.warning(f"Pick {pick_id} not found")

        return success

    except sqlite3.Error as e:
        logger.error(f"Database error in settle_pick: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error in settle_pick: {e}")
        return False


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


def backup_database() -> Optional[str]:
    """
    Backup database to backups/ directory.
    Keeps last 14 days of backups.

    Returns:
        Path to backup file or None if failed
    """
    if not os.path.exists(DB_PATH):
        logger.warning("Database does not exist, skipping backup")
        return None

    try:
        # Create backup directory
        Path(BACKUP_DIR).mkdir(exist_ok=True)

        # Create timestamped backup
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(BACKUP_DIR, f"picks_{timestamp}.db")

        shutil.copy2(DB_PATH, backup_path)
        logger.info(f"Database backed up to {backup_path}")

        # Clean up old backups (keep last 14 days)
        cutoff = datetime.now() - timedelta(days=14)
        for backup_file in Path(BACKUP_DIR).glob("picks_*.db"):
            file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
            if file_time < cutoff:
                backup_file.unlink()
                logger.info(f"Deleted old backup: {backup_file.name}")

        return backup_path

    except Exception as e:
        logger.error(f"Error backing up database: {e}")
        return None


if __name__ == "__main__":
    # Initialize the database
    init_db()
    print(f"Database initialized at {DB_PATH}")
    backup_database()
    print(f"Backup created in {BACKUP_DIR}")
