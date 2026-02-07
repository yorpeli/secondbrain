/**
 * Daily Summary — Text-to-Speech
 *
 * Converts briefing text to audio using OpenAI's TTS API.
 * Outputs opus format (optimized for speech, Telegram-native).
 */

import * as fs from 'fs'
import * as path from 'path'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface TtsOptions {
  text: string
  outputPath: string
  voice?: 'onyx' | 'alloy' | 'echo' | 'fable' | 'nova' | 'shimmer'
  model?: 'tts-1' | 'tts-1-hd'
}

/**
 * Generate speech audio from text using OpenAI TTS API.
 * Returns the file path of the generated audio.
 */
export async function generateSpeech(options: TtsOptions): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required for TTS')
  }

  const { text, outputPath, voice = 'onyx', model = 'tts-1' } = options

  console.log(`  Generating speech (${model}, voice: ${voice}, ${text.length} chars)...`)

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      response_format: 'opus',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenAI TTS API error (${response.status}): ${errorBody}`)
  }

  // Ensure output directory exists
  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Write audio to file
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(outputPath, buffer)

  const sizeKB = (buffer.length / 1024).toFixed(1)
  console.log(`  Audio saved: ${outputPath} (${sizeKB} KB)`)

  return outputPath
}
