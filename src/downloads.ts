import fixture from '../public/downloads/report-studio-fixture.json?raw'
import worksheet from '../public/downloads/checkpoint-worksheet.txt?raw'
import handoff from '../public/downloads/federation-handoff.txt?raw'
import exercise from '../public/downloads/report-studio-exercise-brief.txt?raw'
import fixtureFr from '../public/downloads-fr/report-studio-fixture-fr.json?raw'
import worksheetFr from '../public/downloads-fr/checkpoint-worksheet-fr.txt?raw'
import handoffFr from '../public/downloads-fr/federation-handoff-fr.txt?raw'
import exerciseFr from '../public/downloads-fr/report-studio-exercise-brief-fr.txt?raw'
import scope from '../public/solution-scope.txt?raw'
import scopeFr from '../public/solution-scope-fr.txt?raw'
import type { Locale } from './language'
import type { Fixture } from './report'

export const downloads = [
  { name: 'report-studio-exercise-brief.txt', title: 'Synthetic exercise brief', description: 'For the public route save as knowledge-docs\\business-brief.txt with solution-scope.txt. Request the authorized architecture image from the facilitator or agree the written-scope route. The private pack replaces these public inputs when supplied.', content: exercise, type: 'text/plain;charset=utf-8' },
  { name: 'report-studio-fixture.json', title: 'Synthetic JSON data', description: 'Two periods, three indicators and two negative variants. Place in data\\report-studio-fixture.json in your participant repository.', content: fixture, type: 'application/json' },
  { name: 'checkpoint-worksheet.txt', title: 'Acceptance and decision worksheet', description: 'Blank worksheet: expected, observed, evidence, execution status and decision.', content: worksheet, type: 'text/plain;charset=utf-8' },
  { name: 'federation-handoff.txt', title: 'Handoff and resumption', description: 'Blank template for actual paths, evidence, blockers and next action.', content: handoff, type: 'text/plain;charset=utf-8' },
]
type Download = typeof downloads[number]
export const localizedDownloads: Record<Locale, Download[]> = {
  en: downloads,
  fr: [
    { name: 'report-studio-exercise-brief-fr.txt', title: 'Cadrage synthétique de l’exercice', description: 'Parcours public : enregistrer sous knowledge-docs\\business-brief.txt avec solution-scope.txt. Demander le schéma autorisé à l’animateur ou convenir du parcours écrit. Le pack privé remplace ces entrées publiques s’il est fourni.', content: exerciseFr, type: 'text/plain;charset=utf-8' },
    { name: 'report-studio-fixture-fr.json', title: 'Données JSON synthétiques', description: 'Deux périodes, trois indicateurs et deux variantes négatives. Enregistrer sous data\\report-studio-fixture.json dans votre dépôt participant ; les identifiants et nombres JSON sont stables.', content: fixtureFr, type: 'application/json' },
    { name: 'checkpoint-worksheet-fr.txt', title: 'Fiche d’acceptation et de décision', description: 'Fiche vierge : attendu, observé, preuve, état d’exécution et décision.', content: worksheetFr, type: 'text/plain;charset=utf-8' },
    { name: 'federation-handoff-fr.txt', title: 'Transmission et reprise', description: 'Modèle vierge pour les chemins réels, preuves, blocages et prochaine action.', content: handoffFr, type: 'text/plain;charset=utf-8' },
  ],
}
export const fixtures: Record<Locale, Fixture> = { en: JSON.parse(fixture), fr: JSON.parse(fixtureFr) }
export const scopeDownloads: Record<Locale, string> = { en: scope, fr: scopeFr }
