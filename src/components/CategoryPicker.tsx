import type { Category } from '../lib/types'
import { getCategoryColors } from '../lib/utils'

interface Props {
  categories: Category[]
  onSelect: (category: Category) => void
  onCancel: () => void
}

export default function CategoryPicker({ categories, onSelect, onCancel }: Props) {
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
          {categories.map((cat) => {
            const colors = getCategoryColors(cat.colorKey)
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat)}
                className="rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: colors.bg }}
              >
                <div className="text-2xl mb-2">{cat.emoji}</div>
                <div
                  className="font-medium text-sm"
                  style={{ color: colors.text }}
                >
                  {cat.name}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
