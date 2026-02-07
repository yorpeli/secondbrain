/**
 * Daily Summary — Telegram Delivery
 *
 * Sends voice messages and text via the Telegram Bot API.
 * Uses raw HTTPS fetch — no SDK dependency needed.
 */

import * as fs from 'fs'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

function validateConfig() {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is required')
  }
  if (!TELEGRAM_CHAT_ID) {
    throw new Error('TELEGRAM_CHAT_ID environment variable is required')
  }
}

function apiUrl(method: string): string {
  return `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`
}

/**
 * Send a voice message (audio file) to the configured Telegram chat.
 */
export async function sendVoice(audioPath: string, caption?: string): Promise<void> {
  validateConfig()

  console.log(`  Sending voice message to Telegram...`)

  const audioData = fs.readFileSync(audioPath)
  const formData = new FormData()
  formData.append('chat_id', TELEGRAM_CHAT_ID!)
  formData.append('voice', new Blob([audioData], { type: 'audio/ogg' }), 'briefing.opus')
  if (caption) {
    // Telegram caption limit is 1024 chars
    formData.append('caption', caption.slice(0, 1024))
  }

  const response = await fetch(apiUrl('sendVoice'), {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Telegram sendVoice error (${response.status}): ${errorBody}`)
  }

  console.log(`  Voice message sent.`)
}

/**
 * Send a text message to the configured Telegram chat.
 */
export async function sendMessage(text: string): Promise<void> {
  validateConfig()

  console.log(`  Sending text message to Telegram...`)

  const response = await fetch(apiUrl('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'Markdown',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Telegram sendMessage error (${response.status}): ${errorBody}`)
  }

  console.log(`  Text message sent.`)
}
