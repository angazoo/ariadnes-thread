import { NavigationProvider, useNavigation } from './lib/store'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import DailyView from './components/DailyView'
import ThresholdView from './components/ThresholdView'
import SessionFlow from './components/SessionFlow'
import SettingsView from './components/SettingsView'
import EveningReview from './components/EveningReview'
import ArchiveView from './components/ArchiveView'
import InterstitialJournalView from './components/InterstitialJournalView'

function AppContent() {
  const { view } = useNavigation()

  if (view.type === 'session') return <SessionFlow />
  if (view.type === 'evening') return <EveningReview />
  if (view.type === 'interstitial-journal') return <InterstitialJournalView />

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 pb-36 max-w-lg mx-auto w-full">
        {view.type === 'home' && <DailyView />}
        {view.type === 'threshold' && <ThresholdView />}
        {view.type === 'archive' && <ArchiveView />}
        {view.type === 'settings' && <SettingsView />}
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  )
}
