import type { Category, AppSettings } from './types'

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'forage',
    name: 'Forage',
    emoji: '🌿',
    colorKey: 'forage',
    intentionPrompts: [
      'What are you curious about right now?',
      'What thread are you following?',
      "Is there something specific you're looking for, or are you exploring openly?",
    ],
    debriefPrompts: [
      'What sparked your curiosity?',
      'Did you find what you were looking for?',
      'Anything worth saving or following up on?',
      'What can you close or let go of?',
    ],
    isDefault: true,
    sortOrder: 0,
  },
  {
    id: 'build',
    name: 'Build',
    emoji: '🔨',
    colorKey: 'build',
    intentionPrompts: [
      'What are you building or working on?',
      'What does "done" look like for this session?',
      "What's the one thing you want to move forward?",
    ],
    debriefPrompts: [
      'What did you make progress on?',
      "Is this finished, or what's still missing?",
      "What's the next concrete step?",
      'Anything blocking you?',
    ],
    isDefault: true,
    sortOrder: 1,
  },
  {
    id: 'write',
    name: 'Write',
    emoji: '✏️',
    colorKey: 'write',
    intentionPrompts: [
      'What are you writing?',
      'Are you drafting, editing, or finishing?',
      'What do you want this piece to do?',
    ],
    debriefPrompts: [
      'How did the writing go?',
      "What's the state of this piece now?",
      'Is there anything you want to revisit?',
      'Where does this draft live?',
    ],
    isDefault: true,
    sortOrder: 2,
  },
  {
    id: 'engage',
    name: 'Engage',
    emoji: '💬',
    colorKey: 'engage',
    intentionPrompts: [
      'Who or what are you engaging with?',
      "What's your purpose here?",
      'Is this outreach, connection, or response?',
    ],
    debriefPrompts: [
      'How did the interaction go?',
      'Any follow-ups needed?',
      'Did anything unexpected come up?',
      'Ready to close this channel?',
    ],
    isDefault: true,
    sortOrder: 3,
  },
  {
    id: 'digest',
    name: 'Digest',
    emoji: '🫖',
    colorKey: 'digest',
    intentionPrompts: [
      'What are you processing or organizing?',
      'What accumulated stuff needs attention?',
      'Are you clearing, sorting, or reflecting?',
    ],
    debriefPrompts: [
      'What did you process?',
      'Does anything still need attention?',
      'How do you feel after clearing some space?',
    ],
    isDefault: true,
    sortOrder: 4,
  },
  {
    id: 'admin',
    name: 'Admin',
    emoji: '📋',
    colorKey: 'admin',
    intentionPrompts: [
      'What logistics are you handling?',
      "What's the most important admin task right now?",
      'Is this urgent, or maintenance?',
    ],
    debriefPrompts: [
      'Did you get through what you needed?',
      'Anything left to handle?',
      'Any deadlines or follow-ups?',
    ],
    isDefault: true,
    sortOrder: 5,
  },
]

export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  defaultWorkMinutes: 45,
  defaultDigestMinutes: 10,
}
