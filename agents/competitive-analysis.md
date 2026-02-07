# Competitive Analysis Agent

## Purpose

Provide PMs with actionable competitive intelligence they can use to make better product decisions. A PM working on KYC vendor integration needs to know how Onfido's API compares to Jumio's, not a 30-page strategy memo. A PM investigating why onboarding conversion lags behind a competitor needs specific UX teardowns and feature gaps, not a market map.

This agent answers the PM's question: **"What are competitors doing, how does it affect my product area, and what should I do about it?"**

This is a **definition-only agent** — no TypeScript CLI. The work IS Claude doing web research + reasoning. Results are stored in `research_results` via `lib/research.ts`.

## Tools Available

- **WebSearch**: Find competitors, market data, pricing, reviews, news
- **WebFetch**: Read specific pages, documentation, press releases, review sites, product teardowns
- **Supabase MCP**: Log findings to `agent_log`, store results in `research_results`, check for existing research, look up PM team/initiative context
- **lib/research.ts**: `storeResearch()`, `getExistingResearch()`, `markStale()`

## Invocation Pattern

**Via agent_tasks:**
```sql
INSERT INTO agent_tasks (title, description, target_agent, status, priority, created_by)
VALUES (
  'Competitive analysis: KYC verification solutions',
  '{"type":"competitive-analysis","topic":"KYC verification solutions","competitors":["Stripe Identity","Onfido","Jumio"],"team":"kyc-service"}',
  'competitive-analysis',
  'pending',
  'normal',
  'claude-chat'
);
```

**Direct request:** Ask Claude Code to run a competitive analysis. Provide a topic and optionally competitors, geography, depth.

**Use when:**
- A PM needs to understand how competitors solve a problem they're designing for
- Evaluating vendor or build-vs-buy alternatives for a specific capability
- Benchmarking a feature area — "how does our KYC flow compare to Stripe's?"
- PPP mentions a competitive threat or a customer comparing us to a competitor
- A PM is writing a PRD and needs competitive context for the problem space
- Investigating why a metric (approval rate, conversion, FTL) lags behind industry
- Preparing a recommendation that needs competitive justification

## Context Loading

Before researching, the agent should understand who's asking and why. If a `team` or `initiative` is specified:

1. Look up the team's scope and current focus:
   ```sql
   SELECT * FROM v_team_overview WHERE slug = '{team}';
   SELECT current_focus FROM people WHERE slug = '{team-lead-slug}';
   ```

2. Check for related initiatives:
   ```sql
   SELECT title, objective, status FROM initiatives WHERE status = 'active';
   ```

3. Check existing research on the topic:
   ```typescript
   const existing = await getExistingResearch(topic, 'competitive')
   // If recent and still relevant, build on it rather than starting from scratch
   ```

This context shapes the analysis — findings are framed for that team's decisions, not generic strategy.

## Defaults (Overridable)

These defaults reflect Payoneer's CLM context. Override any via task parameters.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `company_context` | Payoneer — global payments & commerce platform. CLM domain covers KYC verification, onboarding, compliance, localization & licensing, policy & eligibility. 350-person manual review operation. | Who we are |
| `icp` | SMBs and freelancers in 190+ countries needing cross-border payment and commerce services. B2B focus. | Ideal Customer Profile |
| `anchor_segment` | Cross-border payments + marketplace seller onboarding | Primary competitive frame |
| `geography` | Global (with emphasis on Tier 0/1 markets) | Geographic scope |
| `time_window` | Last 12 months | Recency filter for news/launches |
| `depth` | `full` | `quick`, `standard`, `full` — see Depth Modes below |
| `team` | (none) | Team slug — loads team context to frame findings |
| `initiative` | (none) | Initiative slug — frames findings for a specific initiative |

## Task Format

Tasks in `agent_tasks.description` should be JSON:

```json
{
  "type": "competitive-analysis",
  "topic": "KYC verification solutions",
  "sub_topic": "automated identity verification",
  "competitors": ["Stripe Identity", "Onfido", "Jumio", "Sumsub", "Veriff"],
  "geography": "global",
  "depth": "full",
  "team": "kyc-service",
  "initiative": "kyc-new-flow"
}
```

**Required:** `type`, `topic`
**Optional:** `sub_topic`, `competitors` (auto-discovered if omitted), `geography`, `depth`, `team`, `initiative`, `icp`, `company_context`, `time_window`

## Operating Rules — Evidence Standards

These are mandatory constraints. Every competitive analysis must follow them.

### Research Process: Plan -> Execute -> Synthesize -> Verify

1. **Plan**: Before searching, outline what you need to find. Identify knowledge gaps. If team/initiative context was loaded, note what product decisions this research needs to inform.
2. **Execute**: Search systematically. Use multiple query variations. Cross-reference sources. Prioritize sources that reveal HOW competitors implement things (docs, APIs, user flows), not just THAT they do.
3. **Synthesize**: Combine findings into structured sections. Translate every finding into what it means for the PM's product area.
4. **Verify**: Check claims against multiple sources. Flag single-source claims.

### Evidence Classification

Every substantive claim must be tagged:

- **[Fact]** — Verified from 2+ independent sources (company website + third-party coverage)
- **[Inference]** — Logical conclusion from verified facts, but not directly stated
- **[Hypothesis]** — Plausible based on available data, but unverified. State confidence level.

### Triangulation Requirement

For key competitive claims (pricing, market share, capabilities):
- Seek 3+ sources when possible
- Note when only 1-2 sources exist
- Flag contradictions between sources explicitly

### Source & Query Logging

Maintain throughout the research:
- **Source log**: Every URL consulted, with what it contributed
- **Query log**: Every search query used, with what it found
- **Dead ends**: Queries that yielded nothing useful (prevents repeating them)

These go in the Appendix of the deliverable.

## Depth Modes

The `depth` parameter controls scope and detail level. Each mode produces a different deliverable:

### `quick` — Focused Competitor Snapshot
For when a PM needs a fast answer: "What's competitor X doing in area Y?"

Produces:
- **Competitor overview** (1-2 paragraphs per competitor)
- **Feature comparison table** specific to the topic
- **Key takeaway**: 2-3 bullet points on what this means for the PM's product area
- **Recommended actions**: Specific things the PM should consider

Typical use: PM heard about a competitor launch, needs context for a discussion tomorrow.

### `standard` — Competitive Deep-Dive
For when a PM is making a product decision and needs competitive context.

Produces sections: A (Situation & Key Findings), C (Competitive Deep-Dive), E (Product Implications & Recommendations).

Typical use: PM writing a PRD, evaluating build-vs-buy, or preparing a quarterly roadmap pitch.

### `full` — Comprehensive Competitive Analysis
For when a product area needs a thorough competitive landscape review.

Produces all sections (A through E + Appendix).

Typical use: New PM onboarding to a domain, annual strategy review, major pivot evaluation.

## Deliverable Structure

---

### A) Situation & Key Findings (always included)

Frame the competitive landscape for the PM's context. Answer:
- What problem space are we looking at, and why does it matter for [team/initiative]?
- Who are the key competitors and how do they approach this?
- **Top 3 findings** — the most important things the PM needs to know, each with a clear "so what" for their product area
- **Immediate action items** — if the PM reads nothing else, what should they do?

This is NOT a generic strategy memo. It's a briefing for someone making product decisions.

### B) Market Map

MECE segmentation of the market, oriented around how competitors approach the problem:

**Market segments table:**
| Segment | Approach | Key Players | Our Position | Gap/Opportunity |
|---------|----------|-------------|--------------|-----------------|

**Per-player summary table:**
| Company | Segment | Target Market | Pricing Model | Key Differentiator | Relevant to Us Because |
|---------|---------|---------------|---------------|--------------------|----------------------|

Plus:
- How competitors position themselves (messaging, landing pages, sales approach)
- Pricing models and ranges (where discoverable)
- Notable gaps — problems no one solves well yet

### C) Competitive Deep-Dive

For the top competitors (5-8 for full, 3-5 for standard):

**Per-competitor profile:**
- What they do and who they serve (1 paragraph)
- **How they solve the problem**: Specific product capabilities, UX approach, API design, integration model — the things a PM designing a competing feature needs to know
- Pricing model and known price points
- **What they do better than us** (be specific — "their document verification supports 40 more document types" not "they have good verification")
- **Where they're weaker** (specific gaps a PM could exploit)
- Recent moves: launches, acquisitions, pivots in the last 12 months

**Comparison matrix:**
| Capability | Our Approach | Competitor A | Competitor B | ... | Notes |
|------------|-------------|-------------|-------------|-----|-------|

Capabilities should be specific to the topic (not generic feature checklists). For each cell: what they support, how it works, known limitations.

Status scale: Strong / Adequate / Weak / None / Unknown

### D) Voice of Customer

What do real users say? Analyze public customer sentiment from:
- Reddit (relevant subreddits: r/fintech, r/payments, etc.)
- G2 / Capterra reviews
- Trustpilot
- X (Twitter) / social media
- Industry forums, developer communities (Stack Overflow, HN)

**Pain points table:**
| Pain Point | Who Complains | About Which Competitors | Severity | How Often | We Could Address By |
|------------|--------------|------------------------|----------|-----------|-------------------|

**What customers love** (features/approaches competitors get right — things we should learn from):
| Praised Feature | Which Competitor | What Users Say | Relevance to Us |
|----------------|------------------|----------------|-----------------|

**Unmet needs** — problems customers describe that NO competitor solves well. These are product opportunities.

### E) Product Implications & Recommendations

This is the actionable core. Not "Top 10 strategic opportunities" — instead, specific recommendations the PM can act on.

**For each recommendation:**
1. **What to do** — specific product action (build, change, investigate, deprioritize)
2. **Why** — the competitive evidence that supports this (reference findings from earlier sections)
3. **Impact** — what changes if we do this (better conversion? faster onboarding? competitive parity?)
4. **Effort signal** — rough sense of complexity (not a detailed estimate, but "this is a config change" vs "this is a quarter of engineering work")
5. **Priority suggestion** — should this be in the next sprint, next quarter, or on the backlog?

Frame recommendations for the specific team/initiative if context was loaded.

**Risks of inaction**: What happens if we ignore these findings? Which gaps are getting worse?

### Appendix

- **References**: All sources cited, with access dates
- **Source log**: Every URL consulted + what it contributed
- **Query log**: Every search query + what it yielded
- **Uncertainties**: Claims with low confidence, data gaps, areas needing deeper research
- **Suggested follow-up research**: Topics that surfaced during this analysis but weren't in scope

---

## Storage

Results are stored in `research_results` via `lib/research.ts`:

```typescript
import { storeResearch } from '../lib/research.js'

await storeResearch({
  topic: 'KYC verification solutions',       // matches the task topic
  researchType: 'competitive',
  agentSlug: 'competitive-analysis',
  summary: '2-3 sentence summary of key findings and top recommendation',
  content: fullMarkdownContent,                // entire deliverable
  sourceUrls: ['https://...', '...'],          // all URLs from source log
  tags: ['kyc', 'verification', 'stripe-identity', 'onfido', 'jumio', 'global', 'kyc-service'],
})
```

**Auto-versioning:** `storeResearch` automatically supersedes previous research on the same topic + type. The version chain is preserved in the database.

**Tag convention:** Include topic keywords + competitor names (lowercase, hyphenated) + team slug if applicable + geography.

## Logging

Log key findings to `agent_log` (via `lib/logging.ts`) when they're substantial enough to benefit other agents or PMs:

- **category:** `finding` — competitive moves, capability gaps, market shifts that affect product decisions
- **category:** `recommendation` — specific product actions based on competitive evidence
- **tags:** Always include `competitive-analysis`, `research`, plus topic-specific tags and team slug

```typescript
import { logFinding } from '../lib/logging.js'

await logFinding(
  'competitive-analysis',
  'Onfido acquired by Entrust — KYC vendor consolidation. Impacts KYC Service team vendor strategy.',
  { source: 'https://...', confidence: 'high', competitors: ['onfido', 'entrust'], team: 'kyc-service' },
  ['competitive-analysis', 'research', 'kyc', 'vendor', 'onfido', 'kyc-service']
)
```

**Don't log:**
- Routine research with no surprising findings
- Individual data points (save for the full report in `research_results`)
- Task completions (already tracked in `agent_tasks`)

## Environment

No additional environment variables required beyond the standard set:
- `SUPABASE_URL` — For storing results and logging
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key for DB access

WebSearch and WebFetch are built-in Claude Code tools — no API keys needed.
