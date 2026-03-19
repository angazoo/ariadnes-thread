import { useState, useMemo } from 'react'
import type { Category } from '../lib/types'
import { getCategoryColors, getRandomItem } from '../lib/utils'
import VoiceTextArea from './VoiceTextArea'

interface Props {
  category: Category
  onSubmit: (intention: string) => void
  onBack: () => void
}

export default function IntentionStep({ category, onSubmit, onBack }: Props) {
  const [intention, setIntention] = useState('')
  const colors = getCategoryColors(category.colorKey)
  const prompt = useMemo(
    () => getRandomItem(category.intentionPrompts),
    [category.intentionPrompts]
  )

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="btn-ghost text-sm">
          ← Back
        </button>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {category.emoji} {category.name}
        </div>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex flex-col justify-center pb-16">
        <h2 className="font-serif text-2xl text-center mb-2">
          Set your intention
        </h2>
        <p className="text-center text-warm-muted text-sm mb-8">{prompt}</p>

        <VoiceTextArea
          value={intention}
          onChange={setIntention}
          placeholder="What's the thread you're following…"
          className="w-full bg-warm-white rounded-2xl p-4 pr-14 text-warm-text placeholder:text-warm-light
                     resize-none focus:outline-none focus:ring-2 focus:ring-warm-border
                     min-h-[120px] text-base leading-relaxed"
          autoFocus
        />

        <div className="mt-6">
          <button
            onClick={() => onSubmit(intention)}
            className="btn-primary w-full"
          >
            {intention.trim() ? 'Continue' : 'Skip'}
          </button>
        </div>
      </div>
    </div>
  )
}
