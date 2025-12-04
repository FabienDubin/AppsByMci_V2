// Element types configuration
import { Camera, CheckSquare, BarChart3, FileText, LucideIcon } from 'lucide-react'
import { InputElementType } from '@/lib/stores/wizard.store'

export interface ElementTypeConfig {
  type: InputElementType
  icon: LucideIcon
  label: string
  description: string
}

export const ELEMENT_TYPES: ElementTypeConfig[] = [
  {
    type: 'selfie',
    icon: Camera,
    label: '📸 Selfie',
    description: 'Capture ou upload photo via webcam/appareil',
  },
  {
    type: 'choice',
    icon: CheckSquare,
    label: '☑️ Question choix multiple',
    description: 'Question avec 2 à 6 options de réponse',
  },
  {
    type: 'slider',
    icon: BarChart3,
    label: '📊 Question slider',
    description: 'Échelle de valeurs avec labels personnalisables',
  },
  {
    type: 'free-text',
    icon: FileText,
    label: '✍️ Réponse libre',
    description: 'Champ texte libre avec limite de caractères',
  },
]
