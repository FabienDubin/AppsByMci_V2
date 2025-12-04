// Public display configuration types (Step 6)

/**
 * Display configuration (Step 6 - Legacy, kept for backward compatibility)
 */
export interface IDisplayConfig {
  enabled: boolean
  layout: string
  columns: number
  showNames: boolean
  refreshInterval: number
}

/**
 * Public Display configuration (Step 6 - New)
 */
export interface IPublicDisplayConfig {
  enabled: boolean
  layout: 'masonry' | 'grid' | 'carousel'
  columns?: number // Required if layout !== 'carousel'
  autoScroll?: boolean // Auto-scroll for Masonry/Grid
  autoScrollSpeed?: 'slow' | 'medium' | 'fast' // Scroll speed
  showParticipantName: boolean
  refreshInterval: number // 5-60 seconds
}
