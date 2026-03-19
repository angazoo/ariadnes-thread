import { useNavigation } from '../lib/store'

export default function BottomNav() {
  const { view, navigate } = useNavigation()

  const isHome = view.type === 'home'
  const isSettings = view.type === 'settings'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-cream/90 backdrop-blur-lg border-t border-warm-border z-20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-lg mx-auto flex">
        <button
          onClick={() => navigate({ type: 'home' })}
          className={`flex-1 flex flex-col items-center pt-2.5 pb-2 gap-1 transition-colors
            ${isHome ? 'text-warm-text' : 'text-warm-light hover:text-warm-muted'}`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isHome ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span className="text-[10px] font-medium">Today</span>
        </button>

        <button
          onClick={() => navigate({ type: 'settings' })}
          className={`flex-1 flex flex-col items-center pt-2.5 pb-2 gap-1 transition-colors
            ${isSettings ? 'text-warm-text' : 'text-warm-light hover:text-warm-muted'}`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={isSettings ? '2' : '1.5'}
            strokeLinecap="round"
          >
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>
    </nav>
  )
}
