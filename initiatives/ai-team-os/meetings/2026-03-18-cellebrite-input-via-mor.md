---
date: 2026-03-18
type: external-input
source: Mor Regev Lalush (shared from Oren Yosifun, Cellebrite)
topic: AI-native development setup — how Cellebrite structures their AI-augmented workflow
---

# External Input: Cellebrite AI-Native Dev Setup (via Mor Regev)

Shared by Mor Regev Lalush on 2026-03-18, originally from Oren Yosifun at Cellebrite.

## Their Setup

1. **Everything lives in git** — code and all agent/AI context evolve together in the same repo.
2. **`agents.md` as entry point** — a central file describing all agents. `claude.md`, `copilot-instructions.md`, and similar config files point to it.
3. **`docs/` folder** — contains critical information: architecture, key flows, development processes (e.g., how to do a PR).
4. **`knowledge/` folder** — architectural decisions, feature PRDs. Functions as an Obsidian vault.
5. **Shared agent definitions and skills** — standardized across the team.
6. **Git hooks on every PR** — automatically verify that code changes are reflected in architecture documentation. Enforces doc-code sync.

## Key Agent: "DonnyAgent"

Oren has an autonomous agent called **DonnyAgent** (named after a manager character). It auto-commits periodically during autonomous work — essentially creating save points.

### Why This Matters

The main problem managers experience with AI tools like Lovable, Base, Figma Make is: **the agent does something you didn't want, you try to go back, and it can't undo properly.** With the git-based approach, you simply revert to the last commit. DonnyAgent's periodic auto-commits make this a natural workflow — like saving a Word document periodically.

## Relevance to Our Framework

- **Validates repo readiness** as a prerequisite (aligns with Yuval/Wix input)
- **Concrete implementation** of what "AI tooling infrastructure" looks like — not abstract, but `agents.md` + `docs/` + `knowledge/` + git hooks
- **Git as undo mechanism** is a practical operating model insight: teams need rollback safety to trust agent autonomy
- **Doc-code sync hooks** enforce a quality standard that makes autonomous agents safer
- **Obsidian-as-knowledge-vault** pattern — structured knowledge collocated with code, not in a separate wiki
