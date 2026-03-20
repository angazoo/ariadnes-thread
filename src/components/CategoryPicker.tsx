import type { Category } from '../lib/types'
import { getCategoryColors, getTierColors, getTierLabel } from '../lib/utils'

interface Props {
  categories: Category[]
  onSelect: (category: Category) => void
  onCancel: () => void
  plannedIds?: string[]
}

export default function CategoryPicker({
  categories,
  onSelect,
  onCancel,
  plannedIds = [],
}: Props) {
  const activeCategories = categories.filter((c) => !c.archived)
  const plannedSet = new Set(plannedIds)

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onCancel} className="btn-ghost text-sm">
          ← Back
        </button>
        <span className="text-xs text-warm-light uppercase tracking-wide">
          Choose mode
        </span>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex flex-col justify-center pb-16">
        <h2 className="font-serif text-2xl text-center mb-8">
          What are you doing?
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {activeCategories.map((cat) => {
            const colors = getCategoryColors(cat.colorKey)
            const tierColors = getTierColors(cat.tier)
            const isPlanned = plannedSet.has(cat.id)

            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat)}
                className={`rounded-2xl p-5 text-left transition-all duration-200
                  hover:scale-[1.02] active:scale-[0.98] relative
                  ${isPlanned ? 'ring-2 ring-warm-text/20' : ''}`}
                style={{ backgroundColor: colors.bg }}
              >
                {isPlanned && (
                  <div className="absolute top-2.5 right-2.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: colors.accent }}
                      title="Planned for today"
                    />
                  </div>
                )}
                <div className="text-2xl mb-2">{cat.emoji}</div>
                <div
                  className="font-medium text-sm"
                  style={{ color: colors.text }}
                >
                  {cat.name}
                </div>
                <div
                  className="text-[10px] mt-1 px-1.5 py-0.5 rounded-full inline-block"
                  style={{
                    backgroundColor: tierColors.bg,
                    color: tierColors.text,
                  }}
                >
                  {getTierLabel(cat.tier)}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
