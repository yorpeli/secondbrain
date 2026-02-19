# CLM PM Agents — Shared Repository

A shared repository for CLM product managers to contribute their AI agents. Each agent is an autonomous PM assistant built on Claude Code that monitors metrics, investigates issues, and surfaces insights for its domain.

## How It Works

Agents follow a standard architecture:

```
                CLI (run.ts)
                    │
                    ▼
            ┌───────────────┐
            │   commands/    │  ← Pure functions, each command is independent
            │  check-in.ts   │
            │  investigate.ts│
            └───────┬───────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   lib/types.ts  memory.md   agent.ts
   (interfaces)  (state)     (task runner)
```

- **`run.ts`** — CLI entry point. Parses arguments, routes to commands.
- **`agent.ts`** — Task runner. Picks up work from the `agent_tasks` database table.
- **`commands/`** — Each command is a separate file exporting a `run()` function that returns a typed result.
- **`lib/`** — Shared types, configuration, and helpers specific to this agent.
- **`memory.md`** — The agent's working memory: baselines, investigation history, accumulated knowledge.

Agents communicate exclusively through the database — no direct agent-to-agent calls.

---

## Contributing Your Agent

### What to Push

Push a **clean** copy of your agent. This means:

1. **All structural files included** — `run.ts`, `agent.ts`, `commands/`, `lib/`, `memory.md`, agent definition
2. **No personal data** — Memory files should contain the template/structure but be empty of actual findings, baselines, and investigation history
3. **No credentials or environment-specific values** — No API keys, no hardcoded UUIDs, no `.env` contents
4. **No generated output** — No chart PNGs, no docx files, no cached results

### What "Clean Memory" Means

The `memory.md` file is important — it defines what the agent tracks and how it organizes knowledge. Push it with:

- All section headers intact
- All table structures with column headers but no data rows
- Placeholder text explaining what goes in each section
- Empty trackers (e.g., "Research stored: (none yet)")
- No investigation history, no baselines, no findings

**Example — clean memory.md:**

```markdown
# My Agent — Memory

> Agent: my-agent-slug
> Scope: [describe what this agent covers]
> Maps to: [which team/person this maps to]

## Baselines

| Metric | Value | As Of | Source |
|--------|-------|-------|--------|
| (populated at runtime from analytics) | | | |

## What I Know

### [Domain Area 1]
(populated from PPP analysis and investigations)

### [Domain Area 2]
(populated from PPP analysis and investigations)

## Investigation History

| Date | Topic | Key Findings |
|------|-------|-------------|
| (added as investigations complete) | | |

## Open Questions
1. (added as gaps are identified)

## Waiting On
- (added as dependencies are identified)
```

### Clean Config Files

Configuration files (e.g., `lib/country-config.ts`) should be pushed with the full structure but generalized. If your config contains domain-specific constants (country names, tag mappings, Looker filter values), those are part of the agent's logic and **should be included** — they aren't personal data.

---

## Directory Structure

Your agent should follow this layout:

```
pm_team/{agent-name}/
├── run.ts                      # CLI entry point
├── agent.ts                    # Task runner (picks up agent_tasks)
├── commands/
│   ├── {command-1}.ts          # Each command in its own file
│   └── {command-2}.ts
├── lib/
│   ├── types.ts                # Result types, command interfaces
│   └── {agent-specific}.ts     # Config, constants, etc.
└── memory.md                   # Working memory (push clean)
```

Plus an agent definition file:

```
agents/{agent-name}.md          # What the agent does, how to invoke it
```

---

## Agent Definition File

Every agent needs a definition file at `agents/{agent-name}.md`. This is the public documentation for your agent. It should include:

```markdown
# {Agent Name}

## Purpose
What this agent does and why it exists.

## Scope
What domain/countries/metrics this agent owns.

## Commands

### `command-name`
Description of what this command does.

**Options:**
- `--param`: what it does

**Output:** what the command produces

## Invocation

**CLI:**
npx tsx pm_team/{agent-name}/run.ts {command} [args]

**Task (via database):**
INSERT INTO agent_tasks (title, description, target_agent, ...)
VALUES ('...', '{"type": "command-name", ...}', '{agent-slug}', ...);
```

---

## Code Conventions

### Command Pattern

Every command exports a typed result:

```typescript
// commands/check-in.ts
export interface CheckInResult {
  summary: string                    // Human-readable output (printed by CLI)
  details?: Record<string, unknown>  // Structured data (stored in task result_details)
  flags?: Flag[]                     // Issues detected (RED/YELLOW/INFO)
  recommendations?: string[]         // Suggested actions
}

export async function run(input: CheckInInput): Promise<CheckInResult> {
  // 1. Query data
  // 2. Analyze
  // 3. Return typed result — no side effects, no printing
}
```

### CLI Entry Point

```typescript
// run.ts
#!/usr/bin/env tsx
import 'dotenv/config'

const args = process.argv.slice(2)
const command = args[0]

async function main() {
  switch (command) {
    case 'check-in': {
      const { run } = await import('./commands/check-in.js')
      const result = await run({})
      console.log(result.summary)
      break
    }
    case 'check-tasks': {
      const { run: runAgent } = await import('./agent.js')
      await runAgent()
      break
    }
    default:
      console.error(`Unknown command: ${command}`)
      process.exit(1)
  }
}

main().catch(console.error)
```

### Task Runner

```typescript
// agent.ts
import { getPendingTasks, claimTask, completeTask, failTask } from '../../lib/tasks.js'

const AGENT_SLUG = 'my-agent-slug'

export async function run() {
  const tasks = await getPendingTasks(AGENT_SLUG)

  for (const task of tasks) {
    await claimTask(task.id, AGENT_SLUG)
    try {
      const command = JSON.parse(task.description)
      const result = await executeCommand(command)
      await completeTask(task.id, result.summary, result.details)
    } catch (error) {
      await failTask(task.id, (error as Error).message)
    }
  }
}
```

### Lazy Imports

Use lazy imports for Supabase and shared utilities to avoid failing when credentials aren't available:

```typescript
async function getSupabase() {
  const { getSupabase: gs } = await import('../../lib/supabase.js')
  return gs()
}
```

---

## Shared Utilities

All agents have access to these shared libraries:

| Module | Functions | Purpose |
|--------|-----------|---------|
| `lib/tasks.ts` | `createTask`, `claimTask`, `completeTask`, `failTask`, `getPendingTasks` | Task lifecycle |
| `lib/research.ts` | `storeResearch`, `getExistingResearch`, `markStale` | Research storage & versioning |
| `lib/logging.ts` | `logAgent`, `logFinding`, `logError`, `logRecommendation` | Agent logging |
| `lib/supabase.ts` | `getSupabase` | Database client |

---

## Knowledge Model

Agents operate with four layers of knowledge:

| Layer | File | Scope | Updated By |
|-------|------|-------|------------|
| **Business context** | `pm_team/clm-context.md` | Company, domain, teams, metrics | Quarterly refresh |
| **Workflows** | `pm_team/workflows.md` | How agents operate, task lifecycle, escalation | On process changes |
| **Shared playbook** | `pm_team/playbook.md` | Cross-agent learnings, investigation patterns, gotchas | Continuously by any agent |
| **Individual memory** | `pm_team/{agent}/memory.md` | Domain-specific baselines, history, findings | Owning agent only |

When your agent discovers something generalizable (a pattern, a data gotcha, an investigation technique), contribute it to `pm_team/playbook.md` — not just your own memory.

---

## Agent Conventions

1. **Log threshold**: Only log substantial items to `agent_log`. Ask: "Would another agent or human benefit from knowing this?"

2. **Entity linking**: When logging about a person, initiative, or other entity, include `related_entity_type` and `related_entity_id`.

3. **Tags**: Use consistent tags for cross-agent discovery:
   - Domain: `research`, `analytics`, `coaching`, `content`, `ppp`
   - Topic: `competitor`, `industry`, `metrics`, `feedback`
   - Entity: `person:{slug}`, `team:{slug}`, `initiative:{slug}`

4. **Confidence levels**: When reporting findings, indicate confidence:
   - `high`: Multiple corroborating sources, direct evidence
   - `medium`: Single reliable source, reasonable inference
   - `low`: Speculation, limited data

5. **No hardcoded UUIDs**: Always look up IDs by slug or name at runtime.

6. **Task communication**: Use JSON in the `description` field for structured commands:
   ```json
   {"type": "check-in", "days": 7}
   {"type": "investigate", "country": "UK", "topic": "approval rate drop"}
   ```

---

## Checklist Before Pushing

- [ ] Agent follows the standard directory structure (`run.ts`, `agent.ts`, `commands/`, `lib/`, `memory.md`)
- [ ] Agent definition file exists at `agents/{agent-name}.md`
- [ ] `run.ts` handles all commands + `check-tasks`
- [ ] `agent.ts` picks up tasks from `agent_tasks` table
- [ ] Each command is in its own file under `commands/`
- [ ] All types defined in `lib/types.ts`
- [ ] `memory.md` included but clean — structure only, no data
- [ ] No hardcoded UUIDs
- [ ] No credentials, API keys, or `.env` values in code
- [ ] No generated output files (PNGs, docx, etc.)
- [ ] Commands return typed results (no raw `console.log` in command logic)
- [ ] Lazy imports for Supabase and shared utilities
- [ ] TypeScript compiles cleanly (`npx tsc --noEmit`)

---

## Existing Agents (for Reference)

| Agent | Slug | Scope | Type |
|-------|------|-------|------|
| Hub Countries PM | `hub-countries-pm` | UK, US, SG, UAE CLM performance | TypeScript CLI |
| KYC Product PM | `kyc-product-pm` | KYC-as-a-Service exploration (0-to-1) | TypeScript CLI |
| Team Lead | `team-lead` | Hygiene, synthesis, enforcement across agents | TypeScript CLI |
| Analytics | `analytics` | CLM funnel analysis via Looker | TypeScript CLI |
| Competitive Analysis | `competitive-analysis` | Competitive intelligence research | Definition-only |
| Domain Expertise | `domain-expertise` | Domain/regulatory/market research | Definition-only |

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# Run an agent
npx tsx pm_team/{agent-name}/run.ts {command}

# Type check
npx tsc --noEmit
```
