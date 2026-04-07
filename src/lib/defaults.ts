import type { Category, AppSettings } from './types'

/** Six core modes — v3 brief. Users can add custom categories in settings. */
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'act',
    name: 'Act',
    emoji: '🎯',
    colorKey: 'act',
    tier: 'building',
    intentionPrompts: [
      'What are you doing and why?',
      "What's the concrete output of this session?",
      'What does done look like?',
    ],
    debriefPrompts: [
      'What did you ship or move forward?',
      "What's still missing?",
      'What blocked you?',
    ],
    isDefault: true,
    archived: false,
    sortOrder: 0,
  },
  {
    id: 'forage',
    name: 'Forage',
    emoji: '🌿',
    colorKey: 'forage',
    tier: 'treat',
    intentionPrompts: [
      'What are you exploring or consuming?',
      'What thread are you following?',
      'Open exploration or looking for something specific?',
    ],
    debriefPrompts: [
      'What was worth keeping?',
      'Anything to close or let go?',
      'Mind candy or something nourishing?',
    ],
    isDefault: true,
    archived: false,
    sortOrder: 1,
  },
  {
    id: 'think',
    name: 'Think',
    emoji: '🧠',
    colorKey: 'think',
    tier: 'building',
    intentionPrompts: [
      'What are you making sense of?',
      'Planning, strategizing, or processing?',
      'Solo reflection or sparring (e.g. with AI)?',
    ],
    debriefPrompts: [
      'What became clearer?',
      'Any decisions or insights?',
      'What still needs thinking?',
    ],
    isDefault: true,
    archived: false,
    sortOrder: 2,
  },
  {
    id: 'connect',
    name: 'Connect',
    emoji: '💬',
    colorKey: 'connect',
    tier: 'building',
    intentionPrompts: [
      'Who or what are you connecting with?',
      "What's the purpose of this interaction?",
    ],
    debriefPrompts: [
      'How did it go?',
      'Any follow-ups?',
      'Ready to close this thread?',
    ],
    isDefault: true,
    archived: false,
    sortOrder: 3,
  },
  {
    id: 'tidy',
    name: 'Tidy',
    emoji: '🧹',
    colorKey: 'tidy',
    tier: 'foundation',
    intentionPrompts: [
      'What are you cleaning up or filing?',
      'Quick hygiene or deeper admin?',
    ],
    debriefPrompts: [
      'What got tidied?',
      'Anything left in the pile?',
    ],
    isDefault: true,
    archived: false,
    sortOrder: 4,
  },
  {
    id: 'digest',
    name: 'Digest',
    emoji: '🫖',
    colorKey: 'digest',
    tier: 'foundation',
    intentionPrompts: [
      'What are you processing from what you consumed?',
      'Closing loops, clearing decks?',
    ],
    debriefPrompts: [
      'What did you digest?',
      'What can you let go of now?',
    ],
    isDefault: true,
    archived: false,
    sortOrder: 5,
  },
]

export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  defaultWorkMinutes: 45,
  defaultDigestMinutes: 10,
}

export const EVENING_PROMPTS = [
  "How aligned was today with what you're building?",
  'Was it mostly mind candy or genuinely nourishing?',
  "What's one thing you'd do differently tomorrow?",
  'What felt most alive today?',
]
