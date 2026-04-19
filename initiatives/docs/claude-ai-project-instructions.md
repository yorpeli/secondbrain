# Claude AI Project Instructions — Workspace Sync

> Copy the relevant block below into each Claude AI Project's custom instructions.
> Replace `{initiative_id}` and `{initiative_name}` with the actual values.

---

## Per-Initiative Block (paste into each Project)

```
## Workspace Sync

This initiative has a shared workspace with Claude Code. Two content_sections rows keep context in sync:

- `workspace-context`: The initiative's identity, stakeholders, and scope (equivalent of the local CLAUDE.md)
- `workspace-memory`: Working memory — session logs, decisions, current state, open threads, user preferences (equivalent of the local memory.md)

### On conversation start

Load the current workspace state:

SELECT section_type, content, updated_at FROM content_sections
WHERE entity_id = '{initiative_id}' AND section_type IN ('workspace-context', 'workspace-memory');

Use this to understand what Claude Code has been working on, what decisions were made, and the current state of the initiative.

### When you update context or decisions

If the conversation produces new decisions, changes to stakeholders, status updates, or other information that should persist, update the relevant row:

UPDATE content_sections
SET content = '{updated_content}', date = CURRENT_DATE, updated_at = now()
WHERE entity_id = '{initiative_id}' AND section_type = 'workspace-memory';

- Append to the relevant section (Session Log, Key Decisions, Open Threads, etc.) — don't overwrite the whole document.
- For context changes (stakeholders, scope, role): update `workspace-context` instead.
- Always preserve existing content — add to it, don't replace it.

### What NOT to do

- Don't create new content_sections rows for workspace sync — only update the existing workspace-context and workspace-memory rows.
- Don't sync docs or artifacts — those live locally in Claude Code. Reference them by name if needed.
- The curated initiative memory doc (section_type = 'memory') is a separate thing — it's the structured Supabase source of truth maintained by PM agents. Don't confuse it with workspace-memory.
```

---

## Initiative IDs Reference

| Initiative | Slug | Initiative ID |
|-----------|------|---------------|
| The Foundry | `ai-academy-product` | `eb1823ee-4cc8-4918-ae0b-ba99bf76e551` |
| AI Team OS | `ai-native-team-structure` | `72a2dc76-126e-4fee-9ddd-cfa38c22dff9` |
| AIR² | `air-squared` | `288313a6-7c1c-441e-8719-dc29e1fe4869` |
