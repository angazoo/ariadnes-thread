import { useState, useEffect, useCallback, useRef } from 'react'
import type { Category } from '../lib/types'
import { formatTime, getCategoryColors } from '../lib/utils'

interface Props {
  durationSeconds: number
  phase: 'work' | 'digest'
  category: Category
  intention: string
  onComplete: (actualSeconds: number) => void
  onCancel: () => void
}

export default function TimerDisplay({
  durationSeconds,
  phase,
  category,
  intention,
  onComplete,
  onCancel,
}: Props) {
  const colors = getCategoryColors(category.colorKey)

  const startTimestampRef = useRef(Date.now())
  const accumulatedRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  const completedRef = useRef(false)

  const [status, setStatus] = useState<'running' | 'paused'>('running')
  const [elapsed, setElapsed] = useState(0)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (status !== 'running') return

    const interval = setInterval(() => {
      const now = Date.now()
      const currentElapsed =
        accumulatedRef.current + (now - startTimestampRef.current) / 1000
      setElapsed(currentElapsed)

      if (currentElapsed >= durationSeconds && !completedRef.current) {
        completedRef.current = true
        clearInterval(interval)
        onCompleteRef.current(durationSeconds)

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification("Ariadne's Thread", {
            body:
              phase === 'work'
                ? 'Work session complete.'
                : 'Digest complete.',
          })
        }
      }
    }, 250)

    return () => clearInterval(interval)
  }, [status, durationSeconds, phase])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const togglePause = useCallback(() => {
    if (status === 'running') {
      accumulatedRef.current +=
        (Date.now() - startTimestampRef.current) / 1000
      setStatus('paused')
    } else {
      startTimestampRef.current = Date.now()
      setStatus('running')
    }
  }, [status])

  const endEarly = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    const actualElapsed =
      status === 'running'
        ? accumulatedRef.current +
          (Date.now() - startTimestampRef.current) / 1000
        : accumulatedRef.current
    onCompleteRef.current(actualElapsed)
  }, [status])

  const handleCancel = useCallback(() => {
    completedRef.current = true
    onCancel()
  }, [onCancel])

  const remaining = Math.max(0, durationSeconds - elapsed)
  const progress = Math.min(1, elapsed / durationSeconds)

  const radius = 120
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fadeIn">
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {phase === 'work' ? category.emoji : '🫖'}{' '}
        {phase === 'work' ? category.name : 'Digest'}
      </div>

      <div className="relative">
        <svg width="280" height="280" className="-rotate-90">
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="#E8E4E0"
            strokeWidth="4"
          />
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke={colors.accent}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-light text-warm-text tabular-nums tracking-tight">
            {formatTime(remaining)}
          </span>
          {status === 'paused' && (
            <span className="text-xs text-warm-muted mt-1 animate-pulse">
              paused
            </span>
          )}
        </div>
      </div>

      {intention && (
        <p className="text-sm text-warm-muted text-center mt-6 max-w-xs italic">
          &ldquo;{intention}&rdquo;
        </p>
      )}

      <div className="flex items-center gap-6 mt-10">
        <button
          onClick={togglePause}
          className="w-14 h-14 rounded-full bg-warm-white flex items-center justify-center
                     hover:bg-warm-border transition-colors active:scale-95"
          aria-label={status === 'running' ? 'Pause' : 'Resume'}
        >
          {status === 'running' ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-warm-text"
            >
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-warm-text"
            >
              <polygon points="8 4 20 12 8 20" />
            </svg>
          )}
        </button>

        {!showEndConfirm ? (
          <button
            onClick={() => setShowEndConfirm(true)}
            className="text-xs text-warm-light hover:text-warm-muted transition-colors"
          >
            End early
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={endEarly}
              className="text-xs px-3 py-1.5 rounded-lg bg-warm-white text-warm-text
                         hover:bg-warm-border transition-colors"
            >
              Yes, end
            </button>
            <button
              onClick={() => setShowEndConfirm(false)}
              className="text-xs text-warm-light hover:text-warm-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleCancel}
        className="mt-8 text-xs text-warm-light/60 hover:text-warm-muted transition-colors"
      >
        Abandon session
      </button>
    </div>
  )
}
