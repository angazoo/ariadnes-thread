import { useNavigation } from '../lib/store'
import { formatDate, getTodayDate } from '../lib/utils'

export default function Header() {
  const { view, navigate } = useNavigation()

  return (
    <header className="px-4 pt-6 pb-4 max-w-lg mx-auto w-full">
      <button
        onClick={() => navigate({ type: 'home' })}
        className="text-left"
      >
        <h1 className="font-serif text-2xl text-warm-text">
          Ariadne's Thread
        </h1>
        <p className="text-sm text-warm-muted mt-0.5">
          {view.type === 'home' && (
            <>
              The Map · {formatDate(getTodayDate())}
            </>
          )}
          {view.type === 'threshold' && 'The Threshold · Adventure log'}
          {view.type === 'interstitial-journal' &&
            'Interstitial Journal · quick capture'}
          {view.type === 'archive' && 'Archive · timeline & stats'}
          {view.type === 'settings' && 'Settings'}
        </p>
      </button>
    </header>
  )
}
