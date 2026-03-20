import type { Session, Category, PyramidTier } from '../lib/types'
import {
  formatDuration,
  getTierColors,
  getTierLabel,
  getTierEmoji,
  computePyramidBalance,
} from '../lib/utils'

interface Props {
  sessions: Session[]
  categoryMap: Record<string, Category>
  compact?: boolean
}

const TIERS: PyramidTier[] = ['treat', 'building', 'foundation']

export default function PyramidView({
  sessions,
  categoryMap,
  compact = false,
}: Props) {
  const balance = computePyramidBalance(sessions, categoryMap)

  if (balance.total === 0) return null

  const widths: Record<PyramidTier, string> = {
    treat: 'w-3/5',
    building: 'w-4/5',
    foundation: 'w-full',
  }

  return (
    <div className="card space-y-3">
      <div className="flex flex-col items-center gap-1.5">
        {TIERS.map((tier) => {
          const tc = getTierColors(tier)
          const seconds = balance[tier]
          const pct = balance.total > 0 ? seconds / balance.total : 0

          return (
            <div key={tier} className={`${widths[tier]} flex items-center gap-2`}>
              <div
                className="flex-1 h-7 rounded-lg overflow-hidden relative"
                style={{ backgroundColor: tc.bg }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700"
                  style={{
                    width: `${Math.max(pct * 100, seconds > 0 ? 8 : 0)}%`,
                    backgroundColor: tc.accent,
                  }}
                />
                <div className="relative flex items-center justify-between px-2.5 h-full">
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: tc.text }}
                  >
                    {getTierEmoji(tier)} {getTierLabel(tier)}
                  </span>
                  {seconds > 0 && (
                    <span
                      className="text-[11px] tabular-nums"
                      style={{ color: tc.text }}
                    >
                      {formatDuration(seconds)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!compact && (
        <p
          className={`text-xs text-center ${
            balance.isBalanced ? 'text-warm-muted' : 'text-warm-text'
          }`}
        >
          {balance.label}
        </p>
      )}
    </div>
  )
}
