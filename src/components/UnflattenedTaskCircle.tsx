import type { UnflattenedCircle } from '../lib/types'
import { getCategoryColors } from '../lib/utils'

interface Props {
  value: UnflattenedCircle
  onChange: (v: UnflattenedCircle) => void
  colorKey: string
  /** Inner = task scope; outer = emotional atmosphere */
  compact?: boolean
}

export default function UnflattenedTaskCircle({
  value,
  onChange,
  colorKey,
  compact = false,
}: Props) {
  const colors = getCategoryColors(colorKey)
  const maxR = compact ? 44 : 56
  const innerR = 12 + (value.scope / 100) * (maxR - 12)
  const outerR = innerR + 8 + (value.atmosphere / 100) * (maxR - innerR - 8)

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex justify-center">
        <svg
          width={compact ? 120 : 140}
          height={compact ? 120 : 140}
          viewBox="0 0 120 120"
          className="overflow-visible"
        >
          <circle
            cx="60"
            cy="60"
            r={Math.min(outerR, 52)}
            fill="none"
            stroke={colors.accent}
            strokeWidth="2"
            strokeOpacity={0.35}
          />
          <circle
            cx="60"
            cy="60"
            r={Math.min(innerR, outerR - 4)}
            fill={colors.bg}
            stroke={colors.accent}
            strokeWidth="2.5"
          />
        </svg>
      </div>
      <div className="space-y-2 text-xs">
        <div>
          <div className="flex justify-between text-warm-muted mb-1">
            <span>Task scope</span>
            <span className="tabular-nums">{value.scope}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={value.scope}
            onChange={(e) =>
              onChange({ ...value, scope: Number(e.target.value) })
            }
            className="w-full accent-warm-text h-1.5"
          />
          <p className="text-[10px] text-warm-light mt-0.5">
            Small = quick task · Large = big undertaking
          </p>
        </div>
        <div>
          <div className="flex justify-between text-warm-muted mb-1">
            <span>Emotional weight</span>
            <span className="tabular-nums">{value.atmosphere}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={value.atmosphere}
            onChange={(e) =>
              onChange({ ...value, atmosphere: Number(e.target.value) })
            }
            className="w-full accent-warm-text h-1.5"
          />
          <p className="text-[10px] text-warm-light mt-0.5">
            Small = feels easy · Large = dread or resistance
          </p>
        </div>
      </div>
    </div>
  )
}
