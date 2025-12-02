'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { AnimationResponse } from '@/lib/services/animation.service'

interface ParticipantContextType {
  animation: AnimationResponse
}

const ParticipantContext = createContext<ParticipantContextType | null>(null)

interface ParticipantProviderProps {
  children: ReactNode
  animation: AnimationResponse
}

/**
 * Provider for participant animation data
 * Used to share animation data between layout and page components
 */
export function ParticipantProvider({
  children,
  animation,
}: ParticipantProviderProps) {
  return (
    <ParticipantContext.Provider value={{ animation }}>
      {children}
    </ParticipantContext.Provider>
  )
}

/**
 * Hook to access animation data in participant components
 * @throws Error if used outside of ParticipantProvider
 */
export function useAnimation(): AnimationResponse {
  const context = useContext(ParticipantContext)
  if (!context) {
    throw new Error('useAnimation must be used within ParticipantProvider')
  }
  return context.animation
}
