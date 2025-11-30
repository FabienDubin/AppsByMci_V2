import { ReactNode } from 'react'

interface WizardContainerProps {
  header: ReactNode
  stepper: ReactNode
  content: ReactNode
}

export function WizardContainer({ header, stepper, content }: WizardContainerProps) {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        {header}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Stepper sidebar */}
          <div className="lg:col-span-1">{stepper}</div>

          {/* Step content */}
          <div className="lg:col-span-3">
            <div className="rounded-lg border bg-card p-6">{content}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
