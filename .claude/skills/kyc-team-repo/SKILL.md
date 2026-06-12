---
name: kyc-team-repo
description: >-
  READ-ONLY access to the Payoneer KYC team's shared Azure DevOps repo ("Product KYC Team",
  owned by Elad Schnarch) via the Azure DevOps REST API. Fetches files, lists folders, and
  filters by frontmatter from branch KYC_Team_Branch. This repo holds the KYC/KYB team's PRDs,
  competitive research, vendor analyses, EVS/DU reference docs, glossary, and dashboards — useful
  context for CLM vendor, KYC product, competitive, and EVS/eCollection work. Triggers on:
  "KYC team repo", "Elad's repo", "Product KYC Team", "what does the KYC team say", "team glossary",
  "team PRD", "team vendor analysis", "team competitive analysis", "KYC team competitive research",
  "EVS reference", "DU vendors", "KYC_Team_Branch". READ-ONLY: this skill never writes, commits,
  or opens PRs. It does not self-update. Backed by Yonatan's read-only PAT in the project .env.
metadata:
  tags: azure-devops, kyc, kyb, evs, vendors, competitive-research, read-only
  owner: yonatan-orpeli
  source_repo: https://dev.azure.com/Payoneer/Payoneer/_git/Product%20KYC%20Team
---

# kyc-team-repo (read-only)

Read the Payoneer KYC/KYB team's shared Azure DevOps repo on demand via the REST API. Azure DevOps
is the source of truth — there is **no local clone**, no `git pull`, no working tree. Every read hits
the API live, so you always see the latest committed version.

This is Yonatan's **read-only** connection to a repo he is a *consumer* of (the team's README lists
him as a secondary reader, not an author). It is a deliberately trimmed version of Elad's team
`kyc-team-repo` skill: **no write/commit/PR paths, no self-update.** If write access is ever needed,
that's a separate decision (broader PAT scope + the team's full skill).

## Constants

| Name | Value |
|---|---|
| ORG | `Payoneer` |
| PROJECT | `Payoneer` |
| REPO_NAME | `Product KYC Team` (URL-encoded: `Product%20KYC%20Team`) |
| REPO_ID | `6f48db76-f464-4d7d-a682-033bcc0749b3` |
| BRANCH | `KYC_Team_Branch` (always — never `master`) |
| API_BASE | `https://dev.azure.com/Payoneer/Payoneer/_apis/git/repositories/Product%20KYC%20Team` |
| AUTH | Basic auth, empty username, PAT as password: `-u ":$AZURE_DEVOPS_PAT"` |
| PAT location | `AZURE_DEVOPS_PAT` in the project's gitignored `.env` |

## Credentials

The read-only PAT (scope: Code → Read) lives in `AZURE_DEVOPS_PAT` in the project `.env` (gitignored).
**Always load it from `.env` at the start of a bash block; never paste, echo, or commit it:**

```bash
set -a; . ./.env; set +a   # loads $AZURE_DEVOPS_PAT (run from the project root)
```

If `$AZURE_DEVOPS_PAT` is unset or a call returns `401`, the PAT is missing or expired — tell Yonatan
to regenerate a **Code: Read** PAT at https://dev.azure.com/Payoneer/_usersSettings/tokens and update
`.env`. **Never ask for the PAT in chat** (it would land in the transcript).

## Read operations

All examples assume `.env` is already sourced (see Credentials).

### Read a single file
```bash
curl -sS -u ":$AZURE_DEVOPS_PAT" \
  "$API_BASE/items?path=/PATH/TO/FILE&versionType=Branch&version=KYC_Team_Branch&api-version=7.1"
```
For binaries (`.pptx/.xlsx/.docx/.pdf`) add `&download=true` and `-o /tmp/<name>`, then open with the
matching skill (`pptx`, `docx`, etc.). Prefer reading the `<file>.meta.md` sidecar first — it summarizes
the binary so you can decide whether opening it is worth the tokens.

### List a folder
```bash
# OneLevel for a single folder; Full for a deep tree
curl -sS -u ":$AZURE_DEVOPS_PAT" \
  "$API_BASE/items?scopePath=/FOLDER&recursionLevel=OneLevel&versionType=Branch&version=KYC_Team_Branch&api-version=7.1" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); [print(i['path']) for i in d['value'] if not i.get('isFolder')]"
```

### Filter by frontmatter
The API can't filter by frontmatter. Pattern: list the folder → read each `.md`'s first ~50 lines →
parse the YAML between `---` markers → filter in memory. Use the indexes in §5 of the repo `/README.md`
(e.g. PRDs = `type=prd`, competitor analyses = `type=competitor-analysis`, vendor notes = `vendor=<name>`).

## Repo layout (where things live)

The repo's `/README.md` is the canonical operating manual — fetch it when you need the exact frontmatter
contracts or "where does X live" rules. Quick map:

| Folder | What's there |
|---|---|
| `/artifacts` | Dated work docs: PRDs, vendor & competitor analyses, experiment reports, decks, meeting summaries. `/artifacts/competitive-research/` has the Stripe/Wise/Airwallex KYC-KYB studies. |
| `/references` | Evergreen: `glossary.md`, `evs/` (architecture, metrics, providers), `DU/` (doc-understanding core context, vendors, vendor monthly reports), `onboarding-flows.md`, `lob.md` |
| `/vendor-management` | KYX vendor QA framework + scorecards (`/qa`) |
| `/Product Analytics` | Looker / PowerBI / SharePoint dashboard `.link.md` files |
| `/onboarding`, `/agents`, `/archive` | Team setup docs, agent context, superseded content |

Naming: kebab-case, ISO date prefix `YYYY-MM-DD-` on dated artifacts; `/references` & `/onboarding` are
evergreen (no date prefix). Every non-`.md` binary has a `<file>.meta.md` sidecar; external apps are
stored as `<topic>.<platform>.link.md` (figma/miro/looker/sharepoint/asana/lovable/confluence).

## Common workflows

### "What does the KYC team say about X?"
1. Pick the relevant folder(s) from the map above.
2. List the folder; read sidecars / `.md` frontmatter to find matches.
3. Open the matching file(s) and answer by **quoting the source with its repo path** — don't paraphrase
   from training data, and if the repo doesn't cover X, say so.

### "List the team's PRDs / vendor analyses / competitor research"
List `/artifacts` (recursive), read each `.md`'s frontmatter, filter by `type`, return with
`status`, `owner`, `last_updated`.

### "Pull the team glossary / EVS / DU reference"
Read `/references/glossary.md`, `/references/evs/*.md`, or `/references/DU/*.md` directly.

### Bringing repo content into the Second Brain
This is the bridge between the KYC team's repo and Yonatan's Second Brain. When a fetched doc is
relevant to an initiative or a PM agent's domain (vendor-optimization-pm, kyc-product-pm,
competitive-analysis, EVS/eCollection initiatives), surface it to Yonatan and, on his confirmation,
record it in the right place (e.g. an initiative memory doc) **with provenance** — cite the source as
`[KYC team repo: /path/to/file @ KYC_Team_Branch]`. Do not silently copy large chunks; link and
summarize. Keep Azure DevOps as the source of truth (read live), the Second Brain as the index.

## Non-negotiables

1. **READ-ONLY.** Never POST/PATCH, never push, never open or complete a PR. If asked to write to the
   team repo, stop and explain this skill is read-only by design (would need a broader PAT + the team's
   full skill, and Yonatan is a consumer of this repo).
2. **Branch is always `KYC_Team_Branch`** — never `master`.
3. **Never echo or commit the PAT.** Load it from `.env`; if a command might print it, pipe through
   `sed "s/${AZURE_DEVOPS_PAT}/***PAT***/g"`.
4. **Never invent repo contents.** If a file or fact isn't in the repo, say so. Quote with file paths.
5. **Cite provenance** when carrying repo content into the Second Brain.

## Error handling

| Error | Likely cause | Action |
|---|---|---|
| `401 Unauthorized` | PAT expired / missing / wrong scope | Regenerate Code:Read PAT, update `.env`. Don't ask for it in chat. |
| `404 Not Found` on read | Wrong path or branch | Verify the path with a folder listing first. Branch is always `KYC_Team_Branch`. |
| Empty / non-JSON body | `.env` not sourced, so `$AZURE_DEVOPS_PAT` empty | Run `set -a; . ./.env; set +a` from the project root first. |
| Hang with no output | Git/curl prompting for credentials | You forgot the PAT; use the `-u ":$AZURE_DEVOPS_PAT"` form. |
