import discord
from discord.ext import commands, tasks
from discord import app_commands
import os
import logging
from dotenv import load_dotenv
from db import init_db, add_pick, get_pending, settle_pick
from settle import settle_all_pending

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
    settle_loop.start()
    try:
        synced = await bot.tree.sync()
        print(f"Synced {len(synced)} command(s)")
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


def run_bot():
    """Start the Discord bot."""
    if not DISCORD_TOKEN:
        raise ValueError("DISCORD_TOKEN not set in environment variables")
    bot.run(DISCORD_TOKEN)


if __name__ == "__main__":
    run_bot()
