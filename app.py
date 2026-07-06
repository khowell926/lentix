"""Flask API for picks record and stats."""

from flask import Flask, jsonify, send_file
from flask_cors import CORS
from datetime import datetime
from io import BytesIO
import logging
import os
from db import get_record
from record_card import generate_record_card

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.route("/api/record", methods=["GET"])
def api_record():
    """Return record stats as JSON."""
    try:
        record = get_record()

        return jsonify({
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat(),
            "overall": {
                "wins": record["wins"],
                "losses": record["losses"],
                "pushes": record["pushes"],
                "voids": record["voids"],
                "win_pct": record["win_pct"],
                "net_units": record["net_units"],
            },
            "period": "all_time"
        })

    except Exception as e:
        logger.error(f"Error in /api/record: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/record/7d", methods=["GET"])
def api_record_7d():
    """Return 7-day record stats as JSON."""
    try:
        record = get_record(days=7)

        return jsonify({
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat(),
            "overall": {
                "wins": record["wins"],
                "losses": record["losses"],
                "pushes": record["pushes"],
                "voids": record["voids"],
                "win_pct": record["win_pct"],
                "net_units": record["net_units"],
            },
            "period": "last_7_days"
        })

    except Exception as e:
        logger.error(f"Error in /api/record/7d: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/record/30d", methods=["GET"])
def api_record_30d():
    """Return 30-day record stats as JSON."""
    try:
        record = get_record(days=30)

        return jsonify({
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat(),
            "overall": {
                "wins": record["wins"],
                "losses": record["losses"],
                "pushes": record["pushes"],
                "voids": record["voids"],
                "win_pct": record["win_pct"],
                "net_units": record["net_units"],
            },
            "period": "last_30_days"
        })

    except Exception as e:
        logger.error(f"Error in /api/record/30d: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/record/image", methods=["GET"])
def api_record_image():
    """Return record card as PNG image."""
    try:
        img = generate_record_card()
        img_bytes = BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        return send_file(
            img_bytes,
            mimetype="image/png",
            as_attachment=False,
            download_name="record.png"
        )

    except Exception as e:
        logger.error(f"Error in /api/record/image: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "lentix-picks-api"})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
