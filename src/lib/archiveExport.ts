import type {
  AdventureLog,
  Category,
  DayPlan,
  EveningReflection,
  Session,
} from './types'
import {
  formatDate,
  formatDuration,
  formatTimeOfDay,
  quickCaptureIcon,
  quickCaptureLabel,
} from './utils'

export const EXPORT_VERSION = 1 as const

export interface AriadneExportPayload {
  version: typeof EXPORT_VERSION
  exportedAt: string
  categories: Category[]
  sessions: Session[]
  adventureLogs: AdventureLog[]
  dayPlans: DayPlan[]
  eveningReflections: EveningReflection[]
}

const ADVENTURE_LABELS: { key: keyof AdventureLog; label: string }[] = [
  { key: 'howAreYou', label: 'How are you' },
  { key: 'onMind', label: 'On your mind' },
  { key: 'whatsPulling', label: "What's pulling" },
  { key: 'carrying', label: 'Carrying' },
  { key: 'voiceCritic', label: 'Voice: critic' },
  { key: 'voiceDreamer', label: 'Voice: dreamer' },
  { key: 'voiceScared', label: 'Voice: scared' },
  { key: 'voiceExhausted', label: 'Voice: exhausted' },
  { key: 'shiftedSinceYesterday', label: 'Shifted since yesterday' },
  { key: 'intentionToday', label: 'Intention today' },
  { key: 'oneThingWorthwhile', label: 'One thing worthwhile' },
  { key: 'avoidingFacing', label: 'Avoiding / facing' },
  { key: 'projectsSituate', label: 'Projects / situate' },
  { key: 'creativeVsReactive', label: 'Creative vs reactive' },
  { key: 'needRightNow', label: 'Need right now' },
  { key: 'eveningClosing', label: 'Evening closing' },
]

function reflectionLabel(key: string): string {
  if (key === '_alignment') return 'Alignment note'
  return key
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadJsonExport(payload: AriadneExportPayload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const stamp = payload.exportedAt.slice(0, 10)
  triggerDownload(blob, `ariadne-export-${stamp}.json`)
}

export function buildMarkdownExport(
  payload: AriadneExportPayload,
  sortedDatesDesc: string[]
): string {
  const catMap = Object.fromEntries(payload.categories.map((c) => [c.id, c]))
  const logByDate = Object.fromEntries(
    payload.adventureLogs.map((l) => [l.date, l])
  )
  const planByDate = Object.fromEntries(
    payload.dayPlans.map((p) => [p.date, p])
  )
  const eveningByDate = Object.fromEntries(
    payload.eveningReflections.map((e) => [e.date, e])
  )
  const sessionsByDate = new Map<string, Session[]>()
  for (const s of payload.sessions) {
    const list = sessionsByDate.get(s.date) ?? []
    list.push(s)
    sessionsByDate.set(s.date, list)
  }
  for (const list of sessionsByDate.values()) {
    list.sort((a, b) => a.startedAt - b.startedAt)
  }

  const lines: string[] = [
    "# Ariadne's Thread — export",
    '',
    `_Exported ${payload.exportedAt}_`,
    '',
  ]

  for (const date of sortedDatesDesc) {
    const sessions = sessionsByDate.get(date) ?? []
    const log = logByDate[date]
    const plan = planByDate[date]
    const eve = eveningByDate[date]
    if (!sessions.length && !log && !plan && !eve) continue

    lines.push(`## ${formatDate(date)} (${date})`)
    lines.push('')

    if (plan?.intention?.trim() || (plan?.categoryIds?.length ?? 0) > 0) {
      lines.push('### Day intention')
      if (plan?.intention?.trim()) lines.push(plan.intention.trim(), '')
      if ((plan?.categoryIds?.length ?? 0) > 0) {
        const names = (plan!.categoryIds ?? [])
          .map((id) => catMap[id])
          .filter(Boolean)
          .map((c) => `${c.emoji} ${c.name}`)
        if (names.length) lines.push(`Planned tiles: ${names.join(', ')}`, '')
      }
    }

    if (log) {
      const weather = log.weatherMood as string | undefined
      const bits: string[] = []
      if (weather) bits.push(`Weather mood: ${weather}`)
      if (log.energyArrow) bits.push(`Energy: ${log.energyArrow}`)
      if (log.lifePhase) bits.push(`Phase: ${log.lifePhase}`)
      if (bits.length) {
        lines.push('### Threshold')
        lines.push(bits.join(' · '), '')
      }
      for (const { key, label } of ADVENTURE_LABELS) {
        const v = log[key]
        if (typeof v === 'string' && v.trim()) {
          lines.push(`**${label}**`, '', v.trim(), '')
        }
      }
    }

    if (sessions.length) {
      lines.push('### Sessions')
      lines.push('')
      for (const s of sessions) {
        const c = catMap[s.categoryId]
        const emoji = c?.emoji ?? '📌'
        const name = c?.name ?? 'Unknown'
        lines.push(
          `#### ${emoji} ${name} · ${formatTimeOfDay(s.startedAt)}`,
          ''
        )
        lines.push(
          `- Work: ${formatDuration(s.workDurationActual)} (planned ${formatDuration(s.workDurationPlanned)})`
        )
        if (!s.digestSkipped) {
          lines.push(
            `- Digest: ${formatDuration(s.digestDurationActual)} (planned ${formatDuration(s.digestDurationPlanned)})`
          )
        } else {
          lines.push('- Digest: skipped')
        }
        lines.push('')
        if (s.intention?.trim()) {
          lines.push('**Intention**', '', s.intention.trim(), '')
        }
        if (s.unpacking) {
          const u = s.unpacking
          if (u.involves?.trim())
            lines.push('**Involves**', '', u.involves.trim(), '')
          if (u.need?.trim()) lines.push('**Need**', '', u.need.trim(), '')
          if (u.hard?.trim()) lines.push('**Hard**', '', u.hard.trim(), '')
          if (u.feel?.trim()) lines.push('**Feel**', '', u.feel.trim(), '')
        }
        if (s.circleBefore) {
          lines.push(
            `**Before:** scope ${s.circleBefore.scope}% · atmosphere ${s.circleBefore.atmosphere}%`,
            ''
          )
        }
        if (s.circleAfter) {
          lines.push(
            `**After:** scope ${s.circleAfter.scope}% · atmosphere ${s.circleAfter.atmosphere}%`,
            ''
          )
        }
        const refl = s.reflections ?? {}
        for (const [k, v] of Object.entries(refl)) {
          if (typeof v === 'string' && v.trim()) {
            lines.push(`**${reflectionLabel(k)}**`, '', v.trim(), '')
          }
        }
        const journal = s.journalEntries ?? []
        if (journal.length) {
          lines.push('**Journal**', '')
          for (const j of journal.sort((a, b) => a.at - b.at)) {
            lines.push(
              `- ${quickCaptureIcon(j.kind)} ${j.text.trim() || quickCaptureLabel(j.kind)}`
            )
          }
          lines.push('')
        }
        const park = s.parkingEntries ?? []
        if (park.length) {
          lines.push('**Parking lot**', '')
          for (const p of park.sort((a, b) => a.at - b.at)) {
            lines.push(`- 🛑 ${p.text.trim() || 'parking lot'}`)
          }
          lines.push('')
        }
      }
    }

    if (eve?.reflections && Object.keys(eve.reflections).length) {
      lines.push('### Evening mirror')
      lines.push('')
      for (const [k, v] of Object.entries(eve.reflections)) {
        if (typeof v === 'string' && v.trim()) {
          lines.push(`**${reflectionLabel(k)}**`, '', v.trim(), '')
        }
      }
    }

    lines.push('---', '')
  }

  return lines.join('\n').trimEnd() + '\n'
}

export function downloadMarkdownExport(
  payload: AriadneExportPayload,
  sortedDatesDesc: string[]
) {
  const md = buildMarkdownExport(payload, sortedDatesDesc)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const stamp = payload.exportedAt.slice(0, 10)
  triggerDownload(blob, `ariadne-journal-${stamp}.md`)
}
