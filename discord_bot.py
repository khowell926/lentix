import discord
from discord.ext import commands
from discord import app_commands
import os
from dotenv import load_dotenv
from db import init_db, add_pick

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
    try:
        synced = await bot.tree.sync()
        print(f"Synced {len(synced)} command(s)")
    except Exception as e:
        print(f"Failed to sync commands: {e}")


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


def run_bot():
    """Start the Discord bot."""
    if not DISCORD_TOKEN:
        raise ValueError("DISCORD_TOKEN not set in environment variables")
    bot.run(DISCORD_TOKEN)


if __name__ == "__main__":
    run_bot()
