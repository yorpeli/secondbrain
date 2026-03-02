# Project Structure

> Full file tree for the Second Brain codebase. For a summary overview, see [CLAUDE.md](../CLAUDE.md).

```
second-brain/
├── CLAUDE.md              # Project definition for Claude Code
├── README.md              # Setup and overview
├── .env                   # Supabase + Looker credentials (never commit)
├── package.json
├── tsconfig.json
├── docs/                  # Reference documentation
│   ├── schema.md          # Full database schema
│   ├── agents.md          # Agent details (CLI, task formats, key concepts)
│   └── project-structure.md  # This file
├── scripts/               # Standalone automation scripts
│   └── ppp-ingest.ts      # PPP processing
├── agents/                # Agent definitions
│   ├── research.md        # Research agent
│   ├── competitive-analysis.md  # Competitive analysis research agent
│   ├── domain-expertise.md     # Domain expertise research agent
│   ├── analytics.md       # Analytics agent (CLM funnel analysis)
│   ├── data-viz.md        # Data-viz subagent (visual storytelling)
│   ├── team-lead.md       # Team Lead agent (hygiene, synthesis, enforcement)
│   ├── hub-countries-pm.md # Hub Countries PM agent (UK, US, SG, UAE)
│   ├── kyc-product-pm.md  # KYC Product PM agent (0-to-1 product exploration)
│   └── ppp-ingest.md      # PPP Ingest agent (local PPP processing)
├── ppp/                   # PPP Ingest agent — local PPP deck processing
│   ├── run.ts             # CLI entry point
│   ├── agent.ts           # Task runner (picks up agent_tasks)
│   ├── commands/          # context.ts, write.ts, enrich.ts
│   └── lib/               # types.ts, config.ts
├── analytics/             # Analytics agent — Looker-based CLM analysis
│   ├── config/            # Constants, look configs
│   ├── knowledge/         # Country tiers, funnels, filter mappings
│   ├── looks/             # Looker Look configurations (JSON)
│   ├── lib/               # Looker client, data utils, formatting
│   │   └── __tests__/     # Unit tests (node --test)
│   ├── analyses/          # Analysis modules (scan, compare, deep-dive, diagnose)
│   ├── agent.ts           # Task runner (picks up agent_tasks)
│   └── run.ts             # CLI entry point
├── data-viz/              # Data-viz rendering library
│   ├── config/brand.ts    # Chart colors (derived from lib/doc-style.ts)
│   ├── lib/               # Types, renderer, chart defaults
│   ├── templates/         # Chart templates (volume-trend, etc.)
│   ├── agent.ts           # Supabase task runner (secondary)
│   └── run.ts             # CLI entry point
├── pm_team/               # PM Team — autonomous AI product management
│   ├── pmTeamContext.md   # Vision document (pre-implementation)
│   ├── clm-context.md     # Foundational business knowledge for all PM agents
│   ├── ARCHITECTURE.md    # What's built, how it works, key decisions
│   ├── workflows.md       # Agent SOPs (session start, task lifecycle, etc.)
│   ├── playbook.md        # Shared PM knowledge (patterns, gotchas, learnings)
│   ├── team-lead/         # Team Lead agent
│   │   ├── run.ts         # CLI entry point
│   │   ├── agent.ts       # Task runner (picks up agent_tasks)
│   │   ├── commands/      # hygiene.ts, synthesize.ts, enforce.ts
│   │   └── lib/types.ts   # Result types
│   ├── hub-countries/     # Hub Countries PM agent (first PM agent)
│   │   ├── run.ts         # CLI entry point
│   │   ├── agent.ts       # Task runner (picks up agent_tasks)
│   │   ├── commands/      # check-in.ts, investigate.ts
│   │   ├── lib/           # types.ts, country-config.ts
│   │   └── memory.md      # Individual PM memory (baselines, history)
│   └── kyc-product/       # KYC Product PM agent (0-to-1 exploration)
│       ├── run.ts         # CLI entry point
│       ├── agent.ts       # Task runner (picks up agent_tasks)
│       ├── commands/      # research.ts, audit.ts, synthesize.ts
│       ├── lib/           # types.ts, playbook-config.ts
│       └── memory.md      # Thesis, moats, research tracker
├── lib/                   # Shared utilities
│   ├── supabase.ts        # Supabase client initialization
│   ├── tasks.ts           # Shared task utilities (create/claim/complete/fail)
│   ├── research.ts        # Shared research storage/versioning utilities
│   ├── types.ts           # TypeScript types (generated or manual)
│   ├── logging.ts         # Agent logging helpers
│   ├── doc-style.ts       # Docx brand primitives (colors, fonts, tables)
│   └── chart-embed.ts     # Chart → docx ImageRun helper
└── supabase/
    └── functions/         # Edge function source (reference)
        ├── ingest-ppp/
        ├── generate-embeddings/
        └── semantic-search/
```
