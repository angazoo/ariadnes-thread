import { useState } from 'react'

interface Props {
  workMinutes: number
  digestMinutes: number
  onSubmit: (workMinutes: number, digestMinutes: number) => void
  onBack: () => void
}

const WORK_PRESETS = [15, 25, 45, 60, 90, 120]
const DIGEST_PRESETS = [5, 10, 15, 20]

export default function DurationPicker({
  workMinutes: initialWork,
  digestMinutes: initialDigest,
  onSubmit,
  onBack,
}: Props) {
  const [workMinutes, setWorkMinutes] = useState(initialWork)
  const [digestMinutes, setDigestMinutes] = useState(initialDigest)

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="btn-ghost text-sm">
          ← Back
        </button>
        <span className="text-xs text-warm-light uppercase tracking-wide">
          Duration
        </span>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex flex-col justify-center pb-16 space-y-10">
        <div>
          <h2 className="font-serif text-2xl text-center mb-2">How long?</h2>
          <p className="text-center text-warm-muted text-sm mb-6">
            Work session
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {WORK_PRESETS.map((mins) => (
              <button
                key={mins}
                onClick={() => setWorkMinutes(mins)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    workMinutes === mins
                      ? 'bg-warm-text text-cream'
                      : 'bg-warm-white text-warm-muted hover:text-warm-text'
                  }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-center text-warm-muted text-sm mb-4">
            Digest phase
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {DIGEST_PRESETS.map((mins) => (
              <button
                key={mins}
                onClick={() => setDigestMinutes(mins)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    digestMinutes === mins
                      ? 'bg-warm-text text-cream'
                      : 'bg-warm-white text-warm-muted hover:text-warm-text'
                  }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onSubmit(workMinutes, digestMinutes)}
          className="btn-primary mx-auto"
        >
          Begin session
        </button>
      </div>
    </div>
  )
}
