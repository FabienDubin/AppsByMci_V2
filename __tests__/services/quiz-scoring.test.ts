/**
 * @jest-environment node
 */

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

import {
  executeQuizScoringBlock,
  enrichContextWithScoringResult,
  ExecutionContext,
  QuizScoringResult,
} from '@/lib/services/pipeline-executor.service'
import type { IPipelineBlock } from '@/models/Animation.model'
import type { IInputElement } from '@/models/animation/input-collection.types'
import type { ParticipantData } from '@/lib/services/generation.service'

// Helper to create a quiz scoring block config
const createScoringBlock = (
  name: string,
  selectedQuestionIds: string[],
  questionMappings: Array<{
    elementId: string
    optionMappings: Array<{ optionText: string; profileKey: string }>
  }>,
  profiles: Array<{ key: string; name: string; description: string; imageStyle: string }>
): IPipelineBlock => ({
  id: 'block-1',
  type: 'processing',
  blockName: 'quiz-scoring',
  order: 0,
  config: {
    quizScoring: {
      name,
      selectedQuestionIds,
      questionMappings,
      profiles,
    },
  },
})

// Helper to create participant data
const createParticipantData = (
  answers: Array<{ elementId: string; value: string }>
): ParticipantData => ({
  nom: 'Test',
  prenom: 'User',
  email: 'test@example.com',
  answers: answers.map((a) => ({ ...a, type: 'choice' as const })),
})

// Helper to create choice questions
const createChoiceQuestions = (
  questions: Array<{ id: string; options: string[] }>
): IInputElement[] =>
  questions.map((q) => ({
    id: q.id,
    type: 'choice' as const,
    order: 0,
    question: `Question ${q.id}`,
    options: q.options,
  }))

describe('Quiz Scoring Block', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('executeQuizScoringBlock', () => {
    const profiles = [
      { key: 'A', name: 'Profile A', description: 'Desc A', imageStyle: 'Style A' },
      { key: 'B', name: 'Profile B', description: 'Desc B', imageStyle: 'Style B' },
      { key: 'C', name: 'Profile C', description: 'Desc C', imageStyle: 'Style C' },
    ]

    const questionMappings = [
      {
        elementId: 'q1',
        optionMappings: [
          { optionText: 'Option 1A', profileKey: 'A' },
          { optionText: 'Option 1B', profileKey: 'B' },
          { optionText: 'Option 1C', profileKey: 'C' },
        ],
      },
      {
        elementId: 'q2',
        optionMappings: [
          { optionText: 'Option 2A', profileKey: 'A' },
          { optionText: 'Option 2B', profileKey: 'B' },
          { optionText: 'Option 2C', profileKey: 'C' },
        ],
      },
      {
        elementId: 'q3',
        optionMappings: [
          { optionText: 'Option 3A', profileKey: 'A' },
          { optionText: 'Option 3B', profileKey: 'B' },
          { optionText: 'Option 3C', profileKey: 'C' },
        ],
      },
      {
        elementId: 'q4',
        optionMappings: [
          { optionText: 'Option 4A', profileKey: 'A' },
          { optionText: 'Option 4B', profileKey: 'B' },
          { optionText: 'Option 4C', profileKey: 'C' },
        ],
      },
    ]

    const choiceQuestions = createChoiceQuestions([
      { id: 'q1', options: ['Option 1A', 'Option 1B', 'Option 1C'] },
      { id: 'q2', options: ['Option 2A', 'Option 2B', 'Option 2C'] },
      { id: 'q3', options: ['Option 3A', 'Option 3B', 'Option 3C'] },
      { id: 'q4', options: ['Option 4A', 'Option 4B', 'Option 4C'] },
    ])

    // Test #1: Scoring basique - Toutes réponses identiques
    it('should return profile A when all 4 answers map to A', () => {
      const block = createScoringBlock(
        'personnalite',
        ['q1', 'q2', 'q3', 'q4'],
        questionMappings,
        profiles
      )

      const participantData = createParticipantData([
        { elementId: 'q1', value: 'Option 1A' },
        { elementId: 'q2', value: 'Option 2A' },
        { elementId: 'q3', value: 'Option 3A' },
        { elementId: 'q4', value: 'Option 4A' },
      ])

      const result = executeQuizScoringBlock(block, participantData, choiceQuestions)

      expect(result).not.toBeNull()
      expect(result!.winnerProfile.key).toBe('A')
      expect(result!.scores).toEqual({ A: 4, B: 0, C: 0 })
    })

    // Test #2: Scoring mixte - Profil majoritaire clair
    it('should return profile A when A has majority (2A, 1B, 1C)', () => {
      const block = createScoringBlock(
        'personnalite',
        ['q1', 'q2', 'q3', 'q4'],
        questionMappings,
        profiles
      )

      const participantData = createParticipantData([
        { elementId: 'q1', value: 'Option 1A' },
        { elementId: 'q2', value: 'Option 2A' },
        { elementId: 'q3', value: 'Option 3B' },
        { elementId: 'q4', value: 'Option 4C' },
      ])

      const result = executeQuizScoringBlock(block, participantData, choiceQuestions)

      expect(result).not.toBeNull()
      expect(result!.winnerProfile.key).toBe('A')
      expect(result!.scores).toEqual({ A: 2, B: 1, C: 1 })
    })

    // Test #3: Égalité 2 profils - Départage alphabétique
    it('should return profile A when tied with B (alphabetical order)', () => {
      const block = createScoringBlock(
        'personnalite',
        ['q1', 'q2', 'q3', 'q4'],
        questionMappings,
        profiles
      )

      const participantData = createParticipantData([
        { elementId: 'q1', value: 'Option 1A' },
        { elementId: 'q2', value: 'Option 2A' },
        { elementId: 'q3', value: 'Option 3B' },
        { elementId: 'q4', value: 'Option 4B' },
      ])

      const result = executeQuizScoringBlock(block, participantData, choiceQuestions)

      expect(result).not.toBeNull()
      expect(result!.winnerProfile.key).toBe('A') // A wins over B alphabetically
      expect(result!.scores).toEqual({ A: 2, B: 2, C: 0 })
    })

    // Test #4: Égalité 3 profils - Départage alphabétique
    it('should return profile A when all three tied (1A, 1B, 1C)', () => {
      const block = createScoringBlock(
        'personnalite',
        ['q1', 'q2', 'q3'],
        questionMappings.slice(0, 3),
        profiles
      )

      const participantData = createParticipantData([
        { elementId: 'q1', value: 'Option 1A' },
        { elementId: 'q2', value: 'Option 2B' },
        { elementId: 'q3', value: 'Option 3C' },
      ])

      const result = executeQuizScoringBlock(block, participantData, choiceQuestions)

      expect(result).not.toBeNull()
      expect(result!.winnerProfile.key).toBe('A') // A wins alphabetically
      expect(result!.scores).toEqual({ A: 1, B: 1, C: 1 })
    })

    // Test #5: Questions sélectionnées - Scoring partiel
    it('should only score selected questions (2 of 4)', () => {
      const block = createScoringBlock(
        'personnalite',
        ['q1', 'q2'], // Only q1 and q2 selected
        questionMappings,
        profiles
      )

      const participantData = createParticipantData([
        { elementId: 'q1', value: 'Option 1A' },
        { elementId: 'q2', value: 'Option 2B' },
        { elementId: 'q3', value: 'Option 3C' }, // Not selected, should be ignored
        { elementId: 'q4', value: 'Option 4C' }, // Not selected, should be ignored
      ])

      const result = executeQuizScoringBlock(block, participantData, choiceQuestions)

      expect(result).not.toBeNull()
      expect(result!.winnerProfile.key).toBe('A') // A wins over B alphabetically (both have 1)
      expect(result!.scores).toEqual({ A: 1, B: 1, C: 0 }) // Only q1 and q2 counted
    })

    // Test #6: Variables préfixées - Nom du bloc appliqué
    it('should use block name as prefix', () => {
      const block = createScoringBlock(
        'style_perso',
        ['q1'],
        [questionMappings[0]],
        profiles
      )

      const participantData = createParticipantData([
        { elementId: 'q1', value: 'Option 1B' },
      ])

      const result = executeQuizScoringBlock(block, participantData, choiceQuestions)

      expect(result).not.toBeNull()
      expect(result!.blockName).toBe('style_perso')
    })

    // Test #7: Profil complet exposé
    it('should return complete winner profile with all fields', () => {
      const block = createScoringBlock(
        'personnalite',
        ['q1'],
        [questionMappings[0]],
        profiles
      )

      const participantData = createParticipantData([
        { elementId: 'q1', value: 'Option 1B' },
      ])

      const result = executeQuizScoringBlock(block, participantData, choiceQuestions)

      expect(result).not.toBeNull()
      expect(result!.winnerProfile).toEqual({
        key: 'B',
        name: 'Profile B',
        description: 'Desc B',
        imageStyle: 'Style B',
      })
    })

    // Test #17: Réponse non trouvée - Ignore gracefully
    it('should ignore answer that does not match any option mapping', () => {
      const block = createScoringBlock(
        'personnalite',
        ['q1', 'q2'],
        questionMappings,
        profiles
      )

      const participantData = createParticipantData([
        { elementId: 'q1', value: 'Unknown Option' }, // Does not match
        { elementId: 'q2', value: 'Option 2A' },
      ])

      const result = executeQuizScoringBlock(block, participantData, choiceQuestions)

      expect(result).not.toBeNull()
      expect(result!.winnerProfile.key).toBe('A')
      expect(result!.scores).toEqual({ A: 1, B: 0, C: 0 }) // Only q2 counted
    })

    // Test #20: Une seule question
    it('should work with single question', () => {
      const block = createScoringBlock(
        'personnalite',
        ['q1'],
        [questionMappings[0]],
        profiles
      )

      const participantData = createParticipantData([
        { elementId: 'q1', value: 'Option 1C' },
      ])

      const result = executeQuizScoringBlock(block, participantData, choiceQuestions)

      expect(result).not.toBeNull()
      expect(result!.winnerProfile.key).toBe('C')
      expect(result!.scores).toEqual({ A: 0, B: 0, C: 1 })
    })

    // Test: Missing config
    it('should return null if config is missing', () => {
      const block: IPipelineBlock = {
        id: 'block-1',
        type: 'processing',
        blockName: 'quiz-scoring',
        order: 0,
        config: {},
      }

      const participantData = createParticipantData([])

      const result = executeQuizScoringBlock(block, participantData, choiceQuestions)

      expect(result).toBeNull()
    })

    // Test: No selected questions
    it('should return null if no questions are selected', () => {
      const block = createScoringBlock(
        'personnalite',
        [], // No questions selected
        questionMappings,
        profiles
      )

      const participantData = createParticipantData([])

      const result = executeQuizScoringBlock(block, participantData, choiceQuestions)

      expect(result).toBeNull()
    })

    // Test: Less than 2 profiles
    it('should return null if less than 2 profiles defined', () => {
      const block = createScoringBlock(
        'personnalite',
        ['q1'],
        [questionMappings[0]],
        [profiles[0]] // Only 1 profile
      )

      const participantData = createParticipantData([
        { elementId: 'q1', value: 'Option 1A' },
      ])

      const result = executeQuizScoringBlock(block, participantData, choiceQuestions)

      expect(result).toBeNull()
    })
  })

  describe('enrichContextWithScoringResult', () => {
    it('should add prefixed variables to context', () => {
      const context: ExecutionContext = {
        nom: 'Test',
        prenom: 'User',
        email: 'test@example.com',
      }

      const scoringResult: QuizScoringResult = {
        blockName: 'personnalite',
        winnerProfile: {
          key: 'A',
          name: 'HEINEKEN',
          description: 'The iconic one',
          imageStyle: 'Amsterdam terrace',
        },
        scores: { A: 3, B: 1 },
      }

      enrichContextWithScoringResult(context, scoringResult)

      expect(context['personnalite_profile_key']).toBe('A')
      expect(context['personnalite_profile_name']).toBe('HEINEKEN')
      expect(context['personnalite_profile_description']).toBe('The iconic one')
      expect(context['personnalite_profile_image_style']).toBe('Amsterdam terrace')
      expect(context['personnalite_profile_scores']).toBe('{"A":3,"B":1}')
    })

    // Test #8: Two independent scoring blocks
    it('should support multiple scoring blocks with different prefixes', () => {
      const context: ExecutionContext = {
        nom: 'Test',
        prenom: 'User',
        email: 'test@example.com',
      }

      const scoringResult1: QuizScoringResult = {
        blockName: 'perso',
        winnerProfile: {
          key: 'A',
          name: 'Profile A',
          description: 'Desc A',
          imageStyle: 'Style A',
        },
        scores: { A: 2, B: 1 },
      }

      const scoringResult2: QuizScoringResult = {
        blockName: 'style',
        winnerProfile: {
          key: 'B',
          name: 'Profile B',
          description: 'Desc B',
          imageStyle: 'Style B',
        },
        scores: { A: 1, B: 2 },
      }

      enrichContextWithScoringResult(context, scoringResult1)
      enrichContextWithScoringResult(context, scoringResult2)

      // Check first block variables
      expect(context['perso_profile_key']).toBe('A')
      expect(context['perso_profile_name']).toBe('Profile A')

      // Check second block variables
      expect(context['style_profile_key']).toBe('B')
      expect(context['style_profile_name']).toBe('Profile B')

      // Both should coexist
      expect(Object.keys(context).filter((k) => k.startsWith('perso_'))).toHaveLength(5)
      expect(Object.keys(context).filter((k) => k.startsWith('style_'))).toHaveLength(5)
    })
  })
})
