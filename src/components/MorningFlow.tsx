import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, saveDayPlan } from '../lib/db'
import { useNavigation } from '../lib/store'
import type { Category } from '../lib/types'
import { getTodayDate, getCategoryColors, getTierColors, getTierLabel } from '../lib/utils'
import VoiceTextArea from './VoiceTextArea'

type Step = 'intention' | 'categories' | 'done'

export default function MorningFlow() {
  const { navigate } = useNavigation()
  const categories = useLiveQuery(() =>
    db.categories.orderBy('sortOrder').toArray()
  )

  const [step, setStep] = useState<Step>('intention')
  const [intention, setIntention] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleCategory = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    await saveDayPlan({
      date: getTodayDate(),
      intention,
      categoryIds: [...selectedIds],
      createdAt: Date.now(),
    })
    navigate({ type: 'home' })
  }, [intention, selectedIds, navigate])

  if (!categories) {
    return (
      <div className="min-h-screen flex items-center justify-center text-warm-muted">
        Loading…
      </div>
    )
  }

  const activeCategories = categories.filter((c) => !c.archived)

  return (
    <div className="min-h-screen bg-cream">
      {step === 'intention' && (
        <div className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto animate-fadeIn">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate({ type: 'home' })}
              className="btn-ghost text-sm"
            >
              ← Back
            </button>
            <span className="text-xs text-warm-light uppercase tracking-wide">
              Morning
            </span>
            <div className="w-16" />
          </div>

          <div className="flex-1 flex flex-col justify-center pb-16">
            <div className="text-3xl text-center mb-3">☀️</div>
            <h2 className="font-serif text-2xl text-center mb-2">
              What would make today wholesome?
            </h2>
            <p className="text-center text-warm-muted text-sm mb-8">
              Not a rigid plan — more like setting the table.
            </p>

            <VoiceTextArea
              value={intention}
              onChange={setIntention}
              placeholder="A loose intention for the day…"
              className="w-full bg-warm-white rounded-2xl p-4 pr-14 text-warm-text
                         placeholder:text-warm-light resize-none focus:outline-none
                         focus:ring-2 focus:ring-warm-border min-h-[100px] text-base leading-relaxed"
              autoFocus
            />

            <div className="mt-6">
              <button
                onClick={() => setStep('categories')}
                className="btn-primary w-full"
              >
                {intention.trim() ? 'Next' : 'Skip to categories'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'categories' && (
        <div className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto animate-fadeIn">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setStep('intention')}
              className="btn-ghost text-sm"
            >
              ← Back
            </button>
            <span className="text-xs text-warm-light uppercase tracking-wide">
              Today's table
            </span>
            <div className="w-16" />
          </div>

          <div className="flex-1 pb-16">
            <h2 className="font-serif text-2xl text-center mb-2">
              What's on the table today?
            </h2>
            <p className="text-center text-warm-muted text-sm mb-6">
              Pick 2–3 categories you intend to spend time in.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {activeCategories.map((cat) => (
                <MorningCategoryCard
                  key={cat.id}
                  category={cat}
                  selected={selectedIds.has(cat.id)}
                  onToggle={() => toggleCategory(cat.id)}
                />
              ))}
            </div>

            <div className="mt-8">
              <button onClick={handleSave} className="btn-primary w-full">
                {selectedIds.size > 0
                  ? `Begin the day (${selectedIds.size} chosen)`
                  : 'Begin the day'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MorningCategoryCard({
  category,
  selected,
  onToggle,
}: {
  category: Category
  selected: boolean
  onToggle: () => void
}) {
  const colors = getCategoryColors(category.colorKey)
  const tierColors = getTierColors(category.tier)

  return (
    <button
      onClick={onToggle}
      className={`rounded-2xl p-4 text-left transition-all duration-200 relative
        ${selected ? 'ring-2 ring-warm-text/30 scale-[1.02]' : 'hover:scale-[1.01]'}
        active:scale-[0.98]`}
      style={{ backgroundColor: colors.bg }}
    >
      {selected && (
        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-warm-text flex items-center justify-center">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FAF8F5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
      <div className="text-2xl mb-2">{category.emoji}</div>
      <div className="font-medium text-sm" style={{ color: colors.text }}>
        {category.name}
      </div>
      <div
        className="text-[10px] mt-1 px-1.5 py-0.5 rounded-full inline-block"
        style={{ backgroundColor: tierColors.bg, color: tierColors.text }}
      >
        {getTierLabel(category.tier)}
      </div>
    </button>
  )
}
