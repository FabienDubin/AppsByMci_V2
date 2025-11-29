/**
 * Loading Messages Utility Tests
 * Tests for parsing and validation of loading messages
 */

import {
  parseLoadingMessages,
  messagesToText,
  validateLoadingMessages,
  getLoadingMessagesCountLabel,
} from '@/lib/utils/loading-messages'

describe('parseLoadingMessages', () => {
  it('should parse messages separated by newlines', () => {
    const text = 'Message 1\nMessage 2\nMessage 3'
    const result = parseLoadingMessages(text)
    expect(result).toEqual(['Message 1', 'Message 2', 'Message 3'])
  })

  it('should filter empty lines', () => {
    const text = 'Message 1\n\nMessage 2\n\n\nMessage 3'
    const result = parseLoadingMessages(text)
    expect(result).toEqual(['Message 1', 'Message 2', 'Message 3'])
  })

  it('should trim whitespace from messages', () => {
    const text = '  Message 1  \n  Message 2  '
    const result = parseLoadingMessages(text)
    expect(result).toEqual(['Message 1', 'Message 2'])
  })

  it('should handle Windows line endings', () => {
    const text = 'Message 1\r\nMessage 2\r\nMessage 3'
    const result = parseLoadingMessages(text)
    expect(result).toEqual(['Message 1', 'Message 2', 'Message 3'])
  })

  it('should return empty array for empty input', () => {
    expect(parseLoadingMessages('')).toEqual([])
    expect(parseLoadingMessages('   ')).toEqual([])
    expect(parseLoadingMessages('\n\n\n')).toEqual([])
  })
})

describe('messagesToText', () => {
  it('should join messages with newlines', () => {
    const messages = ['Message 1', 'Message 2', 'Message 3']
    const result = messagesToText(messages)
    expect(result).toBe('Message 1\nMessage 2\nMessage 3')
  })

  it('should handle single message', () => {
    const messages = ['Single message']
    const result = messagesToText(messages)
    expect(result).toBe('Single message')
  })

  it('should return empty string for empty array', () => {
    const result = messagesToText([])
    expect(result).toBe('')
  })
})

describe('validateLoadingMessages', () => {
  it('should return valid for 3-10 messages with proper length', () => {
    const messages = ['Message 1', 'Message 2', 'Message 3']
    const result = validateLoadingMessages(messages)
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should return error for less than 3 messages', () => {
    const messages = ['Message 1', 'Message 2']
    const result = validateLoadingMessages(messages)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Minimum 3')
  })

  it('should return error for more than 10 messages', () => {
    const messages = Array.from({ length: 11 }, (_, i) => `Message ${i + 1}`)
    const result = validateLoadingMessages(messages)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Maximum 10')
  })

  it('should return error for message longer than 100 characters', () => {
    const messages = ['Message 1', 'Message 2', 'a'.repeat(101)]
    const result = validateLoadingMessages(messages)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('100 caractères')
  })

  it('should accept message at exactly 100 characters', () => {
    const messages = ['Message 1', 'Message 2', 'a'.repeat(100)]
    const result = validateLoadingMessages(messages)
    expect(result.isValid).toBe(true)
  })

  it('should accept exactly 10 messages', () => {
    const messages = Array.from({ length: 10 }, (_, i) => `Message ${i + 1}`)
    const result = validateLoadingMessages(messages)
    expect(result.isValid).toBe(true)
  })
})

describe('getLoadingMessagesCountLabel', () => {
  it('should show count with singular when 1 message', () => {
    const result = getLoadingMessagesCountLabel(['Message'])
    expect(result).toBe('1 message')
  })

  it('should show count with plural when multiple messages', () => {
    const messages = ['Message 1', 'Message 2', 'Message 3']
    const result = getLoadingMessagesCountLabel(messages)
    expect(result).toBe('3 messages')
  })

  it('should show 0 messages for empty array', () => {
    const result = getLoadingMessagesCountLabel([])
    expect(result).toBe('0 messages')
  })
})
