#!/usr/bin/env tsx
/**
 * Daily Summary Agent — CLI Entry Point
 *
 * Usage:
 *   npx tsx daily-summary/run.ts              # Full flow: gather → compose → TTS → Telegram
 *   npx tsx daily-summary/run.ts --text-only  # Print briefing text, skip TTS and Telegram
 *   npx tsx daily-summary/run.ts --no-send    # Generate audio file, don't send via Telegram
 *   npx tsx daily-summary/run.ts check-tasks  # Pick up pending tasks from agent_tasks
 */

import 'dotenv/config'
import * as path from 'path'
import { gatherDailyData } from './gather.js'
import { composeBriefing } from './compose.js'
import { generateSpeech } from './tts.js'
import { sendVoice, sendMessage } from './telegram.js'

const args = process.argv.slice(2)
const command = args[0]

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`)
}

async function runDailySummary(options: {
  textOnly?: boolean
  noSend?: boolean
}) {
  console.log('Daily Summary Agent')
  console.log('═'.repeat(50))

  // Step 1: Gather data
  console.log('\n1. Gathering data from Supabase...')
  const data = await gatherDailyData()
  console.log(`   Meetings: ${data.meetings.length}`)
  console.log(`   Action items: ${data.actionItems.length}`)
  console.log(`   Initiatives: ${data.initiatives.length}`)
  console.log(`   PPP signals: ${data.pppSignals.length}`)

  // Step 2: Compose briefing
  console.log('\n2. Composing briefing...')
  const briefing = composeBriefing(data)
  console.log(`   Briefing length: ${briefing.length} chars`)

  if (options.textOnly) {
    console.log('\n' + '─'.repeat(50))
    console.log(briefing)
    console.log('─'.repeat(50))
    return
  }

  // Step 3: Generate audio
  console.log('\n3. Generating audio via OpenAI TTS...')
  const outputDir = path.resolve('output')
  const audioPath = path.join(outputDir, `daily-summary-${data.date}.opus`)
  await generateSpeech({ text: briefing, outputPath: audioPath })

  if (options.noSend) {
    console.log(`\nAudio saved to: ${audioPath}`)
    console.log('Skipping Telegram delivery (--no-send).')
    return
  }

  // Step 4: Send via Telegram
  console.log('\n4. Sending via Telegram...')
  const caption = `Daily Briefing — ${data.dayOfWeek}, ${data.date}`
  await sendVoice(audioPath, caption)

  // Also send text summary as a follow-up message
  const textSummary = formatTextSummary(data)
  await sendMessage(textSummary)

  console.log('\nDone. Briefing delivered.')
}

function formatTextSummary(data: import('./gather.js').DailySummaryData): string {
  const lines: string[] = [`*Daily Briefing — ${data.dayOfWeek}, ${data.date}*`]

  if (data.meetings.length > 0) {
    lines.push('')
    lines.push(`*Meetings (${data.meetings.length}):*`)
    data.meetings.forEach(m => {
      lines.push(`• ${m.topic} (${m.meeting_type})`)
    })
  }

  if (data.actionItems.length > 0) {
    lines.push('')
    const overdue = data.actionItems.filter(a => a.is_overdue).length
    lines.push(`*Action items:* ${data.actionItems.length} due (${overdue} overdue)`)
    data.actionItems.slice(0, 5).forEach(a => {
      const marker = a.is_overdue ? 'OVERDUE' : 'today'
      lines.push(`• [${marker}] ${a.owner_name}: ${a.description}`)
    })
  }

  if (data.pppSignals.length > 0) {
    lines.push('')
    lines.push('*PPP signals:*')
    data.pppSignals.forEach(s => {
      const emoji = s.status === 'at-risk' ? '🔴' : '🟡'
      lines.push(`${emoji} ${s.workstream_name} (${s.lead_name})`)
    })
  }

  return lines.join('\n')
}

// ─── Agent Task Pickup ───────────────────────────────────────

async function checkTasks(): Promise<{ processed: number; errors: number }> {
  const { getSupabase } = await import('../lib/supabase.js')
  const supabase = getSupabase()

  const { data: tasks, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, status, priority')
    .or('target_agent.eq.daily-summary,target_agent.is.null')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch tasks:', error.message)
    return { processed: 0, errors: 1 }
  }

  const pending = (tasks || []) as any[]
  if (pending.length === 0) {
    console.log('No pending tasks.')
    return { processed: 0, errors: 0 }
  }

  console.log(`Found ${pending.length} pending task(s).`)
  let processed = 0
  let errors = 0

  for (const task of pending) {
    // Only pick up daily-summary tasks (skip null target_agent ones that aren't for us)
    let desc: any
    try { desc = JSON.parse(task.description) } catch { continue }
    if (desc.type !== 'daily-summary') continue

    console.log(`\nProcessing: ${task.title} (${task.id})`)

    // Claim
    await supabase
      .from('agent_tasks' as any)
      .update({ status: 'picked-up', picked_up_by: 'daily-summary' } as any)
      .eq('id', task.id)

    try {
      await runDailySummary({})

      await supabase
        .from('agent_tasks' as any)
        .update({
          status: 'done',
          result_summary: 'Daily summary generated and delivered via Telegram.',
          completed_at: new Date().toISOString(),
        } as any)
        .eq('id', task.id)

      processed++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  Error: ${message}`)

      await supabase
        .from('agent_tasks' as any)
        .update({ status: 'failed', result_summary: `Error: ${message}` } as any)
        .eq('id', task.id)

      const { logError } = await import('../lib/logging.js')
      await logError('daily-summary', err instanceof Error ? err : new Error(message), {
        task_id: task.id,
      })

      errors++
    }
  }

  return { processed, errors }
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  if (command === 'check-tasks') {
    const stats = await checkTasks()
    console.log(`\nDone. Processed: ${stats.processed}, Errors: ${stats.errors}`)
    return
  }

  if (command === 'help' || command === '--help') {
    console.log(`
Daily Summary Agent — CLI

Usage:
  npx tsx daily-summary/run.ts              Generate and send via Telegram
  npx tsx daily-summary/run.ts --text-only  Print briefing text only
  npx tsx daily-summary/run.ts --no-send    Generate audio, don't send
  npx tsx daily-summary/run.ts check-tasks  Pick up pending agent_tasks

Environment:
  SUPABASE_URL              Database URL
  SUPABASE_SERVICE_ROLE_KEY Database auth
  OPENAI_API_KEY            For TTS generation
  TELEGRAM_BOT_TOKEN        Telegram bot token
  TELEGRAM_CHAT_ID          Target Telegram chat ID
`)
    return
  }

  try {
    await runDailySummary({
      textOnly: hasFlag('text-only'),
      noSend: hasFlag('no-send'),
    })
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
