# People Page — Design Spec

**Date:** 2026-06-25
**Status:** Approved (design); pending implementation plan
**Surface:** React command-center app (`app/`)
**Route:** `/people` (replaces the existing "Coming soon" placeholder at `app/src/pages/people.tsx`)

---

## Purpose

A single screen where Yonatan can, at a glance, see what matters about each of his direct reports — what they're working on, what's top of mind, and what's outstanding — and use it to prep for 1:1s. Read-only, consistent with the thin-UI / smart-terminal direction (the React app is a read-only command center; the terminal stays primary).

## Scope (v1)

- **People covered:** Yonatan's 5 direct reports only, resolved dynamically via `reports_to_id`. Built to expand to skip-levels / wider org later, but v1 ships directs-only.
- **Read-only.** No edits, no writes. All curation of underlying data continues to happen via the terminal / Supabase.
- **Out of scope for v1:** editing person data, skip-level ICs, cross-functional contacts, org-chart visualization, search/filter on the rail (only 5 people — not needed yet).

### Anchor resolution

Yonatan is `people.slug = 'yonatan-orpeli'` (id `7a868fcc-485d-4f04-b4a9-d9f6ab7bc00f`). The list hook resolves his id **by slug** (never hardcode the UUID), then selects `WHERE reports_to_id = {yonatan.id} AND status = 'active'`. This returns exactly the 5 directs (Elad Schnarch, Ira Martinenko, Yael Feldhiem, Ido Seter, Meital Lahat Dekter). Do **not** match directs by name `ILIKE` — that collides with unrelated people (e.g. "Elad Naama, GM GTM Acquisition").

---

## Layout — master-detail split

One screen. Left rail lists the directs; right pane shows the selected person's full detail. Fast switching between people; strong for deep 1:1 prep.

```
┌──────────────────────────────────────────────────────────┐
│  People                                                    │
├────────────────┬───────────────────────────────────────── │
│ [rail ~300px]  │  [detail pane]                            │
│                │                                            │
│ ● Elad S.      │   Header card                              │
│   Ira M.       │   Current focus card                       │
│   Yael F.      │   Team work card                           │
│   Ido S.       │   Open items card                          │
│   Meital L.    │   1:1 continuity card                      │
│                │   Coaching & development card (discreet)   │
└────────────────┴───────────────────────────────────────── ┘
```

- Responsive: on narrow viewports the rail collapses to a horizontal selector / dropdown above the detail pane (reuse the grid breakpoint convention from existing pages, e.g. `lg:grid-cols-[300px_1fr]`).
- Default selection: first direct (alphabetical) on load, or the last-viewed person if we want to add that later (not required for v1).

### Left rail row

Each row shows:
- Initials avatar + name
- Role + team (sub-line)
- Two at-a-glance signals:
  - **Open-items count** = open tasks + open action items (single number badge)
  - **1:1 cadence** = "last 1:1: {relative date}" (and next 1:1 date if a future one exists)
- Selected row highlighted.

---

## Data architecture

Two hooks under `app/src/hooks/`, following the existing `use-initiatives` pattern (TanStack Query, keyed queries, multi-step async assembly in the hook, in-memory shaping in the component). **Lazy detail**: the rail loads cheap; the heavy per-person blocks fetch only when a person is selected.

### `useDirectReports()` — rail list

- `queryKey: ['direct-reports']`
- Resolves Yonatan's id by slug, then fetches the 5 directs (`v_org_tree` gives person + team + manager resolved in one shot).
- Augments each with the two rail signals via lightweight count queries:
  - open items: `count` of `tasks WHERE owner_id = p.id AND status <> 'done'` + `meeting_action_items WHERE owner_id = p.id AND status = 'open'`
  - 1:1 dates: latest past + earliest future `meetings` of `meeting_type='1on1'` joined through `meeting_attendees`
- Returns `DirectReportSummary[]`.
- `staleTime: 5 * 60 * 1000`.

### `usePersonDetail(slug)` — detail pane

- `queryKey: ['person-detail', slug]`, `enabled: !!slug`.
- Assembles the full picture for one person:
  - Identity / development: from `v_org_tree` (name, role, team, manager, `current_focus`, `working_style`, `strengths[]`, `growth_areas[]`, `relationship_notes`).
  - Team work: initiatives the person's team owns/leads (`v_initiative_dashboard`, matched by team + `initiative_stakeholders`), filtered to `kind = 'initiative'` (exclude pillars); latest PPP swimlane status for that lead (`v_ppp_swimlanes`, most recent `week_date`).
  - Open items: open `tasks` (`owner_id`) + open `meeting_action_items` (`owner_id`), merged, sorted by `due_date` (nulls last).
  - 1:1 continuity: recent `meetings` (`meeting_type='1on1'`, this person attending) with `discussion_notes`, newest first; next scheduled 1:1 if any.
  - Coaching & development: latest `content_sections` rows of `section_type IN ('coaching-log','dev-plan')`; latest `performance_reviews` metadata (overall rating + review period).
- Returns `PersonDetail`.
- `staleTime: 5 * 60 * 1000`.

Types added to `app/src/lib/types.ts`: `DirectReportSummary`, `PersonDetail`, and the sub-shapes (`PersonOpenItem`, `PersonOneOnOne`, `PersonTeamWork`, `PersonCoaching`). DB views aren't in generated types — use `.from('view' as never)` and cast (existing convention).

---

## Detail pane — card stack (6 cards, in order)

Reuse `Card`, `Badge`, `Skeleton`, `Tooltip` from `app/src/components/ui/`. Markdown via `react-markdown` + `remark-gfm` (already used).

1. **Header** — name, role, team, "reports to Yonatan", `working_style`. Strengths and growth_areas as chips/badges. `relationship_notes` inline. Initials avatar.
2. **Current focus** — `current_focus` rendered as markdown. (Populated for all 5.)
3. **Team work** — initiatives their team owns/leads with status + priority badges; latest PPP swimlane status line. The strongest "what they're working on" signal for a team lead. Each initiative links to the existing `/initiatives/:slug` detail.
4. **Open items** — merged open tasks + open action items, sorted by due date, with status/priority badges and source tag (task vs action item). Empty state: "No open items logged."
5. **1:1 continuity** — most recent 1:1 `discussion_notes`, collapsible, newest first; next scheduled 1:1 surfaced at top if present. The prep payload.
6. **Coaching & development** *(discreet zone)* — latest coaching-log + dev-plan; latest perf-review metadata (rating + period). Subtle "private" visual treatment (e.g. muted border / lock affordance) to signal sensitivity. Empty state where absent (most directs have none).

### Empty states are first-class

Data reality on the 5 directs (as of 2026-06-25): `current_focus`, 1:1 history, and perf reviews are populated for everyone; **open tasks/action items are thin (0–3)** and **coaching logs are uneven** (Elad: 8; Yael: 1; others: 0); dev-plans: none. Every card must render a clean "nothing logged yet" state rather than looking broken. This is the common case for several blocks, not an edge case.

---

## Sensitivity handling

This is Yonatan's private single-user command center, so discreet data is shown — but handled with care:

- **Shown:** `relationship_notes`, `strengths`, `growth_areas`, coaching-log, dev-plan, `performance_reviews` metadata. The coaching/perf card carries a subtle "private" treatment so the discreet zone is visually distinct.
- **Excluded:** `meetings.private_notes` is **never** surfaced in the 1:1 block — only `discussion_notes`. Any `content_sections` with `is_private = true` follows the same rule unless we later add an explicit reveal affordance (not in v1).
- Nothing on this page is embedded or shared with other agents; it's display-only.

---

## Components (new, under `app/src/components/people/`)

- `person-rail.tsx` — the left list + rows with at-a-glance signals.
- `person-detail.tsx` — orchestrates the card stack for the selected person.
- `person-header-card.tsx`
- `current-focus-card.tsx`
- `team-work-card.tsx`
- `open-items-card.tsx`
- `one-on-one-card.tsx`
- `coaching-card.tsx`

Page component `app/src/pages/people.tsx` replaces the placeholder: holds selected-slug state, renders `<PersonRail>` + `<PersonDetail>`, handles top-level loading/error/empty states (reuse the Initiatives page's error/skeleton patterns).

---

## Error, loading, empty

- **Loading:** rail shows skeleton rows; detail pane shows skeleton cards (`Skeleton` component).
- **Error:** the existing destructive-bordered error block pattern from `InitiativesPage`.
- **Empty (no directs resolved):** unlikely given the anchor, but render a clear "No direct reports found" state rather than a blank pane.

## Testing

- Hook-level: `useDirectReports` resolves exactly the 5 directs by `reports_to_id` (not name); `usePersonDetail` assembles each block and tolerates empty results per block.
- Component-level: each card renders its populated and empty states; the coaching/perf card never renders `private_notes`; selecting a rail row swaps the detail pane.
- Manual: load `/people`, confirm all 5 directs appear, click through each, verify populated blocks (focus, 1:1s, perf) and clean empty states (tasks, coaching for most).

## Future (explicitly deferred)

- Skip-level ICs and wider-org expansion (the hook is built to widen the `reports_to_id` filter).
- Rail search/filter/sort (unneeded at 5 people).
- Last-viewed-person persistence.
- Any write/edit affordances (would break the read-only principle — revisit only if the architecture direction changes).
