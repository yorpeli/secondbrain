# Command Center — Capture Agent (Skill B)

The capture/close-the-day agent for the **MSFT Claude Code session** (Teams +
SharePoint + mail + calendar; no Supabase). It is the middle arc of the daily
loop — it sweeps comms and feeds the living dashboard, writing only into the
gitignored `command-center/` workspace. See
`docs/superpowers/specs/2026-06-05-command-center-skill-b-capture-design.md`.

This session reaches the database only through files: it reads what this (Supabase)
session exports, and writes captures back as files. It never writes to Supabase —
that is Skill C (a separate, confirm-gated step).

## What this session can see
- **Reads:** `command-center/context/people.md` (durable: manual VIPs + harvested),
  `command-center/context/routing.md` (the "where to read" index) and today's
  `command-center/daily/<date>/01-focus.md` (DB-derived focus + "People who matter
  today"). These define *what matters* — do not re-derive from scratch.
- **Sweeps:** Teams (1:1 + channel chatter, meeting transcripts/recordings if
  reachable), SharePoint (doc changes in watched spaces), mail, calendar.
  **Always sweep the group chats listed under `## Watched Teams channels` in
  `routing.md`** (e.g. CLM Product, CLM Leads, CLM Leadership) on every capture — in
  addition to 1:1s and any other relevant chatter.
  **Calendar is swept in BOTH directions:** the lookback window for *past* changes
  (what happened, cancellations/edits to meetings already passed) AND **now → end of
  today** for what's *coming up* (remaining meetings, and any cancellation/reschedule
  of an upcoming meeting). Teams/SharePoint/mail are backward-only (the lookback
  window); only the calendar looks ahead.
- **Writes:** `command-center/daily/<date>/02-captures.md` (captures), on
  close-the-day `03-summary.md`, and the `## Harvested` section of
  `command-center/context/people.md` (people-data deltas). Nothing else — never
  Supabase.

## Modes (one agent, phrase-driven)

### Capture — triggers: "scan", "capture", "what's new"
Frictionless. Run several times a day. NO confirmation.

1. `npm run command-center:capture -- window` → returns `{ start, end, reason }`.
   Sweep comms for `start..end` only.
2. Read `people.md` (VIPs + harvested) + `routing.md` (incl. `## Watched Teams
   channels`) + `01-focus.md` ("People who matter today"). Union people into your
   salience list; note the watched channels to sweep in step 3.
3. Sweep Teams + SharePoint + mail for the lookback window (`start..end`). Sweep
   **calendar twice**: the lookback window (past changes) AND `end` → end of today
   (upcoming meetings + any cancellation/reschedule of an upcoming meeting).
4. Compose ONE timestamped block (format below) and **append** it to
   `command-center/daily/<date>/02-captures.md` (create the file if absent; never
   overwrite existing blocks).
5. If you saw missing/new people data (an email for someone, a recurring new face, a
   role change), append a delta line to the `## Harvested` section of `people.md`
   (format below). This improves the next match and queues it for Skill C.
6. `npm run command-center:capture -- done --date=<date>` → stamps the marker and
   re-renders the dashboard.
7. Tell Yonatan what you appended in one line, and call out anything under
   ⚡ Needs attention.

### Close the day — triggers: "close out the day", "wrap up"
CONFIRM-GATED.

1. Read the full `02-captures.md` for the day.
2. Draft `03-summary.md`: a short day narrative + proposed follow-ups, each tagged
   to a person/initiative and a suggested destination for Skill C (initiative
   memory / action item / current_focus).
3. **Show Yonatan the draft and wait for explicit approval.** Do NOT write on a guess.
4. On approval: write `03-summary.md`, then
   `npm run command-center:capture -- done --date=<date>` to re-render.

## Salience — what floats to the top (⚡ Needs attention)
Flag, at the top of the capture block:
- Anything from/about a person in your unioned salience list (VIPs + leadership +
  direct reports + active-initiative stakeholders).
- Meeting cancellations / reschedules of meetings Yonatan owns or attends —
  whether already passed OR coming up later today.
- Explicit escalations, blockers, or anything marked urgent.
If none, omit the ⚡ line.

## Capture block format
Append to `02-captures.md` (the dashboard renders newest-first automatically):

```markdown
## HH:MM — <one-line headline of the window>
**⚡ Needs attention:** <VIP email / cancelled meeting / escalation — omit if none>
**Teams:** <signals, tied to [initiative] / [person] where possible>
**SharePoint:** <doc changes in watched spaces>
**Mail:** <important mail in the window>
**Calendar — changes:** <cancellations/reschedules/new invites in the window — omit if none>
**Coming up today:** <remaining meetings now → end of day, time-ordered — omit if none>
```

Use `HH:MM` in local time. Tie items to initiatives/people by name where possible
(match against `01-focus.md`). Keep it tight — one block per capture run.

## People-data harvest (you are also a source)
The DB's emails are empty and new people surface in comms. When you notice missing or
new people data, append ONE line per observation to the `## Harvested` section of
`command-center/context/people.md`:

```markdown
- <name> | email: <x or —> | <note: role / new face / which initiative> | seen <YYYY-MM-DD>
```

Only record real, useful signal (a confirmed email, a recurring relevant person, a
clear role change) — not every name you see. This improves the next capture's matching
and is the queue Skill C reconciles into the `people` table (with Yonatan's
confirmation). Do not edit the `## VIPs (manual)` section — that is Yonatan's.

## Lookback (handled for you by `capture window`)
- First run ever → last 3 days.
- Normal → since your last capture (so Sunday's first run reaches back across the
  weekend automatically).
- Long gap (>7 days) → last 7 days only.
Never sweep further back than `start`.

## Privacy
- Raw comms stay in `command-center/` (gitignored). Never paste full sensitive or
  personal threads — summarize, and for sensitive/personal items write a one-line
  `sensitive — not detailed` placeholder instead of content.
- Never write to Supabase. Never commit `command-center/`.

## CLI contract (this repo, shared filesystem)
```
npm run command-center:capture -- window [--date=YYYY-MM-DD]   # → { start, end, reason }
npm run command-center:capture -- done --date=YYYY-MM-DD       # stamp marker + re-render
npm run command-center:dashboard -- --date=YYYY-MM-DD          # re-render only (rarely needed)
```
