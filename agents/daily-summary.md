# Daily Summary Agent

## Purpose

Generate a concise morning briefing for Yonatan — covering today's meetings, open action items, active blockers, team task status, and PPP signals — then deliver it as a voice message via Telegram.

## Tools Available

- **Supabase**: Query all relevant views and tables for daily context
- **OpenAI TTS**: Convert the briefing text to natural-sounding audio (tts-1, voice: `onyx`)
- **Telegram Bot API**: Send voice message to Yonatan's chat

## Invocation Pattern

**CLI (direct):**
```bash
npx tsx daily-summary/run.ts              # Generate and send via Telegram
npx tsx daily-summary/run.ts --text-only  # Print briefing text, skip TTS and Telegram
npx tsx daily-summary/run.ts --no-send    # Generate audio file, don't send via Telegram
```

**Agent task (from other agents or humans):**
```sql
INSERT INTO agent_tasks (title, description, target_agent, status, priority, created_by)
VALUES (
  'Generate daily summary',
  '{"type": "daily-summary"}',
  'daily-summary',
  'pending',
  'normal',
  'scheduled'
);
```

## Briefing Structure

The daily summary is a ~60-90 second spoken briefing covering (in order):

1. **Date & greeting** — "Good morning Yonatan, here's your briefing for Tuesday, February 7th."
2. **Today's meetings** — Who, what type, what to prepare. Sourced from `v_meetings_with_attendees` where `date = today`.
3. **Overdue & due-today action items** — From `v_open_action_items` where `due_date <= today`.
4. **Active blockers** — From `current_focus` in `context_store` (watching/blocked items).
5. **Team task pulse** — Active initiative status from `v_initiative_dashboard`.
6. **PPP signals** — Any `at-risk` or `potential-issues` swimlanes from the latest PPP report via `v_ppp_swimlanes`.
7. **Sign-off** — "That's your briefing. Have a great day."

### Content Rules

- **Conversational tone** — Written for the ear, not the eye. Short sentences, natural rhythm.
- **No private notes** — Never include `private_notes` from meetings or PPP reports.
- **Concrete, not generic** — Use names, dates, specifics. "Elad has a KYC vendor review due today" not "there are pending items."
- **Prioritized** — Most important items first within each section. Skip sections with no items rather than saying "nothing here."

## TTS Configuration

- **Model**: `tts-1` (faster, good enough for voice messages)
- **Voice**: `onyx` (warm, professional male voice — good for briefings)
- **Format**: `opus` (optimized for speech, small file size, Telegram-native)
- **Output**: Saved to `output/daily-summary-{YYYY-MM-DD}.opus`

## Telegram Delivery

Uses the Telegram Bot API directly (HTTPS fetch, no SDK needed):

1. `sendVoice` to send the audio as a voice message
2. `sendMessage` to send a text fallback with the briefing summary

**Required env vars:**
- `TELEGRAM_BOT_TOKEN` — From @BotFather
- `TELEGRAM_CHAT_ID` — Yonatan's chat ID with the bot

## Scheduling (Future)

Not implemented in V1. Current invocation is manual CLI. Future options:
- GitHub Actions cron (`0 4 * * 1-5` = 07:00 Israel time on weekdays)
- Supabase pg_cron extension
- External scheduler (cron-job.org, etc.)

## Environment

Requires:
- `SUPABASE_URL` — Database connection
- `SUPABASE_SERVICE_ROLE_KEY` — Database auth
- `OPENAI_API_KEY` — For TTS generation
- `TELEGRAM_BOT_TOKEN` — Bot token from @BotFather
- `TELEGRAM_CHAT_ID` — Target chat for delivery
