/**
 * Email Variables Utility Tests
 * Tests for detecting, validating, and replacing email template variables
 */

import {
  getAvailableEmailVariables,
  detectVariablesInText,
  validateVariables,
  replaceVariablesWithPlaceholders,
  replaceSubjectVariables,
  getVariablesTooltipContent,
  DEFAULT_EMAIL_TEMPLATE,
  DEFAULT_EMAIL_SUBJECT,
} from '@/lib/utils/email-variables'
import type { AnimationData } from '@/lib/stores/wizard.store'

describe('getAvailableEmailVariables', () => {
  it('should return empty array for animation with no enabled fields', () => {
    const data: AnimationData = {
      baseFields: {
        name: { enabled: false, required: false },
        firstName: { enabled: false, required: false },
        email: { enabled: false, required: false },
      },
    }

    const vars = getAvailableEmailVariables(data)
    // Should only contain system variables
    expect(vars).toContain('{imageUrl}')
    expect(vars).not.toContain('{nom}')
    expect(vars).not.toContain('{prenom}')
    expect(vars).not.toContain('{email}')
  })

  it('should include {nom} when name field is enabled', () => {
    const data: AnimationData = {
      baseFields: {
        name: { enabled: true, required: true },
        firstName: { enabled: false, required: false },
        email: { enabled: false, required: false },
      },
    }

    const vars = getAvailableEmailVariables(data)
    expect(vars).toContain('{nom}')
    expect(vars).not.toContain('{prenom}')
    expect(vars).not.toContain('{email}')
  })

  it('should include all base fields when enabled', () => {
    const data: AnimationData = {
      baseFields: {
        name: { enabled: true, required: true },
        firstName: { enabled: true, required: true },
        email: { enabled: true, required: true },
      },
    }

    const vars = getAvailableEmailVariables(data)
    expect(vars).toContain('{nom}')
    expect(vars).toContain('{prenom}')
    expect(vars).toContain('{email}')
    expect(vars).toContain('{imageUrl}')
  })

  it('should include question variables from inputCollection', () => {
    const data: AnimationData = {
      baseFields: {
        name: { enabled: true, required: true },
        firstName: { enabled: false, required: false },
        email: { enabled: false, required: false },
      },
      inputCollection: {
        elements: [
          { id: '1', type: 'choice', order: 0, question: 'Color?' },
          { id: '2', type: 'slider', order: 1, question: 'Rating?' },
        ],
      },
    }

    const vars = getAvailableEmailVariables(data)
    expect(vars).toContain('{question1}')
    expect(vars).toContain('{question2}')
  })

  it('should not include selfie type as question variable', () => {
    const data: AnimationData = {
      baseFields: {
        name: { enabled: true, required: true },
        firstName: { enabled: false, required: false },
        email: { enabled: false, required: false },
      },
      inputCollection: {
        elements: [
          { id: '1', type: 'selfie', order: 0 },
          { id: '2', type: 'choice', order: 1, question: 'Color?' },
        ],
      },
    }

    const vars = getAvailableEmailVariables(data)
    // Only one question variable (selfie is excluded)
    expect(vars).toContain('{question1}')
    expect(vars).not.toContain('{question2}')
  })

  it('should always include {imageUrl} system variable', () => {
    const data: AnimationData = {}
    const vars = getAvailableEmailVariables(data)
    expect(vars).toContain('{imageUrl}')
  })
})

describe('detectVariablesInText', () => {
  it('should return empty array for text without variables', () => {
    const text = 'Hello world, no variables here!'
    expect(detectVariablesInText(text)).toEqual([])
  })

  it('should detect single variable', () => {
    const text = 'Hello {nom}!'
    expect(detectVariablesInText(text)).toEqual(['{nom}'])
  })

  it('should detect multiple variables', () => {
    const text = 'Hello {nom}, your email is {email}'
    const detected = detectVariablesInText(text)
    expect(detected).toContain('{nom}')
    expect(detected).toContain('{email}')
    expect(detected).toHaveLength(2)
  })

  it('should detect variables with numbers', () => {
    const text = 'Answer 1: {question1}, Answer 2: {question2}'
    const detected = detectVariablesInText(text)
    expect(detected).toContain('{question1}')
    expect(detected).toContain('{question2}')
  })

  it('should return unique variables only', () => {
    const text = 'Hello {nom}, goodbye {nom}'
    expect(detectVariablesInText(text)).toEqual(['{nom}'])
  })

  it('should handle empty string', () => {
    expect(detectVariablesInText('')).toEqual([])
  })

  it('should handle null/undefined', () => {
    expect(detectVariablesInText(null as unknown as string)).toEqual([])
    expect(detectVariablesInText(undefined as unknown as string)).toEqual([])
  })
})

describe('validateVariables', () => {
  const validVars = ['{nom}', '{prenom}', '{email}', '{imageUrl}']

  it('should return empty array when all variables are valid', () => {
    const text = 'Hello {nom}, your email is {email}'
    expect(validateVariables(text, validVars)).toEqual([])
  })

  it('should return invalid variables', () => {
    const text = 'Hello {nomComplet}, your {invalidVar}'
    const invalid = validateVariables(text, validVars)
    expect(invalid).toContain('{nomComplet}')
    expect(invalid).toContain('{invalidVar}')
    expect(invalid).toHaveLength(2)
  })

  it('should return empty for text without variables', () => {
    const text = 'No variables here'
    expect(validateVariables(text, validVars)).toEqual([])
  })
})

describe('replaceVariablesWithPlaceholders', () => {
  const validVars = ['{nom}', '{prenom}', '{email}', '{imageUrl}', '{question1}']

  it('should replace {nom} with styled placeholder', () => {
    const template = 'Hello {nom}!'
    const result = replaceVariablesWithPlaceholders(template, validVars)
    expect(result).toContain('[NOM]')
    expect(result).toContain('class=')
    expect(result).not.toContain('{nom}')
  })

  it('should replace {imageUrl} with image placeholder', () => {
    const template = 'Your image: {imageUrl}'
    const result = replaceVariablesWithPlaceholders(template, validVars)
    expect(result).toContain('[IMAGE_URL]')
    expect(result).not.toContain('{imageUrl}')
  })

  it('should replace question variables with numbered placeholders', () => {
    const template = 'Answer: {question1}'
    const result = replaceVariablesWithPlaceholders(template, validVars)
    expect(result).toContain('[RÉPONSE 1]')
  })

  it('should handle empty template', () => {
    expect(replaceVariablesWithPlaceholders('', validVars)).toBe('')
  })
})

describe('replaceSubjectVariables', () => {
  const validVars = ['{nom}', '{prenom}', '{email}']

  it('should replace variables with plain text placeholders', () => {
    const subject = 'Hello {nom}, your result is ready!'
    const result = replaceSubjectVariables(subject, validVars)
    expect(result.text).toBe('Hello [NOM], your result is ready!')
    expect(result.invalidVars).toEqual([])
  })

  it('should track invalid variables', () => {
    const subject = 'Hello {invalidVar}!'
    const result = replaceSubjectVariables(subject, validVars)
    expect(result.invalidVars).toContain('{invalidVar}')
  })

  it('should handle empty subject', () => {
    const result = replaceSubjectVariables('', validVars)
    expect(result.text).toBe('')
    expect(result.invalidVars).toEqual([])
  })
})

describe('getVariablesTooltipContent', () => {
  it('should include base field variables', () => {
    const vars = ['{nom}', '{prenom}', '{email}']
    const content = getVariablesTooltipContent(vars)
    expect(content).toContain('{nom}')
    expect(content).toContain('Champs participant')
  })

  it('should include question variables', () => {
    const vars = ['{question1}', '{question2}']
    const content = getVariablesTooltipContent(vars)
    expect(content).toContain('{question1}')
    expect(content).toContain('Questions')
  })

  it('should include system variables', () => {
    const vars = ['{imageUrl}']
    const content = getVariablesTooltipContent(vars)
    expect(content).toContain('{imageUrl}')
    expect(content).toContain('Système')
  })

  it('should include example when requested', () => {
    const vars = ['{nom}']
    const content = getVariablesTooltipContent(vars, true)
    expect(content).toContain('Exemple')
  })
})

describe('Default templates', () => {
  it('should have default email template with variables', () => {
    expect(DEFAULT_EMAIL_TEMPLATE).toContain('{nom}')
    expect(DEFAULT_EMAIL_TEMPLATE).toContain('{imageUrl}')
    expect(DEFAULT_EMAIL_TEMPLATE).toContain('<p>')
  })

  it('should have default email subject with variable', () => {
    expect(DEFAULT_EMAIL_SUBJECT).toContain('{nom}')
  })
})
