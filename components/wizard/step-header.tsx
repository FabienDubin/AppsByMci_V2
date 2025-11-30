import { LucideIcon } from 'lucide-react'

interface StepHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
}

export function StepHeader({ title, description, icon: Icon }: StepHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon className="h-6 w-6 text-primary" />}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
