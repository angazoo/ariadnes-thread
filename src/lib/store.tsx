import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { View } from './types'

interface NavigationContextType {
  view: View
  navigate: (view: View) => void
}

const NavigationContext = createContext<NavigationContextType | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>({ type: 'home' })

  const navigate = useCallback((v: View) => {
    setView(v)
    window.scrollTo(0, 0)
  }, [])

  return (
    <NavigationContext.Provider value={{ view, navigate }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx)
    throw new Error('useNavigation must be used within NavigationProvider')
  return ctx
}
