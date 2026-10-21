import { useNavigation } from '../lib/store'
import { formatDate, getTodayDate } from '../lib/utils'

export default function Header() {
  const { view, navigate } = useNavigation()

  const subtitle =
    view.type === 'home'
      ? `The Map · ${formatDate(getTodayDate())}`
      : view.type === 'threshold'
        ? 'The Threshold · Adventure log'
        : view.type === 'interstitial-journal'
          ? 'Interstitial Journal · quick capture'
          : view.type === 'archive'
            ? 'Archive · timeline & stats'
            : view.type === 'settings'
              ? 'Settings'
              : ''

  return (
    <header className="px-4 pt-7 pb-3 max-w-lg mx-auto w-full animate-fadeIn">
      <button
        type="button"
        onClick={() => navigate({ type: 'home' })}
        className="text-left group w-full"
      >
        <div className="flex items-center gap-2.5 mb-1.5">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            className="text-thread shrink-0"
            aria-hidden
          >
            <path
              d="M4 18c3-1 5-4 6.5-7.5C12 7 14 4 20 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              className="animate-thread-pulse"
            />
            <circle cx="20" cy="4" r="1.4" fill="currentColor" />
          </svg>
          <h1 className="font-serif text-[1.7rem] leading-none tracking-tight text-ink group-hover:text-thread transition-colors duration-300">
            Ariadne&apos;s Thread
          </h1>
        </div>
        <p className="text-[13px] text-warm-muted pl-[30px]">{subtitle}</p>
      </button>
    </header>
  )
}
