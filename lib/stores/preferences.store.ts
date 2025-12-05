import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// User preferences state
interface PreferencesState {
  // Admin preferences
  showAllAnimations: boolean // Toggle to show all users' animations (admin only)
}

// User preferences actions
interface PreferencesActions {
  setShowAllAnimations: (show: boolean) => void
  resetPreferences: () => void
}

type PreferencesStore = PreferencesState & PreferencesActions

const initialState: PreferencesState = {
  showAllAnimations: false,
}

/**
 * Zustand preferences store with localStorage persistence
 * Stores user preferences that should persist across sessions
 */
export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...initialState,

      setShowAllAnimations: (show: boolean) => {
        set({ showAllAnimations: show })
      },

      resetPreferences: () => {
        set(initialState)
      },
    }),
    {
      name: 'user-preferences',
      // Only persist preferences, not sensitive data
      partialize: (state) => ({
        showAllAnimations: state.showAllAnimations,
      }),
    }
  )
)
