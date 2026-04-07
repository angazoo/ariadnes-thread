import { useState, useCallback, type KeyboardEvent } from 'react'
import type { QuickCapture } from '../lib/types'
import {
  formatTimeOfDay,
  quickCaptureIcon,
  quickCaptureLabel,
  type QuickCaptureKind,
} from '../lib/utils'

interface Props {
  title: string
  entries: QuickCapture[]
  onAdd: (text: string, kind?: QuickCaptureKind) => void
  onAddParking?: (text: string) => void
  variant: 'journal' | 'parking'
}

export default function QuickCaptureColumn({
  title,
  entries,
  onAdd,
  onAddParking,
  variant,
}: Props) {
  const [line, setLine] = useState('')
  const [activeKind, setActiveKind] = useState<QuickCaptureKind | 'parking'>('thought')

  const submit = useCallback(() => {
    const t = line.trim()
    if (!t) return
    if (variant === 'journal' && activeKind === 'parking' && onAddParking) {
      onAddParking(t)
    } else {
      const selectedKind: QuickCaptureKind =
        variant === 'journal' && activeKind !== 'parking' ? activeKind : 'thought'
      onAdd(t, variant === 'journal' ? selectedKind : undefined)
    }
    setLine('')
  }, [line, onAdd, onAddParking, variant, activeKind])

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  const shell =
    variant === 'journal'
      ? 'bg-[#F6F1E8] border-stone-200/90 w-full max-w-3xl'
      : 'bg-[#F2EDE6] border-stone-300/50'

  const quickActions: {
    kind: QuickCaptureKind | 'parking'
    icon: string
    label: string
  }[] = [
    { kind: 'feeling', icon: '❤️', label: 'Add feeling' },
    { kind: 'thought', icon: '🧠', label: 'Add thought' },
    { kind: 'nervous-system', icon: '🦎', label: 'Add nervous system note' },
    { kind: 'parking', icon: '🛑', label: 'Add parking lot item' },
    { kind: 'idea', icon: '💡', label: 'Add idea' },
  ]

  return (
    <div
      className={`rounded-2xl border p-3 flex flex-col min-h-[200px] max-h-[min(50vh,320px)] ${shell}`}
    >
      <p className="text-[11px] font-medium text-warm-muted uppercase tracking-wide mb-2">
        {title}
      </p>
      {variant === 'journal' && (
        <div className="flex items-center gap-1 mb-2">
          {quickActions.map((action) => (
            <button
              key={action.kind}
              type="button"
              onClick={() => setActiveKind(action.kind)}
              className={`w-8 h-8 rounded-lg active:scale-95 border flex items-center justify-center text-sm ${
                activeKind === action.kind
                  ? 'bg-white border-stone-400 shadow-sm'
                  : 'bg-white/60 hover:bg-white/90 border-amber-200/70'
              }`}
              aria-label={action.label}
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-1.5 mb-2">
        <input
          value={line}
          onChange={(e) => setLine(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            variant === 'journal'
              ? activeKind === 'parking'
                ? 'Parking lot…'
                : `${quickCaptureLabel(activeKind)}…`
              : 'Thought…'
          }
          className="flex-1 bg-white/70 rounded-xl px-2.5 py-2 text-sm placeholder:text-warm-light
                     focus:outline-none focus:ring-2 focus:ring-warm-border/60"
        />
        <button
          type="button"
          onClick={submit}
          className="shrink-0 w-9 h-9 rounded-xl bg-warm-text/10 text-warm-text text-lg leading-none
                     hover:bg-warm-text/15 active:scale-95"
          aria-label="Add note"
        >
          +
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto space-y-2 pr-1">
        {entries.map((e) => (
          <li key={e.id} className="text-sm text-warm-text leading-snug">
            <span className="text-[10px] text-warm-light tabular-nums mr-1">
              {formatTimeOfDay(e.at)}
            </span>
            {variant === 'journal' && (
              <span aria-hidden className="mr-1">
                {quickCaptureIcon(e.kind)}
              </span>
            )}
            {e.text.trim() || quickCaptureLabel(e.kind)}
          </li>
        ))}
      </ul>
    </div>
  )
}
