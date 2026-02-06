export { generateGenericBrief } from './generic-brief.js'
export { generatePppReport } from './ppp-report.js'
export { generateMeetingBrief } from './meeting-brief.js'
export { generateCharter } from './charter.js'

export type { GenericBriefInput, GenericBriefSection } from './generic-brief.js'
export type { PppReportInput, PppSwimlane } from './ppp-report.js'
export type {
  MeetingBriefInput,
  PersonContext,
  MeetingRecord,
  ActionItem,
  CoachingNote,
} from './meeting-brief.js'
export type {
  CharterInput,
  InitiativeData,
  Stakeholder,
  TaskItem,
} from './charter.js'

// ---------------------------------------------------------------------------
// Template registry
// ---------------------------------------------------------------------------

export const DocumentType = {
  PPP_REPORT: 'ppp-report',
  MEETING_BRIEF: 'meeting-brief',
  CHARTER: 'charter',
  GENERIC_BRIEF: 'generic-brief',
} as const

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType]

export interface TemplateInfo {
  type: DocumentType
  description: string
  requiredParams: string[]
  optionalParams: string[]
}

export const templateInfo: Record<DocumentType, TemplateInfo> = {
  [DocumentType.PPP_REPORT]: {
    type: DocumentType.PPP_REPORT,
    description: 'Weekly CLM status report from PPP data',
    requiredParams: ['week'],
    optionalParams: ['raw'],
  },
  [DocumentType.MEETING_BRIEF]: {
    type: DocumentType.MEETING_BRIEF,
    description: '1:1 preparation brief for a person',
    requiredParams: ['person'],
    optionalParams: ['date'],
  },
  [DocumentType.CHARTER]: {
    type: DocumentType.CHARTER,
    description: 'Initiative charter document',
    requiredParams: ['initiative'],
    optionalParams: [],
  },
  [DocumentType.GENERIC_BRIEF]: {
    type: DocumentType.GENERIC_BRIEF,
    description: 'Flexible document from JSON input file',
    requiredParams: ['input'],
    optionalParams: [],
  },
}
