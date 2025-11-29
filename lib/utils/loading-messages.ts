/**
 * Utility functions for loading messages (Step 7 - Customization)
 */

/**
 * Default loading messages shown during AI generation
 */
export const DEFAULT_LOADING_MESSAGES = [
  '🎨 L\'IA travaille sur ton image...',
  '✨ Génération en cours...',
  '🚀 Presque terminé...',
  '⏳ Encore quelques secondes...'
]

/**
 * Minimum number of loading messages required
 */
export const MIN_LOADING_MESSAGES = 3

/**
 * Maximum number of loading messages allowed
 */
export const MAX_LOADING_MESSAGES = 10

/**
 * Maximum length of each individual message
 */
export const MAX_MESSAGE_LENGTH = 100

/**
 * Parse loading messages from a text input (one message per line)
 * @param text - Multi-line text input
 * @returns Array of messages (empty lines filtered out)
 */
export function parseLoadingMessages(text: string): string[] {
  if (!text || text.trim() === '') {
    return []
  }

  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
}

/**
 * Convert loading messages array to text format (one per line)
 * @param messages - Array of messages
 * @returns Multi-line string
 */
export function messagesToText(messages: string[]): string {
  if (!messages || messages.length === 0) {
    return ''
  }

  return messages.join('\n')
}

/**
 * Validate loading messages count
 * @param messages - Array of messages
 * @returns True if count is between MIN and MAX (inclusive)
 */
export function validateLoadingMessagesCount(messages: string[]): boolean {
  return messages.length >= MIN_LOADING_MESSAGES && messages.length <= MAX_LOADING_MESSAGES
}

/**
 * Validate all messages length
 * @param messages - Array of messages
 * @returns True if all messages are within max length
 */
export function validateLoadingMessagesLength(messages: string[]): boolean {
  return messages.every(msg => msg.length <= MAX_MESSAGE_LENGTH)
}

/**
 * Validate loading messages (count and length)
 * @param messages - Array of messages
 * @returns Object with isValid flag and error message if invalid
 */
export function validateLoadingMessages(messages: string[]): { isValid: boolean; error?: string } {
  // Check count
  if (messages.length < MIN_LOADING_MESSAGES) {
    return {
      isValid: false,
      error: `Minimum ${MIN_LOADING_MESSAGES} messages requis (actuellement ${messages.length})`
    }
  }

  if (messages.length > MAX_LOADING_MESSAGES) {
    return {
      isValid: false,
      error: `Maximum ${MAX_LOADING_MESSAGES} messages autorisés (actuellement ${messages.length})`
    }
  }

  // Check individual message lengths
  const tooLongIndex = messages.findIndex(msg => msg.length > MAX_MESSAGE_LENGTH)
  if (tooLongIndex !== -1) {
    return {
      isValid: false,
      error: `Le message ${tooLongIndex + 1} dépasse ${MAX_MESSAGE_LENGTH} caractères`
    }
  }

  return { isValid: true }
}

/**
 * Get loading messages count summary for UI display
 * @param messages - Array of messages
 * @returns Formatted count string (e.g., "4 messages")
 */
export function getLoadingMessagesCountLabel(messages: string[]): string {
  const count = messages.length
  return count === 1 ? '1 message' : `${count} messages`
}

/**
 * Get or default loading messages
 * If no messages or invalid, return defaults
 * @param messages - Optional array of messages
 * @returns Array of messages (defaults if needed)
 */
export function getLoadingMessagesOrDefault(messages?: string[]): string[] {
  if (!messages || messages.length === 0) {
    return [...DEFAULT_LOADING_MESSAGES]
  }

  // If provided messages are invalid (count), use defaults
  if (!validateLoadingMessagesCount(messages)) {
    return [...DEFAULT_LOADING_MESSAGES]
  }

  return messages
}
