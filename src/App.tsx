import { createContext, Fragment, useContext, useEffect, useRef, useState } from 'react'
import { lessons as canonicalLessons, lifecycleSteps as canonicalSteps } from './content'
import type { Lesson, LessonStep, Prompt } from './content'
import { agentSelection, clients, decodeState, defaults, missingSetup, modes, nextClient, renderPrompt, setupCheckId, storageKey, toggleCheckpoint } from './state'
import type { SavedState, Settings } from './state'
import { content } from './locales'
import { isLocale, localeNames, numberLocales, StateError, stateErrorText } from './language'
import type { Locale, StateErrorCode } from './language'
import { translator } from './ui'
import type { UIKey } from './ui'
import { localizedDownloads, fixtures } from './downloads'
import { previewReport } from './report'
import brandNotice from '../public/THIRD-PARTY-NOTICES.txt?raw'

const logoUrl = `${import.meta.env.BASE_URL}hve-squad-logo.svg`
const LocaleContext = createContext<Locale>('en')
function useWorkshop() {
  const locale = useContext(LocaleContext)
  return { locale, t: translator(locale), ...content[locale] }
}
function PreworkPanel() {
  const { t, prework } = useWorkshop()
  return <section className="prework-panel" aria-label={t('prework')}>
    <div className="section-heading"><h2>{t('prework')}</h2><span className="badge">{t('preworkBadge')}</span></div>
    <p>{t('preworkIntro')}</p>
    <div className="download-grid">{prework.map(item => <div className="prework-card" key={item.id}>
      <p className="small">{item.time} · {item.minutes} {t('liveMinutes')}</p>
      <h3><a href={`#${item.id}`}>{item.number} · {item.title}</a></h3><p>{item.output}.</p>
    </div>)}</div>
  </section>
}
function LiveAgenda() {
  const { t, agenda, lessons } = useWorkshop()
  return <section className="agenda-card" aria-label={t('agenda')}>
    <div className="section-heading"><h2>{t('agenda')}</h2><span className="small">210 minutes · CEST</span></div>
    {agenda.map(item => <div className={item.lesson === 'discussion' ? 'agenda-row protected' : 'agenda-row'} key={item.time}>
      <span className="agenda-time">{item.time}<small>{item.end}</small></span>
      {item.lesson ? <a href={`#${item.lesson}`}>{lessons.find(lesson => lesson.id === item.lesson)?.number} · {item.title}</a> : <span>{item.title}</span>}
      <span className="duration">{item.minutes} min</span>
    </div>)}
    <p className="small">{t('agendaNote')}</p>
  </section>
}
const checkIds = new Set([
  ...canonicalLessons.flatMap(lesson => lesson.checks.map((_, index) => `${lesson.id}-${index}`)),
  ...canonicalSteps.map(step => setupCheckId(step.id)),
])
type StorageProblem = { kind: 'load' | 'save'; code?: StateErrorCode; detail?: string } | null
function readInitial(): { data: SavedState; error: StorageProblem; invalidUrl: boolean } {
  const lang = new URLSearchParams(window.location.search).get('lang')
  const invalidUrl = lang !== null && !isLocale(lang)
  let data: SavedState
  let error: StorageProblem = null
  try {
    data = decodeState(localStorage.getItem(storageKey))
    data.checked = data.checked.filter(id => checkIds.has(id))
  } catch (cause) {
    data = { schema: 1, checked: [], settings: { ...defaults } }
    error = { kind: 'load', ...(cause instanceof StateError ? { code: cause.code, detail: cause.detail } : {}) }
  }
  if (lang !== null) data.settings.locale = isLocale(lang) ? lang : 'en'
  return { data, error, invalidUrl }
}
function download(name: string, value: string, type: string) {
  const url = URL.createObjectURL(new Blob([value], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function DownloadPanel() {
  const { t, locale } = useWorkshop()
  return <section className="resource-downloads">
    <h2>{t('materials')}</h2><p>{t('materialsIntro')}</p>
    <div className="download-grid">{localizedDownloads[locale].map(item => <div className="download-card" key={item.name}>
      <h3>{item.title}</h3><p>{item.description}</p>
      <button type="button" data-download={item.name} onClick={() => download(item.name, item.content, item.type)}>{t('download')} · {item.name.endsWith('json') ? 'JSON' : 'TXT'}<span className="sr-only">: {item.title}</span></button>
    </div>)}</div>
  </section>
}
function Lab({ printOnly = false }: { printOnly?: boolean }) {
  const { t, locale, lab, architecture } = useWorkshop()
  const fixture = fixtures[locale]
  const [selected, setSelected] = useState('2026-07')
  const report = previewReport(fixture, selected, locale)
  return <article className={printOnly ? 'resources print-only' : 'resources'} aria-label={t('lab')}>
    <div className="eyebrow">{t('synthetic')}</div><h1>Report Studio</h1><p className="lead">{t('labLead')}</p>
    <div className="notice"><strong>{lab.status}.</strong><p>{t('labDisclaimer')}</p></div>
    <section className="lab-slice"><h2>{t('firstSlice')}</h2><p>{lab.firstSlice}</p><p>{lab.extension}</p><h3>{t('mve')}</h3><p>{lab.mve}</p></section>
    <section className="fixture-panel">
      <div className="section-heading"><h2>{t('exploreContract')}</h2><span className="badge">{t('simulation')}</span></div>
      <label className="fixture-select">{t('previewScenario')}
        <select value={selected} onChange={event => setSelected(event.target.value)}>
          <optgroup label={t('nominal')}>{fixture.periods.map(period => <option key={period.id} value={period.id}>{period.label}</option>)}</optgroup>
          <optgroup label={t('negative')}>{fixture.negativeCases.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</optgroup>
        </select>
      </label>
      <div className="report-preview" aria-live="polite">
        <h3>{report.title}</h3><p>{fixture.scope}</p>
        {report.rows.length > 0 && <div className="table-scroll"><table><caption>{t('tableCaption')}</caption><thead><tr><th scope="col">{t('indicator')}</th><th scope="col">{t('value')}</th><th scope="col">{t('unit')}</th></tr></thead><tbody>
          {report.rows.map(row => <tr key={row.id}><th scope="row">{row.label}</th><td>{row.value == null || !Number.isFinite(row.value) ? t('unavailable') : new Intl.NumberFormat(numberLocales[locale], { maximumFractionDigits: 1 }).format(row.value)}</td><td>{row.unit}</td></tr>)}
        </tbody></table></div>}
        {report.errors.length > 0 && <div className="notice warning"><strong>{t('blockInsertion')}</strong><ul>{report.errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
        <p className="small">{fixture.source} · {t('reference')}: {fixture.referenceDate} · {t('template')}: {fixture.modelVersion}</p>
        <p>{report.expected ?? t('expected')}</p>
      </div><p className="small">{t('variants')}</p>
    </section>
    <section><h2>{t('criteria')}</h2><ol>{lab.acceptance.map(item => <li key={item}>{item}</li>)}</ol><p className="small">{t('criteriaNote')}</p></section>
    <section><h2>{t('technical')}</h2>{architecture.map((item, index) => <div className="architecture-row" key={index}><span className="step-index">{index + 1}</span><p>{item}</p></div>)}</section>
    <section><h2>{t('outsideScope')}</h2><ul>{lab.outOfScope.map(item => <li key={item}>{item}</li>)}</ul></section><DownloadPanel />
  </article>
}
function App() {
  const [initial] = useState(readInitial)
  const [invalidUrlLanguage, setInvalidUrlLanguage] = useState(initial.invalidUrl)
  const [saved, setSaved] = useState(initial.data)
  const [storageError, setStorageError] = useState<StorageProblem>(initial.error)
  const [status, setStatus] = useState<UIKey | ''>('')
  const [page, setPage] = useState(() => window.location.hash.slice(1) || 'overview')
  const [setupOpen, setSetupOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')
  const heading = useRef<HTMLDivElement>(null)
  const resetDialog = useRef<HTMLDialogElement>(null)
  const { locale } = saved.settings
  const t = translator(locale)
  const { lessons, lifecycleSteps, prework, lab, sources, troubleshooting, installation, pdfReadiness, observationNote } = content[locale]
  useEffect(() => {
    const handle = () => { setPage(window.location.hash.slice(1) || 'overview'); setMenuOpen(false); setStatus('') }
    window.addEventListener('hashchange', handle)
    return () => window.removeEventListener('hashchange', handle)
  }, [])
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }) }, [page])
  useEffect(() => { if (resetOpen) resetDialog.current?.showModal(); else resetDialog.current?.close() }, [resetOpen])
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    document.documentElement.lang = locale
    document.title = `onepoint | ${translator(locale)('title')}`
  }, [locale])
  const active = lessons.find(lesson => lesson.id === page)
  const selection = agentSelection(active?.launch?.entry ?? (['federation', 'implementation', 'resume'].includes(page) ? 'squad-federation' : 'squad'), saved.settings)
  const progress = Math.round(saved.checked.length / checkIds.size * 100)
  const firstPrework = prework.find(item => lessons.find(lesson => lesson.id === item.id)!.checks.some((_, index) => !saved.checked.includes(`${item.id}-${index}`)))
  function updateSaved(next: SavedState) {
    setSaved(next)
    if (storageError) return
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { setStorageError({ kind: 'save' }) }
  }
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    updateSaved({ ...saved, settings: { ...saved.settings, [key]: value } })
    if (key === 'locale') {
      setInvalidUrlLanguage(false)
      // Once the reader chooses a language, an opening URL override must not undo it on reload.
      const url = new URL(window.location.href)
      if (url.searchParams.has('lang')) { url.searchParams.delete('lang'); window.history.replaceState(null, '', url) }
    }
  }
  const toggleCheck = (id: string) => updateSaved({ ...saved, checked: toggleCheckpoint(id, saved.checked) })
  const exportProgress = () => download(`onepoint-progress-2026-09-17${locale === 'fr' ? '-fr' : ''}.json`, JSON.stringify({ ...saved, page, storageKey }, null, 2), 'application/json')
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setStatus('copied') }
    catch { setStatus('clipboardError') }
  }
  function renderPromptBlock(prompt: Prompt) {
    const pending = missingSetup(prompt, saved.checked).map(step => lifecycleSteps.find(local => local.id === step.id)!)
    const rendered = renderPrompt(prompt, saved.settings)
    return <div className="prompt-block" data-prompt-kind={prompt.shell ? 'shell' : prompt.lifecycle ?? (prompt.businessMode ? 'business' : 'read-only')}>
      <div className="prompt-toolbar"><span>{t(prompt.shell ? 'shell' : prompt.lifecycle ? 'lifecycle' : 'business')}</span>
        <button type="button" aria-label={`${t('copy')}: ${prompt.title}`} disabled={pending.length > 0} onClick={() => copy(rendered)}>{t('copy')}</button></div>
      <h4>{prompt.title}</h4>
      {!prompt.shell && <p className="agent-hint">{agentSelection(prompt.entry, saved.settings).instruction} {saved.settings.experience !== 'vscode' && t('pasteOnly')}</p>}
      <pre tabIndex={0}><code>{rendered}</code></pre>
      {pending.length > 0 && <div className="prompt-warning">{t('confirmSteps')}<ul>{pending.map(step => <li key={step.id}><a href={`#${step.lessonId}`}>{step.title}</a></li>)}</ul><span>{t('locked')}</span></div>}
    </div>
  }
  function renderExercise(step: LessonStep, index: number) {
    return <div className="exercise" key={index}><div className="step-index">{String(index + 1).padStart(2, '0')}</div><div><h2>{step.title}</h2><p>{step.body}</p>{step.prompt && renderPromptBlock(step.prompt)}</div></div>
  }
  function renderVscodeReference() {
    return <details className="vscode-reference"><summary>{t('parameters')}</summary><p>{t('parametersNote')}</p><ul>{(['paramRequest', 'paramSquad', 'paramProfile', 'paramPack', 'paramDiscovery', 'paramTier', 'paramOwner'] as const).map(key => <li key={key}>{t(key)}</li>)}</ul><ul>{sources.slice(11).map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.name}</a></li>)}</ul></details>
  }
  function renderVscodeInstall() {
    return <div className="vscode-install"><h3>{t('vscodeInstall')}</h3><p>{t('vscodeInstallNote')}</p><p className="notice warning">{t('duplicateWarning')}</p>{renderPromptBlock(installation.apm)}</div>
  }
  function renderLesson(lesson: Lesson, printOnly = false) {
    return <article key={lesson.id} className={printOnly ? 'lesson print-only' : 'lesson'} aria-label={lesson.title}>
      <div className="eyebrow">{lesson.eyebrow} <span>/</span> {lesson.time} · {lesson.minutes} {t('liveMinutes')}</div>
      <div className="lesson-title"><span className="big-number">{lesson.number}</span><h1>{lesson.title}</h1></div>
      {prework.some(item => item.id === lesson.id) && <p className="small">{t('selfPaced')} <a href="#product">{t('startLive')}</a></p>}
      <p className="lead">{lesson.goal}</p><div className="concept"><strong>{t('keyIdea')}</strong><p>{lesson.concept}</p></div>
      <section className="inputs"><h2>{t('inputs')}</h2><ul>{lesson.inputs.map(input => <li key={input}>{input}</li>)}</ul></section>
      {lesson.beforeInstall && <section className="before-install" aria-label={t('beforeInstall')}>
        <div className="section-caption">{t('beforeEither')}</div>{lesson.beforeInstall.map(renderExercise)}
        <div className="repo-layout"><h3>{t('yourRepo')}</h3><pre><code>{'onepoint-workshop-project\\\n  .git\\\n  .gitignore\n  knowledge-docs\\\n    report-studio-exercise-brief.txt'}</code></pre><p className="small">{t('repoNote')} <a href="#resources">{t('resources')}</a></p></div>
      </section>}
      {lesson.setup && <section className="lifecycle-list" aria-label={t('setupBeforeWork')}>
        <div className="eyebrow">{t('setupCaption')}</div><p className="small">{t('lifecycleNote')}</p>
        {lesson.setup.map(step => <section className="lifecycle-step" data-setup-id={step.id} key={step.id}>
          <h2>{step.title}</h2><p>{step.description}</p>{renderPromptBlock(step.request)}
          <h3>{t('outcomeCheck')}</h3><ul>{step.expected.map(result => <li key={result}>{result}</li>)}</ul>
          <label className="check-row setup-check"><input type="checkbox" checked={saved.checked.includes(setupCheckId(step.id))} disabled={missingSetup(step.request, saved.checked).length > 0} onChange={() => toggleCheck(setupCheckId(step.id))} /><span>{step.checkpoint}</span></label><p className="small">{t('setupSelfReport')}</p>
        </section>)}
      </section>}
      {lesson.launch && <section className="phase-launch" aria-label={t('separateRequest')}>
        <span className="eyebrow">{t('outcomeCaption')}</span><h2>{t(lesson.id === 'product' ? 'requestPlanning' : 'requestImplementation')}</h2>
        <p>{lesson.launchHint}</p>{renderPromptBlock(lesson.launch)}
      </section>}
      {lesson.behaviors && <section className="behavior-panel"><span className="eyebrow">{t('observeCaption')}</span><h2>{t('behaviors')}</h2><ul>{lesson.behaviors.map(behavior => <li key={behavior}>{behavior}</li>)}</ul><p className="small">{observationNote}</p></section>}
      {lesson.id === 'prepare' && <>
        <section className="install-panel">
          <h2>{t('installTitle')}</h2><p>{t('installIntro')}</p>
          {saved.settings.experience === 'vscode' ? renderVscodeInstall() : <>
            <div className="segmented" aria-label={t('installMethod')}>{(['plugin', 'apm'] as const).map(value => <button type="button" key={value} aria-pressed={saved.settings.install === value} onClick={() => updateSetting('install', value)}>{t(value)}</button>)}</div>
            <p>{t(saved.settings.install === 'plugin' ? 'pluginNote' : 'apmNote')}</p>
            {saved.settings.install === 'plugin' && saved.settings.experience === 'app' ?
              <div className="app-install"><h3>{t('appInstall')}</h3><ol><li>{t('appFind')}</li><li>{t('appPair')}</li><li>{t('appCheck')}</li></ol><p>{t('appLabels')} <a href={sources[2].url} target="_blank" rel="noreferrer">{t('appGuide')}</a></p></div> : renderPromptBlock(installation[saved.settings.install])}
          </>}
          <details><summary>{t('pairing')}</summary><p>{t('pairingNote')}</p></details>
          <details><summary>{t('tools')}</summary><p>{t('toolsNote')}</p><p><a href={sources[8].url} target="_blank" rel="noreferrer">{t('cliPrerequisites')}</a> · <a href={sources[9].url} target="_blank" rel="noreferrer">{t('apmQuickstart')}</a>. {t('toolsConsent')}</p></details>
        </section>
        <section className="pdf-readiness install-panel"><span className="eyebrow">{t('actualClient')}</span><h2>{pdfReadiness.title}</h2><p>{pdfReadiness.requirement}</p><h3>{t('pythonConditional')}</h3><p>{pdfReadiness.python}</p>
          <details><summary>{t('optionalReader')}</summary><p>{t('readerNote')}</p>{renderPromptBlock(pdfReadiness.setup)}</details><h3>{t('protectedDocument')}</h3><p>{pdfReadiness.fallback}</p>
        </section>
      </>}
      {['product', 'federation', 'implementation'].includes(lesson.id) && <aside className="lab-link"><strong>{lab.status}.</strong><p><a href="#lab">{t('labLink')}</a></p></aside>}
      <section className="exercise-list" aria-label={t('exercises')}><div className="section-caption">{t(lesson.launch ? 'reviewCaption' : 'prepareCaption')}</div>{lesson.steps.map(renderExercise)}</section>
      <div className="checkpoint-grid"><section className="evidence-card"><span className="eyebrow">{t('deliverables')}</span><h2>{t('evidence')}</h2><ul>{lesson.evidence.map(item => <li key={item}>{item}</li>)}</ul></section>
        <section className="check-card"><span className="eyebrow">{t('checkpoint')}</span><h2>{t('showIt')}</h2>{lesson.checks.map((item, index) => <label className="check-row" key={index}><input type="checkbox" data-check-id={`${lesson.id}-${index}`} checked={saved.checked.includes(`${lesson.id}-${index}`)} onChange={() => toggleCheck(`${lesson.id}-${index}`)} /><span>{item}</span></label>)}<p className="small">{t('selfReport')}</p></section></div>
      <aside className="recovery"><h3>{t('blocked')}</h3><p>{lesson.recovery}</p></aside>
    </article>
  }
  const nextLesson = active ? lessons[lessons.indexOf(active) + 1] : undefined
  const previousLesson = active ? lessons[lessons.indexOf(active) - 1] : undefined
  const settingsFields = [
    ['clientVersion', 'clientVersion', 'usedVersion'],
    ['squadVersion', 'squadVersion', 'checkedRevision'],
    ['coreVersion', 'coreVersion', 'checkedVersion'],
    ['officeVersion', 'officeVersion', 'verifiedSupport'],
  ] as const
  return <LocaleContext.Provider value={locale}><div className={focusMode ? 'app focus-mode' : 'app'}>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); heading.current?.focus(); heading.current?.scrollIntoView() }}>{t('skip')}</a>
    <header className="topbar">
      <a className="brand" href="#overview"><img className="brand-mark" src={logoUrl} alt="" width="48" height="48" /><span>HVE SQUAD<span className="brand-sub">{t('guide')}</span></span></a>
      <div className="event-label">onepoint <span>{t('date')} · CEST</span></div>
      <div className="header-actions">
        <label className="language-select"><span className="sr-only">{t('language')}</span><select data-testid="language" value={locale} onChange={event => { if (isLocale(event.target.value)) updateSetting('locale', event.target.value) }}>{Object.entries(localeNames).map(([value, name]) => <option key={value} value={value} lang={value}>{name}</option>)}</select></label>
        <button type="button" aria-expanded={setupOpen} onClick={() => setSetupOpen(!setupOpen)}>{t('workstation')}</button><button type="button" aria-label={t(theme === 'light' ? 'enableDark' : 'enableLight')} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{t(theme === 'light' ? 'dark' : 'light')}</button><button className="mobile-menu" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{t('journey')}</button>
      </div>
    </header>
    {setupOpen && <section className="session-setup" aria-label={t('workstation')}><div className="setup-heading"><div><h2>{t('environment')}</h2><p>{t('environmentPrivacy')}</p></div><button type="button" onClick={() => setSetupOpen(false)}>{t('close')}</button></div><div className="settings-grid">{settingsFields.map(([key, label, placeholder]) => <label key={key}>{t(label)}<input value={saved.settings[key]} maxLength={300} placeholder={t(placeholder)} onChange={event => updateSetting(key, event.target.value)} /></label>)}</div><p className="small">{t('environmentNote')}</p></section>}
    <div className="shell">
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'} aria-label={t('navigation')}><div className="sidebar-heading">{t('learningJourney')}</div>
        <nav><a href="#overview" aria-current={page === 'overview' ? 'page' : undefined} className="overview-link"><span>↗</span>{t('overview')}</a>
          {lessons.map(lesson => {
            const count = lesson.checks.filter((_, index) => saved.checked.includes(`${lesson.id}-${index}`)).length + (lesson.setup ?? []).filter(step => saved.checked.includes(setupCheckId(step.id))).length
            const total = lesson.checks.length + (lesson.setup?.length ?? 0)
            return <Fragment key={lesson.id}>{lesson.id === 'start' && <div className="nav-group">{t('navPrework')}</div>}{lesson.id === 'product' && <div className="nav-group">{t('navLive')}</div>}<a href={`#${lesson.id}`} aria-current={page === lesson.id ? 'page' : undefined}><span className="nav-number">{count === total ? '✓' : lesson.number}</span><span>{lesson.title}<small>{prework.some(item => item.id === lesson.id) ? t('preworkZero') : `${lesson.minutes} ${t('liveMinutes')}`}</small></span></a></Fragment>
          })}
          <a href="#lab" aria-current={page === 'lab' ? 'page' : undefined}><span>◇</span>{t('lab')}</a><a href="#resources" aria-current={page === 'resources' ? 'page' : undefined}><span>＋</span>{t('resources')}</a>
        </nav>
        <div className="progress-box"><div><strong>{t('progress')}</strong><span>{progress}%</span></div><progress value={saved.checked.length} max={checkIds.size} aria-label={t('progressAria')} /><p>{saved.checked.length} {t('of')} {checkIds.size} {t('checkpoints')}</p><button type="button" onClick={exportProgress}>{t('export')}</button></div>
        <div className="discussion-note"><span className="eyebrow">{t('protectedTime')}</span><strong>12:00–12:30</strong><span>{t('stopBuilding')}</span></div>
      </aside>
      <main id="main" className="main-content" ref={heading} tabIndex={-1}>
        <div className="print-only print-heading"><div className="print-brand"><img className="brand-mark" src={logoUrl} alt={t('logo')} width="48" height="48" /><strong>onepoint · {t('title')}</strong></div><p>{t('date')} · 09:00–12:30 CEST · Discussion 12:00–12:30</p><p>{localeNames[locale]} · {saved.settings.experience === 'vscode' ? 'VS Code' : saved.settings.experience === 'cli' ? 'Copilot CLI' : 'Copilot App'}{saved.settings.experience === 'vscode' ? ` · ${t(saved.settings.mode)}` : ''}</p><PreworkPanel /><LiveAgenda /></div>
        <div className="content-toolbar">
          <div className="segmented" role="tablist" aria-label={t('client')}>{clients.map(value => <button type="button" role="tab" id={`experience-${value}`} key={value} aria-selected={saved.settings.experience === value} aria-controls="experience-panel" tabIndex={saved.settings.experience === value ? 0 : -1} onClick={() => updateSetting('experience', value)} onKeyDown={event => {
            const next = nextClient(value, event.key)
            if (next) { event.preventDefault(); updateSetting('experience', next); document.getElementById(`experience-${next}`)?.focus() }
          }}>{value === 'vscode' ? 'VS Code' : value === 'cli' ? 'Copilot CLI' : 'Copilot App'}</button>)}</div>
          <div><button type="button" aria-pressed={focusMode} onClick={() => setFocusMode(!focusMode)}>{t(focusMode ? 'showNavigation' : 'focus')}</button><button type="button" onClick={() => window.print()}>{t('print')}</button></div>
        </div>
        <section className="experience-panel" id="experience-panel" role="tabpanel" aria-labelledby={`experience-${saved.settings.experience}`} tabIndex={0}>
          {saved.settings.experience === 'vscode' ? <div className="vscode-panel">
            <span className="eyebrow">{t('vscodeCaption')}</span><h2>{selection.identifier}</h2><p>{selection.instruction}</p><p>{t('vscodeUse')}</p><a href="#prepare">{t('installSequence')}</a>
            <label className="mode-select">{t('businessMode')}<select data-testid="business-mode" value={saved.settings.mode} onChange={event => { const value = event.target.value; if (value === 'interactive' || value === 'autonomous' || value === 'autopilot') updateSetting('mode', value) }}>{modes.map(mode => <option value={mode} key={mode}>{t(mode)}</option>)}</select></label>
            <p className="small">{t('modeScope')}</p>{saved.settings.mode === 'autopilot' && <p className="notice warning">{t('autopilotWarning')}</p>}
            <details><summary>{t('modeSummary')}</summary><p>{t('modeNote')}</p><p>{t('autopilotWarning')}</p></details>{renderVscodeReference()}
          </div> : page === 'prepare' ? <div><span className="eyebrow">{t('prepareProject')}</span><h2>{t('installSequence')}</h2><p>{t('installSequenceNote')}</p><p className="small">{t('tabsNote')}</p></div> :
            <div><span className="eyebrow">{t('selectAgent')}</span><h2>{selection.name}</h2><p>{selection.instruction}</p><p className="small">{t('lookFor')}: <code>{selection.identifier}</code>. {t('labelsNote')}</p></div>}
          {page !== 'prepare' && saved.settings.experience === 'cli' && <button type="button" onClick={() => copy('/agent')}>{t('copy')} /agent</button>}
        </section>
        {invalidUrlLanguage && <p className="notice">{t('urlLanguage')}</p>}
        {storageError && <div className="notice warning" role="alert">{t(storageError.kind === 'load' ? 'loadError' : 'saveError')}{storageError.code && <p>{stateErrorText(storageError.code, locale, storageError.detail)}</p>}<button type="button" onClick={() => setResetOpen(true)}>{t('reviewReset')}</button></div>}
        <div className="status" role="status" aria-live="polite">{status && t(status)}</div>
        {page === 'overview' ? <div className="overview">
          <section className="hero"><div className="eyebrow">{t('heroEyebrow')}</div><h1>{t('titleFirst')}<br /><em>{t('titleLast')}</em></h1><p className="lead">{t('subtitle')}</p><p>{t('heroIntro')}</p><div className="hero-actions"><a className="button primary" href={`#${firstPrework?.id ?? 'product'}`}>{firstPrework ? `${t('beginPrework')} ${firstPrework.number}` : t('ready')} →</a><a className="button" href={firstPrework ? '#product' : '#start'}>{t(firstPrework ? 'alreadyReady' : 'reviewPrework')}</a></div><div className="hero-meta"><span><strong>09:00–12:30</strong>{t('totalMinutes')}</span><span><strong>30 minutes</strong>{t('finalDiscussion')}</span><span><strong>{t('beforeThursday')}</strong>{t('partsPrework')}</span></div></section>
          <PreworkPanel />
          <section className="method-note"><h2>{t('methodTitle')}</h2><p><strong>{t('sequence')}</strong></p><p>{t('methodNote')}</p></section>
          <section className="journey-panel"><div className="section-heading"><h2>{t('continuous')}</h2><span className="badge">{t('learnMethod')}</span></div><div className="journey"><div><span>03</span><strong>{t('scope')}</strong><small>BRD · PRD · MVE</small></div><span className="arrow">→</span><div><span>04</span><strong>{t('federate')}</strong><small>{t('planningDelivery')}</small></div><span className="arrow">→</span><div><span>05</span><strong>{t('test')}</strong><small>{t('officeSynthetic')}</small></div><span className="arrow">→</span><div><span>06–07</span><strong>{t('resumeDiscuss')}</strong><small>{t('evidenceNext')}</small></div></div></section>
          <div className="overview-grid"><LiveAgenda /><section className="outcome-card"><span className="eyebrow">{t('realOutcome')}</span><h2>{t('repeat')}</h2><p>{t('repeatNote')}</p><ul>{(['twoTargets', 'sliceAgree', 'syntheticLocal', 'distinction'] as const).map(key => <li key={key}>{t(key)}</li>)}</ul><div className="inset"><strong>MVE ≠ MVP</strong><p>{t('experimentNote')}</p></div></section></div>
          <section className="privacy-note"><h3>{t('generic')}</h3><p>{lab.status}. {t('privacyNote')} <a href="#lab">{t('lab')}</a></p></section>
        </div> : active ? renderLesson(active) : page === 'lab' ? <Lab /> : page === 'resources' ? <article className="resources">
          <div className="eyebrow">{t('resourcesEyebrow')}</div><h1>{t('resources')}</h1><p className="lead">{t('resourcesLead')}</p><PreworkPanel /><LiveAgenda /><DownloadPanel />
          <section><h2>{t('troubleshooting')}</h2>{troubleshooting.map(([title, body], index) => <details key={index}><summary>{title}</summary><p>{body}</p></details>)}</section>
          <section><h2>{t('references')}</h2><p>{t('referencesNote')}</p>{renderVscodeReference()}<ul className="source-list">{sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a></li>)}</ul><p className="small">{t('attribution')}</p><details><summary>{t('license')}</summary><pre className="brand-notice" lang="en">{brandNotice}</pre></details></section>
          <section><h2>{t('browserData')}</h2><p>{t('browserNote')}</p><p>{saved.checked.length} {t('of')} {checkIds.size} {t('reported')} ({progress}%).</p><button type="button" onClick={exportProgress}>{t('export')}</button><button type="button" className="danger" onClick={() => setResetOpen(true)}>{t('resetLocal')}</button></section>
        </article> : <section><h1>{t('notFound')}</h1><p>{t('notFoundNote')}</p><a href="#overview">{t('returnOverview')}</a></section>}
        {active && <nav className="lesson-navigation" aria-label={t('previousNext')}><a href={`#${previousLesson?.id ?? 'overview'}`}>← {previousLesson?.title ?? t('overview')}</a><a className="button primary" href={`#${nextLesson?.id ?? 'resources'}`}>{active.id === 'prepare' ? t('ready') : nextLesson?.title ?? t('resources')} →</a></nav>}
        {lessons.map(lesson => renderLesson(lesson, true))}<Lab printOnly />
        <section className="print-only print-sources"><h2>{t('sourcesMaterials')}</h2><p>{t('printNote')}</p>{saved.settings.experience === 'vscode' && <><p>{t('vscodeUse')}</p><p>{t('modeNote')}</p><p>{t('autopilotWarning')}</p><p>{t('parametersNote')}</p><ul>{(['paramRequest', 'paramSquad', 'paramProfile', 'paramPack', 'paramDiscovery', 'paramTier', 'paramOwner'] as const).map(key => <li key={key}>{t(key)}</li>)}</ul></>}<ul>{sources.map(source => <li key={source.url}>{source.name}: {source.url}</li>)}</ul><h3>{t('license')}</h3><pre className="brand-notice" lang="en">{brandNotice}</pre></section>
        <footer><span>onepoint · {t('workshop')}</span><span>{t('date')} · {t('baseline')}</span></footer>
      </main>
    </div>
    <dialog ref={resetDialog} className="reset-dialog" aria-labelledby="reset-title" onCancel={() => setResetOpen(false)} onClose={() => setResetOpen(false)}><h2 id="reset-title">{t('resetTitle')}</h2><p>{t('resetNote')}</p><button autoFocus type="button" onClick={() => setResetOpen(false)}>{t('keepData')}</button><button type="button" className="danger" onClick={() => {
      try { localStorage.removeItem(storageKey); setSaved({ schema: 1, checked: [], settings: { ...defaults, locale } }); setStorageError(null); setStatus('resetDone'); setResetOpen(false) }
      catch { setStatus('resetError'); setResetOpen(false) }
    }}>{t('resetWorkshop')}</button></dialog>
  </div></LocaleContext.Provider>
}
export default App
