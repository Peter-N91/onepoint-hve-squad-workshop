import * as en from './content.ts'
import * as fr from './content.fr.ts'
import type { Locale } from './language.ts'

export type WorkshopContent = Pick<typeof en,
  'prompts' | 'prework' | 'agenda' | 'lab' | 'architecture' | 'installation' |
  'repositorySetup' | 'pdfReadiness' | 'lessons' | 'lifecycleSteps' |
  'troubleshooting' | 'observationNote'> & { sources: readonly { name: string; url: string }[] }
export const content: Record<Locale, WorkshopContent> = { en, fr }
