import { generateSummary, getLayoutDisplayName, getScrollSpeedDisplayName, getThemeDisplayName, getInputTypeDisplayName } from '@/lib/utils/animation-summary'
import type { AnimationData } from '@/lib/stores/wizard.store'

describe('Animation Summary Utility', () => {
  describe('generateSummary', () => {
    it('should generate correct summary with complete config', () => {
      const data: AnimationData = {
        name: 'Test Animation',
        description: 'Test description',
        slug: 'test-animation',
        accessConfig: { type: 'none' },
        baseFields: {
          name: { enabled: true, required: true, label: 'Nom' },
          firstName: { enabled: false, required: false },
          email: { enabled: true, required: true },
        },
        inputCollection: {
          elements: [
            { id: '1', type: 'selfie', order: 0 },
            { id: '2', type: 'choice', order: 1, question: 'Quel style?', options: ['A', 'B'] },
          ],
        },
        pipeline: [
          {
            id: '1',
            type: 'ai-generation',
            blockName: 'ai-generation',
            order: 0,
            config: { modelId: 'dall-e-3', promptTemplate: 'Generate...' },
          },
        ],
        emailConfig: {
          enabled: true,
          subject: 'Votre image {nom}',
          bodyTemplate: 'Bonjour {nom}, voici votre image {imageUrl}',
          senderName: 'AppsByMCI',
          senderEmail: 'noreply@appsbymci.com',
        },
        publicDisplayConfig: {
          enabled: true,
          layout: 'masonry',
          columns: 3,
          autoScroll: true,
          autoScrollSpeed: 'medium',
          showParticipantName: true,
          refreshInterval: 10,
        },
        customization: {
          primaryColor: '#000000',
          secondaryColor: '#71717a',
          logo: 'https://example.com/logo.png',
          theme: 'auto',
          submissionMessage: 'Merci !',
          loadingMessages: ['Loading 1', 'Loading 2', 'Loading 3'],
          thankYouMessage: 'Merci !',
        },
      }

      const summary = generateSummary(data)

      // General Info
      expect(summary.generalInfo.name).toBe('Test Animation')
      expect(summary.generalInfo.description).toBe('Test description')
      expect(summary.generalInfo.slug).toBe('test-animation')

      // Access Config
      expect(summary.accessConfig.type).toBe('none')
      expect(summary.accessConfig.displayText).toBe('Accès libre pour tous')

      // Data Collection
      expect(summary.dataCollection.baseFieldsCount).toBe(2) // name + email
      expect(summary.dataCollection.advancedInputsCount).toBe(1) // choice only, selfie excluded
      expect(summary.dataCollection.selfieRequired).toBe(true)
      expect(summary.dataCollection.totalFields).toBe(4) // 2 base + 1 choice + 1 selfie

      // Pipeline
      expect(summary.pipeline.blocksCount).toBe(1)
      expect(summary.pipeline.aiModel).toBe('DALL-E 3')
      expect(summary.pipeline.hasAiBlock).toBe(true)

      // Email
      expect(summary.email.enabled).toBe(true)
      expect(summary.email.subject).toBe('Votre image {nom}')
      expect(summary.email.variablesCount).toBe(3) // {nom} in subject + {nom}, {imageUrl} in body

      // Public Display
      expect(summary.publicDisplay.enabled).toBe(true)
      expect(summary.publicDisplay.layout).toBe('masonry')
      expect(summary.publicDisplay.columns).toBe(3)

      // Customization
      expect(summary.customization.primaryColor).toBe('#000000')
      expect(summary.customization.hasLogo).toBe(true)
      expect(summary.customization.theme).toBe('auto')
      expect(summary.customization.loadingMessagesCount).toBe(3)

      // Validation
      expect(summary.isComplete).toBe(true)
      expect(summary.validationErrors).toHaveLength(0)
    })

    it('should handle optional fields with undefined values', () => {
      const data: AnimationData = {
        name: 'Test',
        slug: 'test',
        pipeline: [{ id: '1', type: 'ai-generation', blockName: 'ai-generation', order: 0, config: {} }],
        inputCollection: { elements: [{ id: '1', type: 'selfie', order: 0 }] },
      }

      const summary = generateSummary(data)

      expect(summary.generalInfo.description).toBeUndefined()
      expect(summary.accessConfig.displayText).toBe('Accès libre pour tous')
      expect(summary.dataCollection.baseFieldsCount).toBe(0)
      expect(summary.email.enabled).toBe(false)
      expect(summary.publicDisplay.enabled).toBe(true) // Default
    })

    it('should show correct access config text for code type', () => {
      const data: AnimationData = {
        accessConfig: { type: 'code', code: 'SECRET123' },
      }

      const summary = generateSummary(data)

      expect(summary.accessConfig.displayText).toBe('Code requis : SECRET123')
    })

    it('should show correct access config text for email-domain type', () => {
      const data: AnimationData = {
        accessConfig: { type: 'email-domain', emailDomains: ['@company.com', '@other.com'] },
      }

      const summary = generateSummary(data)

      expect(summary.accessConfig.displayText).toBe('Domaines autorisés : @company.com, @other.com')
    })

    it('should show validation errors when config is incomplete', () => {
      const data: AnimationData = {
        // Missing name, slug, pipeline, inputCollection
      }

      const summary = generateSummary(data)

      expect(summary.isComplete).toBe(false)
      expect(summary.validationErrors.length).toBeGreaterThan(0)
    })
  })

  describe('Display name helpers', () => {
    it('getLayoutDisplayName should return correct French labels', () => {
      expect(getLayoutDisplayName('masonry')).toBe('Masonry')
      expect(getLayoutDisplayName('grid')).toBe('Grille')
      expect(getLayoutDisplayName('carousel')).toBe('Carousel')
      expect(getLayoutDisplayName('unknown')).toBe('unknown')
    })

    it('getScrollSpeedDisplayName should return correct French labels', () => {
      expect(getScrollSpeedDisplayName('slow')).toBe('Lent')
      expect(getScrollSpeedDisplayName('medium')).toBe('Moyen')
      expect(getScrollSpeedDisplayName('fast')).toBe('Rapide')
    })

    it('getThemeDisplayName should return correct French labels', () => {
      expect(getThemeDisplayName('light')).toBe('Clair')
      expect(getThemeDisplayName('dark')).toBe('Sombre')
      expect(getThemeDisplayName('auto')).toBe('Automatique')
    })

    it('getInputTypeDisplayName should return correct French labels', () => {
      expect(getInputTypeDisplayName('choice')).toBe('Choix multiple')
      expect(getInputTypeDisplayName('slider')).toBe('Slider')
      expect(getInputTypeDisplayName('free-text')).toBe('Texte libre')
      expect(getInputTypeDisplayName('selfie')).toBe('Selfie')
    })
  })
})
