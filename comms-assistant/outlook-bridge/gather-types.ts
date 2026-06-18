export interface RawGatherRecord {
  outlookId: string
  subject: string
  from: string
  to: string[]
  dateIso: string
  internetMessageId: string
  threadIndex: string
  body: string
}

export interface CapturePacket {
  slug: string
  email: {
    subject: string
    from: string
    date: string
    to: string[]
    excerpt: string
    channel: 'outlook'
    internet_message_id: string
    conversation_id: string
    web_link: string
  }
  thread: { subject: string; participants: string[]; mentions: string[]; bodyToDate: string }
  signals: { sensitive: boolean; directToHim: boolean; askToHim: boolean; broadcast: boolean; cold: boolean }
  body: string
  today: string
}
