"""Generate record card images using PIL."""

from PIL import Image, ImageDraw, ImageFont
from db import get_record
from typing import Optional
import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "picks.db")

# Design tokens
BG_COLOR = (7, 7, 9)  # #070709
HEADER_START = (0, 100, 150)  # Cyan
HEADER_END = (150, 50, 200)  # Violet
TEXT_COLOR = (240, 240, 240)  # Off-white
STAT_COLOR = (34, 197, 94)  # Green (#22c55e)
WARN_COLOR = (239, 68, 68)  # Red

CARD_WIDTH = 1200
CARD_HEIGHT = 800
PADDING = 40


def get_sport_stats(days: Optional[int] = None) -> dict:
    """Get stats broken down by sport."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    where_clause = "WHERE status IN ('won', 'lost', 'push', 'void')"
    params = []

    if days:
        where_clause = f"WHERE created_at >= datetime('now', ?) AND status IN ('won', 'lost', 'push', 'void')"
        params = [f"-{days} days"]

    cursor.execute(f"SELECT * FROM picks {where_clause}", params)
    picks = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # Group by sport
    sports = {}
    for pick in picks:
        sport = pick["sport"].upper()
        if sport not in sports:
            sports[sport] = {"won": 0, "lost": 0, "pushes": 0, "voids": 0, "units": 0.0}

        if pick["status"] == "won":
            sports[sport]["won"] += 1
            odds = pick["odds"]
            if odds > 0:
                profit = odds / 100
            else:
                profit = 100 / abs(odds)
            sports[sport]["units"] += profit
        elif pick["status"] == "lost":
            sports[sport]["lost"] += 1
            sports[sport]["units"] -= 1.0
        elif pick["status"] == "push":
            sports[sport]["pushes"] += 1
        elif pick["status"] == "void":
            sports[sport]["voids"] += 1

    # Sort by volume (wins + losses)
    sorted_sports = sorted(
        sports.items(),
        key=lambda x: x[1]["won"] + x[1]["lost"],
        reverse=True
    )

    return dict(sorted_sports[:4])  # Top 4 sports


def gradient_header(draw: ImageDraw.ImageDraw, width: int, height: int, y: int):
    """Draw a cyan-to-violet gradient header."""
    for x in range(width):
        ratio = x / width
        r = int(HEADER_START[0] * (1 - ratio) + HEADER_END[0] * ratio)
        g = int(HEADER_START[1] * (1 - ratio) + HEADER_END[1] * ratio)
        b = int(HEADER_START[2] * (1 - ratio) + HEADER_END[2] * ratio)
        draw.line([(x, y), (x, y + height)], fill=(r, g, b))


def generate_record_card(days: Optional[int] = None) -> Image.Image:
    """
    Generate a record card image.

    Args:
        days: Number of days (None = all time)

    Returns:
        PIL Image object
    """
    # Get record data
    record = get_record(days)
    sport_stats = get_sport_stats(days)

    # Create image
    img = Image.new("RGB", (CARD_WIDTH, CARD_HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Try to load fonts, fall back to default
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
        large_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        normal_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except:
        title_font = ImageFont.load_default()
        large_font = ImageFont.load_default()
        normal_font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    y = PADDING

    # Header gradient
    gradient_header(draw, CARD_WIDTH, 80, y)
    draw.text(
        (PADDING, y + 15),
        "LENTIX PICKS RECORD",
        fill=TEXT_COLOR,
        font=title_font
    )
    y += 100

    # Time period
    period_text = "ALL TIME" if not days else f"LAST {days} DAYS"
    draw.text((PADDING, y), period_text, fill=(150, 150, 150), font=small_font)
    y += 40

    # Overall stats
    draw.text((PADDING, y), "Overall", fill=TEXT_COLOR, font=large_font)
    y += 45

    wins = record["wins"]
    losses = record["losses"]
    pushes = record["pushes"]
    win_pct = record["win_pct"]
    net_units = record["net_units"]

    record_text = f"{wins}-{losses}-{pushes}"
    color = STAT_COLOR if net_units >= 0 else WARN_COLOR
    draw.text(
        (PADDING, y),
        f"{record_text}  |  {win_pct:.1f}% WIN  |  {net_units:+.2f}u",
        fill=color,
        font=normal_font
    )
    y += 60

    # Sport breakdown
    if sport_stats:
        draw.text((PADDING, y), "By Sport", fill=TEXT_COLOR, font=large_font)
        y += 45

        for sport, stats in sport_stats.items():
            total = stats["won"] + stats["lost"]
            sport_win_pct = (stats["won"] / total * 100) if total > 0 else 0
            units_color = STAT_COLOR if stats["units"] >= 0 else WARN_COLOR

            sport_line = f"{sport:6s}  {stats['won']}-{stats['lost']}  {sport_win_pct:5.1f}%  {stats['units']:+6.2f}u"
            draw.text((PADDING, y), sport_line, fill=units_color, font=normal_font)
            y += 35

    # Footer
    footer_y = CARD_HEIGHT - 40
    draw.text(
        (PADDING, footer_y),
        "Every pick logged. Losers included. | Lentix Picks",
        fill=(100, 100, 100),
        font=small_font
    )

    return img


if __name__ == "__main__":
    # Generate and save test cards
    img = generate_record_card()
    img.save("record_card_all_time.png")
    print("✓ Generated record_card_all_time.png")

    img7 = generate_record_card(days=7)
    img7.save("record_card_7d.png")
    print("✓ Generated record_card_7d.png")

    img30 = generate_record_card(days=30)
    img30.save("record_card_30d.png")
    print("✓ Generated record_card_30d.png")
