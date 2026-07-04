# Lentix — Opportunity Intelligence

> **Lentix** — *Know the market. Win the contract.*

Three front-end features for the [Lentix](https://lentix.lovable.app) lead-to-revenue
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

3. **AI Gap Radar** — a market-scouting module for finding **industries behind
   in AI adoption**. 15 curated US verticals scored 0-100 on a composite
   **Gap Score** (adoption gap x market size x digital readiness / vendor
   competition), plotted on an adoption-vs-market-size **quadrant chart**
   (the goldmine is top-left: big market, nobody's home). Each market opens a
   **playbook drawer**: why the buyers are stuck, two concrete AI products to
   build (with pricing model + build effort), and a cold-pitch opener.

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

## The research agent (live Firecrawl + AI)

The Deep-Dive runs against a real **`lead-deep-dive` edge function**
(`supabase/functions/lead-deep-dive/`, Deno) that matches the production Lentix
stack:

1. **Firecrawl** scrapes the company website (markdown) and searches the web for
   licensing / insurance / review signals.
2. An **OpenAI-compatible AI gateway** (Gemini 2.5 Flash via the Lovable AI
   Gateway by default) extracts the 20-field structured profile + sales briefing.
3. Every fact comes back with a clickable **source receipt** + verified timestamp.

Secrets stay server-side (never in client code), per the platform security posture.

### Run it live

```bash
# 1. Backend secrets
cp supabase/functions/.env.example supabase/functions/.env   # add FIRECRAWL_API_KEY + AI_API_KEY
supabase functions serve lead-deep-dive --env-file supabase/functions/.env
#   (or deploy: supabase functions deploy lead-deep-dive --no-verify-jwt
#    then supabase secrets set --env-file supabase/functions/.env)

# 2. Point the frontend at it
cp .env.example .env.local
#   VITE_DEEP_DIVE_URL=http://localhost:54321/functions/v1/lead-deep-dive
npm run dev
```

`src/lib/deepDiveAgent.ts` calls the endpoint when `VITE_DEEP_DIVE_URL` is set
(driving the step animation while the request is in flight) and **falls back to a
deterministic simulation** when it isn't — or if the live call fails — so the app
always runs with no backend. The drawer shows a **LIVE · Firecrawl + AI** vs
**Simulated** badge so you can tell which produced a brief.
