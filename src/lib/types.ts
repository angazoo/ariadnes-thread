export interface Category {
  id: string
  name: string
  emoji: string
  colorKey: string
  intentionPrompts: string[]
  debriefPrompts: string[]
  isDefault: boolean
  sortOrder: number
}

export interface Session {
  id?: number
  date: string
  categoryId: string
  intention: string
  workDurationPlanned: number
  workDurationActual: number
  digestDurationPlanned: number
  digestDurationActual: number
  digestSkipped: boolean
  reflections: Record<string, string>
  startedAt: number
  endedAt: number
  status: 'completed'
}

export interface AppSettings {
  id: number
  defaultWorkMinutes: number
  defaultDigestMinutes: number
}

export type View =
  | { type: 'home' }
  | { type: 'session' }
  | { type: 'settings' }

export type SessionPhase =
  | 'category'
  | 'intention'
  | 'duration'
  | 'timer-work'
  | 'timer-digest-prompt'
  | 'timer-digest'
  | 'debrief'
