# Second Brain

Knowledge management and automation system for product leadership at Payoneer. Tracks people, teams, meetings, initiatives, and weekly status reports across a 21-person product org.

## How It Works

Two interfaces share one Supabase Postgres database:

- **Claude.ai Project** — Conversational interface for thinking, meeting prep, decision support
- **Claude Code** (this repo) — Scripts, automation, and sub-agents

See [CLAUDE.md](./CLAUDE.md) for the full project definition: schema, conventions, entity relationships, and query patterns.

## Setup

### Prerequisites

- Node.js 18+
- Supabase service role key
- OpenAI API key (for embeddings)

### Install

```bash
git clone <repo-url>
cd second-brain
npm install
```

### Environment

Create `.env` in the project root (never commit):

```bash
SUPABASE_URL=https://tjlcdwsckbbkedyzrzda.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
OPENAI_API_KEY=<your-openai-key>
```

## Structure

```
second-brain/
├── CLAUDE.md          # Full project definition (start here)
├── README.md          # Setup (this file)
├── .env               # Credentials (not committed)
├── package.json
├── scripts/           # Automation scripts
├── agents/            # Sub-agent definitions
├── lib/               # Shared utilities (DB client, logging, types)
└── supabase/
    └── functions/     # Edge function source (reference)
```

## Key Commands

```bash
# Run a script
npx tsx scripts/ppp-ingest.ts

# Generate TypeScript types from DB schema
npx supabase gen types typescript --project-id tjlcdwsckbbkedyzrzda > lib/types.ts
```
