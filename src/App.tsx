import { NavigationProvider, useNavigation } from './lib/store'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import DailyView from './components/DailyView'
import SessionFlow from './components/SessionFlow'
import SettingsView from './components/SettingsView'
import MorningFlow from './components/MorningFlow'
import EveningReview from './components/EveningReview'

function AppContent() {
  const { view } = useNavigation()

  if (view.type === 'session') return <SessionFlow />
  if (view.type === 'morning') return <MorningFlow />
  if (view.type === 'evening') return <EveningReview />

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 pb-36 max-w-lg mx-auto w-full">
        {view.type === 'home' && <DailyView />}
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
