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
