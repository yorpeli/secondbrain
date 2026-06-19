// Naive local datetime string, "YYYY-MM-DDTHH:MM" (no timezone offset).
export type NaiveDateTime = string

export interface BusyBlock {
  start: NaiveDateTime
  end: NaiveDateTime
}

export interface Slot {
  start: NaiveDateTime
  end: NaiveDateTime
  score: number
}

export interface SlotConstraints {
  dayStartHour: number   // first hour a meeting may start
  dayEndHour: number     // a meeting must END by this hour
  lunchStartHour: number // inclusive lunch block start hour
  lunchEndHour: number   // exclusive lunch block end hour
  minGapMin: number      // buffer required around busy blocks
  workdays: number[]     // 0=Sun … 6=Sat (getUTCDay convention)
  slotStepMin: number    // candidate start granularity
}

export interface ResolvedAttendee {
  slug: string
  name: string
  email: string
}

export interface MeetingSpec {
  subject: string
  body: string             // plain text agenda; converted to HTML for the event content
  attendees: string[]      // email addresses
  start: NaiveDateTime
  end: NaiveDateTime
  location?: string
}
