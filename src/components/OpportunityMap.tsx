import { useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet";
import type { School, Tier } from "@/types";
import { SCHOOLS } from "@/data/schools";
import {
  TIER_COLOR,
  TIER_LABEL,
  bubbleRadius,
  formatUSD,
  tierFor,
} from "@/lib/scoring";
import { FilterPanel, DEFAULT_FILTERS, type MapFilters } from "@/components/FilterPanel";
import { MapLegend } from "@/components/MapLegend";

// DMV bounding center; CARTO dark tiles match the Slate & Steel palette.
const CENTER: [number, number] = [38.92, -77.15];
const CONTRACT_LABEL: Record<School["contractStatus"], string> = {
  "open-rfp": "Open RFP",
  "renewal-soon": "Renewal soon",
  "incumbent-locked": "Incumbent locked",
  "no-contract": "No contract",
};

function matches(s: School, f: MapFilters): boolean {
  const tier = tierFor(s.opportunityScore);
  if (!f.tiers[tier]) return false;
  if (f.zone !== "all" && s.zone !== f.zone) return false;
  if (s.opportunityScore < f.minScore) return false;
  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    if (!s.name.toLowerCase().includes(q) && !s.district.toLowerCase().includes(q)) return false;
  }
  return true;
}

export function OpportunityMap() {
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);

  const tierCounts = useMemo(() => {
    const c: Record<Tier, number> = { hot: 0, warm: 0, watch: 0 };
    for (const s of SCHOOLS) c[tierFor(s.opportunityScore)]++;
    return c;
  }, []);

  const visible = useMemo(() => SCHOOLS.filter((s) => matches(s, filters)), [filters]);

  return (
    <div className="map-page">
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        tierCounts={tierCounts}
        visibleCount={visible.length}
        totalCount={SCHOOLS.length}
      />

      <div className="map-wrap">
        <div className="map-count">
          <b>{visible.length}</b> opportunities on map
        </div>

        <MapContainer center={CENTER} zoom={10} scrollWheelZoom>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
          />

          {visible.map((s) => {
            const tier = tierFor(s.opportunityScore);
            const color = TIER_COLOR[tier];
            return (
              <CircleMarker
                key={s.id}
                center={[s.lat, s.lng]}
                radius={bubbleRadius(s.enrollment)}
                pathOptions={{
                  color,
                  weight: 1.5,
                  fillColor: color,
                  fillOpacity: 0.45,
                }}
              >
                <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                  <strong>{s.name}</strong> · {TIER_LABEL[tier]} {s.opportunityScore}
                </Tooltip>
                <Popup>
                  <div className="school-pop">
                    <h3>{s.name}</h3>
                    <div className="pop-sub">
                      {s.district} · {s.zone} County
                    </div>
                    <span className={`chip tier-${tier}`}>
                      <span className={`dot dot-${tier}`} /> {TIER_LABEL[tier]} · {s.opportunityScore}
                      /100
                    </span>
                    <div className="pop-grid">
                      <div>
                        <div className="k">Enrollment</div>
                        <div className="v">{s.enrollment.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="k">Fleet vehicles</div>
                        <div className="v">{s.fleetVehicles.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="k">Est. annual value</div>
                        <div className="v">{formatUSD(s.estAnnualValue)}</div>
                      </div>
                      <div>
                        <div className="k">Contract</div>
                        <div className="v">{CONTRACT_LABEL[s.contractStatus]}</div>
                      </div>
                    </div>
                    <div className="pop-signal">⚑ {s.lastSignal}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <MapLegend />
      </div>
    </div>
  );
}
