export const localeNames = { en: 'English', fr: 'Français' } as const
export type Locale = keyof typeof localeNames
export const numberLocales: Record<Locale, string> = { en: 'en-GB', fr: 'fr-FR' }
export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'fr'
}
export const stateMessages = {
  en: {
    format: 'The saved progress format is not supported.',
    corrupt: 'Saved progress is corrupted.',
    missing: 'Missing saved setting',
    client: 'Unknown Copilot client.',
    install: 'Unknown installation method.',
    locale: 'Unknown saved language. Expected en or fr.',
    mode: 'Unknown saved mode. Expected a recognized legacy setting or autopilot.',
    cycle: 'Circular setup prerequisite',
    prerequisite: 'Unknown setup prerequisite',
    squadMissing: 'Enter the exact registered squad name before copying this request.',
    squadInvalid: 'Use the registered lowercase name: letters, digits and hyphens, starting with a letter or digit.',
    targetContext: 'A squad target is only valid on a federation work request.',
    publicationMissing: 'Complete the required Azure DevOps destination fields before copying.',
    targetField: 'Invalid saved destination field',
  },
  fr: {
    format: 'Le format de progression enregistré n’est pas pris en charge.',
    corrupt: 'La progression enregistrée est corrompue.',
    missing: 'Paramètre enregistré manquant',
    client: 'Client Copilot inconnu.',
    install: 'Méthode d’installation inconnue.',
    locale: 'Langue enregistrée inconnue. Valeurs attendues : en ou fr.',
    mode: 'Mode enregistré inconnu. Une ancienne valeur reconnue ou autopilot est attendu.',
    cycle: 'Dépendance d’initialisation circulaire',
    prerequisite: 'Prérequis d’initialisation inconnu',
    squadMissing: 'Saisissez le nom exact de l’équipe enregistrée avant de copier cette demande.',
    squadInvalid: 'Utilisez le nom enregistré en minuscules : lettres, chiffres et tirets, commençant par une lettre ou un chiffre.',
    targetContext: 'Une équipe cible est réservée à une demande de travail de fédération.',
    publicationMissing: 'Complétez les champs obligatoires de destination Azure DevOps avant de copier.',
    targetField: 'Champ de destination enregistré invalide',
  },
} satisfies Record<Locale, Record<string, string>>
export type StateErrorCode = keyof typeof stateMessages.en
export class StateError extends Error {
  code: StateErrorCode
  detail: string
  constructor(code: StateErrorCode, detail = '') {
    super(stateMessages.en[code] + (detail ? `: ${detail}.` : ''))
    this.code = code
    this.detail = detail
  }
}
export function stateErrorText(code: StateErrorCode, locale: Locale, detail = '') {
  return stateMessages[locale][code] + (detail ? `: ${detail}.` : '')
}
