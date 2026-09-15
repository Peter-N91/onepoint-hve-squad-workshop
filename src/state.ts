import { lifecycleSteps } from './content.ts'
import type { Prompt, SetupId } from './content.ts'
import { isLocale, StateError } from './language.ts'
import type { Locale } from './language.ts'

export const clients = ['app', 'cli', 'vscode'] as const
export const modes = ['interactive', 'autonomous', 'autopilot'] as const
export type Mode = typeof modes[number]
export type Settings = {
  experience: typeof clients[number]
  install: 'plugin' | 'apm'
  locale: Locale
  mode: Mode
  clientVersion: string
  squadVersion: string
  coreVersion: string
  officeVersion: string
}
export type SavedState = { schema: 1; checked: string[]; settings: Settings }
export const defaults: Settings = {
  experience: 'cli', install: 'plugin', clientVersion: '', squadVersion: '',
  coreVersion: '', officeVersion: '', locale: 'en', mode: 'interactive',
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
    if (active.has(id)) throw new StateError('cycle', id)
    if (visited.has(id)) return
    const step = lifecycleSteps.find(candidate => candidate.id === id)
    if (!step) throw new StateError('prerequisite', id)
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
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { throw new StateError('corrupt') }
  if (!parsed || typeof parsed !== 'object' || !('schema' in parsed) || parsed.schema !== 1) {
    throw new StateError('format')
  }
  const data = parsed as Record<string, unknown>
  if (!Array.isArray(data.checked) || !data.checked.every(x => typeof x === 'string') ||
    !data.settings || typeof data.settings !== 'object') {
    throw new StateError('corrupt')
  }
  const settings = { ...defaults }
  const input = data.settings as Record<string, unknown>
  for (const key of ['clientVersion', 'squadVersion', 'coreVersion', 'officeVersion'] as const) {
    if (typeof input[key] !== 'string') throw new StateError('missing', key)
    settings[key] = input[key].slice(0, 300)
  }
  if (input.experience !== 'cli' && input.experience !== 'app' && input.experience !== 'vscode') throw new StateError('client')
  if (input.install !== 'plugin' && input.install !== 'apm') throw new StateError('install')
  if ('locale' in input && !isLocale(input.locale)) throw new StateError('locale')
  if ('mode' in input && input.mode !== 'interactive' && input.mode !== 'autonomous' && input.mode !== 'autopilot') throw new StateError('mode')
  settings.experience = input.experience
  settings.install = input.install
  if (isLocale(input.locale)) settings.locale = input.locale
  if (input.mode === 'interactive' || input.mode === 'autonomous' || input.mode === 'autopilot') settings.mode = input.mode
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
  const identifier = settings.experience === 'vscode' ? `/${entry ?? 'squad'}` : settings.install === 'plugin'
    ? `hve-squad:${federation ? 'squad-federation-coordinator' : 'squad-coordinator'}`
    : name
  return {
    name,
    identifier,
    instruction: settings.locale === 'fr'
      ? settings.experience === 'vscode'
        ? `Dans GitHub Copilot Chat de VS Code, vérifiez l’entrée ${identifier}, puis collez la commande complète ci-dessous.`
        : settings.experience === 'cli' ? `Dans Copilot CLI, saisissez /agent et choisissez ${name}.` : `Dans Copilot App, ouvrez la liste des agents et choisissez ${name}.`
      : settings.experience === 'vscode'
        ? `In VS Code GitHub Copilot Chat, confirm the ${identifier} entry, then paste the complete command below.`
        : settings.experience === 'cli' ? `In Copilot CLI, enter /agent and choose ${name}.` : `In Copilot App, open the agent list and choose ${name}.`,
  }
}
export function renderPrompt(prompt: Prompt, settings: Settings = defaults): string {
  if (prompt.shell || settings.experience !== 'vscode') return prompt.text
  let text = prompt.text
  if (prompt.lifecycle) {
    const end = text.indexOf('\n')
    if (end >= 0 && text.slice(0, end).trimEnd() === prompt.lifecycle) text = text.slice(end + 1).trimStart()
  }
  const entry = prompt.entry ?? 'squad'
  const lifecycle = entry === 'squad-federation' && prompt.lifecycle ? ` ${prompt.lifecycle}` : ''
  const mode = prompt.businessMode && !prompt.lifecycle && settings.mode !== 'interactive' ? ` mode=${settings.mode}` : ''
  // JSON string quoting keeps quotes, backslashes and multiline requests in one argument.
  return `/${entry}${lifecycle}${mode} request=${JSON.stringify(text)}`
}
export function nextClient(current: Settings['experience'], key: string) {
  if (key === 'Home') return clients[0]
  if (key === 'End') return clients[clients.length - 1]
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return undefined
  return clients[(clients.indexOf(current) + (key === 'ArrowRight' ? 1 : clients.length - 1)) % clients.length]
}
