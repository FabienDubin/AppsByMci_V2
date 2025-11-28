'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WizardStepperProps {
  currentStep: number // 1-8
  totalSteps?: number // Default 8
  stepTitles: string[] // Array of 8 step titles
  completedSteps: number[] // Array of completed step numbers
}

/**
 * WizardStepper component
 * Displays wizard progress with step indicator and list of steps
 * Design: Minimal Monochrome (ShadCN + Tailwind)
 */
export function WizardStepper({
  currentStep,
  totalSteps = 8,
  stepTitles,
  completedSteps,
}: WizardStepperProps) {
  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="text-sm text-gray-500">
        Étape {currentStep}/{totalSteps}
      </div>

      {/* Steps list */}
      <nav aria-label="Progress" className="space-y-3">
        {stepTitles.map((title, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = completedSteps.includes(stepNumber)

          return (
            <div
              key={stepNumber}
              className={cn(
                'flex items-center gap-3 text-sm transition-colors',
                isActive && 'font-semibold text-black',
                isCompleted && !isActive && 'text-gray-600',
                !isActive && !isCompleted && 'text-gray-400'
              )}
            >
              {/* Step number or check icon */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isCompleted && 'border-green-600 bg-green-600 text-white',
                  isActive && !isCompleted && 'border-black bg-black text-white',
                  !isActive && !isCompleted && 'border-gray-300 text-gray-400'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" aria-label="Complété" />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>

              {/* Step title */}
              <span>{title}</span>
            </div>
          )
        })}
      </nav>
    </div>
  )
}
