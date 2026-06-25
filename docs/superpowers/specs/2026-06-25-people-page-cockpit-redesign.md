# People Page — 1:1 Cockpit Redesign

**Date:** 2026-06-25
**Status:** Approved (design from Claude Design + decisions below); implementing
**Builds on:** `2026-06-25-people-page-design.md` (v1 master-detail). This is a layout + signal-derivation redesign of the same `/people` page, prompted by "too cluttered".
**Source design:** Claude Design project `db876278-e637-46b7-934a-5ee606d08b5f`, file `People - 1to1 Cockpit.dc.html` (saved alongside as provenance).

## What changes vs v1

The page becomes a **1:1 cockpit**: still master-detail, but the detail pane is reorganized for glanceability and 1:1 prep, and a **derivation layer** adds computed signals.

**Page header:** breadcrumb "Second Brain › People", title, subtitle "`N` direct reports · `M` need attention" (M in red when >0), and a "Per person / Overview" segmented toggle (Per person active; **Overview is a disabled/'coming' placeholder** in this pass).

**Rail (264px):** each row = avatar with an **attention status dot**, name, next-1:1 line, and an **overdue count pill** (red) when overdue>0. Selected row keeps the accent border/left-bar. Below the list, a **"This week" summary box**: 1:1s scheduled this week, total open items + overdue, avg cadence.

**Detail — hero card:** avatar, name + **attention badge** (Needs attention / Watch / Ramping / On track), "role · team · reports to you", working style, a prominent **"Next 1:1" box** (big relative day + sub; pulse dot if today), and a row of **4 stat tiles**: Open commitments, Overdue (red-bordered if >0), 1:1 cadence, Latest review.

**Detail — two columns:**
- **Left (prep, 1.15fr):** "To cover in your next 1:1" agenda card (accent header) → Current focus card → Open commitments card (dot + title + due + status badge).
- **Right (context, 1fr):** 1:1 continuity card (timeline style, newest dot accented, "View all sessions") → Coaching & development card (dashed/lock/"Private to you"), now also holding **Strengths + Growth-area chips** (moved out of the header).

**Dropped from this page:** the v1 "Team work" (initiatives + PPP) card. `usePersonTeamWork` + `team-work-card.tsx` stay in the repo (unused) for a future Overview tab.

## Decisions (confirmed with user 2026-06-25)

1. **Attention level — derived from overdue + cadence** (`AttentionLevel = 'high' | 'watch' | 'new' | 'ok'`), precedence:
   - `new` ("Ramping") if `started_date` within the last 60 days **and** no overdue items.
   - else `high` ("Needs attention") if `overdueCount >= 1` **or** days-since-last-1:1 `> 21` (includes never-met).
   - else `watch` if `dueSoonCount >= 1` **or** days-since-last-1:1 in `14..21`.
   - else `ok` ("On track").
2. **"To cover" agenda — auto-assembled from real signals only**, labeled "Auto-assembled from overdue items, carry-overs & cadence". No fabricated blockers. Composition (capped at 5):
   - If no upcoming 1:1: a `Cadence` item "Reschedule a standing 1:1 / No 1:1 in N days".
   - Each overdue commitment → `Overdue` item ("Overdue since `<date>`").
   - Each due-soon commitment → `Topic` item ("Due `<date>`").
   - Remaining open action-items → `Carry-over` items.
3. **No meeting time-of-day in our data** (`meetings.date` only). The "Next 1:1" box shows date-granularity: "Today" / relative day ("in 4 days") / "Unscheduled · No 1:1 in N days". No "3:00 PM · in 2 hrs".

## Derivation layer (pure, tested helpers in `app/src/lib/people-data.ts`)

- `isOverdue(dueDate, todayISO)` / `countOverdue(items, todayISO)`
- `commitmentStatus(dueDate, todayISO, dueSoonDays=7): 'overdue' | 'due-soon' | 'open'`
- `computeCadenceDays(oneOnOnes): number | null` (avg gap between consecutive recent 1:1s; null if <2 sessions) + `cadenceLabel(days): string | null`
- `daysSince(dateISO, todayISO): number`
- `nextOneOnOneKind(nextDateISO, todayISO): 'today' | 'soon' | 'date' | 'none'`
- `deriveAttention({ overdueCount, dueSoonCount, daysSinceLast, startedDateISO, todayISO }): AttentionLevel`
- `assembleAgenda({ commitments, nextKind, daysSinceLast, todayISO }): PersonAgendaItem[]`

Existing `formatDate`, `sortOpenItems`, `splitOneOnOnes` stay. All new helpers are deterministic (take `todayISO`, never call `Date.now()` internally) and unit-tested.

## Data sourcing

No new tables. `useDirectReports` and `usePersonDetail` additionally fetch `people.started_date` (for `new`) and reuse the already-fetched open items + 1:1 dates to compute overdue/cadence/attention. `meetings.private_notes` still never selected; coaching still `is_private=false`; initiatives still `kind='initiative'` (only relevant to the now-unused team-work hook).

## Constraints (unchanged from v1)

Read-only; resolve by slug, no hardcoded UUIDs; no em-dashes in code/copy; `@/` alias; privacy rules (no `private_notes`, `is_private=false`, no perf narrative fields); follows existing hook/component conventions; people files stay tsc/eslint-clean (repo has pre-existing unrelated build errors).
