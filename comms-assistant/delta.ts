// Deterministic style-delta metrics between predicted and actual replies.
const HEBREW = /[֐-׿]/
const LATIN = /[A-Za-z]/

export type Lang = 'he' | 'en' | 'mixed' | 'empty'

export function detectLang(text: string): Lang {
  if (!text.trim()) return 'empty'
  const he = HEBREW.test(text)
  const en = LATIN.test(text)
  if (he && en) return 'mixed'
  return he ? 'he' : 'en'
}

export interface StructuralDelta {
  predictedLen: number
  actualLen: number
  lengthRatio: number
  langPredicted: Lang
  langActual: Lang
  languageMatch: boolean
}

export function structuralDelta(predicted: string, actual: string): StructuralDelta {
  const langPredicted = detectLang(predicted)
  const langActual = detectLang(actual)
  return {
    predictedLen: predicted.length,
    actualLen: actual.length,
    lengthRatio: actual.length === 0 ? 0 : +(predicted.length / actual.length).toFixed(2),
    langPredicted,
    langActual,
    languageMatch: langPredicted === langActual,
  }
}

// Action-selection delta: did Yonatan take the suggested action, aimed at the suggested target?
// This is the higher-value learning signal (action + targeting beats phrasing). The suggested
// action lives in the comms_predictions row (action_type/action_target); the actual action is
// observed at reconcile time (e.g. "no in-thread reply, briefed leaders" = redirect). The diff
// goes into the prediction's `delta` JSON and feeds `comms_rules` (type 'decision').
export interface ActionDelta {
  suggestedType: string | null
  actualType: string | null
  typeMatch: boolean
  suggestedTarget: string | null
  actualTarget: string | null
  targetMatch: boolean | null   // null when either side is unspecified — don't claim a match we can't judge
}

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()

export function actionDelta(
  suggested: { type?: string | null; target?: string | null },
  actual: { type?: string | null; target?: string | null },
): ActionDelta {
  const sTarget = suggested.target ?? null
  const aTarget = actual.target ?? null
  return {
    suggestedType: suggested.type ?? null,
    actualType: actual.type ?? null,
    typeMatch: norm(suggested.type) === norm(actual.type),
    suggestedTarget: sTarget,
    actualTarget: aTarget,
    targetMatch: sTarget && aTarget ? norm(sTarget) === norm(aTarget) : null,
  }
}
