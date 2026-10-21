import { useNavigation } from '../lib/store'

export default function BottomNav() {
  const { view, navigate } = useNavigation()

  const items = [
    {
      id: 'home' as const,
      label: 'Map',
      active: view.type === 'home',
      onClick: () => navigate({ type: 'home' }),
      icon: (active: boolean) => (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
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
      ),
    },
    {
      id: 'threshold' as const,
      label: 'Threshold',
      active: view.type === 'threshold',
      onClick: () => navigate({ type: 'threshold' }),
      icon: (active: boolean) => (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? '2' : '1.5'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 21V10.5a6 6 0 0 1 12 0V21" />
          <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      id: 'archive' as const,
      label: 'Archive',
      active: view.type === 'archive',
      onClick: () => navigate({ type: 'archive' }),
      icon: (active: boolean) => (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={active ? '2' : '1.5'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="8" y1="7" x2="16" y2="7" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      ),
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      active: view.type === 'settings',
      onClick: () => navigate({ type: 'settings' }),
      icon: (active: boolean) => (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? '2' : '1.5'}
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
      ),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
    >
      <div className="max-w-lg mx-auto pointer-events-auto rounded-[1.35rem] border border-warm-border/80 bg-warm-white/90 backdrop-blur-xl shadow-float flex">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={`flex-1 flex flex-col items-center pt-2.5 pb-2 gap-1 transition-all duration-200
              ${item.active ? 'text-ink' : 'text-warm-light hover:text-warm-muted'}`}
          >
            <span
              className={`transition-transform duration-200 ${item.active ? 'scale-105' : ''}`}
            >
              {item.icon(item.active)}
            </span>
            <span
              className={`text-[10px] font-medium tracking-wide ${
                item.active ? 'text-thread' : ''
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
