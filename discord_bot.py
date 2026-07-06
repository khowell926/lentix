import discord
from discord.ext import commands, tasks
from discord import app_commands
import os
import logging
from dotenv import load_dotenv
from db import init_db, add_pick, get_pending, settle_pick, backup_database
from settle import settle_all_pending
from record_card import generate_record_card
from io import BytesIO
from datetime import datetime
import pytz

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
GUILD_ID = os.getenv("GUILD_ID")  # Optional: for testing in a specific guild

# Initialize database
init_db()

# Create bot with command prefix (for traditional commands if needed)
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    """Called when the bot is ready."""
    print(f"{bot.user} has connected to Discord!")
    if not settle_loop.is_running():
        settle_loop.start()
    if not weekly_summary_task.is_running():
        weekly_summary_task.start()
    if not nightly_backup_task.is_running():
        nightly_backup_task.start()
    try:
        # Per-guild sync makes slash commands appear instantly (global sync
        # can take up to an hour). Copy the global command set into every
        # guild the bot is in, then also do a global sync as a fallback.
        for guild in bot.guilds:
            bot.tree.copy_global_to(guild=guild)
            synced = await bot.tree.sync(guild=guild)
            print(f"Synced {len(synced)} command(s) to guild: {guild.name}")
        await bot.tree.sync()
    except Exception as e:
        print(f"Failed to sync commands: {e}")


async def update_pick_reaction(pick: dict, status: str):
    """Update Discord message with settlement reaction."""
    if not pick.get("discord_message_id"):
        return

    emoji_map = {"won": "✅", "lost": "❌", "push": "➖", "void": "⚠️"}
    emoji = emoji_map.get(status, "🔄")

    try:
        # Try to find and update the message in any visible channel
        for guild in bot.guilds:
            for channel in guild.text_channels:
                try:
                    message = await channel.fetch_message(int(pick["discord_message_id"]))
                    await message.add_reaction(emoji)
                    logger.info(f"Updated reaction on message {pick['discord_message_id']}")
                    return
                except discord.NotFound:
                    continue
                except Exception as e:
                    logger.debug(f"Could not fetch message in {channel}: {e}")
    except Exception as e:
        logger.warning(f"Could not update reaction for pick {pick['id']}: {e}")


@tasks.loop(minutes=30)
async def settle_loop():
    """Background task to settle picks every 30 minutes."""
    try:
        logger.info("Running settle_loop...")
        results = settle_all_pending()
        for sport, (settled, unmatched) in results.items():
            logger.info(f"{sport}: {settled} settled, {unmatched} unmatched")
    except Exception as e:
        logger.error(f"Error in settle_loop: {e}")


@settle_loop.before_loop
async def before_settle_loop():
    """Wait for bot to be ready before starting settle_loop."""
    await bot.wait_until_ready()


@bot.tree.command(
    name="pick",
    description="Post a premium or standard pick"
)
@app_commands.describe(
    sport="Sport (e.g., NFL, NBA, MLB)",
    league="League name",
    matchup="Matchup description (e.g., Chiefs vs Ravens)",
    selection="The pick (e.g., Chiefs ML)",
    odds="American odds (e.g., -110, +150)",
    confidence="Confidence level 1-5",
    tier="Pick tier (free, tier1, tier2)",
    event_id="Optional: external event ID",
    commence_time="Optional: event start time (YYYY-MM-DD HH:MM:SS)"
)
async def post_pick(
    interaction: discord.Interaction,
    sport: str,
    league: str,
    matchup: str,
    selection: str,
    odds: int,
    confidence: int,
    tier: str,
    event_id: str = None,
    commence_time: str = None,
):
    """Post a new pick (premium/standard)."""
    try:
        # Validate tier
        if tier not in ("free", "tier1", "tier2"):
            await interaction.response.send_message(
                "❌ Tier must be 'free', 'tier1', or 'tier2'",
                ephemeral=True
            )
            return

        # Validate confidence
        if not (1 <= confidence <= 5):
            await interaction.response.send_message(
                "❌ Confidence must be between 1 and 5",
                ephemeral=True
            )
            return

        # Defer the response since we'll send a message
        await interaction.response.defer()

        # Post the pick embed
        embed = discord.Embed(
            title=f"📊 {sport} {tier.upper()}",
            description=f"**{matchup}**",
            color=discord.Color.green() if tier == "free" else discord.Color.gold()
        )
        embed.add_field(name="Pick", value=selection, inline=False)
        embed.add_field(name="Odds", value=f"{odds:+d}", inline=True)
        embed.add_field(name="Confidence", value=f"{'🔥' * confidence}", inline=True)
        embed.add_field(name="Posted by", value=interaction.user.mention, inline=False)

        # Send the embed
        message = await interaction.followup.send(embed=embed)

        # Log to database
        pick_id = add_pick(
            sport=sport,
            league=league,
            pick_text=selection,
            matchup=matchup,
            odds=odds,
            confidence=confidence,
            tier=tier,
            posted_by=str(interaction.user),
            event_id=event_id,
            commence_time=commence_time,
            discord_message_id=str(message.id)
        )

        # Send confirmation
        await interaction.followup.send(
            f"✅ Pick logged (ID: {pick_id}) | **{selection}** @ {odds}",
            ephemeral=True
        )

    except Exception as e:
        await interaction.followup.send(
            f"❌ Error posting pick: {str(e)}",
            ephemeral=True
        )
        print(f"Error in /pick command: {e}")


@bot.tree.command(
    name="free",
    description="Post a free pick"
)
@app_commands.describe(
    sport="Sport (e.g., NFL, NBA, MLB)",
    league="League name",
    matchup="Matchup description (e.g., Chiefs vs Ravens)",
    selection="The pick (e.g., Chiefs ML)",
    odds="American odds (e.g., -110, +150)",
    confidence="Confidence level 1-5",
    event_id="Optional: external event ID",
    commence_time="Optional: event start time (YYYY-MM-DD HH:MM:SS)"
)
async def post_free_pick(
    interaction: discord.Interaction,
    sport: str,
    league: str,
    matchup: str,
    selection: str,
    odds: int,
    confidence: int,
    event_id: str = None,
    commence_time: str = None,
):
    """Post a free pick (shorthand for /pick tier:free)."""
    try:
        # Validate confidence
        if not (1 <= confidence <= 5):
            await interaction.response.send_message(
                "❌ Confidence must be between 1 and 5",
                ephemeral=True
            )
            return

        # Defer the response
        await interaction.response.defer()

        # Post the pick embed (free tier)
        embed = discord.Embed(
            title=f"📊 {sport} FREE",
            description=f"**{matchup}**",
            color=discord.Color.green()
        )
        embed.add_field(name="Pick", value=selection, inline=False)
        embed.add_field(name="Odds", value=f"{odds:+d}", inline=True)
        embed.add_field(name="Confidence", value=f"{'🔥' * confidence}", inline=True)
        embed.add_field(name="Posted by", value=interaction.user.mention, inline=False)

        # Send the embed
        message = await interaction.followup.send(embed=embed)

        # Log to database as 'free' tier
        pick_id = add_pick(
            sport=sport,
            league=league,
            pick_text=selection,
            matchup=matchup,
            odds=odds,
            confidence=confidence,
            tier="free",
            posted_by=str(interaction.user),
            event_id=event_id,
            commence_time=commence_time,
            discord_message_id=str(message.id)
        )

        # Send confirmation
        await interaction.followup.send(
            f"✅ Free pick logged (ID: {pick_id}) | **{selection}** @ {odds}",
            ephemeral=True
        )

    except Exception as e:
        await interaction.followup.send(
            f"❌ Error posting pick: {str(e)}",
            ephemeral=True
        )
        print(f"Error in /free command: {e}")


@bot.tree.command(
    name="settle",
    description="[Admin] Manually trigger pick settlement"
)
@app_commands.checks.has_role("Picks Admin")
async def manual_settle(interaction: discord.Interaction):
    """Manually trigger settlement of all pending picks."""
    try:
        await interaction.response.defer()

        results = settle_all_pending()

        if not results:
            await interaction.followup.send("✅ No pending picks to settle")
            return

        summary = "**Settlement Results:**\n"
        total_settled = 0
        total_unmatched = 0

        for sport, (settled, unmatched) in results.items():
            summary += f"\n**{sport}:** {settled} settled, {unmatched} unmatched"
            total_settled += settled
            total_unmatched += unmatched

        summary += f"\n\n**Total:** {total_settled} settled, {total_unmatched} unmatched"
        await interaction.followup.send(summary)

    except discord.ext.commands.MissingRole:
        await interaction.response.send_message(
            "❌ You need the 'Picks Admin' role to use this command",
            ephemeral=True
        )
    except Exception as e:
        await interaction.followup.send(f"❌ Error settling picks: {str(e)}")
        logger.error(f"Error in /settle command: {e}")


@bot.tree.command(
    name="grade",
    description="[Admin] Manually grade a pick"
)
@app_commands.describe(
    pick_id="The pick ID to grade",
    result="Result: won, lost, push, or void"
)
@app_commands.checks.has_role("Picks Admin")
async def manual_grade(
    interaction: discord.Interaction,
    pick_id: int,
    result: str
):
    """Manually grade a pick when the parser couldn't."""
    try:
        if result not in ("won", "lost", "push", "void"):
            await interaction.response.send_message(
                "❌ Result must be: won, lost, push, or void",
                ephemeral=True
            )
            return

        await interaction.response.defer()

        # Find and update the pick
        pending = get_pending()
        pick = next((p for p in pending if p["id"] == pick_id), None)

        if not pick:
            await interaction.followup.send(f"❌ Pick {pick_id} not found or already settled")
            return

        if settle_pick(pick_id, result):
            emoji_map = {"won": "✅", "lost": "❌", "push": "➖", "void": "⚠️"}
            emoji = emoji_map.get(result, "🔄")

            await interaction.followup.send(
                f"{emoji} Pick {pick_id} graded as **{result.upper()}**: {pick['pick_text']} @ {pick['odds']}"
            )

            # Try to update Discord message with reaction
            if pick.get("discord_message_id"):
                try:
                    channel = interaction.channel
                    message = await channel.fetch_message(int(pick["discord_message_id"]))
                    await message.add_reaction(emoji)
                except Exception as e:
                    logger.warning(f"Could not add reaction to message {pick['discord_message_id']}: {e}")

            logger.info(f"Pick {pick_id} manually graded as {result}")
        else:
            await interaction.followup.send(f"❌ Failed to grade pick {pick_id}")

    except discord.ext.commands.MissingRole:
        await interaction.response.send_message(
            "❌ You need the 'Picks Admin' role to use this command",
            ephemeral=True
        )
    except Exception as e:
        await interaction.followup.send(f"❌ Error grading pick: {str(e)}")
        logger.error(f"Error in /grade command: {e}")


@bot.tree.command(
    name="record",
    description="Post the picks record as an image card"
)
async def post_record(interaction: discord.Interaction):
    """Post the record card to the channel."""
    try:
        await interaction.response.defer()

        # Generate card image
        img = generate_record_card()

        # Convert to bytes
        img_bytes = BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        # Send as file
        await interaction.followup.send(
            file=discord.File(img_bytes, filename="record.png")
        )

    except Exception as e:
        await interaction.followup.send(f"❌ Error generating record card: {str(e)}")
        logger.error(f"Error in /record command: {e}")


@bot.tree.command(
    name="pending",
    description="[Admin] List all unsettled picks with IDs"
)
@app_commands.checks.has_role("Picks Admin")
async def list_pending(interaction: discord.Interaction):
    """List all pending picks for manual review."""
    try:
        await interaction.response.defer()

        pending = get_pending()

        if not pending:
            await interaction.followup.send("✅ No pending picks!")
            return

        # Build table
        msg = f"**{len(pending)} Pending Picks:**\n```\n"
        msg += "ID    Sport  Pick                   Odds   Posted\n"
        msg += "-" * 60 + "\n"

        for pick in pending[:20]:  # Limit to 20 for readability
            created = datetime.fromisoformat(pick["created_at"]).strftime("%m-%d")
            pick_text = pick["pick_text"][:18].ljust(18)
            msg += f"{pick['id']:4d}  {pick['sport']:5s}  {pick_text}  {pick['odds']:5d}  {created}\n"

        if len(pending) > 20:
            msg += f"\n... and {len(pending) - 20} more\n"

        msg += "```"
        await interaction.followup.send(msg)

    except discord.ext.commands.MissingRole:
        await interaction.response.send_message(
            "❌ You need the 'Picks Admin' role to use this command",
            ephemeral=True
        )
    except Exception as e:
        await interaction.followup.send(f"❌ Error listing picks: {str(e)}")
        logger.error(f"Error in /pending command: {e}")


@tasks.loop(hours=1)
async def weekly_summary_task():
    """Post weekly summary every Sunday at 6pm ET."""
    et = pytz.timezone("America/New_York")
    now = datetime.now(et)

    # Check if it's Sunday at 6pm (within the hour)
    if now.weekday() != 6 or now.hour != 18:
        return

    try:
        logger.info("Running weekly summary task...")

        # Find #announcements channel
        announcements_channel = None
        for guild in bot.guilds:
            for channel in guild.text_channels:
                if channel.name == "announcements":
                    announcements_channel = channel
                    break

        if not announcements_channel:
            logger.warning("Could not find #announcements channel")
            return

        # Generate record card for last 7 days
        img = generate_record_card(days=7)
        img_bytes = BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        # Get best and worst picks
        from db import get_record
        import sqlite3
        DB_PATH = os.path.join(os.path.dirname(__file__), "picks.db")
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM picks
            WHERE created_at >= datetime('now', '-7 days')
            AND status IN ('won', 'lost')
            ORDER BY created_at DESC
        """)

        settled_picks = [dict(row) for row in cursor.fetchall()]
        conn.close()

        best_pick = None
        worst_pick = None

        for pick in settled_picks:
            if pick["status"] == "won":
                if best_pick is None or pick["odds"] > best_pick["odds"]:
                    best_pick = pick
            elif pick["status"] == "lost":
                if worst_pick is None:
                    worst_pick = pick

        # Build summary message
        record = get_record(days=7)
        wins = record["wins"]
        losses = record["losses"]
        net_units = record["net_units"]

        summary_msg = f"**THE WEEK HONEST**\n\n"
        summary_msg += f"**{wins}-{losses}** on the week, **{net_units:+.2f}u**"

        if best_pick:
            summary_msg += f"\n**Best:** {best_pick['pick_text']} @ {best_pick['odds']} ✅"
        if worst_pick:
            summary_msg += f"\n**Worst:** {worst_pick['pick_text']} @ {worst_pick['odds']} ❌"

        await announcements_channel.send(
            summary_msg,
            file=discord.File(img_bytes, filename="weekly_record.png")
        )
        logger.info("Weekly summary posted")

    except Exception as e:
        logger.error(f"Error in weekly_summary_task: {e}")


@weekly_summary_task.before_loop
async def before_weekly_summary_task():
    """Wait for bot to be ready."""
    await bot.wait_until_ready()


@tasks.loop(hours=24)
async def nightly_backup_task():
    """Backup database nightly at midnight ET."""
    et = pytz.timezone("America/New_York")
    now = datetime.now(et)

    # Run at midnight (0:00 AM)
    if now.hour != 0:
        return

    try:
        logger.info("Running nightly backup...")
        backup_database()
    except Exception as e:
        logger.error(f"Error in nightly_backup_task: {e}")


@nightly_backup_task.before_loop
async def before_nightly_backup_task():
    """Wait for bot to be ready."""
    await bot.wait_until_ready()


def run_bot():
    """Start the Discord bot."""
    if not DISCORD_TOKEN:
        raise ValueError("DISCORD_TOKEN not set in environment variables")
    bot.run(DISCORD_TOKEN)


if __name__ == "__main__":
    run_bot()
