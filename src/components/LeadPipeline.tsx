import { useState } from "react";
import type { Lead } from "@/types";
import { LEADS } from "@/data/leads";
import { cachedResult } from "@/lib/deepDiveAgent";
import { LeadCard } from "@/components/LeadCard";
import { DeepDiveDrawer } from "@/components/DeepDiveDrawer";

export function LeadPipeline() {
  const [active, setActive] = useState<Lead | null>(null);
  // bump to force re-read of the "cached brief" indicator after a run
  const [, setTick] = useState(0);

  const closeDrawer = () => {
    setActive(null);
    setTick((t) => t + 1);
  };

  return (
    <div className="pipeline-page">
      <div className="pipeline-head">
        <h2>Commercial Pipeline</h2>
        <p>
          Each card carries live deal data. Hit <b>AI Deep-Dive</b> to fire the research agent and
          read a 20-field briefing side-by-side with the deal.
        </p>
      </div>

      <div className="lead-grid">
        {LEADS.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onDeepDive={setActive}
            hasCachedBrief={cachedResult(lead.id) !== null}
          />
        ))}
      </div>

      {active && <DeepDiveDrawer lead={active} onClose={closeDrawer} />}
    </div>
  );
}
