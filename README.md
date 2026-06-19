# Lentix — Opportunity Intelligence

> **Lentix** — *Know the market. Win the contract.*

Two front-end features for the [Lentix](https://lentix.lovable.app) lead-to-revenue
platform (DMV fleet-wash & drone services), built as a standalone **React + Vite +
TypeScript** app:

1. **Opportunity Map** — an interactive Leaflet map of DMV-area schools/districts
   plotted as bubbles. Color = opportunity tier (**Hot / Warm / Watch**), bubble
   **size = enrollment**, with a live filter bar (search, tier toggles, zone,
   minimum opportunity score). Click a bubble for fleet size, est. annual value,
   contract status, and the latest opportunity signal.

2. **AI Lead Deep-Dive** — every lead card has an **AI Deep-Dive** button that
   fires a research agent and opens a drawer showing a **20-field structured
   profile + AI sales briefing side-by-side with the deal data**. Every fact
   carries a clickable source receipt and verified timestamp.

These mirror Lentix modules 04/09/10 (mapping + opportunity scoring) and 05
(Lead Research / Deep-Dive) from the platform feature breakdown.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm run preview    # serve the production build
```

## Stack

- **React 18 + Vite 5 + TypeScript** (strict)
- **react-leaflet 4.x + leaflet 1.9.4** with CARTO dark basemap
- **"Slate & Steel"** design tokens, **Outfit** typography, dark-first, bento surfaces
- **localStorage** persistence with a seed-version guard (`SEED_VERSION_KEY` pattern)

## Project layout

```
src/
  types.ts                     # School, Lead, DeepDiveResult, …
  data/
    schools.ts                 # seed DMV schools (lat/lng, enrollment, score)
    leads.ts                   # seed commercial pipeline leads + deal data
  lib/
    scoring.ts                 # Hot/Warm/Watch tiering + bubble-size scale
    storage.ts                 # localStorage + seed-version guard
    deepDiveAgent.ts           # research agent (pluggable; simulated client-side)
  components/
    OpportunityMap.tsx         # map page (bubbles, popups, filtering)
    FilterPanel.tsx            # filter bar
    MapLegend.tsx              # tier + size legend
    LeadPipeline.tsx           # lead card grid
    LeadCard.tsx               # single lead card w/ Deep-Dive button
    DeepDiveDrawer.tsx         # side-by-side brief + deal data, agent progress
```

## The research agent

`src/lib/deepDiveAgent.ts` runs the Deep-Dive behind an async contract and
streams progress steps (license → insurance → registry → reviews → briefing).
Results are cached per-company in localStorage.

In the production Lentix platform this is the `lead-deep-dive` edge function:
Firecrawl + state license registries (MD MHIC, VA DPOR, DC DCRA) + corporate
registry (MD SDAT, VA SCC, DC CCA) + reviews, synthesized by Gemini 2.5 Flash via
the Lovable AI Gateway. This build ships a deterministic client-side simulation
behind the **same interface** — swap `runDeepDive` for a `fetch()` to the edge
function and the UI is unchanged (no server secrets required to demo it).
