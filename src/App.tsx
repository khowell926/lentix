import { useEffect, useState } from "react";
import { OpportunityMap } from "@/components/OpportunityMap";
import { LeadPipeline } from "@/components/LeadPipeline";
import { ensureSeedVersion } from "@/lib/storage";

type View = "map" | "pipeline";

export default function App() {
  const [view, setView] = useState<View>("map");

  useEffect(() => {
    ensureSeedVersion();
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark">◇</span>
          <span>
            LENTIX
            <small>KNOW THE MARKET · WIN THE CONTRACT</small>
          </span>
        </div>

        <nav className="tabs">
          <button
            className={`tab ${view === "map" ? "active" : ""}`}
            onClick={() => setView("map")}
          >
            Opportunity Map
          </button>
          <button
            className={`tab ${view === "pipeline" ? "active" : ""}`}
            onClick={() => setView("pipeline")}
          >
            Lead Deep-Dive
          </button>
        </nav>

        <div className="topbar-spacer" />
        <div className="topbar-meta">
          <b>Lead-to-Revenue Intelligence</b>
          <br />
          DMV Fleet Wash &amp; Drone Services
        </div>
      </header>

      <main className="content">{view === "map" ? <OpportunityMap /> : <LeadPipeline />}</main>
    </div>
  );
}
