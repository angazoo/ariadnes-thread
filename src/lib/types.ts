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

export interface QuickCapture {
  id: string
  text: string
  at: number
  kind?: 'feeling' | 'thought' | 'nervous-system' | 'idea'
  bucket?: string
}

export interface TaskUnpacking {
  involves?: string
  need?: string
  hard?: string
  feel?: string
}

export interface UnflattenedCircle {
  scope: number
  atmosphere: number
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
  unpacking?: TaskUnpacking
  circleBefore?: UnflattenedCircle
  circleAfter?: UnflattenedCircle
  journalEntries?: QuickCapture[]
  parkingEntries?: QuickCapture[]
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

/** LEVEL 2 — The Threshold / Adventure Log (one evolving doc per day). */
export type WeatherMood =
  | 'clear'
  | 'bright'
  | 'cloudy'
  | 'rain'
  | 'fog'
  | 'fire'
  | ''

export type EnergyArrow = 'up' | 'steady' | 'down' | ''

export type LifePhaseSelf = 'gathering' | 'building' | 'digesting' | ''

export interface AdventureLog {
  date: string
  createdAt: number
  updatedAt: number
  weatherMood?: WeatherMood
  howAreYou?: string
  onMind?: string
  whatsPulling?: string
  carrying?: string
  voiceCritic?: string
  voiceDreamer?: string
  voiceScared?: string
  voiceExhausted?: string
  shiftedSinceYesterday?: string
  energyArrow?: EnergyArrow
  intentionToday?: string
  oneThingWorthwhile?: string
  avoidingFacing?: string
  projectsSituate?: string
  creativeVsReactive?: string
  lifePhase?: LifePhaseSelf
  needRightNow?: string
  /** End-of-day return to the threshold */
  eveningClosing?: string
}

export type View =
  | { type: 'home' }
  | { type: 'threshold' }
  | { type: 'interstitial-journal' }
  | { type: 'archive' }
  | { type: 'session'; categoryId?: string }
  | { type: 'settings' }
  | { type: 'evening' }

export type SessionPhase =
  | 'prep'
  | 'timer-work'
  | 'post'

export const DEBRIEF_KEYS = {
  howWent: 'How did it go?',
  howFelt: 'How did it feel?',
  finished: "Finished, or what's missing?",
  other: 'Any other thoughts or ideas?',
} as const
