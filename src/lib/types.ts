export type PyramidTier = 'foundation' | 'building' | 'treat'

export interface Category {
  id: string
  name: string
  emoji: string
  colorKey: string
  tier: PyramidTier
  intentionPrompts: string[]
  debriefPrompts: string[]
  isDefault: boolean
  archived: boolean
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

export interface DayPlan {
  date: string
  intention: string
  categoryIds: string[]
  createdAt: number
}

export interface EveningReflection {
  date: string
  reflections: Record<string, string>
  createdAt: number
}

export type View =
  | { type: 'home' }
  | { type: 'session' }
  | { type: 'settings' }
  | { type: 'morning' }
  | { type: 'evening' }

export type SessionPhase =
  | 'category'
  | 'intention'
  | 'duration'
  | 'timer-work'
  | 'timer-digest-prompt'
  | 'timer-digest'
  | 'debrief'
