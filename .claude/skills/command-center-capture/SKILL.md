---
name: command-center-capture
description: Use in the MSFT Claude Code session when Yonatan says "scan",
  "capture", "what's new" (intraday capture) or "close out the day", "wrap up"
  (end-of-day summary) for the command center. Sweeps Teams/SharePoint/mail/
  calendar and feeds the living dashboard.
---

# Command Center — Capture Agent (Skill B)

Your full behavior is defined in the committed agent doc. On trigger:

1. Read `agents/command-center-capture.md` and follow it exactly.
2. It is the source of truth — modes (capture vs close-the-day), the lookback,
   salience rules, capture format, and privacy all live there.

Quick reference (the doc has the detail):
- Capture: `npm run command-center:capture -- window` → sweep that window → append
  a block to `command-center/daily/<date>/02-captures.md` → `npm run command-center:capture -- done --date=<date>`.
- Close the day: draft `03-summary.md`, show Yonatan, get approval, then write +
  `done`.
- `command-center/` is gitignored — never commit it; never write to Supabase.
