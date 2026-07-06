import { useEffect, useState } from "react";

interface RecordData {
  status: string;
  timestamp: string;
  overall: {
    wins: number;
    losses: number;
    pushes: number;
    voids: number;
    win_pct: number;
    net_units: number;
  };
  period: string;
}

export function LiveRecord() {
  const [record, setRecord] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/record`);
      const data = await response.json();
      setRecord(data);
      setLastUpdated(new Date().toLocaleTimeString("en-US"));
    } catch (error) {
      console.error("Error fetching record:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
    const interval = setInterval(fetchRecord, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading && !record) {
    return (
      <div className="live-record loading">
        <p>Loading record...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="live-record error">
        <p>Could not load record</p>
      </div>
    );
  }

  const { wins, losses, pushes, win_pct, net_units } = record.overall;
  const unitsColor = net_units >= 0 ? "positive" : "negative";

  return (
    <div className="live-record">
      <div className="lr-header">
        <h3>Live Record</h3>
        <span className="lr-updated">{lastUpdated}</span>
      </div>

      <div className="lr-stats">
        <div className="lr-stat">
          <span className="lr-label">Record</span>
          <span className="lr-value">
            {wins}-{losses}-{pushes}
          </span>
        </div>

        <div className="lr-stat">
          <span className="lr-label">Win %</span>
          <span className="lr-value">{win_pct.toFixed(1)}%</span>
        </div>

        <div className={`lr-stat ${unitsColor}`}>
          <span className="lr-label">Net Units</span>
          <span className="lr-value">{net_units >= 0 ? "+" : ""}{net_units.toFixed(2)}u</span>
        </div>
      </div>
    </div>
  );
}
