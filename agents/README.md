# Agents

This directory contains sub-agent definitions for the Second Brain system.

## How Agents Work

Each agent is defined as a markdown file with:
- **Purpose**: What this agent does
- **Tools Available**: What capabilities it has access to
- **Invocation Pattern**: When to use it
- **Output Format**: What it returns
- **Logging Guidelines**: What to record in `agent_log`

Claude Code invokes these agents via the Task tool when specialized expertise is needed.

## Available Agents

| Agent | File | Purpose |
|-------|------|---------|
| Research | `research.md` | Competitor analysis, industry trends, market research |
| Analytics | `analytics.md` | Query analytics repos, data analysis |
| Coaching | `coaching.md` | PM development, feedback drafting |
| Content | `content.md` | Email writing, communications |
| PPP Analyst | `ppp-analyst.md` | Deep-dive on PPP reports, pattern detection |

## Creating a New Agent

1. Create `{agent-name}.md` in this directory
2. Follow the template structure below
3. Register in Supabase `agent_registry` (optional, for discoverability)

### Template

```markdown
# {Agent Name}

## Purpose
One paragraph describing what this agent does and when it's useful.

## Tools Available
- Tool 1 (what it's used for)
- Tool 2 (what it's used for)

## Invocation Pattern
**Use when:** Describe the triggers/scenarios
**Thoroughness levels:** quick | medium | deep (if applicable)

## Input
What information the agent needs to do its job.

## Output Format
- Key findings (format)
- Recommendations (format)
- Confidence level

## Logging
When and what to log to `agent_log`:
- Log findings with category='finding', tags=['{domain}', ...]
- Log recommendations with category='recommendation'
- Don't log routine operations

## Examples
Example invocations and expected outputs.
```

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
