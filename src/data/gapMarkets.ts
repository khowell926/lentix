import type { GapMarket } from "@/types";

/**
 * Seed dataset for the AI Gap Radar.
 *
 * Adoption estimates are directional, blended from public signals — the
 * Census Bureau's Business Trends & Outlook Survey (BTOS) AI supplement
 * (firm-level AI use averaging ~5–6% overall, ~18% in Information, ~2–4%
 * in construction/transport/personal services as of 2024–25), industry
 * association surveys, and vendor-landscape scans. Market sizes are
 * IBISWorld-style US annual revenue estimates. Treat every number as an
 * estimate to be re-verified before it goes in a deck.
 */
export const GAP_MARKETS: GapMarket[] = [
  {
    id: "trucking-small-carriers",
    name: "Trucking — Small Carriers & Owner-Operators",
    sector: "Logistics",
    marketSizeUSD: 400_000_000_000,
    aiAdoptionPct: 4,
    digitalReadiness: 62,
    avgDealSizeUSD: 7_200,
    competition: "medium",
    painPoints: [
      "Dispatchers juggle load boards, texts, and phone calls all day — deadhead miles eat 15–20% of revenue",
      "Detention and lumper fees go unbilled because paperwork lags the truck",
      "95% of US carriers run 10 trucks or fewer and can't afford enterprise TMS platforms",
    ],
    aiPlays: [
      {
        name: "AI Dispatch Copilot",
        what: "Reads load boards + driver hours and recommends the next best load to cut deadhead miles.",
        monetization: "$99–$299/truck/month SaaS",
        effort: "1-3 months",
      },
      {
        name: "Detention Auto-Biller",
        what: "Watches ELD/geofence data, drafts detention invoices with evidence attached the moment a driver leaves a dock late.",
        monetization: "10–15% of recovered fees",
        effort: "1-3 months",
      },
    ],
    pitchLine:
      "Your dispatcher makes 200 decisions a day from a load board — what if the top 3 loads for every truck were already ranked when they sat down?",
    sourceNote: "BTOS transport AI use ~3–4%; ATA carrier-size distribution",
  },
  {
    id: "hvac-plumbing",
    name: "HVAC & Plumbing Contractors",
    sector: "Trades & Field Services",
    marketSizeUSD: 250_000_000_000,
    aiAdoptionPct: 5,
    digitalReadiness: 58,
    avgDealSizeUSD: 4_800,
    competition: "medium",
    painPoints: [
      "30–40% of inbound calls go to voicemail during peak season — each missed call is a $300–$3,000 job",
      "Quotes take days because estimates live in the owner's head",
      "Techs write illegible job notes that never become upsell opportunities",
    ],
    aiPlays: [
      {
        name: "After-Hours AI Call Agent",
        what: "Voice agent that answers, triages emergency vs. routine, and books straight into the schedule.",
        monetization: "$199–$499/month per location",
        effort: "weekend-mvp",
      },
      {
        name: "Photo-to-Quote Estimator",
        what: "Homeowner or tech snaps photos; model drafts a line-item estimate from the shop's own price book.",
        monetization: "$149/month + per-quote fee",
        effort: "1-3 months",
      },
    ],
    pitchLine:
      "Last month you missed roughly 40 calls after 5pm. At your average ticket, that's a truck's worth of revenue on voicemail.",
    sourceNote: "BTOS construction-adjacent AI use ~3–5%; ServiceTitan call-miss studies",
  },
  {
    id: "landscaping",
    name: "Landscaping & Lawn Care",
    sector: "Trades & Field Services",
    marketSizeUSD: 130_000_000_000,
    aiAdoptionPct: 3,
    digitalReadiness: 44,
    avgDealSizeUSD: 2_400,
    competition: "low",
    painPoints: [
      "Owners quote from windshield drive-bys — routing and bidding are pure gut feel",
      "600k+ US firms, median crew of 3, almost no software beyond QuickBooks",
      "Seasonal cash-flow whiplash with zero demand forecasting",
    ],
    aiPlays: [
      {
        name: "Satellite Instant-Quote",
        what: "Prospect types an address; aerial imagery measures turf/beds and returns a priced quote in 30 seconds.",
        monetization: "$99/month + $2 per quote",
        effort: "1-3 months",
      },
      {
        name: "Crew Route Optimizer",
        what: "Sequences the week's jobs to cut drive time between properties by 15–25%.",
        monetization: "$49/crew/month",
        effort: "weekend-mvp",
      },
    ],
    pitchLine:
      "You drive to properties to quote them. Your competitor's website quotes the same lawn from a satellite photo before you've left the office.",
    sourceNote: "BTOS admin/support & landscaping services AI use ~2–3%",
  },
  {
    id: "auto-repair",
    name: "Independent Auto Repair Shops",
    sector: "Trades & Field Services",
    marketSizeUSD: 78_000_000_000,
    aiAdoptionPct: 4,
    digitalReadiness: 52,
    avgDealSizeUSD: 3_600,
    competition: "low",
    painPoints: [
      "Service writers spend 2+ hours a day explaining repairs and chasing approvals by phone",
      "Declined work is never followed up — a fortune in deferred repairs walks out the door",
      "Parts lookups across supplier sites burn tech time on the clock",
    ],
    aiPlays: [
      {
        name: "Deferred-Work Recall Agent",
        what: "Mines past estimates for declined jobs and runs polite, well-timed SMS follow-up campaigns.",
        monetization: "$299/month or % of recovered revenue",
        effort: "weekend-mvp",
      },
      {
        name: "Estimate Explainer",
        what: "Turns a technician's findings into a photo-annotated, plain-English approval link customers actually tap.",
        monetization: "$149–$249/month per shop",
        effort: "1-3 months",
      },
    ],
    pitchLine:
      "Pull last year's declined jobs from your system — that number is usually six figures. We turn 10–15% of it into booked work.",
    sourceNote: "BTOS other-services AI use ~3–4%; shop-management vendor scans",
  },
  {
    id: "dental",
    name: "Dental Practices (Independent)",
    sector: "Healthcare",
    marketSizeUSD: 180_000_000_000,
    aiAdoptionPct: 8,
    digitalReadiness: 71,
    avgDealSizeUSD: 9_000,
    competition: "medium",
    painPoints: [
      "No-shows and unfilled hygiene slots cost a typical practice $150k+/year",
      "Insurance claim denials force staff into hours of resubmission busywork",
      "Front desk drowns in phone tag for scheduling and recall",
    ],
    aiPlays: [
      {
        name: "Recall & Fill-the-Chair Agent",
        what: "Predicts likely no-shows, overbooks intelligently, and works the recall list by SMS/voice to keep chairs full.",
        monetization: "$499–$999/month per practice",
        effort: "1-3 months",
      },
      {
        name: "Claim Scrubber",
        what: "Checks claims against payer rules before submission and drafts appeals for denials.",
        monetization: "$1–3 per claim or $399/month",
        effort: "serious build",
      },
    ],
    pitchLine:
      "Every empty hygiene slot is ~$150 gone. We keep your chairs full without your front desk making a single extra call.",
    sourceNote: "ADA HPI tech surveys; BTOS healthcare AI use ~6–8%",
  },
  {
    id: "home-health",
    name: "Home Healthcare Agencies",
    sector: "Healthcare",
    marketSizeUSD: 140_000_000_000,
    aiAdoptionPct: 5,
    digitalReadiness: 55,
    avgDealSizeUSD: 12_000,
    competition: "low",
    painPoints: [
      "Schedulers hand-match caregivers to shifts across availability, skills, and drive time",
      "Visit documentation for Medicare compliance eats 30% of a nurse's day",
      "Caregiver churn near 80%/year — recruiting is a permanent fire drill",
    ],
    aiPlays: [
      {
        name: "Shift-Matching Engine",
        what: "Auto-fills open visits with the best caregiver by skill, location, continuity, and overtime risk.",
        monetization: "$8–15/caregiver/month",
        effort: "1-3 months",
      },
      {
        name: "Voice Visit Notes",
        what: "Caregiver dictates in the car; model produces compliant, structured visit documentation.",
        monetization: "$29/caregiver/month",
        effort: "1-3 months",
      },
    ],
    pitchLine:
      "Your schedulers spend all day playing Tetris with shifts. We fill 80% of open visits automatically — and your nurses stop charting at the kitchen table at 10pm.",
    sourceNote: "BTOS healthcare/social assistance AI use ~4–6%",
  },
  {
    id: "small-law",
    name: "Solo & Small Law Firms",
    sector: "Professional Services",
    marketSizeUSD: 160_000_000_000,
    aiAdoptionPct: 12,
    digitalReadiness: 78,
    avgDealSizeUSD: 6_000,
    competition: "high",
    painPoints: [
      "Big-firm AI tools are priced for big firms; solos still draft from old Word files",
      "Intake calls go unanswered during court hours — leads hire whoever answers first",
      "Non-billable admin swallows 40% of the working week",
    ],
    aiPlays: [
      {
        name: "Practice-Area Intake Agent",
        what: "Answers, qualifies, and books consults 24/7, tuned to one practice area (immigration, PI, family).",
        monetization: "$299–$699/month",
        effort: "weekend-mvp",
      },
      {
        name: "Document Drafting Vault",
        what: "Fine-tuned drafting on the firm's own precedent bank — motions and letters in the firm's voice.",
        monetization: "$99/seat/month",
        effort: "1-3 months",
      },
    ],
    pitchLine:
      "While you were in court this morning, three potential clients called. Two already hired the firm that picked up.",
    sourceNote: "ABA/Clio legal trends: AI use rising but concentrated upstream",
  },
  {
    id: "bookkeeping",
    name: "Small Accounting & Bookkeeping Firms",
    sector: "Professional Services",
    marketSizeUSD: 145_000_000_000,
    aiAdoptionPct: 10,
    digitalReadiness: 82,
    avgDealSizeUSD: 5_400,
    competition: "high",
    painPoints: [
      "Client document chasing (bank statements, receipts) devours staff hours every close",
      "Categorization cleanup in QuickBooks is endless low-value toil",
      "Capacity ceiling: firms turn away clients every tax season",
    ],
    aiPlays: [
      {
        name: "Client Docs Chaser",
        what: "Agent that requests, receives, OCRs, and files client documents — and nags politely until they arrive.",
        monetization: "$20/client/month",
        effort: "1-3 months",
      },
      {
        name: "Close Copilot",
        what: "Pre-categorizes transactions and flags anomalies so a bookkeeper reviews instead of types.",
        monetization: "$149/seat/month",
        effort: "serious build",
      },
    ],
    pitchLine:
      "Your team spends the first week of every month chasing PDFs. We get the documents in and coded before they open QuickBooks.",
    sourceNote: "BTOS professional services AI use ~9–12%",
  },
  {
    id: "property-mgmt",
    name: "Residential Property Management",
    sector: "Professional Services",
    marketSizeUSD: 110_000_000_000,
    aiAdoptionPct: 7,
    digitalReadiness: 68,
    avgDealSizeUSD: 8_400,
    competition: "medium",
    painPoints: [
      "Maintenance calls at 2am route to the owner's cell phone",
      "Leasing agents answer the same 20 questions per listing, hundreds of times",
      "Rent-roll and delinquency reporting assembled by hand in Excel",
    ],
    aiPlays: [
      {
        name: "Maintenance Triage Line",
        what: "Voice/SMS agent that triages emergencies, schedules vendors, and updates tenants automatically.",
        monetization: "$2–4/unit/month",
        effort: "1-3 months",
      },
      {
        name: "Leasing Q&A Agent",
        what: "Answers listing questions, pre-qualifies applicants, and books showings around the clock.",
        monetization: "$199/month per portfolio",
        effort: "weekend-mvp",
      },
    ],
    pitchLine:
      "How many showings did your team book after 6pm last month? Renters shop at night — our agent books while your staff sleeps.",
    sourceNote: "BTOS real-estate AI use ~5–7%; NARPM tech surveys",
  },
  {
    id: "restaurants",
    name: "Independent Restaurants",
    sector: "Hospitality & Consumer",
    marketSizeUSD: 350_000_000_000,
    aiAdoptionPct: 6,
    digitalReadiness: 60,
    avgDealSizeUSD: 2_800,
    competition: "high",
    painPoints: [
      "Phone orders lost during rush hours; missed calls are missed covers",
      "Food cost creeps invisibly — invoices are never reconciled against menu pricing",
      "Weekly scheduling drama across group chats",
    ],
    aiPlays: [
      {
        name: "Phone Order & Reservation Agent",
        what: "Answers every call, takes orders into the POS, and books tables during the Friday rush.",
        monetization: "$149–$399/month per location",
        effort: "1-3 months",
      },
      {
        name: "Invoice-to-Food-Cost Radar",
        what: "OCRs supplier invoices and alerts when an ingredient price move breaks a dish's margin.",
        monetization: "$99/month per location",
        effort: "1-3 months",
      },
    ],
    pitchLine:
      "Friday, 7pm: your phone rings four times and nobody can grab it. That was $120 in orders — every Friday.",
    sourceNote: "BTOS accommodation & food services AI use ~5–6%",
  },
  {
    id: "funeral",
    name: "Funeral Homes & Services",
    sector: "Hospitality & Consumer",
    marketSizeUSD: 20_000_000_000,
    aiAdoptionPct: 2,
    digitalReadiness: 38,
    avgDealSizeUSD: 3_000,
    competition: "low",
    painPoints: [
      "Directors hand-write obituaries and service programs under intense time pressure",
      "First-call intake happens at 3am with a legal pad",
      "Pre-need sales follow-up is nonexistent — families only hear from them at need",
    ],
    aiPlays: [
      {
        name: "Obituary & Program Studio",
        what: "Interviews the family via a gentle guided form and drafts the obituary, program, and eulogy notes.",
        monetization: "$199/month per home",
        effort: "weekend-mvp",
      },
      {
        name: "First-Call Intake Agent",
        what: "Compassionate 24/7 line that captures required intake details and alerts the on-call director.",
        monetization: "$299/month per home",
        effort: "1-3 months",
      },
    ],
    pitchLine:
      "Your directors write obituaries at midnight. We give them a respectful first draft in five minutes so they can be with the family instead.",
    sourceNote: "NFDA tech surveys; BTOS personal services AI use ~2%",
  },
  {
    id: "janitorial",
    name: "Commercial Cleaning & Janitorial",
    sector: "Trades & Field Services",
    marketSizeUSD: 90_000_000_000,
    aiAdoptionPct: 3,
    digitalReadiness: 41,
    avgDealSizeUSD: 3_200,
    competition: "low",
    painPoints: [
      "Bids built from walkthrough guesses — win rates are a coin flip",
      "No-show cleaners discovered only when the client complains",
      "Quality inspections are paper checklists that nobody reads",
    ],
    aiPlays: [
      {
        name: "Walkthrough-to-Bid Builder",
        what: "Walk the site filming on a phone; model measures areas, counts fixtures, and prices the bid.",
        monetization: "$149/month + per-bid fee",
        effort: "1-3 months",
      },
      {
        name: "Photo QA Verifier",
        what: "Cleaners photo-verify each zone; vision model scores completeness and flags misses before the client does.",
        monetization: "$4/cleaner/month",
        effort: "1-3 months",
      },
    ],
    pitchLine:
      "You find out a cleaner skipped a floor when the client calls. Our system knows at 11pm the night it happened.",
    sourceNote: "BTOS admin & support services AI use ~2–3%",
  },
  {
    id: "job-shops",
    name: "Small Machine & Job Shops",
    sector: "Industrial",
    marketSizeUSD: 45_000_000_000,
    aiAdoptionPct: 5,
    digitalReadiness: 49,
    avgDealSizeUSD: 10_800,
    competition: "low",
    painPoints: [
      "Quoting a part from a drawing takes the owner 30–90 minutes; RFQs pile up unanswered",
      "Tribal knowledge (feeds, speeds, fixturing) lives in two retiring machinists' heads",
      "Job scheduling on a whiteboard means hot jobs bump everything blindly",
    ],
    aiPlays: [
      {
        name: "RFQ-to-Quote Engine",
        what: "Parses drawings/STEP files, estimates cycle time from the shop's history, and drafts the quote.",
        monetization: "$499–$999/month per shop",
        effort: "serious build",
      },
      {
        name: "Shop Knowledge Base",
        what: "Captures setup sheets, photos, and machinist voice notes into a searchable brain for the next hire.",
        monetization: "$199/month per shop",
        effort: "weekend-mvp",
      },
    ],
    pitchLine:
      "Every RFQ you don't quote in 24 hours goes to the shop that did. We get your quote out while your competitors are still opening the drawing.",
    sourceNote: "BTOS manufacturing AI use ~4–6% (small firms far lower)",
  },
  {
    id: "insurance-agencies",
    name: "Independent Insurance Agencies",
    sector: "Professional Services",
    marketSizeUSD: 200_000_000_000,
    aiAdoptionPct: 9,
    digitalReadiness: 74,
    avgDealSizeUSD: 6_600,
    competition: "medium",
    painPoints: [
      "Renewal remarketing is manual carrier-by-carrier requoting",
      "Certificates of insurance requests interrupt producers all day",
      "Policy documents arrive as PDFs nobody compares against what was quoted",
    ],
    aiPlays: [
      {
        name: "Renewal Remarketer",
        what: "Pulls expiring policies, requotes across carrier portals, and drafts the renewal comparison email.",
        monetization: "$399/month + per-policy fee",
        effort: "serious build",
      },
      {
        name: "COI Self-Service Desk",
        what: "Insureds request certificates by email/portal; agent verifies and issues without touching a producer.",
        monetization: "$249/month per agency",
        effort: "1-3 months",
      },
    ],
    pitchLine:
      "Your CSRs spend Fridays issuing certificates. We give those Fridays back — and your renewals never sneak up on you again.",
    sourceNote: "Big I / Liberty agent-tech surveys; BTOS finance & insurance ~8–10%",
  },
  {
    id: "self-storage",
    name: "Self-Storage Operators (Independent)",
    sector: "Hospitality & Consumer",
    marketSizeUSD: 44_000_000_000,
    aiAdoptionPct: 4,
    digitalReadiness: 57,
    avgDealSizeUSD: 3_900,
    competition: "low",
    painPoints: [
      "Single-manager facilities lose every rental that calls while the office is closed",
      "Rate management is set-and-forget while REIT competitors reprice daily",
      "Delinquency follow-up is awkward and inconsistent",
    ],
    aiPlays: [
      {
        name: "24/7 Rental Agent",
        what: "Answers calls/web chat, quotes unit availability, takes payment, and issues gate codes — no manager needed.",
        monetization: "$199–$449/month per facility",
        effort: "1-3 months",
      },
      {
        name: "Dynamic Rate Advisor",
        what: "Scrapes competitor rates nearby and recommends weekly price moves per unit size.",
        monetization: "$149/month per facility",
        effort: "weekend-mvp",
      },
    ],
    pitchLine:
      "The REIT down the road rents units at 11pm without a human. Every after-hours call you miss moves someone into their facility.",
    sourceNote: "SSA industry reports; BTOS real-estate AI use ~4–5%",
  },
];
