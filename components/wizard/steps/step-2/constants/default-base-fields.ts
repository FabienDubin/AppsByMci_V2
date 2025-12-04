// Default values for base fields
export const DEFAULT_BASE_FIELDS = {
  name: {
    enabled: true,
    required: true,
    label: 'Nom',
    placeholder: 'Ex: Jean Dupont',
  },
  firstName: {
    enabled: false,
    required: true,
    label: 'Prénom',
    placeholder: 'Ex: Marie',
  },
  email: {
    enabled: false,
    required: true,
    label: 'Email',
    placeholder: 'exemple@email.com',
  },
  aiConsent: {
    enabled: false,
    required: true, // Always required when enabled
    label: '',
  },
} as const
