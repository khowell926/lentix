import os
import re
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple, List, Dict
import requests
from difflib import SequenceMatcher
from db import get_pending, settle_pick

logger = logging.getLogger(__name__)

API_KEY = os.getenv("THE_ODDS_API_KEY")
API_BASE = "https://api.the-odds-api.com/v4"

# Sport mappings to The Odds API sport keys
SPORT_MAP = {
    "nfl": "americanfootball_nfl",
    "nba": "basketball_nba",
    "nhl": "icehockey_nhl",
    "mlb": "baseball_mlb",
    "mls": "soccer_usa_mls",
    "ncaaf": "americanfootball_ncaaf",
    "ncaab": "basketball_ncaab",
    "epl": "soccer_epl",
    "champions": "soccer_uefa_champs",
}


def get_sport_key(sport: str) -> Optional[str]:
    """Convert sport name to The Odds API sport key."""
    return SPORT_MAP.get(sport.lower())


def fetch_scores(sport_key: str, days_from: int = 2) -> List[Dict]:
    """
    Fetch completed game scores from The Odds API.

    Args:
        sport_key: The Odds API sport key (e.g., 'americanfootball_nfl')
        days_from: Number of days back to look (default 2)

    Returns:
        List of completed games with scores
    """
    if not API_KEY:
        logger.warning("THE_ODDS_API_KEY not set")
        return []

    try:
        url = f"{API_BASE}/sports/{sport_key}/scores"
        params = {
            "apiKey": API_KEY,
            "daysFrom": days_from,
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        games = response.json()
        logger.info(f"Fetched {len(games)} games for {sport_key}")
        return games

    except requests.RequestException as e:
        logger.error(f"Error fetching scores for {sport_key}: {e}")
        return []


def fuzzy_match_score(s1: str, s2: str) -> float:
    """
    Calculate fuzzy match score between two strings (0-1).
    1.0 = perfect match, 0.0 = no match.
    """
    return SequenceMatcher(None, s1.lower(), s2.lower()).ratio()


def normalize_team_name(name: str) -> str:
    """Normalize team name for matching."""
    # Remove city prefixes, keep just team name
    return name.strip().lower()


def match_pick_to_game(pick: Dict, games: List[Dict]) -> Optional[Dict]:
    """
    Match a pending pick to a game.

    Tries event_id first, then fuzzy-matches on matchup + commence_time.

    Args:
        pick: Pick record from database
        games: List of completed games

    Returns:
        Matched game or None
    """
    # Try event_id match first (exact)
    if pick.get("event_id"):
        for game in games:
            if game.get("id") == pick["event_id"]:
                return game

    # Fuzzy match on matchup + time
    pick_matchup = pick["matchup"].lower()
    pick_time = pick.get("commence_time")

    best_match = None
    best_score = 0.5  # Threshold

    for game in games:
        # Build game matchup string
        home = game.get("home_team", "").lower()
        away = game.get("away_team", "").lower()
        game_matchup = f"{away} @ {home}".lower()

        # Score the matchup match
        match_score = fuzzy_match_score(pick_matchup, game_matchup)

        # Boost score if commence times are close (within 1 hour)
        if pick_time:
            try:
                game_time = datetime.fromisoformat(game.get("commence_time", "").replace("Z", "+00:00"))
                pick_time_dt = datetime.fromisoformat(pick_time.replace("Z", "+00:00") if pick_time else "")
                time_diff = abs((game_time - pick_time_dt).total_seconds())
                if time_diff < 3600:  # Within 1 hour
                    match_score += 0.1
            except (ValueError, TypeError):
                pass

        if match_score > best_score:
            best_score = match_score
            best_match = game

    return best_match if best_score > 0.6 else None


def parse_line(pick_text: str) -> Optional[Tuple[str, float]]:
    """
    Parse line type and value from pick text.

    Examples:
        "Chiefs -6.5" -> ("spread", -6.5)
        "o224.5" -> ("total", 224.5)
        "u105" -> ("total", 105.0)

    Returns:
        Tuple of (line_type, line_value) or None if can't parse
    """
    pick_text = pick_text.strip()

    # Total over/under (o/u prefix)
    total_match = re.search(r"^[ou](\d+(?:\.\d+)?)", pick_text.lower())
    if total_match:
        line_val = float(total_match.group(1))
        line_type = "over" if pick_text[0].lower() == "o" else "under"
        return (line_type, line_val)

    # Spread (number with +/- prefix)
    spread_match = re.search(r"([+-])(\d+(?:\.\d+)?)", pick_text)
    if spread_match:
        sign = 1 if spread_match.group(1) == "+" else -1
        line_val = sign * float(spread_match.group(2))
        return ("spread", line_val)

    return None


def grade_moneyline(pick_text: str, home_score: int, away_score: int, home_team: str) -> Optional[str]:
    """
    Grade a moneyline pick from final scores.

    Args:
        pick_text: The pick (e.g., "Chiefs ML", "Ravens")
        home_score: Home team final score
        away_score: Away team final score
        home_team: Home team name

    Returns:
        "won", "lost", "push", or None if can't determine
    """
    pick_lower = pick_text.lower()

    # Check for moneyline indicator
    if "ml" not in pick_lower and "moneyline" not in pick_lower:
        return None

    # Try to extract team name from pick
    # Common patterns: "Chiefs ML", "Chiefs", "Chiefs -110"
    pick_team = None
    for pattern in [r"(\w+)\s*ml", r"(\w+)\s*[-+]\d+", r"(\w+)"]:
        match = re.search(pattern, pick_lower)
        if match:
            pick_team = match.group(1).strip().lower()
            break

    if not pick_team:
        return None

    # Normalize team names for matching
    home_normalized = normalize_team_name(home_team)
    pick_team_normalized = pick_team

    # Check if pick is for home or away
    if fuzzy_match_score(pick_team_normalized, home_normalized) > 0.6:
        return "won" if home_score > away_score else ("lost" if home_score < away_score else "push")
    else:
        # Assume it's away team
        return "won" if away_score > home_score else ("lost" if away_score < home_score else "push")


def grade_spread(pick_text: str, home_score: int, away_score: int, home_team: str, line: float) -> Optional[str]:
    """
    Grade a spread pick.

    Args:
        pick_text: The pick (e.g., "Chiefs -6.5")
        home_score: Home team final score
        away_score: Away team final score
        home_team: Home team name
        line: The spread line (e.g., -6.5)

    Returns:
        "won", "lost", "push", or None
    """
    spread_match = re.search(r"([+-])(\d+(?:\.\d+)?)", pick_text)
    if not spread_match:
        return None

    sign = 1 if spread_match.group(1) == "+" else -1
    spread_val = sign * float(spread_match.group(2))

    # Check if pick is on home or away
    home_normalized = normalize_team_name(home_team)
    pick_lower = pick_text.lower()

    # Simple heuristic: if spread is negative, it's on home team
    # if positive, it's on away team (or first mentioned team)
    if spread_val < 0:
        # Favorite (home?)
        final_spread = home_score - away_score
    else:
        # Underdog (away?)
        final_spread = away_score - home_score

    if final_spread > spread_val:
        return "won"
    elif final_spread < spread_val:
        return "lost"
    else:
        return "push"


def grade_total(pick_type: str, total_line: float, home_score: int, away_score: int) -> Optional[str]:
    """
    Grade a total (over/under) pick.

    Args:
        pick_type: "over" or "under"
        total_line: The total line (e.g., 224.5)
        home_score: Home team final score
        away_score: Away team final score

    Returns:
        "won", "lost", "push", or None
    """
    final_total = home_score + away_score

    if pick_type == "over":
        if final_total > total_line:
            return "won"
        elif final_total < total_line:
            return "lost"
        else:
            return "push"
    elif pick_type == "under":
        if final_total < total_line:
            return "won"
        elif final_total > total_line:
            return "lost"
        else:
            return "push"

    return None


def settle_picks_for_sport(sport: str, games: List[Dict]) -> Tuple[int, int]:
    """
    Settle all pending picks for a sport.

    Args:
        sport: Sport name (e.g., 'NFL')
        games: List of completed games

    Returns:
        Tuple of (settled_count, unmatched_count)
    """
    pending = get_pending()
    sport_picks = [p for p in pending if p["sport"].upper() == sport.upper()]

    settled = 0
    unmatched = 0

    for pick in sport_picks:
        game = match_pick_to_game(pick, games)

        if not game:
            logger.warning(f"Pick {pick['id']} ({sport}) could not be matched to a game: {pick['matchup']}")
            unmatched += 1
            continue

        home_team = game.get("home_team", "")
        away_team = game.get("away_team", "")
        home_score = game.get("scores", [{}])[0].get("score")
        away_score = game.get("scores", [{}])[1].get("score") if len(game.get("scores", [])) > 1 else None

        # Check if game is complete
        if home_score is None or away_score is None:
            logger.debug(f"Game {game.get('id')} not yet complete")
            continue

        home_score = int(home_score)
        away_score = int(away_score)

        result = None

        # Try to grade based on pick type
        line_info = parse_line(pick["pick_text"])

        if line_info:
            line_type, line_val = line_info
            if line_type == "spread":
                result = grade_spread(pick["pick_text"], home_score, away_score, home_team, line_val)
            elif line_type in ("over", "under"):
                result = grade_total(line_type, line_val, home_score, away_score)
        else:
            # Try moneyline
            result = grade_moneyline(pick["pick_text"], home_score, away_score, home_team)

        if result:
            settle_pick(pick["id"], result)
            logger.info(f"Pick {pick['id']} settled as {result}: {pick['pick_text']} (final: {away_team} {away_score}-{home_score} {home_team})")
            settled += 1
        else:
            logger.warning(f"Pick {pick['id']} could not be graded (unparseable line): {pick['pick_text']}")
            unmatched += 1

    return (settled, unmatched)


def settle_all_pending() -> Dict[str, Tuple[int, int]]:
    """
    Settle all pending picks across all sports with pending picks.

    Returns:
        Dict mapping sport -> (settled_count, unmatched_count)
    """
    pending = get_pending()

    if not pending:
        logger.info("No pending picks to settle")
        return {}

    # Get unique sports with pending picks
    sports = set(p["sport"] for p in pending)

    results = {}

    for sport in sports:
        sport_key = get_sport_key(sport)
        if not sport_key:
            logger.warning(f"Unknown sport: {sport}")
            continue

        logger.info(f"Settling picks for {sport} ({sport_key})...")
        games = fetch_scores(sport_key)
        settled, unmatched = settle_picks_for_sport(sport, games)
        results[sport] = (settled, unmatched)

    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    results = settle_all_pending()
    for sport, (settled, unmatched) in results.items():
        print(f"{sport}: {settled} settled, {unmatched} unmatched")
