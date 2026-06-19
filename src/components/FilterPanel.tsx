import type { Tier, Zone } from "@/types";
import { TIER_LABEL } from "@/lib/scoring";

export interface MapFilters {
  search: string;
  tiers: Record<Tier, boolean>;
  zone: Zone | "all";
  minScore: number;
}

export const DEFAULT_FILTERS: MapFilters = {
  search: "",
  tiers: { hot: true, warm: true, watch: true },
  zone: "all",
  minScore: 0,
};

const ZONES: (Zone | "all")[] = [
  "all",
  "Prince George's",
  "Fairfax",
  "Arlington",
  "Loudoun",
  "Prince William",
  "Montgomery",
  "DC",
];

interface Props {
  filters: MapFilters;
  onChange: (next: MapFilters) => void;
  tierCounts: Record<Tier, number>;
  visibleCount: number;
  totalCount: number;
}

const TIER_ORDER: Tier[] = ["hot", "warm", "watch"];

export function FilterPanel({ filters, onChange, tierCounts, visibleCount, totalCount }: Props) {
  const toggleTier = (t: Tier) =>
    onChange({ ...filters, tiers: { ...filters.tiers, [t]: !filters.tiers[t] } });

  return (
    <aside className="filter-panel">
      <h2>⚙︎ Filters</h2>

      <div className="filter-group">
        <label htmlFor="f-search">Search</label>
        <input
          id="f-search"
          className="search-input"
          placeholder="School or district…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="filter-group">
        <label>Opportunity Tier</label>
        <div className="tier-toggles">
          {TIER_ORDER.map((t) => (
            <button
              key={t}
              className={`tier-toggle ${filters.tiers[t] ? "" : "off"}`}
              onClick={() => toggleTier(t)}
              aria-pressed={filters.tiers[t]}
            >
              <span className="left">
                <span className={`chip dot dot-${t}`} aria-hidden />
                {TIER_LABEL[t]}
              </span>
              <span className="count">{tierCounts[t]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label htmlFor="f-zone">Zone / County</label>
        <select
          id="f-zone"
          className="select-input"
          value={filters.zone}
          onChange={(e) => onChange({ ...filters, zone: e.target.value as Zone | "all" })}
        >
          {ZONES.map((z) => (
            <option key={z} value={z}>
              {z === "all" ? "All zones" : z}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="f-score">Min Opportunity Score</label>
        <div className="range-row">
          <input
            id="f-score"
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.minScore}
            onChange={(e) => onChange({ ...filters, minScore: Number(e.target.value) })}
          />
          <span className="val">{filters.minScore}</span>
        </div>
      </div>

      <button className="filter-reset" onClick={() => onChange(DEFAULT_FILTERS)}>
        Reset filters
      </button>

      <div className="filter-summary">
        Showing <b>{visibleCount}</b> of <b>{totalCount}</b> schools.
        <br />
        Bubble size = enrollment · color = opportunity tier.
      </div>
    </aside>
  );
}
