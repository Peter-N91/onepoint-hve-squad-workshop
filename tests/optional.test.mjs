import test from 'node:test'
import assert from 'node:assert/strict'
import { content } from '../src/locales.ts'
import { optionalCheckIds, optionalText, publicationPrompt } from '../src/optional.ts'
import { designCheckIds, designPrompt, designText } from '../src/design.ts'
import { clients, decodeState, defaults, destinationFields, missingPublicationFields, missingSetup, newSettings, promptTargetErrors, renderPrompt, squadNameError, toggleCheckpoint } from '../src/state.ts'

const ready = ['setup:planning-team', 'setup:promote', 'setup:delivery-team']
const targets = { organization: 'org', project: 'project', participant: 'team-a', documentTarget: 'Approved Wiki', implementationSquad: 'delivery', publicationSquad: 'planning' }
test('new optional settings migrate without losing old fields or changing core progress', () => {
  const old = { ...defaults, clientVersion: 'saved', locale: 'fr' }
  for (const key of Object.keys(newSettings)) delete old[key]
  const checked = ['start-0', ...ready, 'ado-0']
  const result = decodeState(JSON.stringify({ schema: 1, settings: old, checked }))
  assert.deepEqual(result, { schema: 1, settings: { ...old, ...newSettings }, checked })
  for (const key of Object.keys(newSettings)) for (const value of [null, 5, [], {}, 'x'.repeat(301)]) {
    assert.throws(() => decodeState(JSON.stringify({ schema: 1, settings: { ...defaults, [key]: value }, checked })), error => error.code === 'targetField')
  }
})
test('both init requests cover all required components without triggering work or autopilot', () => {
  for (const locale of ['en', 'fr']) for (const experience of clients) {
    const c = content[locale]
    for (const step of [c.lifecycleSteps[0], c.lifecycleSteps[2]]) {
      for (const term of ['Word', 'PowerPoint', '.NET 10', 'Aspose.Words', 'Aspose.Slides', 'Azure App Service', 'CI/CD']) assert.ok(step.request.text.includes(term), term)
      assert.doesNotMatch(renderPrompt(step.request, { ...defaults, locale, experience }), /mode=/)
    }
    assert.match(c.prompts.planningInit, /init\n/)
    assert.match(c.prompts.deliveryInit, /init\n/)
    assert.ok(c.prompts.implementation.includes('IaC'))
    assert.ok(c.prompts.implementation.includes('CI/CD'))
  }
})
test('optional HLD/LLD uses a registered squad, Python/Azure/Graphviz and no main completion dependency', () => {
  for (const locale of ['en', 'fr']) for (const experience of clients) {
    const p = designPrompt(locale)
    assert.deepEqual(p.requiresSetup, ['delivery-team'])
    assert.deepEqual(missingSetup(p, ready), [])
    assert.throws(() => renderPrompt(p, { ...defaults, locale, experience }), /registered|squad|Enter/)
    const rendered = renderPrompt(p, { ...defaults, locale, experience, implementationSquad: 'delivery' })
    assert.ok(rendered.includes('mode="autopilot" squad="delivery"'))
    for (const term of ['HLD', 'LLD', 'Python', 'diagrams', 'Azure', 'Graphviz', 'PNG', 'SVG', '.NET 10', 'Aspose.Words', 'IaC', 'CI/CD']) assert.ok(rendered.includes(term), term)
    const checks = [...ready, ...optionalCheckIds, ...designCheckIds]
    assert.deepEqual(missingSetup(content[locale].lessons.find(l => l.id === 'implementation').launch, ready), [])
    assert.equal(checks.filter(id => ready.includes(id)).length, 3)
    assert.equal(designCheckIds.length, 3)
    assert.match(designText(locale)('boundary'), locale === 'fr' ? /ne bloque jamais/ : /never blocks/)
  }
})
test('optional publication has no dependencies in core steps or progress IDs', () => {
  for (const c of Object.values(content)) {
    const core = new Set([...c.lessons.flatMap(l => l.checks.map((_, i) => `${l.id}-${i}`)), ...ready])
    assert.equal(c.lessons.length, 7)
    assert.equal(core.size, 25)
    assert.ok(optionalCheckIds.every(id => !core.has(id)))
    for (const lesson of c.lessons) for (const prompt of [lesson.launch, ...lesson.steps.map(s => s.prompt), ...(lesson.setup ?? []).map(s => s.request)].filter(Boolean)) {
      assert.ok((prompt.requiresSetup ?? []).every(id => !id.startsWith('ado')))
    }
    let checked = [...ready]
    for (const id of optionalCheckIds) checked = toggleCheckpoint(id, checked)
    assert.equal(checked.filter(id => core.has(id)).length, ready.length)
    for (const id of optionalCheckIds) checked = toggleCheckpoint(id, checked)
    assert.deepEqual(checked, ready)
    const launch = c.lessons.find(l => l.id === 'implementation').launch
    assert.deepEqual(missingSetup(launch, ready), [])
    assert.deepEqual(promptTargetErrors(launch, { ...defaults, implementationSquad: 'delivery' }), [])
  }
})
for (const locale of ['en', 'fr']) for (const experience of clients) {
  test(`${locale}/${experience}: implementation requires an actual safe registered target`, () => {
    const launch = content[locale].lessons.find(l => l.id === 'implementation').launch
    for (const value of ['', ' ', 'BadName', 'two names', '../team', 'team/name', 'team" mode="bad', 'team\nother']) {
      const settings = { ...defaults, locale, experience, implementationSquad: value }
      assert.ok(squadNameError(value))
      assert.throws(() => renderPrompt(launch, settings), error => ['squadMissing', 'squadInvalid'].includes(error.code))
    }
    const settings = { ...defaults, locale, experience, implementationSquad: ' team-2 ' }
    const actual = renderPrompt(launch, settings)
    assert.equal(actual, experience === 'vscode'
      ? `/squad-federation mode="autopilot" squad="team-2" request=${JSON.stringify(launch.text)}`
      : `mode="autopilot" squad="team-2"\n\n${launch.text}`)
    assert.equal(settings.implementationSquad, ' team-2 ')
    for (const step of content[locale].lifecycleSteps) assert.doesNotMatch(renderPrompt(step.request, settings), /squad=|mode=/)
    assert.throws(() => renderPrompt({ ...launch, entry: 'squad' }, settings), error => error.code === 'targetContext')
    assert.throws(() => renderPrompt({ ...launch, lifecycle: 'init' }, settings), error => error.code === 'targetContext')
  })
  test(`${locale}/${experience}: publication destination validation only gates the optional request`, () => {
    for (const promoted of [false, true]) {
      const p = publicationPrompt(locale, promoted)
      const settings = { ...defaults, ...targets, locale, experience, project: 'A "quoted" project\\folder\nmode="other"' }
      assert.deepEqual(missingSetup(p, ready), [])
      assert.throws(() => renderPrompt(p, { ...settings, organization: '' }), error => error.code === 'publicationMissing')
      const actual = renderPrompt(p, settings)
      const body = experience === 'vscode' ? JSON.parse(actual.slice(actual.indexOf('request=') + 8)) : actual.split('\n\n').slice(1).join('\n\n')
      assert.ok(body.startsWith(optionalText(locale)('request')))
      assert.ok(body.includes(JSON.stringify(settings.project)))
      assert.ok(actual.startsWith(experience === 'vscode' ? `/${promoted ? 'squad-federation' : 'squad'} mode="autopilot"` : 'mode="autopilot"'))
      assert.equal(actual.includes(' squad="planning"'), promoted)
      if (promoted) assert.throws(() => renderPrompt(p, { ...settings, publicationSquad: '' }), error => error.code === 'squadMissing')
    }
    assert.deepEqual(missingPublicationFields(defaults), destinationFields.slice(0, 4))
    const implementation = content[locale].lessons.find(l => l.id === 'implementation').launch
    assert.doesNotThrow(() => renderPrompt(implementation, { ...defaults, locale, experience, implementationSquad: 'delivery' }))
    assert.doesNotThrow(() => renderPrompt(content[locale].lifecycleSteps[1].request, defaults))
  })
}
