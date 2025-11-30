import { useEffect } from 'react'

/**
 * Hook to warn users about unsaved changes
 * Listens to beforeunload event (browser refresh/close)
 *
 * TODO: For Next.js internal navigation (router.push), implement route change interception
 * This requires using Next.js router events or middleware
 */
export function useUnsavedChanges(hasChanges: boolean) {
  useEffect(() => {
    if (!hasChanges) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Modern browsers require returnValue to be set
      e.returnValue = ''
      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasChanges])
}
