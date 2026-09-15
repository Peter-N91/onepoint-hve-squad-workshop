import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { content } from '../src/locales.ts'
import { agentSelection, clients, decodeState, defaults, missingSetup, modes, nextClient, renderPrompt, toggleCheckpoint } from '../src/state.ts'
import { StateError, stateErrorText } from '../src/language.ts'
import { translator } from '../src/ui.ts'
import { previewReport } from '../src/report.ts'

const load = path => readFile(new URL(path, import.meta.url), 'utf8')
const fixtures = {
  en: JSON.parse(await load('../public/downloads/report-studio-fixture.json')),
  fr: JSON.parse(await load('../public/downloads-fr/report-studio-fixture-fr.json')),
}
function allRequests(c) {
  return {
    readiness: c.lessons.find(l => l.id === 'prepare').steps.at(-1).prompt,
    planningInit: c.lifecycleSteps[0].request,
    product: c.lessons.find(l => l.id === 'product').launch,
    promote: c.lifecycleSteps[1].request,
    deliveryInit: c.lifecycleSteps[2].request,
    implementation: c.lessons.find(l => l.id === 'implementation').launch,
    resume: c.lessons.find(l => l.id === 'resume').steps[0].prompt,
  }
}
test('old schema-1 state migrates without losing checks, client, installation or versions', () => {
  for (const experience of ['app', 'cli']) for (const install of ['plugin', 'apm']) {
    const settings = { experience, install, clientVersion: 'actual-client', squadVersion: 'actual-squad', coreVersion: 'actual-core', officeVersion: 'actual-office' }
    const checked = ['start-0', 'prepare-3', 'product-1', 'setup:planning-team', 'setup:promote', 'setup:delivery-team']
    assert.deepEqual(decodeState(JSON.stringify({ schema: 1, checked, settings })), { schema: 1, checked, settings: { ...settings, locale: 'en', mode: 'interactive' } })
  }
})
test('new saved settings validate supplied values explicitly, including null and wrong types', () => {
  for (const key of ['locale', 'mode']) for (const value of [null, false, 42, '', [], {}, 'invalid']) {
    assert.throws(() => decodeState(JSON.stringify({ schema: 1, checked: [], settings: { ...defaults, [key]: value } })), error => error instanceof StateError && error.code === key && /Unknown saved/.test(error.message))
  }
  for (const locale of ['en', 'fr']) for (const experience of clients) for (const mode of modes) {
    const settings = { ...defaults, locale, experience, mode }
    assert.deepEqual(decodeState(JSON.stringify({ schema: 1, checked: ['start-0'], settings })).settings, settings)
  }
  assert.match(stateErrorText('mode', 'fr'), /Mode VS Code enregistré inconnu/)
  assert.match(stateErrorText('locale', 'fr'), /Langue enregistrée inconnue/)
})
test('all French lessons preserve stable structure, timing, checkpoint counts and setup dependencies', () => {
  const structure = c => c.lessons.map(l => ({
    id: l.id, number: l.number, minutes: l.minutes, checks: l.checks.length,
    steps: l.steps.length, beforeInstall: l.beforeInstall?.length,
    setup: l.setup?.map(s => [s.id, s.request.entry, s.request.lifecycle, s.request.requiresSetup]),
    launch: l.launch && [l.launch.entry, l.launch.requiresSetup, l.launch.businessMode],
  }))
  assert.deepEqual(structure(content.fr), structure(content.en))
  for (const locale of ['en', 'fr']) {
    const c = content[locale]
    assert.equal(c.agenda.reduce((sum, a) => sum + a.minutes, 0), 210)
    assert.equal(c.prework.reduce((sum, a) => sum + a.minutes, 0), 0)
    assert.equal(c.agenda.at(-1).minutes, 30)
    assert.deepEqual(c.agenda.map(a => [a.time, a.end, a.lesson, a.minutes]), content.en.agenda.map(a => [a.time, a.end, a.lesson, a.minutes]))
    assert.ok(c.lessons.find(l => l.id === 'product').setup[0].description.includes('09:00–09:10'))
    assert.ok(c.lessons.find(l => l.id === 'product').setup[0].description.includes('09:10'))
    assert.deepEqual(Object.keys(c.prompts), Object.keys(content.en.prompts))
    assert.deepEqual(c.sources.map(s => s.url), content.en.sources.map(s => s.url))
  }
})
for (const locale of ['en', 'fr']) for (const experience of clients) for (const mode of modes) {
  test(`${locale}/${experience}/${mode}: all seven exact request payloads, scope-limited mode and lifecycle`, () => {
    const c = content[locale]
    const settings = { ...defaults, locale, experience, mode }
    for (const [key, prompt] of Object.entries(allRequests(c))) {
      assert.equal(prompt.text, c.prompts[key])
      const actual = renderPrompt(prompt, settings)
      if (experience !== 'vscode') { assert.equal(actual, prompt.text); continue }
      const federation = ['promote', 'deliveryInit', 'implementation', 'resume'].includes(key)
      const lifecycle = key === 'promote' ? ' promote' : key === 'deliveryInit' ? ' init' : ''
      const optionalMode = ['product', 'implementation'].includes(key) && mode !== 'interactive' ? ` mode=${mode}` : ''
      const text = ['planningInit', 'promote', 'deliveryInit'].includes(key) ? prompt.text.split('\n\n').slice(1).join('\n\n') : prompt.text
      assert.equal(actual, `/${federation ? 'squad-federation' : 'squad'}${lifecycle}${optionalMode} request=${JSON.stringify(text)}`)
      assert.equal(JSON.parse(actual.slice(actual.indexOf('request=') + 8)), text)
      assert.doesNotMatch(actual, /mode=(interactive|init|promote)|cost-ceiling|^\/\/|request="(?:init|promote)\\n/)
      assert.ok(!actual.includes('\n'), 'one complete copyable command, with escaped line breaks')
    }
    for (const prompt of [c.repositorySetup, c.installation.apm, c.installation.plugin, c.pdfReadiness.setup]) {
      assert.equal(renderPrompt(prompt, settings), prompt.text, 'shell blocks never get wrapped')
    }
    const selection = agentSelection('squad-federation', settings)
    assert.ok(selection.instruction.includes(experience === 'vscode' ? 'GitHub Copilot Chat' : experience === 'cli' ? '/agent' : locale === 'fr' ? 'liste des agents' : 'agent list'))
    const launch = c.lessons.find(l => l.id === 'implementation').launch
    assert.equal(missingSetup(launch, []).length, 3, 'mode cannot unlock gates')
    assert.equal(missingSetup(launch, ['setup:delivery-team']).length, 2, 'inherited prerequisites still apply')
  })
}
test('quote, backslash, CRLF, newline and lifecycle rendering is deterministic and non-mutating', () => {
  const settings = { ...defaults, experience: 'vscode', mode: 'autopilot' }
  const text = 'Keep "Q3" and C:\\work\\data\nSecond line\r\nFrançais : « résultat »\tfin'
  for (const entry of ['squad', 'squad-federation']) for (const lifecycle of [undefined, 'init', 'promote']) {
    const prompt = { entry, lifecycle, text: lifecycle ? `${lifecycle}\r\n\r\n${text}` : text }
    const before = JSON.stringify(prompt)
    const result = renderPrompt(prompt, settings)
    assert.equal(JSON.parse(result.slice(result.indexOf('request=') + 8)), text)
    assert.equal(JSON.stringify(prompt), before)
    assert.equal(result, renderPrompt(prompt, settings))
    assert.ok(!result.includes('mode='), 'no mode on setup/read-only')
    assert.equal(result.split(' request=')[0], `/${entry}${entry === 'squad-federation' && lifecycle ? ` ${lifecycle}` : ''}`)
  }
  assert.equal(JSON.parse(renderPrompt({ text: 'init is a word within ordinary prose', entry: 'squad' }, settings).split('request=')[1]), 'init is a word within ordinary prose')
})
test('three roving client tabs wrap both directions with Home and End', () => {
  assert.equal(nextClient('vscode', 'ArrowRight'), 'app')
  assert.equal(nextClient('app', 'ArrowLeft'), 'vscode')
  assert.equal(nextClient('cli', 'ArrowLeft'), 'app')
  assert.equal(nextClient('app', 'ArrowRight'), 'cli')
  for (const client of clients) {
    assert.equal(nextClient(client, 'Home'), 'app')
    assert.equal(nextClient(client, 'End'), 'vscode')
    assert.equal(nextClient(client, 'Tab'), undefined)
  }
})
test('French fixtures retain numeric contracts, stable identifiers, no invented data and French errors', () => {
  const f = fixtures.fr
  assert.deepEqual(f.periods.map(p => [p.id, p.values]), fixtures.en.periods.map(p => [p.id, p.values]))
  assert.deepEqual(f.indicators.map(p => p.id), fixtures.en.indicators.map(p => p.id))
  assert.deepEqual(f.negativeCases.map(p => [p.id, p.periodId, p.overrideValues]), fixtures.en.negativeCases.map(p => [p.id, p.periodId, p.overrideValues]))
  assert.deepEqual(f.periods.map(p => p.label), ['Juillet 2026', 'Août 2026'])
  assert.deepEqual(previewReport(f, 'valeur-nulle', 'fr').errors, ['Donnée indisponible: Délai moyen'])
  assert.equal(previewReport(f, 'valeur-nulle', 'fr').rows[1].value, null)
  assert.deepEqual(previewReport(f, 'periode-absente', 'fr').errors, ['Période indisponible: 2026-09'])
  assert.deepEqual(previewReport(f, 'periode-absente', 'fr').rows, [])
  assert.equal(previewReport(f, 'unknown', 'fr').canInsert, false)
  const before = JSON.stringify(f)
  for (const p of f.periods) assert.equal(previewReport(f, p.id, 'fr').canInsert, true)
  assert.equal(JSON.stringify(f), before)
})
test('French downloads carry every acceptance criterion, blank outcomes and matching agenda', async () => {
  const brief = await load('../public/downloads-fr/report-studio-exercise-brief-fr.txt')
  const worksheet = await load('../public/downloads-fr/checkpoint-worksheet-fr.txt')
  const handoff = await load('../public/downloads-fr/federation-handoff-fr.txt')
  for (const criterion of content.fr.lab.acceptance) {
    assert.ok(brief.includes(criterion), criterion)
    assert.ok(worksheet.includes(criterion), criterion)
  }
  for (const a of content.fr.agenda) assert.ok(brief.includes(`${a.time}–${a.end} | ${a.lesson ? content.fr.lessons.find(l => l.id === a.lesson).number + ' ' : ''}${a.title} | ${a.minutes} min`))
  assert.ok(brief.includes('09:00–09:10'))
  assert.match(handoff, /FICHE DE TRANSMISSION VIERGE/)
  assert.doesNotMatch(worksheet + handoff, /\[x\]/)
})
test('UI paired keys and French content are authored, not runtime DOM translations', async () => {
  for (const key of ['copy', 'language', 'loadError', 'saveError', 'clipboardError', 'resetError', 'resetDone', 'vscodeInstallNote', 'modeNote', 'autopilotWarning']) {
    assert.ok(translator('fr')(key))
    assert.notEqual(translator('fr')(key), translator('en')(key))
  }
  const app = await load('../src/App.tsx')
  assert.doesNotMatch(app, /innerHTML|innerText\s*=|textContent\s*=/)
  assert.match(app, /document\.documentElement\.lang = locale/)
  assert.match(app, /document\.title =/)
  assert.match(app, /if \(storageError\) return/)
  for (const prompt of Object.values(content.fr.prompts)) assert.doesNotMatch(prompt, /\/squad|profile=|pack=|owner=|cost-ceiling/)
  assert.deepEqual(toggleCheckpoint('setup:planning-team', ['start-0', 'setup:planning-team', 'setup:promote', 'setup:delivery-team']), ['start-0'])
})
