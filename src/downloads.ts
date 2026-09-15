import fixture from '../public/downloads/report-studio-fixture.json?raw'
import worksheet from '../public/downloads/checkpoint-worksheet.txt?raw'
import handoff from '../public/downloads/federation-handoff.txt?raw'
import exercise from '../public/downloads/report-studio-exercise-brief.txt?raw'

export const downloads = [
  { name: 'report-studio-exercise-brief.txt', title: 'Synthetic exercise brief', description: 'Before the workshop: place in knowledge-docs and check readability. Includes pre-work and the 210-minute live agenda; separate from any private brief.', content: exercise, type: 'text/plain;charset=utf-8' },
  { name: 'report-studio-fixture.json', title: 'Synthetic JSON data', description: 'Two periods, three indicators and two negative variants. Place in data\\report-studio-fixture.json in your participant repository.', content: fixture, type: 'application/json' },
  { name: 'checkpoint-worksheet.txt', title: 'Acceptance and decision worksheet', description: 'Blank worksheet: expected, observed, evidence, execution status and decision.', content: worksheet, type: 'text/plain;charset=utf-8' },
  { name: 'federation-handoff.txt', title: 'Handoff and resumption', description: 'Blank template for actual paths, evidence, blockers and next action.', content: handoff, type: 'text/plain;charset=utf-8' },
]
