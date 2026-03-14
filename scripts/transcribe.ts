#!/usr/bin/env npx tsx
/**
 * Local audio transcription using OpenAI Whisper.
 *
 * Usage:
 *   npx tsx scripts/transcribe.ts <audio-file> [--model small|medium|large] [--language he|en|...]
 *
 * Examples:
 *   npx tsx scripts/transcribe.ts recording.m4a
 *   npx tsx scripts/transcribe.ts meeting.mp3 --model medium
 *   npx tsx scripts/transcribe.ts hebrew-call.wav --model large --language he
 *
 * Output: transcript printed to stdout and saved as <audio-file>.txt
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, basename, dirname, extname } from 'path';

const VALID_MODELS = ['small', 'medium', 'large'];

function parseArgs() {
  const args = process.argv.slice(2);
  let audioFile: string | undefined;
  let model = 'small';
  let language: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--model' && args[i + 1]) {
      model = args[++i];
    } else if (args[i] === '--language' && args[i + 1]) {
      language = args[++i];
    } else if (!args[i].startsWith('--')) {
      audioFile = args[i];
    }
  }

  if (!audioFile) {
    console.error('Usage: npx tsx scripts/transcribe.ts <audio-file> [--model small|medium|large] [--language he|en|...]');
    process.exit(1);
  }

  if (!VALID_MODELS.includes(model)) {
    console.error(`Invalid model "${model}". Choose from: ${VALID_MODELS.join(', ')}`);
    process.exit(1);
  }

  const resolved = resolve(audioFile);
  if (!existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  return { audioFile: resolved, model, language };
}

function transcribe({ audioFile, model, language }: { audioFile: string; model: string; language?: string }) {
  const outputDir = dirname(audioFile);
  const baseName = basename(audioFile, extname(audioFile));
  const outputFile = resolve(outputDir, `${baseName}.txt`);

  const langFlag = language ? `--language ${language}` : '';

  const pythonScript = `
import whisper
import sys

model = whisper.load_model("${model}")
result = model.transcribe("${audioFile.replace(/"/g, '\\"')}"${language ? `, language="${language}"` : ''})
print(result["text"])
`.trim();

  console.error(`Transcribing: ${basename(audioFile)}`);
  console.error(`Model: ${model} | Language: ${language || 'auto-detect'}`);
  console.error('---');

  try {
    const output = execSync(`python3 -c ${JSON.stringify(pythonScript)}`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'inherit'], // stderr shows whisper progress
    });

    const transcript = output.trim();

    // Save to file
    require('fs').writeFileSync(outputFile, transcript, 'utf-8');
    console.error('---');
    console.error(`Saved to: ${outputFile}`);
    console.error('');

    // Print transcript to stdout
    console.log(transcript);
  } catch (err: any) {
    console.error('Transcription failed:', err.message);
    process.exit(1);
  }
}

const config = parseArgs();
transcribe(config);
