#!/bin/bash

# Start both Discord bot and Flask API

echo "Starting Lentix Picks platform..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copy .env.example and set your tokens:"
    echo "   DISCORD_TOKEN=your_token"
    echo "   THE_ODDS_API_KEY=your_api_key"
    exit 1
fi

# Start Flask API in background
echo "▶️  Starting Flask API on port 5000..."
python3 app.py > logs/flask.log 2>&1 &
FLASK_PID=$!
echo "   Flask PID: $FLASK_PID"

# Start Discord bot in background
echo "▶️  Starting Discord bot..."
python3 discord_bot.py > logs/bot.log 2>&1 &
BOT_PID=$!
echo "   Bot PID: $BOT_PID"

echo ""
echo "✅ Both services started!"
echo ""
echo "Logs:"
echo "  Flask API: tail -f logs/flask.log"
echo "  Discord:   tail -f logs/bot.log"
echo ""
echo "To stop: kill $FLASK_PID $BOT_PID"
echo ""

# Keep script running, allow graceful shutdown
trap "kill $FLASK_PID $BOT_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
