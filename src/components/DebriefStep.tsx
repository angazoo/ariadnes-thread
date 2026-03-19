import { useState } from 'react'
import type { Category } from '../lib/types'
import { getCategoryColors } from '../lib/utils'
import VoiceTextArea from './VoiceTextArea'

interface Props {
  category: Category
  onSubmit: (reflections: Record<string, string>) => void
}

export default function DebriefStep({ category, onSubmit }: Props) {
  const [reflections, setReflections] = useState<Record<string, string>>({})
  const colors = getCategoryColors(category.colorKey)

  const prompts = category.debriefPrompts

  const updateReflection = (prompt: string, value: string) => {
    setReflections((prev) => ({ ...prev, [prompt]: value }))
  }

  const hasAnyReflection = Object.values(reflections).some((v) => v.trim())

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto animate-fadeIn">
      <div className="mb-8 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {category.emoji} {category.name}
        </div>
        <h2 className="font-serif text-2xl">How did it go?</h2>
        <p className="text-warm-muted text-sm mt-1">
          Answer any, all, or none.
        </p>
      </div>

      <div className="flex-1 space-y-4">
        {prompts.map((prompt) => (
          <div key={prompt}>
            <label className="text-sm text-warm-muted block mb-1.5">
              {prompt}
            </label>
            <VoiceTextArea
              value={reflections[prompt] ?? ''}
              onChange={(val) => updateReflection(prompt, val)}
              className="w-full bg-warm-white rounded-xl p-3 pr-14 text-sm text-warm-text
                         placeholder:text-warm-light resize-none focus:outline-none
                         focus:ring-2 focus:ring-warm-border min-h-[72px]"
              placeholder="…"
            />
          </div>
        ))}
      </div>

      <div className="pt-6 pb-2">
        <button
          onClick={() => onSubmit(reflections)}
          className="btn-primary w-full"
        >
          {hasAnyReflection ? 'Save & finish' : 'Skip & finish'}
        </button>
      </div>
    </div>
  )
}
