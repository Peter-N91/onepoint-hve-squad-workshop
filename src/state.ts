import { lifecycleSteps } from './content.ts'
import type { Prompt, SetupId } from './content.ts'

export type Settings = {
  experience: 'cli' | 'app'
  install: 'plugin' | 'apm'
  clientVersion: string
  squadVersion: string
  coreVersion: string
  officeVersion: string
}
export type SavedState = { schema: 1; checked: string[]; settings: Settings }
export const defaults: Settings = {
  experience: 'cli', install: 'plugin', clientVersion: '', squadVersion: '',
  coreVersion: '', officeVersion: '',
}
export const storageKey = 'onepoint-hve-workshop-2026-09-17-v1'
export function setupCheckId(id: SetupId): string {
  return `setup:${id}`
}
export function missingSetup(prompt: Pick<Prompt, 'requiresSetup'>, checked: string[]) {
  const ordered: typeof lifecycleSteps = []
  const visited = new Set<SetupId>()
  const active = new Set<SetupId>()
  function visit(id: SetupId) {
    if (active.has(id)) throw new Error(`Circular setup prerequisite: ${id}.`)
    if (visited.has(id)) return
    const step = lifecycleSteps.find(candidate => candidate.id === id)
    if (!step) throw new Error(`Unknown setup prerequisite: ${id}.`)
    active.add(id)
    for (const parent of step.request.requiresSetup ?? []) visit(parent)
    active.delete(id)
    visited.add(id)
    ordered.push(step)
  }
  for (const id of prompt.requiresSetup ?? []) visit(id)
  return ordered.filter(step => !checked.includes(setupCheckId(step.id)))
}
export function decodeState(raw: string | null): SavedState {
  if (!raw) return { schema: 1, checked: [], settings: { ...defaults } }
  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object' || !('schema' in parsed) || parsed.schema !== 1) {
    throw new Error('The saved progress format is not supported.')
  }
  const data = parsed as Record<string, unknown>
  if (!Array.isArray(data.checked) || !data.checked.every(x => typeof x === 'string') ||
    !data.settings || typeof data.settings !== 'object') {
    throw new Error('Saved progress is corrupted.')
  }
  const settings = { ...defaults }
  const input = data.settings as Record<string, unknown>
  for (const key of Object.keys(defaults) as (keyof Settings)[]) {
    if (typeof input[key] !== 'string') throw new Error(`Missing saved setting: ${key}.`)
    if (key !== 'experience' && key !== 'install') settings[key] = input[key].slice(0, 300)
  }
  if (input.experience !== 'cli' && input.experience !== 'app') throw new Error('Unknown Copilot client.')
  if (input.install !== 'plugin' && input.install !== 'apm') throw new Error('Unknown installation method.')
  settings.experience = input.experience
  settings.install = input.install
  return { schema: 1, checked: [...new Set(data.checked)], settings }
}
export function toggleCheckpoint(id: string, current: string[]) {
  let checked = current.includes(id) ? current.filter(value => value !== id) : [...current, id]
  if (id.startsWith('setup:') && !checked.includes(id)) {
    checked = checked.filter(candidate => {
      const step = lifecycleSteps.find(item => setupCheckId(item.id) === candidate)
      return !step || missingSetup({ requiresSetup: [step.id] }, checked).length === 0
    })
  }
  return checked
}
export function agentSelection(entry: Prompt['entry'], settings: Settings) {
  const federation = entry === 'squad-federation'
  const name = federation ? 'Squad Federation Coordinator' : 'Squad Coordinator'
  const identifier = settings.install === 'plugin'
    ? `hve-squad:${federation ? 'squad-federation-coordinator' : 'squad-coordinator'}`
    : name
  return {
    name,
    identifier,
    instruction: settings.experience === 'cli'
      ? `In Copilot CLI, enter /agent and choose ${name}.`
      : `In Copilot App, open the agent list and choose ${name}.`,
  }
}
export function renderPrompt(prompt: Prompt): string {
  return prompt.text
}
