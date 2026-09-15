import { Fragment, useEffect, useRef, useState } from 'react'
import { agenda, architecture, baseline, installation, lab, lessons, lifecycleSteps, observationNote, pdfReadiness, prework, sources, troubleshooting } from './content'
import type { Lesson, LessonStep, Prompt } from './content'
import { agentSelection, decodeState, defaults, missingSetup, renderPrompt, setupCheckId, storageKey, toggleCheckpoint } from './state'
import type { SavedState, Settings } from './state'
import { downloads } from './downloads'
import { previewReport } from './report'
import type { Fixture } from './report'
import fixtureText from '../public/downloads/report-studio-fixture.json?raw'
import brandNotice from '../public/THIRD-PARTY-NOTICES.txt?raw'

const fixture: Fixture = JSON.parse(fixtureText)
const logoUrl = `${import.meta.env.BASE_URL}hve-squad-logo.svg`
function PreworkPanel() {
  return <section className="prework-panel" aria-label="Before the workshop">
    <div className="section-heading"><h2>Before the workshop</h2><span className="badge">SELF-PACED · 0 LIVE MINUTES</span></div>
    <p>Complete Parts 01 and 02 at your own pace before Thursday. They are not part of the live agenda. At 09:00, start Part 03 with planning init and product work, not an extra opening or installation block.</p>
    <div className="download-grid">{prework.map(item => <div className="prework-card" key={item.id}>
      <p className="small">{item.time} · {item.minutes} live minutes</p>
      <h3><a href={`#${item.id}`}>{item.number} · {item.title}</a></h3><p>{item.output}.</p>
    </div>)}</div>
  </section>
}
function LiveAgenda() {
  return <section className="agenda-card" aria-label="Live workshop agenda">
    <div className="section-heading"><h2>Live workshop agenda</h2><span className="small">210 minutes · CEST</span></div>
    {agenda.map(item => <div className={item.lesson === 'discussion' ? 'agenda-row protected' : 'agenda-row'} key={item.time}>
      <span className="agenda-time">{item.time}<small>{item.end}</small></span>
      {item.lesson ? <a href={`#${item.lesson}`}>{lessons.find(lesson => lesson.id === item.lesson)?.number} · {item.title}</a> : <span>{item.title}</span>}
      <span className="duration">{item.minutes} min</span>
    </div>)}
    <p className="small">Includes the 10-minute break. The final 30 minutes, 12:00–12:30, are protected for discussion.</p>
  </section>
}
const checkIds = new Set([
  ...lessons.flatMap(lesson => lesson.checks.map((_, index) => `${lesson.id}-${index}`)),
  ...lifecycleSteps.map(step => setupCheckId(step.id)),
])
function readInitial() {
  try {
    const data = decodeState(localStorage.getItem(storageKey))
    data.checked = data.checked.filter(id => checkIds.has(id))
    return { data, error: '' }
  } catch {
    return {
      data: { schema: 1, checked: [], settings: { ...defaults } } satisfies SavedState,
      error: 'Unable to load progress. Saving is suspended: existing data has not been replaced. You can export this session’s progress or reset this workshop’s data.',
    }
  }
}
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function DownloadPanel() {
  return <section className="resource-downloads">
    <h2>Your exercise materials</h2>
    <p>Synthetic or blank files, not a completed solution or preinitialized team state. Keep completed worksheets in your participant repository, never in this guide.</p>
    <div className="download-grid">{downloads.map(item => <div className="download-card" key={item.name}>
      <h3>{item.title}</h3><p>{item.description}</p>
      <button type="button" onClick={() => download(item.name, item.content, item.type)}>Download · {item.name.endsWith('json') ? 'JSON' : 'TXT'}<span className="sr-only">: {item.title}</span></button>
    </div>)}</div>
  </section>
}
function Lab({ printOnly = false }: { printOnly?: boolean }) {
  const [selected, setSelected] = useState('2026-07')
  const report = previewReport(fixture, selected)
  return <article className={printOnly ? 'resources print-only' : 'resources'} aria-label="Report Studio lab">
    <div className="eyebrow">SYNTHETIC CASE · WORD + POWERPOINT</div>
    <h1>Report Studio</h1>
    <p className="lead">A simple data contract. Editable output. Verifiable evidence.</p>
    <div className="notice"><strong>{lab.status}.</strong><p>This lab only illustrates a local data preview in the guide: it is not an add-in and executes no Office, Fabric or Power BI integration.</p></div>
    <section className="lab-slice"><h2>Proposed first slice</h2><p>{lab.firstSlice}</p><p>{lab.extension}</p><h3>Minimum viable experiment</h3><p>{lab.mve}</p></section>
    <section className="fixture-panel">
      <div className="section-heading"><h2>Explore the synthetic contract</h2><span className="badge">LOCAL SIMULATION</span></div>
      <label className="fixture-select">Preview scenario
        <select value={selected} onChange={event => setSelected(event.target.value)}>
          <optgroup label="Two nominal periods">{fixture.periods.map(period => <option key={period.id} value={period.id}>{period.label}</option>)}</optgroup>
          <optgroup label="Negative cases">{fixture.negativeCases.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</optgroup>
        </select>
      </label>
      <div className="report-preview" aria-live="polite">
        <h3>{report.title}</h3><p>{fixture.scope}</p>
        {report.rows.length > 0 && <div className="table-scroll"><table><caption>Synthetic values — no Office document generated</caption><thead><tr><th scope="col">Indicator</th><th scope="col">Value</th><th scope="col">Unit</th></tr></thead><tbody>
          {report.rows.map(row => <tr key={row.id}><th scope="row">{row.label}</th><td>{row.value == null || !Number.isFinite(row.value) ? 'Unavailable' : new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(row.value)}</td><td>{row.unit}</td></tr>)}
        </tbody></table></div>}
        {report.errors.length > 0 && <div className="notice warning"><strong>Block insertion under the exercise convention.</strong><ul>{report.errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
        <p className="small">{fixture.source} · Reference: {fixture.referenceDate} · Template: {fixture.modelVersion}</p>
        <p>{report.expected ?? 'Expected: three values matching the selected dataset, then editable native content in the selected host. Insertion and its verification remain to be implemented in your project.'}</p>
      </div>
      <p className="small">The null value and missing period are two test variants, not a third nominal period. The proposed convention blocks incomplete reports and preserves the existing document; obtain approval for it.</p>
    </section>
    <section><h2>Proposed acceptance criteria</h2><ol>{lab.acceptance.map(item => <li key={item}>{item}</li>)}</ol><p className="small">Approve before implementation. The guide attests none of these tests in Office.</p></section>
    <section><h2>Technical decisions to make explicit</h2>{architecture.map((item, index) => <div className="architecture-row" key={item}><span className="step-index">{index + 1}</span><p>{item}</p></div>)}</section>
    <section><h2>Outside workshop scope</h2><ul>{lab.outOfScope.map(item => <li key={item}>{item}</li>)}</ul></section>
    <DownloadPanel />
  </article>
}
function App() {
  const [initial] = useState(readInitial)
  const [saved, setSaved] = useState(initial.data)
  const [storageError, setStorageError] = useState(initial.error)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(() => window.location.hash.slice(1) || 'overview')
  const [setupOpen, setSetupOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')
  const heading = useRef<HTMLDivElement>(null)
  const resetDialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const handle = () => { setPage(window.location.hash.slice(1) || 'overview'); setMenuOpen(false); setStatus('') }
    window.addEventListener('hashchange', handle)
    return () => window.removeEventListener('hashchange', handle)
  }, [])
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }) }, [page])
  useEffect(() => { if (resetOpen) resetDialog.current?.showModal(); else resetDialog.current?.close() }, [resetOpen])
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  const active = lessons.find(lesson => lesson.id === page)
  const selection = agentSelection(active?.launch?.entry ?? (['federation', 'implementation', 'resume'].includes(page) ? 'squad-federation' : 'squad'), saved.settings)
  const progress = Math.round(saved.checked.length / checkIds.size * 100)
  const firstPrework = prework.find(item => lessons.find(lesson => lesson.id === item.id)!.checks.some((_, index) => !saved.checked.includes(`${item.id}-${index}`)))
  function updateSaved(next: SavedState) {
    setSaved(next)
    if (storageError) return
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { setStorageError('Progress was not saved. Keep this tab open and export your progress before leaving it.') }
  }
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => updateSaved({ ...saved, settings: { ...saved.settings, [key]: value } })
  const toggleCheck = (id: string) => updateSaved({ ...saved, checked: toggleCheckpoint(id, saved.checked) })
  const exportProgress = () => download('onepoint-progress-2026-09-17.json', JSON.stringify(saved, null, 2), 'application/json')
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setStatus('Copied. Review the request in your own project before sending it.') }
    catch { setStatus('Clipboard unavailable. Select the visible text and copy it manually; respect the required confirmations.') }
  }
  function renderPromptBlock(prompt: Prompt) {
    const pending = missingSetup(prompt, saved.checked)
    return <div className="prompt-block">
      <div className="prompt-toolbar"><span>{prompt.shell ? 'POWERSHELL · PREPARATION / INSTALLATION' : prompt.lifecycle ? 'LIFECYCLE · AGENT CONVERSATION' : 'BUSINESS REQUEST · EXPECTED OUTCOME'}</span>
        <button type="button" aria-label={`Copy: ${prompt.title}`} disabled={pending.length > 0} onClick={() => copy(renderPrompt(prompt))}>Copy</button></div>
      <h4>{prompt.title}</h4>
      {!prompt.shell && <p className="agent-hint">{agentSelection(prompt.entry, saved.settings).instruction} Paste only the request below.</p>}
      <pre tabIndex={0}><code>{renderPrompt(prompt)}</code></pre>
      {pending.length > 0 && <div className="prompt-warning">First confirm these steps in your project:
        <ul>{pending.map(step => <li key={step.id}><a href={`#${step.lessonId}`}>{step.title}</a></li>)}</ul>
        <span>The Copy button is locked based on your self-report, not repository inspection. Do not bypass the step by copying manually.</span>
      </div>}
    </div>
  }
  function renderExercise(step: LessonStep, index: number) {
    return <div className="exercise" key={step.title}><div className="step-index">{String(index + 1).padStart(2, '0')}</div><div><h2>{step.title}</h2><p>{step.body}</p>{step.prompt && renderPromptBlock(step.prompt)}</div></div>
  }
  function renderLesson(lesson: Lesson, printOnly = false) {
    return <article key={lesson.id} className={printOnly ? 'lesson print-only' : 'lesson'} aria-label={lesson.title}>
      <div className="eyebrow">{lesson.eyebrow} <span>/</span> {lesson.time} · {lesson.minutes} live minutes</div>
      <div className="lesson-title"><span className="big-number">{lesson.number}</span><h1>{lesson.title}</h1></div>
      {prework.some(item => item.id === lesson.id) && <p className="small">Self-paced before Thursday · excluded from the 210-minute live agenda. Ready? <a href="#product">Start Part 03 at 09:00 with planning init and product work.</a></p>}
      <p className="lead">{lesson.goal}</p>
      <div className="concept"><strong>The key idea</strong><p>{lesson.concept}</p></div>
      <section className="inputs"><h2>Have these ready</h2><ul>{lesson.inputs.map(input => <li key={input}>{input}</li>)}</ul></section>
      {lesson.beforeInstall && <section className="before-install" aria-label="Repository and knowledge-docs before installation">
        <div className="section-caption">BEFORE EITHER INSTALLATION METHOD</div>
        {lesson.beforeInstall.map(renderExercise)}
        <div className="repo-layout"><h3>Your participant repository</h3><pre><code>{'onepoint-workshop-project\\\n  .git\\\n  .gitignore\n  knowledge-docs\\\n    report-studio-exercise-brief.txt'}</code></pre><p className="small">No team state is supplied. The synthetic brief is available in <a href="#resources">Resources</a>. Never copy a private scoping document into this site.</p></div>
      </section>}
      {lesson.setup && <section className="lifecycle-list" aria-label="Setup before work">
        <div className="eyebrow">SET UP · CONFIRM · REQUEST WORK</div>
        <p className="small">Send each message separately in the agent conversation. init and promote are not PowerShell commands. These checkboxes record your confirmations: they create nothing and authorize no action.</p>
        {lesson.setup.map(step => <section className="lifecycle-step" data-setup-id={step.id} key={step.id}>
          <h2>{step.title}</h2><p>{step.description}</p>{renderPromptBlock(step.request)}
          <h3>Outcome to check before continuing</h3><ul>{step.expected.map(result => <li key={result}>{result}</li>)}</ul>
          <label className="check-row setup-check"><input type="checkbox" checked={saved.checked.includes(setupCheckId(step.id))} disabled={missingSetup(step.request, saved.checked).length > 0} onChange={() => toggleCheck(setupCheckId(step.id))} /><span>{step.checkpoint}</span></label>
          <p className="small">Self-report after checking the real project. Completed setup does not mean business work has been executed.</p>
        </section>)}
      </section>}
      {lesson.launch && <section className="phase-launch" aria-label="Separate business request">
        <span className="eyebrow">WHAT YOU REQUEST · NOT INTERNAL MECHANISMS</span>
        <h2>{lesson.id === 'product' ? '2. Request planning work' : '3. Request implementation'}</h2>
        <p>{lesson.launchHint}</p>{renderPromptBlock(lesson.launch)}
      </section>}
      {lesson.behaviors && <section className="behavior-panel"><span className="eyebrow">WHAT YOU OBSERVE · DO NOT PASTE</span><h2>Expected behaviors to verify</h2><ul>{lesson.behaviors.map(behavior => <li key={behavior}>{behavior}</li>)}</ul><p className="small">{observationNote}</p></section>}
      {lesson.id === 'prepare' && <>
        <section className="install-panel">
          <h2>3. Install after preparing the repository</h2><p>Continue only if the repository already contains the scoping document in <code>knowledge-docs</code>. If tools are installed, check their versions rather than reinstalling unnecessarily.</p>
          <div className="segmented" aria-label="Installation method">{(['plugin', 'apm'] as const).map(value => <button type="button" key={value} aria-pressed={saved.settings.install === value} onClick={() => updateSetting('install', value)}>{value === 'plugin' ? 'Plug-in · recommended' : 'APM · pinned'}</button>)}</div>
          <p>{saved.settings.install === 'plugin' ? 'Install both paired entries in your client. Marketplace installation does not guarantee v0.16.2: confirm actual versions and revisions.' : 'After installing APM and authenticating to GitHub, run this command at the participant repository root. It pins the HVE Squad rehearsal reference; check resolved dependencies and their availability in your client.'}</p>
          {saved.settings.install === 'plugin' && saved.settings.experience === 'app' ?
            <div className="app-install"><h3>In the App plug-in settings</h3><ol><li>Find the <code>Peter-N91/hve-squad-plugin</code> marketplace.</li><li>Install <code>hve-squad</code> and <code>hve-squad-hve-core</code> together.</li><li>Check versions and the presence of coordinators in the agent list.</li></ol><p>Labels depend on the client and version. See the <a href={sources[2].url} target="_blank" rel="noreferrer">App installation guide</a>; a CLI installation does not prove that the App uses the same resources.</p></div> : renderPromptBlock(installation[saved.settings.install])}
          <details><summary>Pairing, updates and App/CLI differences</summary><p>Do not overlay another standalone HVE Core version on the pair. Clients may have different plug-in directories. Check the client you actually use. For updates, follow the plug-in documentation: the second entry may need removal and reinstallation to pick up the correct revision. Do not change an installation used by other projects without approval.</p></details>
          <details><summary>Local tools and version references</summary><p>v{baseline} is the Qubix rehearsal baseline, not prior validation of this Onepoint workshop. Record actual versions in “My workstation”. Git and an authenticated Copilot client are required. The Office toolchain needs a Node environment supported by the selected generator, an HTTPS development server and host authorization. This site itself uses Node 24+.</p><p>See the <a href={sources[8].url} target="_blank" rel="noreferrer">CLI prerequisites</a> and <a href={sources[9].url} target="_blank" rel="noreferrer">APM quickstart</a>. Installing a capability authorizes neither remote access nor deployment.</p></details>
        </section>
        <section className="pdf-readiness install-panel"><span className="eyebrow">TEST THE ACTUAL CLIENT, NOT JUST THE TOOLS</span><h2>{pdfReadiness.title}</h2><p>{pdfReadiness.requirement}</p><h3>Python remains conditional</h3><p>{pdfReadiness.python}</p>
          <details><summary>Optional text PDF reader preparation</summary><p>Use an authorized environment and the same executable as the client. Reopen the client if its environment changed. The command checks an import, not extraction of the scoping document.</p>{renderPromptBlock(pdfReadiness.setup)}</details>
          <h3>Difficult or protected document</h3><p>{pdfReadiness.fallback}</p>
        </section>
      </>}
      {['product', 'federation', 'implementation'].includes(lesson.id) && <aside className="lab-link"><strong>{lab.status}.</strong><p>See the <a href="#lab">Report Studio lab</a>: first slice, three indicators, negative cases, criteria and technical decisions.</p></aside>}
      <section className="exercise-list" aria-label="Exercises and review points"><div className="section-caption">{lesson.launch ? 'REVIEW POINTS · NOT ONE REQUEST PER INTERNAL ROLE' : 'PREPARE, OBSERVE AND CONCLUDE'}</div>{lesson.steps.map(renderExercise)}</section>
      <div className="checkpoint-grid"><section className="evidence-card"><span className="eyebrow">DELIVERABLES</span><h2>Evidence to keep</h2><ul>{lesson.evidence.map(item => <li key={item}>{item}</li>)}</ul></section>
        <section className="check-card"><span className="eyebrow">YOUR CHECKPOINT</span><h2>Can you show it?</h2>{lesson.checks.map((item, index) => <label className="check-row" key={item}><input type="checkbox" checked={saved.checked.includes(`${lesson.id}-${index}`)} onChange={() => toggleCheck(`${lesson.id}-${index}`)} /><span>{item}</span></label>)}<p className="small">Local self-report, not automatic evidence of completion.</p></section></div>
      <aside className="recovery"><h3>If you are blocked</h3><p>{lesson.recovery}</p></aside>
    </article>
  }
  const nextLesson = active ? lessons[lessons.indexOf(active) + 1] : undefined
  const previousLesson = active ? lessons[lessons.indexOf(active) - 1] : undefined
  const settingsFields: [keyof Settings, string, string][] = [
    ['clientVersion', 'Copilot client and version', 'Version actually used'],
    ['squadVersion', 'Installed HVE Squad', 'Checked version or revision'],
    ['coreVersion', 'Paired HVE Core', 'Checked version and revision'],
    ['officeVersion', 'Office hosts, versions and OS', 'Verified support or blocker'],
  ]
  return <div className={focusMode ? 'app focus-mode' : 'app'}>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); heading.current?.focus(); heading.current?.scrollIntoView() }}>Skip to content</a>
    <header className="topbar">
      <a className="brand" href="#overview"><img className="brand-mark" src={logoUrl} alt="" width="48" height="48" /><span>HVE SQUAD<span className="brand-sub">WORKSHOP GUIDE</span></span></a>
      <div className="event-label">onepoint <span>17 September 2026 · CEST</span></div>
      <div className="header-actions"><button type="button" aria-expanded={setupOpen} onClick={() => setSetupOpen(!setupOpen)}>My workstation</button><button type="button" aria-label={`Enable ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? 'Dark' : 'Light'}</button><button className="mobile-menu" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>Journey</button></div>
    </header>
    {setupOpen && <section className="session-setup" aria-label="My workstation"><div className="setup-heading"><div><h2>Your environment, reported locally</h2><p>No secrets, scoping documents or customer data. These values are not sent to a server.</p></div><button type="button" onClick={() => setSetupOpen(false)}>Close</button></div><div className="settings-grid">{settingsFields.map(([key, label, placeholder]) => <label key={key}>{label}<input value={saved.settings[key]} maxLength={300} placeholder={placeholder} onChange={event => updateSetting(key, event.target.value)} /></label>)}</div><p className="small">These notes install and verify nothing. The export includes these fields; review it before sharing. No remote access is configured here.</p></section>}
    <div className="shell">
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'} aria-label="Workshop navigation"><div className="sidebar-heading">YOUR LEARNING JOURNEY</div>
        <nav><a href="#overview" aria-current={page === 'overview' ? 'page' : undefined} className="overview-link"><span>↗</span>Overview</a>
          {lessons.map(lesson => {
            const count = lesson.checks.filter((_, index) => saved.checked.includes(`${lesson.id}-${index}`)).length + (lesson.setup ?? []).filter(step => saved.checked.includes(setupCheckId(step.id))).length
            const total = lesson.checks.length + (lesson.setup?.length ?? 0)
            return <Fragment key={lesson.id}>{lesson.id === 'start' && <div className="nav-group">Before the workshop · self-paced</div>}{lesson.id === 'product' && <div className="nav-group">Live workshop · 09:00–12:30</div>}<a href={`#${lesson.id}`} aria-current={page === lesson.id ? 'page' : undefined}><span className="nav-number">{count === total ? '✓' : lesson.number}</span><span>{lesson.title}<small>{prework.some(item => item.id === lesson.id) ? 'Before the workshop · 0 live minutes' : `${lesson.minutes} live minutes`}</small></span></a></Fragment>
          })}
          <a href="#lab" aria-current={page === 'lab' ? 'page' : undefined}><span>◇</span>Report Studio lab</a><a href="#resources" aria-current={page === 'resources' ? 'page' : undefined}><span>＋</span>Resources and troubleshooting</a>
        </nav>
        <div className="progress-box"><div><strong>My progress</strong><span>{progress}%</span></div><progress value={saved.checked.length} max={checkIds.size} aria-label="Self-reported workshop progress" /><p>{saved.checked.length} of {checkIds.size} checkpoints · pre-work and live work · this browser</p><button type="button" onClick={exportProgress}>Export progress</button></div>
        <div className="discussion-note"><span className="eyebrow">PROTECTED TIME</span><strong>12:00–12:30</strong><span>Stop building. Make time for discussion.</span></div>
      </aside>
      <main id="main" className="main-content" ref={heading} tabIndex={-1}>
        <div className="print-only print-heading"><div className="print-brand"><img className="brand-mark" src={logoUrl} alt="HVE Squad logo" width="48" height="48" /><strong>onepoint · From data to reports, with HVE Squad</strong></div><p>17 September 2026 · 09:00–12:30 CEST · Discussion 12:00–12:30</p><PreworkPanel /><LiveAgenda /></div>
        <div className="content-toolbar">
          <div className="segmented" role="tablist" aria-label="Copilot client">{(['app', 'cli'] as const).map(value => <button type="button" role="tab" id={`experience-${value}`} key={value} aria-selected={saved.settings.experience === value} aria-controls="experience-panel" tabIndex={saved.settings.experience === value ? 0 : -1} onClick={() => updateSetting('experience', value)} onKeyDown={event => {
            const next = event.key === 'Home' ? 'app' : event.key === 'End' ? 'cli' : ['ArrowLeft', 'ArrowRight'].includes(event.key) ? (value === 'app' ? 'cli' : 'app') : undefined
            if (next) { event.preventDefault(); updateSetting('experience', next); document.getElementById(`experience-${next}`)?.focus() }
          }}>{value === 'cli' ? 'Copilot CLI' : 'Copilot App'}</button>)}</div>
          <div><button type="button" aria-pressed={focusMode} onClick={() => setFocusMode(!focusMode)}>{focusMode ? 'Show navigation' : 'Focus mode'}</button><button type="button" onClick={() => window.print()}>Print the guide</button></div>
        </div>
        <section className="experience-panel" id="experience-panel" role="tabpanel" aria-labelledby={`experience-${saved.settings.experience}`} tabIndex={0}>
          {page === 'prepare' ? <div><span className="eyebrow">PREPARE THE PROJECT FIRST</span><h2>Repository → knowledge-docs → installation</h2><p>Place the scoping document in your project before installing APM resources or both paired plug-ins.</p><p className="small">The tabs select your client. Agent selection comes after preparation and installation.</p></div> :
            <div><span className="eyebrow">SELECT THE AGENT, NOT A SKILL</span><h2>{selection.name}</h2><p>{selection.instruction}</p><p className="small">Look for: <code>{selection.identifier}</code>. Labels may vary by client and version. Then paste the request in that agent’s conversation, in your participant repository.</p></div>}
          {page !== 'prepare' && saved.settings.experience === 'cli' && <button type="button" onClick={() => copy('/agent')}>Copy /agent</button>}
        </section>
        {storageError && <div className="notice warning" role="alert">{storageError}<button type="button" onClick={() => setResetOpen(true)}>Review reset options</button></div>}
        <div className="status" role="status" aria-live="polite">{status}</div>
        {page === 'overview' ? <div className="overview">
          <section className="hero"><div className="eyebrow">HANDS-ON WORKSHOP · THURSDAY 17 SEPTEMBER</div><h1>From data to reports, <br /><em>with HVE Squad</em></h1><p className="lead">Hands-on workshop: scope and start an Office add-in</p><p>Express the need, review decisions and retain evidence — from Word to PowerPoint, with Fabric and Power BI as the eventual target.</p><div className="hero-actions"><a className="button primary" href={`#${firstPrework?.id ?? 'product'}`}>{firstPrework ? `Begin pre-work · Part ${firstPrework.number} →` : 'Ready — start Part 03 at 09:00 →'}</a><a className="button" href={firstPrework ? '#product' : '#start'}>{firstPrework ? 'Already ready? Start Part 03 at 09:00' : 'Review the pre-work'}</a></div><div className="hero-meta"><span><strong>09:00–12:30</strong>210 live minutes, including break</span><span><strong>30 minutes</strong>of protected final discussion</span><span><strong>Before Thursday</strong>Parts 01–02 · self-paced</span></div></section>
          <PreworkPanel />
          <section className="method-note"><h2>Set up first. Request work next.</h2><p><strong>planning init → confirm → product work → promote → confirm → delivery init → confirm → implementation.</strong></p><p>Business requests name the outcome, not roles or internal procedures. You remain responsible for decisions. Guide checkboxes record your self-reports; they execute and authorize nothing.</p></section>
          <section className="journey-panel"><div className="section-heading"><h2>One continuous live journey</h2><span className="badge">LEARN THE METHOD</span></div><div className="journey"><div><span>03</span><strong>Scope</strong><small>BRD · PRD · MVE</small></div><span className="arrow">→</span><div><span>04</span><strong>Federate</strong><small>Planning + delivery</small></div><span className="arrow">→</span><div><span>05</span><strong>Test</strong><small>Office · synthetic data</small></div><span className="arrow">→</span><div><span>06–07</span><strong>Resume + discuss</strong><small>Evidence · next action</small></div></div></section>
          <div className="overview-grid"><LiveAgenda />
            <section className="outcome-card"><span className="eyebrow">THE REAL EXPECTED OUTCOME</span><h2>Be able to repeat it<br />independently.</h2><p>You do not need to finish the entire application: learn to scope, confirm, review, hand off and resume.</p><ul><li>Two targets: Word and PowerPoint.</li><li>A first slice to agree.</li><li>Entirely synthetic local data.</li><li>A distinction between generated, tested and not executed.</li></ul><div className="inset"><strong>MVE ≠ MVP</strong><p>A minimum experiment tests an uncertainty. An unexecuted experiment has no result.</p></div></section></div>
          <section className="privacy-note"><h3>Report Studio: a generic scenario, not a private brief.</h3><p>{lab.status}. The <a href="#lab">lab</a> provides synthetic data and proposed criteria. An authorized scoping document stays in <code>knowledge-docs</code> at the participant repository root. The guide performs no uploads, integrations or publication.</p></section>
        </div> : active ? renderLesson(active) : page === 'lab' ? <Lab /> : page === 'resources' ? <article className="resources">
          <div className="eyebrow">MAKE PROGRESS WITHOUT INVENTING</div><h1>Resources and troubleshooting</h1><p className="lead">Context stays local. Evidence stays honest.</p><PreworkPanel /><LiveAgenda /><DownloadPanel />
          <section><h2>When something blocks progress</h2>{troubleshooting.map(([title, body]) => <details key={title}><summary>{title}</summary><p>{body}</p></details>)}</section>
          <section><h2>References to check in your environment</h2><p>HVE Squad v{baseline} is the Qubix rehearsal baseline. Confirm installed versions for Onepoint. This journey selects the agent through the App list or CLI /agent, then uses a natural business request. Other documented entry points are not used in this exercise.</p><ul className="source-list">{sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a></li>)}</ul><p className="small">The sequence, synthetic case and requests are English teaching adaptations. MVE concepts are paraphrased from HVE Core (CC BY 4.0). The unmodified HVE Squad logo is MIT licensed, copyright (c) 2026 Peter-N91. Logo and green/blue theme match the Qubix workshop, including its light and print variants.</p><details><summary>Logo attribution and MIT license</summary><pre className="brand-notice">{brandNotice}</pre></details></section>
          <section><h2>This browser’s data</h2><p>Progress and reported versions are kept locally, without synchronization, telemetry or delivery to the facilitator. This is not a workstation inspection tool. The export includes these settings and all seven parts, including the untimed pre-work; review it before sharing. Existing checkpoint IDs and export schema are unchanged. For a local HTML file, persistence may vary by browser: prefer export.</p><p>{saved.checked.length} of {checkIds.size} checkpoints reported ({progress}%).</p><button type="button" onClick={exportProgress}>Export progress</button><button type="button" className="danger" onClick={() => setResetOpen(true)}>Reset local data</button></section>
        </article> : <section><h1>Step not found</h1><p>This link does not match any step in the journey.</p><a href="#overview">Return to overview</a></section>}
        {active && <nav className="lesson-navigation" aria-label="Previous and next steps"><a href={`#${previousLesson?.id ?? 'overview'}`}>← {previousLesson?.title ?? 'Overview'}</a><a className="button primary" href={`#${nextLesson?.id ?? 'resources'}`}>{active.id === 'prepare' ? 'Ready — start Part 03 at 09:00' : nextLesson?.title ?? 'Resources and troubleshooting'} →</a></nav>}
        {lessons.map(lesson => renderLesson(lesson, true))}<Lab printOnly />
        <section className="print-only print-sources"><h2>Sources and materials</h2><p>The four synthetic or blank materials are available under Resources in the interactive guide. Parts 01–02 are self-paced before the workshop; Parts 03–07 and the break occupy 210 live minutes. This printout does not attest execution.</p><ul>{sources.map(source => <li key={source.url}>{source.name}: {source.url}</li>)}</ul><h3>Logo attribution and MIT license</h3><pre className="brand-notice">{brandNotice}</pre></section>
        <footer><span>onepoint · HVE Squad hands-on workshop</span><span>17 September 2026 · Rehearsal baseline v{baseline}, versions to confirm</span></footer>
      </main>
    </div>
    <dialog ref={resetDialog} className="reset-dialog" aria-labelledby="reset-title" onCancel={() => setResetOpen(false)} onClose={() => setResetOpen(false)}><h2 id="reset-title">Reset this workshop’s data?</h2><p>Only this workshop’s checked items and settings in this browser will be removed. No repository, team or document will change. Export first if needed.</p><button autoFocus type="button" onClick={() => setResetOpen(false)}>Keep my data</button><button type="button" className="danger" onClick={() => {
      try { localStorage.removeItem(storageKey); setSaved({ schema: 1, checked: [], settings: { ...defaults } }); setStorageError(''); setStatus('This workshop’s local data has been reset.'); setResetOpen(false) }
      catch { setStatus('Unable to reset: browser storage is inaccessible. Your data has not been replaced.'); setResetOpen(false) }
    }}>Reset this workshop</button></dialog>
  </div>
}
export default App
