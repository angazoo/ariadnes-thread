import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

const getSpeechAPI = (): (new () => any) | null => {
  if (typeof window === 'undefined') return null
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  )
}

export default function VoiceTextArea({
  value,
  onChange,
  placeholder,
  className = '',
  autoFocus,
}: Props) {
  const [isListening, setIsListening] = useState(false)
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef<any>(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    valueRef.current = value
  }, [value])
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const SpeechRecognitionAPI = getSpeechAPI()
  const isSupported = !!SpeechRecognitionAPI

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI || isListening) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'

    recognition.onresult = (event: any) => {
      let finalText = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += t
        } else {
          interimText += t
        }
      }

      if (finalText) {
        const current = valueRef.current
        const needsSpace =
          current.length > 0 &&
          !current.endsWith(' ') &&
          !current.endsWith('\n')
        onChangeRef.current(
          current + (needsSpace ? ' ' : '') + finalText.trim()
        )
        setInterim('')
      } else {
        setInterim(interimText)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterim('')
    }

    recognition.onerror = () => {
      setIsListening(false)
      setInterim('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [SpeechRecognitionAPI, isListening])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterim('')
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) stopListening()
    else startListening()
  }, [isListening, startListening, stopListening])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
      />

      {isSupported && (
        <button
          type="button"
          onClick={toggleListening}
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center
                      transition-all duration-200
            ${
              isListening
                ? 'bg-rose-50 text-rose-500 shadow-sm shadow-rose-200'
                : 'bg-warm-white/80 text-warm-light hover:text-warm-muted'
            }`}
          aria-label={isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isListening && (
            <span className="absolute inset-0 rounded-full bg-rose-400/20 animate-ping" />
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isListening ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </button>
      )}

      {interim && (
        <p className="text-xs text-warm-light italic mt-1.5 px-1 animate-pulse">
          {interim}…
        </p>
      )}
    </div>
  )
}
