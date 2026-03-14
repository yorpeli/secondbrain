#!/bin/bash
# Local audio transcription using OpenAI Whisper.
#
# Usage:
#   ./scripts/transcribe.sh <audio-file> [--model small|medium|large] [--language he|en|...]
#
# Examples:
#   ./scripts/transcribe.sh recording.m4a
#   ./scripts/transcribe.sh meeting.mp3 --model medium
#   ./scripts/transcribe.sh hebrew-call.wav --model large --language he
#
# Output: transcript printed to stdout and saved as <audio-file>.txt

set -e

MODEL="small"
LANGUAGE=""
AUDIO_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --model)
      MODEL="$2"
      shift 2
      ;;
    --language)
      LANGUAGE="$2"
      shift 2
      ;;
    *)
      AUDIO_FILE="$1"
      shift
      ;;
  esac
done

if [[ -z "$AUDIO_FILE" ]]; then
  echo "Usage: ./scripts/transcribe.sh <audio-file> [--model small|medium|large] [--language he|en|...]" >&2
  exit 1
fi

if [[ ! -f "$AUDIO_FILE" ]]; then
  echo "File not found: $AUDIO_FILE" >&2
  exit 1
fi

if [[ "$MODEL" != "small" && "$MODEL" != "medium" && "$MODEL" != "large" ]]; then
  echo "Invalid model \"$MODEL\". Choose from: small, medium, large" >&2
  exit 1
fi

# Resolve full path
AUDIO_FILE="$(cd "$(dirname "$AUDIO_FILE")" && pwd)/$(basename "$AUDIO_FILE")"
OUTPUT_FILE="${AUDIO_FILE%.*}.txt"

echo "Transcribing: $(basename "$AUDIO_FILE")" >&2
echo "Model: $MODEL | Language: ${LANGUAGE:-auto-detect}" >&2
echo "---" >&2

LANG_ARG=""
if [[ -n "$LANGUAGE" ]]; then
  LANG_ARG=", language=\"$LANGUAGE\""
fi

python3 -c "
import whisper
model = whisper.load_model('$MODEL')
result = model.transcribe('$AUDIO_FILE'$LANG_ARG)
text = result['text'].strip()
with open('$OUTPUT_FILE', 'w') as f:
    f.write(text)
print(text)
"

echo "---" >&2
echo "Saved to: $OUTPUT_FILE" >&2
