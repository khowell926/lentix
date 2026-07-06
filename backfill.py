"""
Import historical picks from CSV.

CSV format (header required):
date,sport,pick,odds,result,confidence,tier,league,matchup

Example:
2024-07-01,NFL,"Chiefs ML",-110,won,5,free,NFL,"Chiefs vs Ravens"
2024-07-01,NBA,"Lakers +3.5",110,lost,3,tier1,NBA,"Lakers vs Celtics"

Results: won, lost, push, void
"""

import csv
import logging
from datetime import datetime
from db import init_db
import sqlite3

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = "picks.db"


def import_csv(filepath: str, dry_run: bool = False) -> dict:
    """
    Import picks from CSV file.

    Args:
        filepath: Path to CSV file
        dry_run: If True, validate but don't insert

    Returns:
        Dict with imported, skipped, error counts
    """
    init_db()

    imported = 0
    skipped = 0
    errors = 0

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        with open(filepath, "r") as f:
            reader = csv.DictReader(f)

            if not reader.fieldnames:
                logger.error("CSV file is empty")
                return {"imported": 0, "skipped": 0, "errors": 1}

            required_fields = {"date", "sport", "pick", "odds", "result"}
            missing = required_fields - set(reader.fieldnames or [])
            if missing:
                logger.error(f"Missing required columns: {missing}")
                return {"imported": 0, "skipped": 0, "errors": 1}

            for row_num, row in enumerate(reader, start=2):
                try:
                    # Validate and parse fields
                    date_str = row.get("date", "").strip()
                    sport = row.get("sport", "").strip().upper()
                    pick = row.get("pick", "").strip()
                    odds_str = row.get("odds", "").strip()
                    result = row.get("result", "").strip().lower()
                    confidence = row.get("confidence", "3").strip()
                    tier = row.get("tier", "free").strip().lower()
                    league = row.get("league", "").strip()
                    matchup = row.get("matchup", "").strip()

                    # Validate date
                    try:
                        created_at = datetime.fromisoformat(date_str)
                    except ValueError:
                        logger.error(f"Row {row_num}: Invalid date '{date_str}'")
                        errors += 1
                        continue

                    # Validate sport
                    if not sport:
                        logger.error(f"Row {row_num}: Missing sport")
                        errors += 1
                        continue

                    # Validate pick
                    if not pick:
                        logger.error(f"Row {row_num}: Missing pick")
                        errors += 1
                        continue

                    # Validate odds
                    try:
                        odds = int(odds_str)
                    except ValueError:
                        logger.error(f"Row {row_num}: Invalid odds '{odds_str}'")
                        errors += 1
                        continue

                    # Validate result
                    if result not in ("won", "lost", "push", "void"):
                        logger.error(f"Row {row_num}: Invalid result '{result}' (must be won/lost/push/void)")
                        errors += 1
                        continue

                    # Validate confidence
                    try:
                        confidence = int(confidence)
                        if not (1 <= confidence <= 5):
                            raise ValueError
                    except (ValueError, TypeError):
                        logger.warning(f"Row {row_num}: Invalid confidence '{confidence}', using 3")
                        confidence = 3

                    # Validate tier
                    if tier not in ("free", "tier1", "tier2"):
                        logger.warning(f"Row {row_num}: Invalid tier '{tier}', using 'free'")
                        tier = "free"

                    # Default matchup if not provided
                    if not matchup:
                        matchup = f"{sport} Game"

                    if dry_run:
                        logger.info(f"Row {row_num}: Would insert {sport} {pick} @ {odds} ({result})")
                        imported += 1
                    else:
                        # Insert into database
                        cursor.execute("""
                            INSERT INTO picks (
                                created_at, sport, league, pick_text, matchup, odds,
                                confidence, tier, status, settled_at, posted_by
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            created_at.isoformat(),
                            sport,
                            league or None,
                            pick,
                            matchup,
                            odds,
                            confidence,
                            tier,
                            result,
                            datetime.now().isoformat() if result != "pending" else None,
                            "backfill"
                        ))
                        logger.info(f"Row {row_num}: Imported {sport} {pick} @ {odds} ({result})")
                        imported += 1

                except Exception as e:
                    logger.error(f"Row {row_num}: Error - {str(e)}")
                    errors += 1

    except FileNotFoundError:
        logger.error(f"File not found: {filepath}")
        return {"imported": 0, "skipped": 0, "errors": 1}
    except Exception as e:
        logger.error(f"Error reading file: {str(e)}")
        return {"imported": 0, "skipped": 0, "errors": 1}
    finally:
        if not dry_run:
            conn.commit()
        conn.close()

    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors
    }


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python backfill.py <csv_file> [--dry-run]")
        print("\nExample CSV format:")
        print("date,sport,pick,odds,result,confidence,tier,league,matchup")
        print("2024-07-01,NFL,'Chiefs ML',-110,won,5,free,NFL,'Chiefs vs Ravens'")
        sys.exit(1)

    filepath = sys.argv[1]
    dry_run = "--dry-run" in sys.argv

    if dry_run:
        logger.info("Running in DRY-RUN mode (no changes will be made)")

    results = import_csv(filepath, dry_run=dry_run)

    print(f"\n{'DRY RUN: ' if dry_run else ''}Results:")
    print(f"  Imported: {results['imported']}")
    print(f"  Skipped:  {results['skipped']}")
    print(f"  Errors:   {results['errors']}")

    if not dry_run and results["imported"] > 0:
        print(f"\n✅ Imported {results['imported']} picks to {DB_PATH}")
