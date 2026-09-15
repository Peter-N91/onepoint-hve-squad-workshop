import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { agenda, architecture, baseline, installation, lab, lessons, lifecycleSteps, observationNote, pdfReadiness, prework, prompts, repositorySetup, sources, troubleshooting } from '../src/content.ts'
import { agentSelection, decodeState, defaults, missingSetup, renderPrompt, setupCheckId, storageKey, toggleCheckpoint } from '../src/state.ts'
import { previewReport } from '../src/report.ts'

const read = path => readFile(new URL(path, import.meta.url), 'utf8')
const fixture = JSON.parse(await read('../public/downloads/report-studio-fixture.json'))
test('the seven prompts exactly match the English workshop contract', () => {
  assert.deepEqual(prompts, {
    readiness: 'Read the scoping document in knowledge-docs at the root of this repository. Summarize the business objective and three requirements, with their section references. Distinguish requirements from proposed workshop choices. For now, only answer: do not start planning or development.',
    planningInit: 'init\n\nUse the scoping document in knowledge-docs at the root of this repository. We need to understand the need, define business and product requirements, test uncertainties and prioritize the work before development. Set up a team for this planning work. Stop once the team is ready; I will send the work request next.',
    product: 'Using the scoping document in knowledge-docs, prepare business requirements, product requirements and a prioritized backlog with acceptance criteria and a proposed first release. Include a small experiment to test the most important uncertainty. Users must be able to enrich the reports in Word and PowerPoint. Separate facts, assumptions and pending decisions. Present the plan for review before any implementation.',
    promote: 'promote\n\nEvolve the existing team so that it can coordinate planning and a separate delivery team. Preserve the documents, decisions and work items already produced. Stop after this change; do not initialize the delivery team yet or start development.',
    deliveryInit: 'init\n\nWithin this existing organization, set up a delivery team for the first release agreed in the backlog. The context is an Office add-in for Word and PowerPoint, with Fabric and Power BI data as the eventual target, and synthetic data for the local exercise. Use the reviewed plan and existing decisions to propose suitable expertise. Stop when the team is ready, without starting implementation.',
    implementation: 'Implement the first release we agreed in the backlog, using the reviewed requirements and decisions. First propose an implementation plan for approval. For this workshop, use only local synthetic data; do not connect to the customer tenant or deploy anything. The result must produce editable content in the selected Office host and preserve manual additions according to the agreed rule. Surface errors without inventing or substituting missing data. Provide the available evidence and clearly distinguish what was executed, simulated or remains to be done.',
    resume: 'Resume the existing work without reinitializing teams or overwriting decisions. Summarize the agreed scope, completed items with their evidence, unexecuted tests and blockers. Propose the next useful backlog action and wait for my approval before continuing.',
  })
})
test('English agenda titles and acceptance criteria match the agreed contract', () => {
  assert.deepEqual(agenda.map(item => item.title), [
    'Product scope and first release',
    'Federation and technical decisions', 'Break', 'First slice and evidence',
    'Review and independent resumption', 'Discussion and next steps',
  ])
  assert.deepEqual(lab.acceptance, [
    'Period and scope are visible; all three values exactly match the selected synthetic dataset',
    'An editable native Word table, not only a screenshot or PDF',
    'Synthetic source, reference date and template version are displayed',
    'Reinsertion follows the selected rule; no user comment is lost',
    'Missing period or null value: an explicit message, never zero or invented data',
    'Office host, version and observed outcome are recorded; an unrun test is marked not executed',
  ])
})
test('English correction preserves saved progress identifiers and schema', () => {
  assert.equal(storageKey, 'onepoint-hve-workshop-2026-09-17-v1')
  assert.deepEqual(lessons.map(item => item.number), ['01', '02', '03', '04', '05', '06', '07'])
  assert.deepEqual(lessons.map(item => [item.id, item.checks.length]), [
    ['start', 2], ['prepare', 4], ['product', 4], ['federation', 3],
    ['implementation', 4], ['resume', 3], ['discussion', 2],
  ])
  const checked = ['start-0', 'prepare-3', 'product-1', 'setup:planning-team', 'setup:promote', 'setup:delivery-team']
  assert.deepEqual(decodeState(JSON.stringify({ schema: 1, checked, settings: defaults })).checked, checked)
})
test('English fixture labels and error surfaces are explicit', () => {
  assert.deepEqual(fixture.periods.map(item => item.label), ['July 2026', 'August 2026'])
  assert.deepEqual(fixture.indicators.map(item => [item.label, item.unit]), [
    ['Cases processed', 'cases'], ['Average turnaround', 'days'], ['Compliance rate', '%'],
  ])
  assert.equal(fixture.modelVersion, 'exercise-1.0')
  assert.throws(() => decodeState('{}'), /The saved progress format is not supported/)
  assert.throws(() => decodeState('{"schema":1}'), /Saved progress is corrupted/)
  assert.throws(() => decodeState('{"schema":1,"checked":[],"settings":{}}'), /Missing saved setting/)
  assert.throws(() => decodeState(JSON.stringify({ schema: 1, checked: [], settings: { ...defaults, experience: 'unknown' } })), /Unknown Copilot client/)
  assert.throws(() => decodeState(JSON.stringify({ schema: 1, checked: [], settings: { ...defaults, install: 'unknown' } })), /Unknown installation method/)
  assert.throws(() => missingSetup({ requiresSetup: ['unknown'] }, []), /Unknown setup prerequisite/)
})
test('Parts 01 and 02 are unchanged lesson IDs in separate self-paced pre-work', () => {
  assert.deepEqual(prework, [
    { id: 'start', number: '01', title: 'Outcome and method', time: 'Before the workshop', minutes: 0, output: 'Understand the learning outcome and separate team setup from business work' },
    { id: 'prepare', number: '02', title: 'Environment and context', time: 'Before the workshop', minutes: 0, output: 'Prepare the participant repository, readable knowledge-docs, client and tools before Thursday' },
  ])
  assert.equal(prework.reduce((total, item) => total + item.minutes, 0), 0)
  assert.ok(prework.every(item => !agenda.some(slot => slot.lesson === item.id)))
})
test('continuous 210-minute live agenda starts in Part 03 at 09:00 and protects the final thirty minutes', () => {
  assert.equal(agenda.reduce((total, item) => total + item.minutes, 0), 210)
  assert.deepEqual(agenda.map(item => [item.time, item.end, item.minutes]), [
    ['09:00', '10:00', 60], ['10:00', '10:30', 30], ['10:30', '10:40', 10],
    ['10:40', '11:45', 65], ['11:45', '12:00', 15], ['12:00', '12:30', 30],
  ])
  assert.deepEqual(agenda.map(item => item.lesson), ['product', 'federation', '', 'implementation', 'resume', 'discussion'])
  assert.deepEqual(agenda.map(item => item.output), [
    'Reviewed BRD, PRD, MVE and backlog; agreed delivery scope',
    'Delivery team initialized; explicit Office and data decisions', '',
    'Backlog slice started, executed where possible and reviewed',
    'Actual state, gaps and next action saved',
    'Decisions, owners to confirm and the next evidence to collect',
  ])
  const product = lessons.find(item => item.id === agenda[0].lesson)
  assert.equal(product.number, '03')
  assert.equal(product.setup[0].request.text, prompts.planningInit)
  assert.equal(product.launch.text, prompts.product)
  assert.ok(prework.every(item => !lessons.find(lesson => lesson.id === item.id).setup))
  assert.equal(agenda.at(-1).lesson, 'discussion')
  for (let i = 1; i < agenda.length; i++) assert.equal(agenda[i - 1].end, agenda[i].time)
})
test('each lesson matches pre-work or live timing and retains evidence, criteria and recovery', () => {
  assert.equal(new Set(lessons.map(item => item.id)).size, 7)
  for (const lesson of lessons) {
    const before = prework.find(item => item.id === lesson.id)
    const item = before ?? agenda.find(item => item.lesson === lesson.id)
    assert.ok(item)
    assert.equal(lesson.minutes, item.minutes)
    assert.equal(lesson.title, item.title)
    assert.equal(lesson.time, before ? 'Before the workshop' : `${item.time}–${item.end} CEST`)
    assert.ok(lesson.steps.length && lesson.checks.length && lesson.evidence.length && lesson.recovery)
  }
})
test('Onepoint progress is isolated, empty by default and deduplicated', () => {
  assert.match(storageKey, /onepoint.*2026-09-17/)
  assert.deepEqual(decodeState(null), { schema: 1, checked: [], settings: defaults })
  const value = decodeState(JSON.stringify({ schema: 1, checked: ['product-0', 'product-0'], settings: defaults }))
  assert.deepEqual(value.checked, ['product-0'])
  assert.deepEqual(value.settings, defaults)
})
test('invalid progress is rejected without silent replacement', () => {
  for (const raw of ['error', '{}', 'null', '{"schema":2}', JSON.stringify({ schema: 1, checked: [1], settings: defaults }), JSON.stringify({ schema: 1, checked: [], settings: { ...defaults, experience: 'unknown' } }), JSON.stringify({ schema: 1, checked: [], settings: { ...defaults, install: 'unknown' } })]) assert.throws(() => decodeState(raw))
})
test('workstation settings are bounded and contain no connection data', () => {
  const result = decodeState(JSON.stringify({ schema: 1, checked: [], settings: { ...defaults, officeVersion: 'a'.repeat(400) } }))
  assert.equal(result.settings.officeVersion.length, 300)
  assert.deepEqual(Object.keys(defaults).sort(), ['clientVersion', 'coreVersion', 'experience', 'install', 'locale', 'mode', 'officeVersion', 'squadVersion'])
})
test('App and CLI receive mandatory autopilot requests, unchanged lifecycle and shell blocks, never a slash skill', () => {
  for (const experience of ['app', 'cli']) for (const lesson of lessons) {
    for (const prompt of [lesson.launch, ...lesson.steps.map(step => step.prompt), ...(lesson.setup ?? []).map(step => step.request)].filter(Boolean)) {
      const actual = renderPrompt(prompt, { ...defaults, experience })
      assert.equal(actual, prompt.shell || prompt.lifecycle ? prompt.text : `mode="autopilot"\n\n${prompt.text}`)
      assert.ok(!/\/squad|profile\s*=|request=/.test(actual))
    }
  }
})
test('agent selection is explicit and matches the installation', () => {
  const cli = agentSelection('squad', defaults)
  assert.match(cli.instruction, /\/agent/)
  assert.equal(cli.identifier, 'hve-squad:squad-coordinator')
  const app = agentSelection('squad-federation', { ...defaults, experience: 'app' })
  assert.match(app.instruction, /agent list/)
  assert.ok(!app.instruction.includes('/agent'))
  assert.equal(app.identifier, 'hve-squad:squad-federation-coordinator')
  assert.equal(agentSelection('squad', { ...defaults, install: 'apm' }).identifier, 'Squad Coordinator')
})
test('business requests are complete and distinct from lifecycle messages', () => {
  const product = lessons.find(item => item.id === 'product')
  const delivery = lessons.find(item => item.id === 'implementation')
  assert.equal(product.launch.text, prompts.product)
  assert.equal(delivery.launch.text, prompts.implementation)
  assert.deepEqual(product.launch.requiresSetup, ['planning-team'])
  assert.deepEqual(delivery.launch.requiresSetup, ['delivery-team'])
  assert.ok(product.steps.every(step => !step.prompt))
  assert.ok(delivery.steps.every(step => !step.prompt))
  for (const term of ['business requirements', 'product requirements', 'backlog', 'acceptance', 'experiment', 'Word', 'PowerPoint']) assert.ok(product.launch.text.includes(term), term)
})
test('lifecycle is init then promote then init, without a double prefix', () => {
  assert.deepEqual(lifecycleSteps.map(step => step.id), ['planning-team', 'promote', 'delivery-team'])
  assert.deepEqual(lifecycleSteps.map(step => step.request.lifecycle), ['init', 'promote', 'init'])
  assert.deepEqual(lifecycleSteps.map(step => step.request.text), [prompts.planningInit, prompts.promote, prompts.deliveryInit])
  for (const step of lifecycleSteps) {
    assert.ok(step.request.text.startsWith(`${step.request.lifecycle}\n\n`))
    assert.ok(!step.request.text.includes(`${step.request.lifecycle}\n\n${step.request.lifecycle}`))
    assert.ok(step.expected.length && step.checkpoint)
  }
})
test('transitive prerequisites lock copy until all three confirmations', () => {
  const work = lessons.find(item => item.id === 'implementation').launch
  const [init, promote, delivery] = lifecycleSteps.map(step => step.request)
  const [planningId, promotionId, deliveryId] = lifecycleSteps.map(step => setupCheckId(step.id))
  assert.deepEqual(missingSetup(init, []), [])
  assert.deepEqual(missingSetup(promote, []).map(step => step.id), ['planning-team'])
  assert.deepEqual(missingSetup(delivery, [planningId]).map(step => step.id), ['promote'])
  assert.deepEqual(missingSetup(work, []).map(step => step.id), ['planning-team', 'promote', 'delivery-team'])
  assert.deepEqual(missingSetup(work, [planningId, promotionId, deliveryId]), [])
  assert.deepEqual(missingSetup(work, [deliveryId]).map(step => step.id), ['planning-team', 'promote'])
})
test('unchecking a prerequisite also invalidates dependent confirmations', () => {
  const checked = ['product-0', ...lifecycleSteps.map(step => setupCheckId(step.id))]
  assert.deepEqual(toggleCheckpoint('setup:planning-team', checked), ['product-0'])
  assert.deepEqual(toggleCheckpoint('setup:promote', checked), ['product-0', 'setup:planning-team'])
  assert.deepEqual(toggleCheckpoint('setup:delivery-team', checked), ['product-0', 'setup:planning-team', 'setup:promote'])
})
test('business checkpoints cannot replace an initialization confirmation', () => {
  const business = lessons.flatMap(item => item.checks.map((_, index) => `${item.id}-${index}`))
  const setup = lifecycleSteps.map(item => setupCheckId(item.id))
  assert.equal(new Set([...business, ...setup]).size, business.length + setup.length)
  assert.deepEqual(missingSetup(lessons.find(item => item.id === 'product').launch, business).map(item => item.id), ['planning-team'])
})
test('repository and knowledge-docs precede installation, with overwrite protection', () => {
  const prepare = lessons.find(item => item.id === 'prepare')
  assert.equal(prepare.beforeInstall.length, 2)
  assert.equal(prepare.beforeInstall[0].prompt, repositorySetup)
  for (const term of ['onepoint-workshop-project', 'Test-Path', 'git init -b main', '.\\knowledge-docs', '.\\.gitignore', 'private/', '.env', '*.docx', '*.pptx']) assert.ok(repositorySetup.text.includes(term), term)
  assert.ok(repositorySetup.text.indexOf('Test-Path') < repositorySetup.text.indexOf('git init'))
  assert.ok(!/apm install|copilot plugin install/.test(repositorySetup.text))
  assert.match(prepare.beforeInstall[1].body, /Before any installation/)
})
test('both plug-in entries are installed and checked, APM pins the baseline', () => {
  assert.match(installation.plugin.text, /copilot plugin install hve-squad@hve-squad-plugin/)
  assert.match(installation.plugin.text, /copilot plugin install hve-squad-hve-core@hve-squad-plugin/)
  assert.match(installation.plugin.text, /copilot plugin list/)
  assert.equal(installation.apm.text, `apm install "Peter-N91/hve-squad#v${baseline}" --target copilot`)
})
test('outcome-oriented requests do not prescribe internal mechanisms', () => {
  const internals = /\b(hve|squad|coordinator|profile|pack|autopilot|intake|gate|registry|ledger|scribe|validator)\b|handoff\.md|backlog-execute|\.copilot-tracking|\/squad/i
  for (const prompt of Object.values(prompts)) assert.ok(!internals.test(prompt))
  assert.match(observationNote, /not instructions to paste/)
  assert.match(observationNote, /record that gap/)
})
test('context reading is actually compared, Python and PDF remain optional', () => {
  assert.match(prompts.readiness, /three requirements/)
  assert.match(prompts.readiness, /section references/)
  assert.match(prompts.readiness, /do not start planning or development/)
  assert.match(pdfReadiness.requirement, /Compare/)
  assert.match(pdfReadiness.python, /Python is optional/)
  assert.match(pdfReadiness.python, /same Python environment/)
  assert.match(pdfReadiness.fallback, /does not perform OCR/)
  assert.match(pdfReadiness.setup.text, /python -m pip install pypdf/)
})
test('Office, synthetic data and thresholds remain proposals, not attested outcomes', () => {
  assert.match(lab.status, /Teaching proposal to confirm/)
  assert.match(lab.firstSlice, /In Word/)
  assert.match(lab.extension, /In PowerPoint/)
  assert.match(lab.mve, /Proposed threshold to approve; the experiment has not been executed/)
  assert.match(prompts.implementation, /local synthetic data/)
  assert.match(prompts.implementation, /do not connect to the customer tenant or deploy anything/)
  assert.match(lessons.find(item => item.id === 'implementation').recovery, /11:45/)
})
test('technical decisions distinguish Office, exports, access and Execute Queries limits', () => {
  const text = architecture.join('\n')
  for (const term of ['RDL', 'HTTPS', 'Office.js', 'requirement sets', 'Fabric/OneLake', 'Read/Build', '200', 'RLS', 'SSO', 'editable']) assert.ok(text.includes(term), term)
  assert.ok(!lessons.some(item => item.id === 'ado'))
})
test('fixture has exactly two nominal periods and three numeric indicators', () => {
  assert.equal(fixture.periods.length, 2)
  assert.equal(fixture.indicators.length, 3)
  assert.deepEqual(fixture.periods.map(item => Object.values(item.values)), [[1280, 4.2, 96.5], [1345, 3.8, 97.2]])
  for (const period of fixture.periods) {
    assert.deepEqual(Object.keys(period.values), fixture.indicators.map(item => item.id))
    assert.ok(Object.values(period.values).every(value => typeof value === 'number' && Number.isFinite(value)))
  }
  for (const key of ['scope', 'source', 'referenceDate', 'modelVersion']) assert.ok(fixture[key])
  assert.match(fixture.notice, /Entirely synthetic/)
})
test('nominal preview preserves exact values without mutation', () => {
  const before = JSON.stringify(fixture)
  for (const period of fixture.periods) {
    const result = previewReport(fixture, period.id)
    assert.deepEqual(result.rows.map(item => item.value), Object.values(period.values))
    assert.deepEqual(result.errors, [])
    assert.equal(result.canInsert, true)
  }
  assert.equal(JSON.stringify(fixture), before)
})
test('null value produces an explicit error, not zero, and blocks insertion', () => {
  const result = previewReport(fixture, 'valeur-nulle')
  assert.deepEqual(result.errors, ['Data unavailable: Average turnaround'])
  assert.equal(result.rows[1].value, null)
  assert.equal(result.canInsert, false)
  assert.match(result.expected, /Do not replace with zero/)
  assert.equal(fixture.periods[1].values.delaiMoyenJours, 3.8)
})
test('missing period has no silent carry-over and no rows to insert', () => {
  const result = previewReport(fixture, 'periode-absente')
  assert.deepEqual(result.errors, ['Period unavailable: 2026-09'])
  assert.deepEqual(result.rows, [])
  assert.equal(result.canInsert, false)
  assert.match(result.expected, /preserve the existing document/)
  assert.equal(previewReport(fixture, 'unknown').canInsert, false)
})
test('valid zero is preserved; non-finite numbers are rejected', () => {
  const copy = structuredClone(fixture)
  copy.periods[0].values.dossiersTraites = 0
  assert.equal(previewReport(copy, '2026-07').canInsert, true)
  copy.periods[0].values.delaiMoyenJours = NaN
  assert.equal(previewReport(copy, '2026-07').canInsert, false)
})
test('four useful downloads are consistent and contain no team state', async () => {
  assert.deepEqual((await readdir(new URL('../public/downloads/', import.meta.url))).sort(), ['checkpoint-worksheet.txt', 'federation-handoff.txt', 'report-studio-exercise-brief.txt', 'report-studio-fixture.json'])
  const exercise = await read('../public/downloads/report-studio-exercise-brief.txt')
  for (const term of ['SYNTHETIC BRIEF WRITTEN FOR THE EXERCISE', '1280', '1345', '4.2', '3.8', '96.5', '97.2', 'knowledge-docs', 'TEACHING PROPOSAL TO APPROVE']) assert.ok(exercise.includes(term), term)
  const worksheet = await read('../public/downloads/checkpoint-worksheet.txt')
  assert.match(worksheet, /BLANK ACCEPTANCE AND DECISION WORKSHEET/)
  assert.ok(!worksheet.includes('[x]'))
  assert.match(await read('../public/downloads/federation-handoff.txt'), /BLANK HANDOFF/)
  for (const criterion of lab.acceptance) {
    assert.ok(exercise.includes(criterion))
    assert.ok(worksheet.includes(criterion))
  }
})
test('exact Qubix light, dark and print brand tokens; all component colors use cp variables', async () => {
  const css = await read('../src/index.css')
  const tokenSets = [...css.matchAll(/\{([^{}]*--cp-[^{}]*)\}/g)]
    .map(block => Object.fromEntries([...block[1].matchAll(/(--cp-[\w-]+)\s*:\s*([^;]+);/g)].map(match => [match[1], match[2].trim()])))
    .filter(tokens => Object.keys(tokens).length)
  // Snapshots of every token in Qubix's light, dark and print blocks (14 September 2026).
  assert.deepEqual(tokenSets.map(tokens => createHash('sha256').update(JSON.stringify(tokens)).digest('hex')), [
    '293ab00b8e369df0cd83001d8d50fdb460316977748a89fef4733c9840012314',
    '42c8a75d73a6961c61eb2131f52222affb12a897a1f2f8bbaed059defd2fd5e2',
    'ce364a9737afd34d2a932578792c99864309f6e378850f51e467d5ac864fb122',
  ])
  for (const pair of ['--cp-bg: #f3f7fa', '--cp-accent: #08764f', '--cp-bg: #0b0f14', '--cp-accent: #3ddc97', '--cp-brand: #3ddc97', '--cp-brand-hover: #63e4ad', '--cp-brand-ink: #06281c']) assert.ok(css.includes(pair))
  const withoutTokens = css.replace(/--cp-[\w-]+\s*:[^;]+;/g, '')
  assert.ok(!/#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i.test(withoutTokens))
  assert.match(css, /\.primary \{ background: var\(--cp-brand\); color: var\(--cp-brand-ink\); border-color: var\(--cp-brand\); \}/)
  assert.match(css, /\.primary:hover \{ background: var\(--cp-brand-hover\); color: var\(--cp-brand-ink\); \}/)
  assert.match(css, /"Segoe UI", Aptos, Calibri/)
})
test('the original Qubix logo is byte-identical and licensed, including in portable and print', async () => {
  const logo = await readFile(new URL('../public/hve-squad-logo.svg', import.meta.url))
  assert.equal(createHash('sha256').update(logo).digest('hex'), '325cf59d606085357e81c746d3c8b1671f07be076746c59c11864fd7e9891034')
  const notice = await read('../public/THIRD-PARTY-NOTICES.txt')
  for (const term of ['https://peter-n91.github.io/hve-squad/assets/logo.svg', 'MIT License', 'Copyright (c) 2026 Peter-N91', 'Copyright (c) Meta Platforms', 'CC BY 4.0']) assert.ok(notice.includes(term), term)
  const app = await read('../src/App.tsx')
  assert.match(app, /import\.meta\.env\.BASE_URL}hve-squad-logo\.svg/)
  assert.equal((app.match(/<img className="brand-mark" src=\{logoUrl\}/g) ?? []).length, 2)
  assert.match(app, /THIRD-PARTY-NOTICES\.txt\?raw/)
  assert.match(app, /print-brand/)
  const portable = await read('../scripts/portable.mjs')
  assert.match(portable, /data:image\/svg\+xml;base64/)
  assert.match(portable, /replaceAll\(logoPath/)
})
test('resources, download brief, running instructions and recovery agree on pre-work and live timing', async () => {
  for (const path of ['../public/downloads/report-studio-exercise-brief.txt', '../RUNNING.txt']) {
    const text = await read(path)
    assert.match(text, /210 MINUTES/)
    assert.match(text, /SELF-PACED, 0 LIVE MINUTES|self-paced, 0 live minutes/)
    for (const item of agenda) assert.ok(text.includes(`${item.time}–${item.end} | ${item.lesson ? `${lessons.find(lesson => lesson.id === item.lesson).number} ` : ''}${item.title} | ${item.minutes} min`))
  }
  const app = await read('../src/App.tsx') + await read('../src/ui.ts')
  for (const term of ['Before the workshop', '0 live minutes', 'Ready — start Part 03 at 09:00', 'firstPrework', '<PreworkPanel /><LiveAgenda />']) assert.ok(app.includes(term), term)
  assert.match(app, /including (?:the )?untimed pre-work/)
  assert.match(troubleshooting.find(([title]) => title === 'Pre-work unfinished at 09:00')[1], /09:00–09:10 readiness check-in, then planning init and product work from 09:10/)
  for (const path of ['../src/content.ts', '../src/App.tsx', '../public/downloads/report-studio-exercise-brief.txt', '../RUNNING.txt']) assert.doesNotMatch(await read(path), /09:15|09:35|10:15|10:35|10:45|Clawpilot/)
})
test('English guide has early theme detection and relative build paths', async () => {
  const html = await read('../index.html')
  assert.match(html, /lang="en"/)
  assert.match(html, /<link rel="icon" href="data:,"/)
  assert.match(html, /onepoint \| From data to reports, with HVE Squad/)
  assert.match(html, /This interactive guide requires JavaScript/)
  assert.ok(html.indexOf('scoutTheme') < html.indexOf('src="/src/main.tsx"'))
  assert.match(await read('../vite.config.ts'), /base: '\.\/'/)
  const app = await read('../src/App.tsx') + await read('../src/ui.ts') + await read('../src/language.ts')
  for (const term of ['Copy', 'Self-report', "en: 'en-GB'", 'NumberFormat(numberLocales[locale]', 'Hands-on workshop: scope and start an Office add-in', 'aria-live="polite"', 'role="tablist"', 'onKeyDown', 'showModal', 'localStorage', 'print-only']) assert.ok(app.includes(term), term)
  assert.ok(!/fetch\(|XMLHttpRequest|https:\/\/.*\/api\//.test(app))
})
test('Pages deployment is manual only and uses no invented site URL', async () => {
  const workflow = await read('../.github/workflows/pages.yml')
  assert.match(workflow, /workflow_dispatch:/)
  assert.ok(!/^\s*(push|pull_request|schedule):/m.test(workflow))
  assert.match(workflow, /steps\.deployment\.outputs\.page_url/)
})
test('resumption does not reinitialize or prescribe internal paths', () => {
  assert.match(prompts.resume, /without reinitializing/)
  assert.match(prompts.resume, /wait for my approval/)
  assert.ok(!/team\.md|federation\.md|\.copilot-tracking/.test(prompts.resume))
})
test('official references are accessible through explicit links only', () => {
  assert.ok(sources.length >= 8)
  assert.equal(new Set(sources.map(item => item.url)).size, sources.length)
  assert.ok(sources.every(item => item.url.startsWith('https://')))
})
