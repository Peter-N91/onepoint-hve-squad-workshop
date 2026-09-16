import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { agenda, prework, prompts } from '../src/content.ts'
import { content } from '../src/locales.ts'
import { translator } from '../src/ui.ts'
import { clients, defaults, modes, renderPrompt, storageKey } from '../src/state.ts'
import { optionalText, publicationPrompt } from '../src/optional.ts'
import { designPrompt, designText } from '../src/design.ts'

function expectedPrompt(prompt, settings) {
  if (prompt.shell) return prompt.text
  const squad = prompt.squadTarget ? ` squad=${JSON.stringify(settings[prompt.squadTarget === 'implementation' ? 'implementationSquad' : 'publicationSquad'].trim())}` : ''
  if (settings.experience !== 'vscode') return prompt.lifecycle ? prompt.text : `mode="autopilot"${squad}\n\n${prompt.text}`
  const text = prompt.lifecycle ? prompt.text.replace(/^(?:init|promote)\r?\n\r?\n/, '') : prompt.text
  const entry = prompt.entry ?? 'squad'
  return `/${entry}${entry === 'squad-federation' && prompt.lifecycle ? ` ${prompt.lifecycle}` : ''}${prompt.lifecycle ? '' : ' mode="autopilot"'}${squad} request=${JSON.stringify(text)}`
}

function requestCases(c) {
  return [
    ['prepare', '.exercise-list .prompt-block', c.lessons.find(l => l.id === 'prepare').steps.at(-1).prompt],
    ['product', '[data-setup-id="planning-team"] .prompt-block', c.lifecycleSteps[0].request],
    ['product', '.phase-launch .prompt-block', c.lessons.find(l => l.id === 'product').launch],
    ['federation', '[data-setup-id="promote"] .prompt-block', c.lifecycleSteps[1].request],
    ['federation', '[data-setup-id="delivery-team"] .prompt-block', c.lifecycleSteps[2].request],
    ['implementation', '.phase-launch .prompt-block', c.lessons.find(l => l.id === 'implementation').launch],
    ['resume', '.exercise-list .prompt-block', c.lessons.find(l => l.id === 'resume').steps[0].prompt],
  ]
}

// Independent local check through Edge/CDP, without touching the shared browser.
const edge = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const output = resolve('artifacts')
const profile = resolve(output, `qa-browser-profile-${process.pid}`)
const downloadPath = resolve(output, 'qa-downloads')
const root = resolve('dist')
await mkdir(profile, { recursive: true })
await rm(downloadPath, { recursive: true, force: true })
await mkdir(downloadPath, { recursive: true })
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    if (!url.pathname.startsWith('/workshop/')) { res.writeHead(404).end(); return }
    const file = resolve(root, decodeURIComponent(url.pathname.slice('/workshop/'.length)) || 'index.html')
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return }
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream')
    res.end(await readFile(file))
  } catch { res.writeHead(404).end() }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const url = origin + '/workshop/'
const browser = spawn(edge, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--disable-background-networking', '--disable-component-update', '--disable-sync', 'about:blank'], { stdio: 'ignore' })
let launchError
browser.on('error', error => { launchError = error })
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const results = []
let ws
let seq = 0
const pending = new Map()
const exceptions = []
const requests = []
let call
async function waitFor(check, label) {
  for (let i = 0; i < 80; i++) { if (await check()) return; await sleep(100) }
  throw new Error(`Timed out: ${label}`)
}
try {
  let port
  await waitFor(async () => {
    if (launchError) throw launchError
    try { port = (await readFile(resolve(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; return !!port } catch { return false }
  }, 'Edge startup')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  ws = new WebSocket(targets.find(item => item.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject) })
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.id) {
      const task = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) task?.reject(new Error(JSON.stringify(message.error)))
      else task?.resolve(message.result)
    }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text)
    if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url)
  })
  call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  const check = async (label, expression) => { assert.equal(await evaluate(expression), true, label); results.push(label) }
  const click = async expression => { await evaluate(`${expression}.click()`); await sleep(100) }
  const go = async hash => { await evaluate(`location.hash=${JSON.stringify(hash)}`); await sleep(100) }
  const checkAgenda = async (label, selector) => {
    assert.deepEqual(await evaluate(`[...document.querySelectorAll(${JSON.stringify(selector + ' .agenda-row')})].map(row=>[row.querySelector('.agenda-time').firstChild.textContent,row.querySelector('.agenda-time small').textContent,parseInt(row.querySelector('.duration').textContent),row.querySelector('a')?.getAttribute('href') ?? ''])`), agenda.map(item => [item.time, item.end, item.minutes, item.lesson ? `#${item.lesson}` : '']), label)
    results.push(label)
  }
  const visibleLesson = `document.querySelector('article.lesson:not(.print-only)')`
  const findButton = label => `[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(label)} && b.getClientRects().length)`
  await call('Page.enable')
  await call('Runtime.enable')
  await call('Network.enable')
  await call('Network.setBlockedURLs', { urls: ['https://*'] })
  await call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath })
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await call('Page.navigate', { url: url + '?scoutTheme=light' })
  await waitFor(() => evaluate(`!!document.querySelector('.hero h1')`), 'guide served under a subpath')
  await check('Site under /workshop/: English title, subtitle and light theme', `document.documentElement.lang==='en' && document.documentElement.dataset.theme==='light' && document.querySelector('h1').textContent==='From data to reports, with HVE Squad' && document.querySelector('.hero .lead').textContent==='Hands-on workshop: scope and start an Office add-in'`)
  await waitFor(() => evaluate(`document.querySelector('.brand img').complete && document.querySelector('.brand img').naturalWidth===64`), 'original SVG logo loaded')
  await check('Header uses real logo resolved under the Pages subpath', `new URL(document.querySelector('.brand img').src).pathname==='/workshop/hve-squad-logo.svg' && document.querySelector('.brand img').width===48`)
  assert.deepEqual(Buffer.from(await (await fetch(url + 'hve-squad-logo.svg')).arrayBuffer()), await readFile(resolve('public', 'hve-squad-logo.svg')))
  results.push('Served logo bytes identical to original source asset')
  await check('Qubix light background and green brand button', `getComputedStyle(document.documentElement).getPropertyValue('--cp-bg').trim()==='#f3f7fa' && getComputedStyle(document.querySelector('.hero-actions .primary')).backgroundColor==='rgb(61, 220, 151)' && getComputedStyle(document.querySelector('.hero-actions .primary')).color==='rgb(6, 40, 28)'`)
  const buttonBox = await evaluate(`(()=>{const box=document.querySelector('.hero-actions .primary').getBoundingClientRect();return {x:box.x+8,y:box.y+8}})()`)
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...buttonBox })
  await check('Qubix primary hover uses the exact brand-hover color', `getComputedStyle(document.querySelector('.hero-actions .primary')).backgroundColor==='rgb(99, 228, 173)'`)
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 })
  await check('Overview starts at first pre-work with an explicit ready-to-start Part 03 link', `document.querySelector('.hero-actions .primary').getAttribute('href')==='#start' && document.querySelector('.hero-actions a:nth-child(2)').getAttribute('href')==='#product' && document.querySelector('.hero-actions').textContent.includes('09:00')`)
  await check('Pre-work cards and sidebar show Before the workshop and zero live minutes', `document.querySelectorAll('.overview .prework-card').length===2 && [...document.querySelectorAll('.overview .prework-card')].every(card=>card.textContent.includes('Before the workshop · 0 live minutes')) && ['start','prepare'].every(id=>document.querySelector('.sidebar a[href="#'+id+'"] small').textContent==='Before the workshop · 0 live minutes')`)
  await checkAgenda('Overview: exact 210-minute live agenda begins at 09:00 with Part 03', '.overview .agenda-card')
  await check('Final thirty minutes are visually protected', `document.querySelector('.overview .agenda-row.protected a').getAttribute('href')==='#discussion' && document.querySelector('.overview .agenda-row.protected .duration').textContent==='30 min'`)
  await writeFile(resolve(output, 'onepoint-desktop.png'), Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  await evaluate(`document.querySelector('.overview .agenda-card').scrollIntoView({behavior:'instant',block:'start'})`)
  await writeFile(resolve(output, 'onepoint-agenda.png'), Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  for (const item of prework) {
    await go(item.id)
    await check(`Part ${item.number} header is self-paced with zero live minutes`, `${visibleLesson}.querySelector('.eyebrow').textContent.includes('Before the workshop · 0 live minutes') && ${visibleLesson}.querySelector('.small').textContent.includes('excluded from the 210-minute live agenda')`)
    await evaluate(`[...${visibleLesson}.querySelectorAll('.check-row input')].forEach(input=>input.click())`)
    await sleep(100)
    await go('overview')
    await check(`CTA follows completed Part ${item.number} without renumbering lessons`, `document.querySelector('.hero-actions .primary').getAttribute('href')===${JSON.stringify(item.id === 'start' ? '#prepare' : '#product')}`)
  }
  await check('Ready CTA begins live Part 03 at 09:00, not another opening', `document.querySelector('.hero-actions .primary').textContent==='Ready — start Part 03 at 09:00 →'`)
  await check('Pre-work progress retains all six original checkpoint IDs', `JSON.stringify(JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).checked)===JSON.stringify(['start-0','start-1','prepare-0','prepare-1','prepare-2','prepare-3'])`)
  await evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)})`)
  await call('Page.reload')
  await waitFor(() => evaluate(`!!document.querySelector('.hero h1')`), 'reset test progress after pre-work assertions')
  await go('product')
  await check('09:00 opens Part 03 planning init then mandatory autopilot product request', `${visibleLesson}.querySelector('.big-number').textContent==='03' && ${visibleLesson}.querySelector('.eyebrow').textContent.includes('09:00–10:00 CEST · 60 live minutes') && ${visibleLesson}.querySelector('[data-setup-id="planning-team"] pre').textContent===${JSON.stringify(prompts.planningInit)} && ${visibleLesson}.querySelector('.phase-launch pre').textContent===${JSON.stringify('mode="autopilot"\n\n' + prompts.product)}`)
  await check('Product copy blocked before confirmation', `${visibleLesson}.querySelector('.phase-launch button').disabled`)
  await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text}}})`)
  await click(`${visibleLesson}.querySelector('[data-setup-id="planning-team"] input')`)
  await check('Planning confirmation unlocks copy', `!${visibleLesson}.querySelector('.phase-launch button').disabled`)
  await click(`${visibleLesson}.querySelector('.phase-launch button')`)
  assert.equal(await evaluate('window.__copied'), 'mode="autopilot"\n\n' + prompts.product)
  results.push('Exact product request copied with mandatory autopilot, without other internal instructions')
  await go('federation')
  await check('Delivery init copy blocked before promotion', `${visibleLesson}.querySelector('[data-setup-id="delivery-team"] button').disabled`)
  await click(`${visibleLesson}.querySelector('[data-setup-id="promote"] input')`)
  await click(`${visibleLesson}.querySelector('[data-setup-id="delivery-team"] input')`)
  await go('implementation')
  await check('Three confirmations still require a registered implementation target', `${visibleLesson}.querySelector('.phase-launch button').disabled && !${visibleLesson}.querySelector('.phase-launch code')`)
  await evaluate(`(()=>{const input=${visibleLesson}.querySelector('[data-setting="implementationSquad"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'delivery');input.dispatchEvent(new Event('input',{bubbles:true}))})()`)
  await sleep(100)
  await check('Three confirmations and a valid name unlock implementation', `!${visibleLesson}.querySelector('.phase-launch button').disabled`)
  await call('Page.reload')
  await waitFor(() => evaluate(`!!${visibleLesson}`), 'reload')
  await check('Progress preserved after reload', `!${visibleLesson}.querySelector('.phase-launch button').disabled`)
  await go('product')
  await click(`${visibleLesson}.querySelector('[data-setup-id="planning-team"] input')`)
  await go('implementation')
  await check('Unchecking planning invalidates promotion and delivery', `${visibleLesson}.querySelector('.phase-launch button').disabled && JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).checked.length===0`)
  await go('prepare')
  await click(`document.getElementById('experience-app')`)
  await check('App installation: two paired entries', `${visibleLesson}.querySelector('.app-install').textContent.includes('hve-squad-hve-core')`)
  await click(`${visibleLesson}.querySelectorAll('.install-panel .segmented button')[1]`)
  await check('APM: pinned command available', `${visibleLesson}.textContent.includes('apm install "Peter-N91/hve-squad#v0.16.2" --target copilot')`)
  await evaluate(`document.getElementById('experience-app').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))`)
  await check('Tabs support keyboard operation', `document.getElementById('experience-cli').getAttribute('aria-selected')==='true' && document.activeElement.id==='experience-cli'`)
  await click(findButton('My workstation'))
  await evaluate(`const input=document.querySelector('.settings-grid input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'CLI — local test'); input.dispatchEvent(new Event('input',{bubbles:true}))`)
  await sleep(100)
  await check('Workstation notes saved locally', `JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).settings.clientVersion==='CLI — local test'`)
  await click(findButton('Close'))
  await go('lab')
  await check('Initial fixture: three nominal rows with English number formatting', `document.querySelector('article:not(.print-only) tbody').rows.length===3 && document.querySelector('article:not(.print-only) tbody').textContent.includes('4.2') && document.querySelector('article:not(.print-only) tbody').textContent.includes('96.5') && document.querySelector('article:not(.print-only) tbody').textContent.includes('1,280')`)
  const select = async value => { await evaluate(`(()=>{const select=document.querySelector('article:not(.print-only) select'); select.value=${JSON.stringify(value)}; select.dispatchEvent(new Event('change',{bubbles:true}))})()`); await sleep(100) }
  await select('2026-08')
  await check('Second period is exact with no carried-over values', `document.querySelector('article:not(.print-only) tbody').textContent.includes('3.8') && document.querySelector('article:not(.print-only) tbody').textContent.includes('97.2')`)
  await select('valeur-nulle')
  await check('Null value: explicit message, not zero', `document.querySelector('article:not(.print-only) .report-preview').textContent.includes('Data unavailable: Average turnaround') && document.querySelector('article:not(.print-only) tbody tr:nth-child(2) td').textContent==='Unavailable'`)
  await select('periode-absente')
  await check('Missing period: no table or substitution', `!document.querySelector('article:not(.print-only) table') && document.querySelector('article:not(.print-only) .report-preview').textContent.includes('Period unavailable: 2026-09')`)
  await select('2026-07')
  await writeFile(resolve(output, 'onepoint-lab.png'), Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  await go('resources')
  await checkAgenda('Resources: same live agenda, no pre-work counted', 'article:not(.print-only) .agenda-card')
  await check('Resources retain pre-work and embedded logo license', `document.querySelectorAll('article:not(.print-only) .prework-card').length===2 && document.querySelector('article:not(.print-only) .brand-notice').textContent.includes('Copyright (c) 2026 Peter-N91')`)
  for (let i = 0; i < 4; i++) await click(`document.querySelectorAll('article:not(.print-only) .download-card button')[${i}]`)
  await waitFor(async () => (await readdir(downloadPath)).filter(name => /\.(txt|json)$/.test(name)).length >= 4, 'four downloads')
  for (const file of ['checkpoint-worksheet.txt', 'federation-handoff.txt', 'report-studio-exercise-brief.txt', 'report-studio-fixture.json']) assert.equal(await readFile(resolve(downloadPath, file), 'utf8'), await readFile(resolve('public', 'downloads', file), 'utf8'))
  results.push('Four downloads identical to source files')
  await click(findButton('Export progress'))
  await waitFor(async () => (await readdir(downloadPath)).includes('onepoint-progress-2026-09-17.json'), 'progress export')
  assert.equal(JSON.parse(await readFile(resolve(downloadPath, 'onepoint-progress-2026-09-17.json'), 'utf8')).settings.clientVersion, 'CLI — local test')
  results.push('Complete JSON export of progress and notes')
  await evaluate(`localStorage.setItem('other-qa-key','preserve')`)
  await click(findButton('Reset local data'))
  await check('Reset uses a modal dialog with safe cancellation', `document.querySelector('dialog').open && document.activeElement.textContent==='Keep my data'`)
  await click(findButton('Keep my data'))
  await check('Cancel preserves data', `!!localStorage.getItem(${JSON.stringify(storageKey)})`)
  await click(findButton('Reset local data'))
  await click(findButton('Reset this workshop'))
  await check('Confirmation removes only this workshop', `localStorage.getItem(${JSON.stringify(storageKey)})===null && localStorage.getItem('other-qa-key')==='preserve'`)
  await evaluate(`localStorage.setItem(${JSON.stringify(storageKey)},'corrupted')`)
  await call('Page.reload')
  await waitFor(() => evaluate(`!!document.querySelector('[role="alert"]')`), 'preserved read error')
  await go('start')
  await click(`${visibleLesson}.querySelector('.check-row input')`)
  await check('Corrupted data preserved, saving suspended', `localStorage.getItem(${JSON.stringify(storageKey)})==='corrupted' && document.querySelector('[role="alert"]').textContent.includes('Unable to load progress. Saving is suspended')`)
  await evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)})`)
  await call('Page.reload')
  await waitFor(() => evaluate(`!!${visibleLesson}`), 'return to guide')
  await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Unavailable')}}})`)
  await click(findButton('Copy /agent'))
  await check('Blocked clipboard: explicit manual fallback', `document.querySelector('.status').textContent.includes('Select the visible text')`)
  await click(findButton('Focus mode'))
  await check('Focus mode hides navigation', `getComputedStyle(document.querySelector('.sidebar')).display==='none'`)
  await click(findButton('Show navigation'))
  await click(findButton('Dark'))
  await go('overview')
  await check('Exact Qubix dark theme and visible original logo', `document.documentElement.dataset.theme==='dark' && getComputedStyle(document.documentElement).getPropertyValue('--cp-bg').trim()==='#0b0f14' && getComputedStyle(document.documentElement).getPropertyValue('--cp-link').trim()==='#5aa9ff' && document.querySelector('.brand img').naturalWidth===64`)
  await check('Qubix dark secondary text and brand button colors', `getComputedStyle(document.querySelector('.hero .lead')).color==='rgb(163, 176, 191)' && getComputedStyle(document.querySelector('.hero-actions .primary')).backgroundColor==='rgb(61, 220, 151)'`)
  await writeFile(resolve(output, 'onepoint-desktop-dark.png'), Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await go('overview')
  await click(findButton('Journey'))
  await check('Mobile navigation accessible', `getComputedStyle(document.querySelector('.sidebar')).display!=='none'`)
  await check('Mobile logo and pre-work labels stay visible', `document.querySelector('.brand img').naturalWidth===64 && document.querySelector('.brand img').getBoundingClientRect().width===40 && document.querySelector('.sidebar a[href="#prepare"]').textContent.includes('Before the workshop · 0 live minutes')`)
  await click(findButton('Journey'))
  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true })
    for (const hash of ['overview', 'start', 'prepare', 'product', 'federation', 'implementation', 'resume', 'discussion', 'lab', 'resources']) {
      await go(hash)
      await check(`No horizontal overflow at ${width}px — ${hash}`, `document.documentElement.scrollWidth<=innerWidth`)
    }
  }
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await go('prepare')
  await writeFile(resolve(output, 'onepoint-mobile-dark.png'), Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await call('Emulation.setEmulatedMedia', { media: 'print' })
  await check('Print: seven complete lessons and lab', `document.querySelectorAll('.lesson.print-only').length===7 && [...document.querySelectorAll('.lesson.print-only')].every(el=>getComputedStyle(el).display!=='none') && getComputedStyle(document.querySelector('.resources.print-only')).display!=='none'`)
  await check('Print: English heading and content', `document.querySelector('.print-heading').textContent.includes('From data to reports, with HVE Squad') && document.querySelector('.print-sources h2').textContent==='Sources and materials'`)
  await check('Print: menus and buttons hidden', `getComputedStyle(document.querySelector('.topbar')).display==='none' && getComputedStyle(document.querySelector('.content-toolbar')).display==='none'`)
  assert.deepEqual(await evaluate(`({naturalWidth:document.querySelector('.print-heading img').naturalWidth,width:document.querySelector('.print-heading img').getBoundingClientRect().width,visible:getComputedStyle(document.querySelector('.print-heading')).display!=='none',accent:getComputedStyle(document.documentElement).getPropertyValue('--cp-accent').trim(),background:getComputedStyle(document.body).backgroundColor})`), { naturalWidth: 64, width: 48, visible: true, accent: '#08764f', background: 'rgb(255, 255, 255)' }, 'Print: actual logo and Qubix print palette visible even from dark mode')
  results.push('Print: actual logo and Qubix print palette visible even from dark mode')
  await checkAgenda('Print: all 210 live minutes and protected discussion, no pre-work slots', '.print-heading .agenda-card')
  await check('Print: both pre-work cards and lesson headers retain zero live minutes', `document.querySelectorAll('.print-heading .prework-card').length===2 && [...document.querySelectorAll('.lesson.print-only')].slice(0,2).every(lesson=>lesson.querySelector('.eyebrow').textContent.includes('Before the workshop · 0 live minutes'))`)
  await evaluate(`window.scrollTo(0,0)`)
  await writeFile(resolve(output, 'onepoint-print.png'), Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  const pdf = await call('Page.printToPDF', { printBackground: true, preferCSSPageSize: true })
  await writeFile(resolve(output, 'onepoint-guide-qa.pdf'), Buffer.from(pdf.data, 'base64'))
  await call('Emulation.setEmulatedMedia', { media: '' })
  const portableRequestStart = requests.length
  await call('Page.navigate', { url: pathToFileURL(resolve(root, 'onepoint-workshop-portable.html')).href + '?scoutTheme=light#lab' })
  await waitFor(() => evaluate(`!!document.querySelector('article:not(.print-only) .fixture-select')`), 'standalone HTML over file://')
  await check('Standalone portable HTML and lab usable in English', `document.documentElement.lang==='en' && document.querySelector('h1').textContent==='Report Studio' && document.querySelectorAll('script[src], link[rel="stylesheet"]').length===0`)
  await waitFor(() => evaluate(`document.querySelector('.brand img').complete && document.querySelector('.brand img').naturalWidth===64`), 'standalone embedded logo')
  const embeddedLogo = await evaluate(`document.querySelector('.brand img').getAttribute('src')`)
  assert.ok(embeddedLogo.startsWith('data:image/svg+xml;base64,'))
  assert.deepEqual(Buffer.from(embeddedLogo.split(',')[1], 'base64'), await readFile(resolve('public', 'hve-squad-logo.svg')))
  results.push('Portable logo is a byte-identical data URI, without a standalone asset fetch')
  await select('valeur-nulle')
  await check('Negative case also works in standalone HTML', `document.querySelector('article:not(.print-only) .report-preview').textContent.includes('Data unavailable: Average turnaround')`)
  await go('overview')
  await checkAgenda('Portable: exact 210-minute live agenda starts with Part 03', '.overview .agenda-card')
  await check('Portable: pre-work and Qubix light brand present', `document.querySelectorAll('.overview .prework-card').length===2 && getComputedStyle(document.documentElement).getPropertyValue('--cp-bg').trim()==='#f3f7fa' && getComputedStyle(document.querySelector('.hero-actions .primary')).backgroundColor==='rgb(61, 220, 151)'`)
  await writeFile(resolve(output, 'onepoint-portable.png'), Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  await click(findButton('Dark'))
  await check('Portable: Qubix dark theme retains the embedded logo', `getComputedStyle(document.documentElement).getPropertyValue('--cp-bg').trim()==='#0b0f14' && document.querySelector('.brand img').naturalWidth===64`)
  await call('Emulation.setEmulatedMedia', { media: 'print' })
  await check('Portable print: logo embedded and visible', `document.querySelector('.print-heading img').src.startsWith('data:image/svg+xml;base64,') && document.querySelector('.print-heading img').naturalWidth===64 && document.querySelector('.print-heading img').getBoundingClientRect().width===48`)
  await checkAgenda('Portable print: same six live slots', '.print-heading .agenda-card')
  await call('Emulation.setEmulatedMedia', { media: '' })
  assert.ok(requests.slice(portableRequestStart).filter(request => /^(file|https?):/.test(request)).every(request => request.includes('onepoint-workshop-portable.html')))
  results.push('Portable loads no separate files or network assets')

  // Full locale/client matrix, with real rendered Copy handlers and isolated downloads.
  const bilingualDownloads = resolve(output, 'qa-bilingual-downloads')
  await rm(bilingualDownloads, { recursive: true, force: true })
  await mkdir(bilingualDownloads, { recursive: true })
  await call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: bilingualDownloads })
  await call('Page.navigate', { url: url + '?scoutTheme=light#overview' })
  await waitFor(() => evaluate(`!!document.querySelector('.hero')`), 'bilingual hosted guide')
  const changeSelect = async (selector, value) => {
    await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('change',{bubbles:true}))})()`)
    await sleep(100)
  }
  const setLanguage = locale => changeSelect('[data-testid="language"]', locale)
  const screenshot = async name => writeFile(resolve(output, name + '.png'), Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  const seed = async (settings, checked = []) => {
    await evaluate(`localStorage.setItem(${JSON.stringify(storageKey)},${JSON.stringify(JSON.stringify({ schema: 1, checked, settings }))})`)
    await call('Page.reload')
    await waitFor(() => evaluate(`!!document.querySelector('[data-testid="language"]')`), 'load matrix settings')
    await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text}}})`)
  }
  const assertCopy = async (label, selector, prompt, settings) => {
    const expected = expectedPrompt(prompt, settings)
    assert.equal(renderPrompt(prompt, settings), expected, label + ' independently specified renderer contract')
    assert.equal(await evaluate(`${selector}.querySelector('pre').textContent`), expected, label + ' visible code')
    await click(`${selector}.querySelector('.prompt-toolbar button')`)
    assert.equal(await evaluate('window.__copied'), expected, label + ' clipboard')
    results.push(label + ' — exact visible and Copy payload')
  }
  const visibleArticle = `document.querySelector('article:not(.print-only)')`
  const assertPolicy = async (label, locale) => {
    await check(label + ' mandatory policy visible with no optional mode selector', `(()=>{const policy=document.querySelector('[data-testid="autopilot-policy"]');return !!policy && policy.getClientRects().length>0 && policy.textContent.includes('mode="autopilot"') && policy.textContent.includes('init') && policy.textContent.includes('promote') && !document.querySelector('[data-testid="business-mode"]') && ![...document.querySelectorAll('select option')].some(option=>['interactive','autonomous'].includes(option.value))})()`)
    const text = await evaluate(`document.querySelector('[data-testid="autopilot-policy"]').textContent`)
    assert.match(text, locale === 'fr' ? /obligatoire/i : /mandatory|required|must/i, label + ' mandatory wording')
    assert.match(text, locale === 'fr' ? /approbation/i : /approval/i, label + ' approvals retained')
    assert.match(text, locale === 'fr' ? /périmètre|lecture seule/i : /scope|read.only/i, label + ' scope retained')
    results.push(label + ' localized mandatory rule retains approvals and scope')
  }
  const assertPrintPolicy = async (label, locale, experience) => {
    const t = translator(locale)
    await check(label + ' print header and sources state mandatory autopilot for every client', `document.querySelector('.print-heading').textContent.includes('mode="autopilot"') && document.querySelector('.print-sources').textContent.includes(${JSON.stringify(t('modeNote'))}) && !document.querySelector('[data-testid="business-mode"]')`)
    for (const [page, selector, prompt] of requestCases(content[locale])) {
      const number = content[locale].lessons.find(l => l.id === page).number
      const actual = await evaluate(`[...document.querySelectorAll('.lesson.print-only')].find(lesson=>lesson.querySelector('.big-number').textContent===${JSON.stringify(number)}).querySelector(${JSON.stringify(selector + ' pre')}).textContent`)
      const settings = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).settings`)
      assert.equal(actual, expectedPrompt(prompt, { ...settings, experience }), label + ' print ' + page + '/' + (prompt.lifecycle ?? 'request'))
    }
    results.push(label + ' all seven printed commands enforce policy with lifecycle exceptions')
  }
  const testPages = ['overview', 'start', 'prepare', 'product', 'federation', 'implementation', 'resume', 'discussion', 'lab', 'resources']
  for (const locale of ['en', 'fr']) {
    const c = content[locale]
    const t = translator(locale)
    for (const experience of clients) {
      const mode = 'autopilot'
      const settings = { ...defaults, locale, experience, mode, implementationSquad: 'delivery', clientVersion: 'QA version', coreVersion: 'QA core', squadVersion: 'QA squad', officeVersion: 'Not executed' }
      const tag = `${locale}/${experience}/${mode}`
      await seed(settings)
      await assertPolicy(tag, locale)
      await check(`${tag} document metadata and three accessible tabs`, `document.documentElement.lang===${JSON.stringify(locale)} && document.title===${JSON.stringify('onepoint | ' + t('title'))} && document.querySelectorAll('[role="tab"]').length===3 && document.querySelectorAll('[role="tab"][tabindex="0"]').length===1 && document.getElementById('experience-${experience}').getAttribute('aria-selected')==='true' && document.querySelector('[role="tabpanel"]').getAttribute('aria-labelledby')==='experience-${experience}'`)
      if (experience === 'vscode') {
        for (const [key, expected] of [['End', 'vscode'], ['ArrowRight', 'app'], ['ArrowLeft', 'vscode'], ['Home', 'app'], ['ArrowRight', 'cli'], ['ArrowRight', 'vscode']]) {
          await evaluate(`document.querySelector('[role="tab"][aria-selected="true"]').dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(key)},bubbles:true}))`)
          await sleep(60)
          await check(`${tag} keyboard ${key} → ${expected}`, `document.activeElement.id==='experience-${expected}' && document.querySelectorAll('[role="tab"][tabindex="0"]').length===1 && document.getElementById('experience-${expected}').getAttribute('aria-selected')==='true'`)
        }
        await go('implementation')
      }
      await go('implementation')
      await check(`${tag} mandatory autopilot cannot unlock implementation`, `${visibleLesson}.querySelector('.phase-launch button').disabled && JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).checked.length===0`)
      for (const hash of testPages) {
        await go(hash)
        const title = hash === 'overview' ? t('title') : hash === 'lab' ? 'Report Studio' : hash === 'resources' ? t('resources') : c.lessons.find(l => l.id === hash).title
        await check(`${tag} localized page ${hash}`, `document.querySelector('h1').textContent===${JSON.stringify(title)} && document.documentElement.lang===${JSON.stringify(locale)}`)
        await assertPolicy(`${tag}/${hash}`, locale)
      }
      await go('prepare')
      await assertCopy(`${tag} readiness`, `${visibleLesson}.querySelector('.exercise-list .prompt-block')`, c.lessons.find(l => l.id === 'prepare').steps.at(-1).prompt, settings)
      await assertCopy(`${tag} repository shell`, `${visibleLesson}.querySelector('.before-install .prompt-block')`, c.repositorySetup, settings)
      if (experience === 'vscode') {
        await assertCopy(`${tag} verified APM installation`, `${visibleLesson}.querySelector('.vscode-install .prompt-block')`, c.installation.apm, settings)
        await check(`${tag} VS Code does not silently switch plugin preference`, `JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).settings.install==='plugin' && !${visibleLesson}.querySelector('.install-panel .segmented') && ${visibleLesson}.querySelector('.vscode-install').textContent.includes('.github/prompts/squad/squad.prompt.md')`)
      } else {
        if (experience === 'app') await check(`${tag} App pair retained`, `${visibleLesson}.querySelector('.app-install').textContent.includes('hve-squad-hve-core')`)
        else await assertCopy(`${tag} CLI pair retained`, `${visibleLesson}.querySelector('.install-panel .prompt-block')`, c.installation.plugin, settings)
        await click(`${visibleLesson}.querySelectorAll('.install-panel .segmented button')[1]`)
        await assertCopy(`${tag} APM preference`, `${visibleLesson}.querySelector('.install-panel .prompt-block')`, c.installation.apm, settings)
        await click(`document.getElementById('experience-vscode')`)
        await click(`document.getElementById('experience-${experience}')`)
        await check(`${tag} APM choice survives VS Code roundtrip`, `JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).settings.install==='apm'`)
      }
      await check(`${tag} APM CLI is v0.29.0, not latest, with a fixed release and version check`, `(()=>{const panel=${visibleLesson}.querySelector('[data-testid="apm-version-policy"]');return !!panel && panel.textContent.includes('APM v0.29.0') && panel.textContent.includes('apm --version') && panel.querySelector('a').href==='https://github.com/microsoft/apm/releases/tag/v0.29.0' && panel.textContent.includes(${JSON.stringify(locale === 'fr' ? 'pas la dernière version' : 'not latest')});})()`)
      await go('product')
      const product = c.lessons.find(l => l.id === 'product')
      await check(`${tag} readiness check stays inside product hour`, `${visibleLesson}.textContent.includes('09:00–09:10') && ${visibleLesson}.querySelector('.eyebrow').textContent.includes('09:00–10:00')`)
      await assertCopy(`${tag} planning initialization`, `${visibleLesson}.querySelector('[data-setup-id="planning-team"] .prompt-block')`, product.setup[0].request, settings)
      await check(`${tag} product blocked before self-report`, `${visibleLesson}.querySelector('.phase-launch button').disabled`)
      await check(`${tag} no optional mode can bypass product confirmation`, `!document.querySelector('[data-testid="business-mode"]') && ${visibleLesson}.querySelector('.phase-launch button').disabled`)
      await click(`${visibleLesson}.querySelector('[data-setup-id="planning-team"] input')`)
      await click(`${visibleLesson}.querySelector('[data-check-id="product-0"]')`)
      await assertCopy(`${tag} product`, `${visibleLesson}.querySelector('.phase-launch .prompt-block')`, product.launch, settings)
      const beforeLanguage = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}))`)
      await setLanguage(locale === 'en' ? 'fr' : 'en')
      await assertPolicy(tag + ' switched language', locale === 'en' ? 'fr' : 'en')
      await check(`${tag} language preserves page, client, mode, progress and status`, `location.hash==='#product' && document.getElementById('experience-${experience}').getAttribute('aria-selected')==='true' && JSON.stringify(JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).checked)===${JSON.stringify(JSON.stringify(beforeLanguage.checked))} && JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).settings.mode===${JSON.stringify(mode)} && document.querySelector('.status').textContent===${JSON.stringify(translator(locale === 'en' ? 'fr' : 'en')('copied'))}`)
      await setLanguage(locale)
      await go('federation')
      const federation = c.lessons.find(l => l.id === 'federation')
      await assertCopy(`${tag} promotion`, `${visibleLesson}.querySelector('[data-setup-id="promote"] .prompt-block')`, federation.setup[0].request, settings)
      await check(`${tag} delivery blocked before promotion`, `${visibleLesson}.querySelector('[data-setup-id="delivery-team"] button').disabled && ${visibleLesson}.querySelector('[data-setup-id="delivery-team"] input').disabled`)
      await click(`${visibleLesson}.querySelector('[data-setup-id="promote"] input')`)
      await assertCopy(`${tag} delivery initialization`, `${visibleLesson}.querySelector('[data-setup-id="delivery-team"] .prompt-block')`, federation.setup[1].request, settings)
      await click(`${visibleLesson}.querySelector('[data-setup-id="delivery-team"] input')`)
      await go('implementation')
      await assertCopy(`${tag} implementation`, `${visibleLesson}.querySelector('.phase-launch .prompt-block')`, c.lessons.find(l => l.id === 'implementation').launch, settings)
      await go('resume')
      await assertCopy(`${tag} read-only resumption`, `${visibleLesson}.querySelector('.exercise-list .prompt-block')`, c.lessons.find(l => l.id === 'resume').steps[0].prompt, settings)
      await go('product')
      await click(`${visibleLesson}.querySelector('[data-setup-id="planning-team"] input')`)
      await go('implementation')
      await check(`${tag} inherited confirmations revoked, business checks retained`, `${visibleLesson}.querySelector('.phase-launch button').disabled && JSON.stringify(JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).checked)==='["product-0"]'`)
      for (const width of [390, 320]) {
        await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true })
        for (const hash of testPages) {
          await go(hash)
          await check(`${tag} ${width}px no overflow — ${hash}`, `document.documentElement.scrollWidth<=innerWidth`)
        }
      }
      if (experience === 'vscode' && mode === 'autopilot') {
        await go('product')
        await screenshot(`onepoint-${locale}-vscode-320`)
      }
      await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
      for (const theme of ['light', 'dark']) {
        if (await evaluate('document.documentElement.dataset.theme') !== theme) await click(`document.querySelector('.header-actions button[aria-label]')`)
        await call('Emulation.setEmulatedMedia', { media: 'print' })
        await check(`${tag} ${theme} print contains localized lessons, sources, logo and Qubix palette`, `document.querySelectorAll('.lesson.print-only').length===7 && [...document.querySelectorAll('.lesson.print-only')].every(el=>getComputedStyle(el).display!=='none') && document.querySelector('.print-sources h2').textContent===${JSON.stringify(t('sourcesMaterials'))} && document.querySelector('.print-heading img').naturalWidth===64 && getComputedStyle(document.body).backgroundColor==='rgb(255, 255, 255)' && getComputedStyle(document.documentElement).getPropertyValue('--cp-accent').trim()==='#08764f'`)
        assert.equal(await evaluate(`document.querySelector('.lesson.print-only .big-number').textContent`), '01')
        assert.equal(await evaluate(`document.querySelectorAll('.lesson.print-only')[2].querySelector('.phase-launch pre').textContent`), expectedPrompt(product.launch, settings), tag + ' print command')
        await assertPrintPolicy(`${tag}/${theme}`, locale, experience)
        if (experience === 'vscode' && mode === 'autopilot') { await evaluate('scrollTo(0,0)'); await screenshot(`onepoint-${locale}-print-${theme}`) }
        await call('Emulation.setEmulatedMedia', { media: '' })
      }
      if (experience === 'vscode' && mode === 'autopilot') {
        await go('overview')
        await screenshot(`onepoint-${locale}-vscode-desktop`)
        await go('product')
        await evaluate(`${visibleLesson}.querySelector('.phase-launch').scrollIntoView({block:'start',behavior:'instant'})`)
        await sleep(100)
        await screenshot(`onepoint-${locale}-vscode-command`)
      }
    }
    await go('lab')
    await changeSelect('article:not(.print-only) .fixture-select select', '2026-07')
    await check(`${locale} number formatting and labels`, `${visibleArticle}.querySelector('tbody').textContent.includes(${JSON.stringify(locale === 'fr' ? '1\u202f280' : '1,280')}) && ${visibleArticle}.querySelector('tbody').textContent.includes(${JSON.stringify(locale === 'fr' ? '4,2' : '4.2')})`)
    await changeSelect('article:not(.print-only) .fixture-select select', 'valeur-nulle')
    await check(`${locale} localized null error`, `${visibleArticle}.querySelector('.report-preview').textContent.includes(${JSON.stringify(locale === 'fr' ? 'Donnée indisponible: Délai moyen' : 'Data unavailable: Average turnaround')}) && ${visibleArticle}.querySelector('tbody tr:nth-child(2) td').textContent===${JSON.stringify(t('unavailable'))}`)
    await setLanguage(locale === 'en' ? 'fr' : 'en')
    await check(`${locale} changing language retains negative scenario`, `${visibleArticle}.querySelector('.fixture-select select').value==='valeur-nulle'`)
    await setLanguage(locale)
    await changeSelect('article:not(.print-only) .fixture-select select', 'periode-absente')
    await check(`${locale} missing period never substitutes`, `!${visibleArticle}.querySelector('table') && ${visibleArticle}.querySelector('.report-preview').textContent.includes(${JSON.stringify(locale === 'fr' ? 'Période indisponible: 2026-09' : 'Period unavailable: 2026-09')})`)
    await go('resources')
    const filenames = ['report-studio-exercise-brief', 'report-studio-fixture', 'checkpoint-worksheet', 'federation-handoff'].map((base, i) => `${base}${locale === 'fr' ? '-fr' : ''}.${i === 1 ? 'json' : 'txt'}`)
    for (const filename of filenames) await click(`${visibleArticle}.querySelector('[data-download="${filename}"]')`)
    await waitFor(async () => { const present = await readdir(bilingualDownloads); return filenames.every(name => present.includes(name)) }, locale + ' material downloads')
    for (const filename of filenames) assert.equal(await readFile(resolve(bilingualDownloads, filename), 'utf8'), await readFile(resolve('public', locale === 'fr' ? 'downloads-fr' : 'downloads', filename), 'utf8'))
    results.push(locale + ' four localized downloads byte-identical to source')
    await click(findButton(t('export')))
    const progressName = `onepoint-progress-2026-09-17${locale === 'fr' ? '-fr' : ''}.json`
    await waitFor(async () => (await readdir(bilingualDownloads)).includes(progressName), locale + ' exported metadata')
    const exported = JSON.parse(await readFile(resolve(bilingualDownloads, progressName), 'utf8'))
    assert.equal(exported.settings.locale, locale)
    assert.equal(exported.settings.mode, 'autopilot')
    assert.equal(exported.settings.experience, 'vscode')
    assert.equal(exported.storageKey, storageKey)
    assert.equal(exported.page, 'resources')
    assert.deepEqual(exported.checked, ['product-0'])
    results.push(locale + ' export contains restore metadata, selected language/client, canonical autopilot and unchanged IDs')
    await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('QA blocked')}}})`)
    await go('resume')
    await click(`${visibleLesson}.querySelector('.prompt-toolbar button')`)
    await check(`${locale} localized clipboard error`, `document.querySelector('.status').textContent===${JSON.stringify(t('clipboardError'))}`)
    await go('invalid-page')
    await check(`${locale} localized missing page`, `document.querySelector('h1').textContent===${JSON.stringify(t('notFound'))}`)
  }
  // Imported legacy preferences must never weaken the workshop's mandatory policy.
  const migratedChecks = ['start-0', 'prepare-3', 'product-1', 'setup:planning-team', 'setup:promote', 'setup:delivery-team']
  for (const locale of ['en', 'fr']) for (const experience of clients) for (const mode of [undefined, ...modes]) {
    const tag = `${locale}/${experience}/legacy-${mode ?? 'missing'}`
    const settings = { ...defaults, locale, experience, mode, implementationSquad: 'delivery', install: 'apm', clientVersion: 'legacy-client', squadVersion: 'legacy-squad', coreVersion: 'legacy-core', officeVersion: 'legacy-office' }
    await seed(settings, migratedChecks)
    await assertPolicy(tag, locale)
    const expectedState = { schema: 1, checked: migratedChecks, settings: { ...settings, mode: 'autopilot' } }
    for (const [page, selector, prompt] of requestCases(content[locale])) {
      await go(page)
      await assertCopy(tag + ' ' + page + '/' + (prompt.lifecycle ?? 'request'), `${visibleLesson}.querySelector(${JSON.stringify(selector)})`, prompt, settings)
    }
    // Reading imports is non-destructive; the next explicit setting action persists normalized state.
    await click(`document.getElementById('experience-${experience}')`)
    assert.deepEqual(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}))`), expectedState, tag + ' all fields retained')
    results.push(tag + ' schema, checkpoints, locale, client, install and versions retained; mode normalized')
    await call('Page.reload')
    await waitFor(() => evaluate(`!!document.querySelector('[data-testid="language"]')`), tag + ' canonical reload')
    assert.deepEqual(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}))`), expectedState, tag + ' reload is idempotent')
    results.push(tag + ' canonical autopilot and every other field persist on reload')
  }
  // Invalid supplied settings must survive language changes and checkpoint actions unchanged.
  for (const [key, value] of [['locale', 'invalid'], ['mode', 'interactive-invalid']]) {
    const raw = JSON.stringify({ schema: 1, checked: ['start-0'], settings: { ...defaults, [key]: value } })
    await evaluate(`localStorage.setItem(${JSON.stringify(storageKey)},${JSON.stringify(raw)})`)
    await call('Page.reload')
    await waitFor(() => evaluate(`!!document.querySelector('[role="alert"]')`), key + ' explicit saved-state error')
    await check(`${key} error identifies invalid supplied setting`, `document.querySelector('[role="alert"]').textContent.includes(${JSON.stringify(key === 'locale' ? 'Unknown saved language' : 'Unknown saved mode')})`)
    await setLanguage('fr')
    await go('start')
    await click(`${visibleLesson}.querySelector('.check-row input')`)
    await check(`${key} error remains localized and bad data preserved`, `localStorage.getItem(${JSON.stringify(storageKey)})===${JSON.stringify(raw)} && document.querySelector('[role="alert"]').textContent.includes(${JSON.stringify(key === 'locale' ? 'Langue enregistrée inconnue' : 'Mode enregistré inconnu')})`)
  }
  await seed({ ...defaults, locale: 'fr' })
  await evaluate(`Storage.prototype.setItem=function(){throw new DOMException('QA quota','QuotaExceededError')}`)
  await go('start')
  await click(`${visibleLesson}.querySelector('.check-row input')`)
  await check('French storage-write failure remains explicit', `document.querySelector('[role="alert"]').textContent.includes(${JSON.stringify(translator('fr')('saveError'))})`)
  await setLanguage('en')
  await check('Language translates rather than clears storage failure', `document.querySelector('[role="alert"]').textContent.includes(${JSON.stringify(translator('en')('saveError'))})`)
  await go('resources')
  await click(findButton('Reset local data'))
  await evaluate(`Storage.prototype.removeItem=function(){throw new DOMException('QA blocked','SecurityError')}`)
  await click(findButton('Reset this workshop'))
  await check('Reset failure preserves existing error and data', `document.querySelector('.status').textContent===${JSON.stringify(translator('en')('resetError'))} && !!document.querySelector('[role="alert"]')`)
  await setLanguage('fr')
  await check('French reset failure status', `document.querySelector('.status').textContent===${JSON.stringify(translator('fr')('resetError'))}`)
  await call('Page.reload')
  await waitFor(() => evaluate(`!!document.querySelector('[data-testid="language"]')`), 'restore native storage methods')
  const oldSettings = { experience: 'app', install: 'apm', clientVersion: 'old-client', squadVersion: 'old-squad', coreVersion: 'old-core', officeVersion: 'old-office' }
  await evaluate(`localStorage.setItem(${JSON.stringify(storageKey)},${JSON.stringify(JSON.stringify({ schema: 1, checked: ['start-0', 'prepare-3'], settings: oldSettings }))})`)
  await call('Page.navigate', { url: url + '?lang=bad#prepare' })
  await waitFor(() => evaluate(`!!${visibleLesson}`), 'safe invalid URL language')
  await check('Invalid URL defaults English without erasing old state', `document.documentElement.lang==='en' && [...document.querySelectorAll('.notice')].some(node=>node.textContent.includes('Unknown URL language')) && document.getElementById('experience-app').getAttribute('aria-selected')==='true' && JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).settings.clientVersion==='old-client' && JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).checked.includes('prepare-3')`)
  await setLanguage('fr')
  await check('Choosing a valid language clears the stale URL warning immediately', `document.documentElement.lang==='fr' && !location.search.includes('lang=') && ![...document.querySelectorAll('.notice')].some(node=>node.textContent.includes('Langue d’URL inconnue'))`)
  await call('Page.reload')
  await waitFor(() => evaluate(`!!${visibleLesson}`), 'saved locale after URL override removed')
  await check('Migrated state and French preference persist after reload', `document.documentElement.lang==='fr' && !location.search.includes('lang=') && JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).settings.mode==='autopilot' && JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).settings.install==='apm' && JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).checked.length===2`)
  const denyRead = await call('Page.addScriptToEvaluateOnNewDocument', { source: `Storage.prototype.getItem=function(){throw new DOMException('QA blocked','SecurityError')}` })
  await call('Page.navigate', { url: url + '?lang=fr#resources' })
  await waitFor(() => evaluate(`!!document.querySelector('[role="alert"]')`), 'denied storage read')
  await check('French browser read denial is visible', `document.querySelector('[role="alert"]').textContent.includes(${JSON.stringify(translator('fr')('loadError'))})`)
  await call('Page.removeScriptToEvaluateOnNewDocument', { identifier: denyRead.identifier })

  // Portable file must include both languages and all eight file payloads without requests.
  const standaloneDownloads = resolve(output, 'qa-portable-downloads')
  await rm(standaloneDownloads, { recursive: true, force: true })
  await mkdir(standaloneDownloads, { recursive: true })
  await call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: standaloneDownloads })
  const standaloneStart = requests.length
  for (const locale of ['en', 'fr']) {
    await call('Page.navigate', { url: pathToFileURL(resolve(root, 'onepoint-workshop-portable.html')).href + `?lang=${locale}&scoutTheme=light#overview` })
    await waitFor(() => evaluate(`!!document.querySelector('.hero')`), locale + ' standalone opened')
    await check(`${locale} standalone document and embedded logo`, `document.documentElement.lang===${JSON.stringify(locale)} && document.querySelector('.hero h1').textContent===${JSON.stringify(translator(locale)('title'))} && document.querySelector('.brand img').src.startsWith('data:image/svg+xml;base64,') && document.querySelectorAll('script[src],link[rel="stylesheet"]').length===0`)
    for (const experience of clients) {
      const settings = { ...defaults, locale, experience, implementationSquad: 'delivery', mode: 'autonomous' }
      await seed(settings, migratedChecks)
      await assertPolicy(`${locale}/${experience} standalone legacy autonomous`, locale)
      await click(`document.getElementById('experience-${experience}')`)
      await check(`${locale}/${experience} standalone normalizes saved mode`, `JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).settings.mode==='autopilot'`)
      for (const [page, selector, prompt] of requestCases(content[locale])) {
        await go(page)
        await assertCopy(`${locale}/${experience} standalone ${page}/${prompt.lifecycle ?? 'request'}`, `${visibleLesson}.querySelector(${JSON.stringify(selector)})`, prompt, settings)
      }
      for (const theme of ['light', 'dark']) {
        if (await evaluate('document.documentElement.dataset.theme') !== theme) await click(`document.querySelector('.header-actions button[aria-label]')`)
        await call('Emulation.setEmulatedMedia', { media: 'print' })
        await assertPrintPolicy(`${locale}/${experience} standalone/${theme}`, locale, experience)
        await check(`${locale}/${experience} standalone/${theme} print localized with logo and print palette`, `document.querySelector('.print-sources h2').textContent===${JSON.stringify(translator(locale)('sourcesMaterials'))} && document.querySelector('.print-heading img').naturalWidth===64 && getComputedStyle(document.body).backgroundColor==='rgb(255, 255, 255)' && getComputedStyle(document.documentElement).getPropertyValue('--cp-accent').trim()==='#08764f'`)
        await call('Emulation.setEmulatedMedia', { media: '' })
      }
    }
    await go('lab')
    await changeSelect('article:not(.print-only) .fixture-select select', 'valeur-nulle')
    await check(`${locale} standalone localized fixture error`, `${visibleArticle}.querySelector('.report-preview').textContent.includes(${JSON.stringify(locale === 'fr' ? 'Donnée indisponible: Délai moyen' : 'Data unavailable: Average turnaround')})`)
    await go('resources')
    const names = ['report-studio-exercise-brief', 'report-studio-fixture', 'checkpoint-worksheet', 'federation-handoff'].map((base, i) => `${base}${locale === 'fr' ? '-fr' : ''}.${i === 1 ? 'json' : 'txt'}`)
    for (const name of names) await click(`${visibleArticle}.querySelector('[data-download="${name}"]')`)
    await waitFor(async () => (await readdir(standaloneDownloads)).length >= (locale === 'fr' ? 8 : 4), locale + ' standalone downloads')
    for (const name of names) assert.equal(await readFile(resolve(standaloneDownloads, name), 'utf8'), await readFile(resolve('public', locale === 'fr' ? 'downloads-fr' : 'downloads', name), 'utf8'))
    results.push(locale + ' standalone four localized downloads match source')
    await call('Emulation.setEmulatedMedia', { media: 'print' })
    await check(`${locale} standalone print localized`, `document.querySelector('.print-sources h2').textContent===${JSON.stringify(translator(locale)('sourcesMaterials'))} && document.querySelector('.print-heading img').naturalWidth===64`)
    await call('Emulation.setEmulatedMedia', { media: '' })
    await go('overview')
    await screenshot(`onepoint-${locale}-portable`)
  }
  assert.ok(requests.slice(standaloneStart).filter(request => /^(file|https?):/.test(request)).every(request => request.includes('onepoint-workshop-portable.html')))
  results.push('Both standalone languages, all clients, mandatory autopilot and eight downloads use no external app requests')
  // Optional publication is an independent practice branch, never core progress.
  await call('Page.navigate', { url: url + '?scoutTheme=light#ado' })
  await waitFor(() => evaluate(`!!document.querySelector('.optional-ado:not(.print-only)')`), 'optional branch loaded')
  const ado = `document.querySelector('.optional-ado:not(.print-only)')`
  const setInput = async (selector, value) => {
    await evaluate(`(()=>{const input=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`)
    await sleep(100)
  }
  const allCoreChecks = [...content.en.lessons.flatMap(l => l.checks.map((_, i) => `${l.id}-${i}`)), 'setup:planning-team', 'setup:promote', 'setup:delivery-team']
  for (const locale of ['en', 'fr']) for (const experience of clients) {
    const settings = { ...defaults, locale, experience }
    const tag = `optional/${locale}/${experience}`
    const ot = optionalText(locale)
    await seed(settings, ['setup:planning-team'])
    await go('ado')
    await check(`${tag} optional page and skip links`, `${ado}.querySelector('h1').textContent===${JSON.stringify(ot('title'))} && !!${ado}.querySelector('a[href="#federation"]') && !!${ado}.querySelector('a[href="#implementation"]')`)
    await check(`${tag} missing destination blocks only optional copy`, `${ado}.querySelector('.prompt-toolbar button').disabled && !${ado}.querySelector('.prompt-block code')`)
    const before = await evaluate(`({value:document.querySelector('progress').value,max:document.querySelector('progress').max})`)
    await click(`${ado}.querySelector('[data-check-id="ado-0"]')`)
    assert.deepEqual(await evaluate(`({value:document.querySelector('progress').value,max:document.querySelector('progress').max})`), before)
    await call('Page.reload')
    await waitFor(() => evaluate(`!!${ado}`), 'optional checkpoint reload')
    await check(`${tag} optional check persists without core progress change`, `${ado}.querySelector('[data-check-id="ado-0"]').checked && document.querySelector('progress').value===1 && document.querySelector('progress').max===25`)
    await go('federation')
    await check(`${tag} skip publication allows promotion with blank ADO fields`, `!${visibleLesson}.querySelector('[data-setup-id="promote"] button').disabled`)
    await seed(settings, ['setup:planning-team', 'setup:promote', 'setup:delivery-team'])
    await go('implementation')
    await check(`${tag} implementation needs squad, not ADO`, `${visibleLesson}.querySelector('.phase-launch button').disabled && !${visibleLesson}.querySelector('.phase-launch code') && !${visibleLesson}.textContent.includes(${JSON.stringify(ot('destination'))})`)
    for (const name of ['BadName', 'two teams', 'team" mode="other', '../team']) {
      await setInput('article.lesson:not(.print-only) [data-setting="implementationSquad"]', name)
      await check(`${tag} invalid squad ${JSON.stringify(name)} blocks copy`, `${visibleLesson}.querySelector('.phase-launch button').disabled && !${visibleLesson}.querySelector('.phase-launch code')`)
    }
    await setInput('article.lesson:not(.print-only) [data-setting="implementationSquad"]', ' delivery-2 ')
    const request = content[locale].lessons.find(l => l.id === 'implementation').launch
    const expected = expectedPrompt(request, { ...settings, implementationSquad: 'delivery-2' })
    await check(`${tag} valid registered name gives targeted request`, `!${visibleLesson}.querySelector('.phase-launch button').disabled && ${visibleLesson}.querySelector('.phase-launch code').textContent===${JSON.stringify(expected)}`)
    await click(`${visibleLesson}.querySelector('.phase-launch button')`)
    assert.equal(await evaluate('window.__copied'), expected)
    await setLanguage(locale === 'en' ? 'fr' : 'en')
    await check(`${tag} squad and setup survive language switch`, `${visibleLesson}.querySelector('[data-setting="implementationSquad"]').value===' delivery-2 ' && !${visibleLesson}.querySelector('.phase-launch button').disabled`)
    await setLanguage(locale)
    await go('ado')
    await check(`${tag} returning after promotion requests planning target`, `!!${ado}.querySelector('[data-setting="publicationSquad"]') && ${ado}.querySelector('.prompt-toolbar button').disabled`)
    const values = { organization: 'workshop-org', project: 'Project "quoted"', participant: 'team-2', documentTarget: 'Approved Wiki', publicationSquad: 'planning' }
    for (const [field, value] of Object.entries(values)) await setInput(`.optional-ado:not(.print-only) [data-setting="${field}"]`, value)
    const expectedAdo = renderPrompt(publicationPrompt(locale, true), { ...settings, ...values })
    await click(`${ado}.querySelector('.prompt-toolbar button')`)
    assert.equal(await evaluate('window.__copied'), expectedAdo)
    await check(`${tag} promoted publication scopes planning team and waits for batch approval`, `${ado}.querySelector('.prompt-block code').textContent.includes('squad="planning"') && ${ado}.textContent.includes(${JSON.stringify(ot('preview'))})`)
    for (const width of [320, 390]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true })
      await check(`${tag} optional form no horizontal overflow at ${width}`, 'document.documentElement.scrollWidth<=innerWidth+1')
    }
    await evaluate(`${ado}.querySelector('.repo-layout').scrollIntoView({behavior:'instant',block:'start'})`)
    await screenshot(`onepoint-optional-${locale}-${experience}`)
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
    await call('Emulation.setEmulatedMedia', { media: 'print' })
    await check(`${tag} print includes optional page and exact targeted implementation`, `document.querySelector('.optional-ado.print-only').getBoundingClientRect().height>0 && document.querySelector('.optional-ado.print-only').textContent.includes(${JSON.stringify(ot('optionalProgress'))}) && [...document.querySelectorAll('.lesson.print-only .phase-launch code')].some(code=>code.textContent===${JSON.stringify(expected)})`)
    await call('Emulation.setEmulatedMedia', { media: '' })
    await evaluate(`${ado}.querySelector('h1').scrollIntoView({behavior:'instant',block:'start'})`)
    await screenshot(`onepoint-optional-desktop-${locale}-${experience}`)
    await setInput('.optional-ado:not(.print-only) [data-setting="organization"]', '')
    await go('implementation')
    await check(`${tag} removing ADO destination cannot relock implementation`, `!${visibleLesson}.querySelector('.phase-launch button').disabled`)
    await setInput('article.lesson:not(.print-only) [data-setting="implementationSquad"]', '')
    await check(`${tag} clearing squad relocks implementation without removing setup`, `${visibleLesson}.querySelector('.phase-launch button').disabled && JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).checked.includes('setup:delivery-team')`)
    await seed({ ...settings, implementationSquad: 'delivery' }, allCoreChecks)
    await go('ado')
    await evaluate(`[...${ado}.querySelectorAll('.check-row input')].forEach(input=>input.click())`)
    await sleep(100)
    await check(`${tag} optional checks neither exceed nor reduce 100 percent`, `document.querySelector('progress').value===25 && document.querySelector('progress').max===25 && document.querySelector('.progress-box span').textContent==='100%'`)
    await go('overview')
    await check(`${tag} optional branch does not change completed prework CTA`, `document.querySelector('.hero-actions .primary').getAttribute('href')==='#product'`)
  }
  await call('Page.navigate', { url: pathToFileURL(resolve(root, 'onepoint-workshop-portable.html')).href + '?lang=fr#ado' })
  await waitFor(() => evaluate(`!!${ado}`), 'portable optional page')
  await check('Portable French optional branch works without destinations', `${ado}.querySelector('h1').textContent===${JSON.stringify(optionalText('fr')('title'))} && ${ado}.querySelector('.prompt-toolbar button').disabled && !!${ado}.querySelector('a[href="#implementation"]')`)
  await evaluate(`(()=>{const current=new URL(location.href);current.searchParams.delete('lang');history.replaceState(null,'',current)})()`)
  for (const locale of ['en', 'fr']) for (const experience of clients) {
    const settings = { ...defaults, locale, experience, implementationSquad: 'delivery' }
    await seed(settings, ['setup:planning-team', 'setup:promote', 'setup:delivery-team'])
    await go('azure-design')
    const design = `document.querySelector('.optional-design:not(.print-only)')`
    await check(`design/${locale}/${experience} optional page and no implementation completion required`, `${design}.querySelector('h1').textContent===${JSON.stringify(designText(locale)('title'))} && !${design}.querySelector('.prompt-toolbar button').disabled && !!${design}.querySelector('a[href="#resume"]')`)
    const expected = renderPrompt(designPrompt(locale), settings)
    await click(`${design}.querySelector('.prompt-toolbar button')`)
    assert.equal(await evaluate('window.__copied'), expected)
    await click(`${design}.querySelector('[data-check-id="design-0"]')`)
    await check(`design/${locale}/${experience} optional check never changes core progress`, `document.querySelector('progress').value===3 && document.querySelector('progress').max===25`)
    await call('Page.reload')
    await waitFor(() => evaluate(`!!${design}`), 'design reload')
    await check(`design/${locale}/${experience} saved optional progress and explicit render prerequisites`, `${design}.querySelector('[data-check-id="design-0"]').checked && ${design}.textContent.includes('Graphviz') && ${design}.textContent.includes('PNG') && ${design}.textContent.includes('SVG')`)
    await call('Emulation.setDeviceMetricsOverride', { width: 320, height: 844, deviceScaleFactor: 1, mobile: true })
    await check(`design/${locale}/${experience} mobile has no overflow`, 'document.documentElement.scrollWidth<=innerWidth+1')
    await screenshot(`onepoint-design-${locale}-${experience}`)
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
    await go('resources')
    await check(`scope/${locale}/${experience} complete inputs and separate scope download`, `document.querySelector('.resources:not(.print-only) .scope-download').textContent.includes('solution-scope.txt') && document.querySelector('.resources:not(.print-only) .scope-download').textContent.includes('architecture.png')`)
  }
  assert.deepEqual(exceptions, [])
  assert.ok(requests.filter(request => /^https?:/.test(request)).every(request => request.startsWith(origin + '/')))
  results.push('No JavaScript exceptions or external application requests')
  await writeFile(resolve(output, 'browser-qa.txt'), `${results.length} browser checks passed.\n${results.map(item => 'OK — ' + item).join('\n')}\nOffice not executed: QA covers only the guide and its simulation.\n`, 'utf8')
  console.log(`${results.length} browser checks passed; screenshots and report in artifacts.`)
} finally {
  try { if (call && ws?.readyState === WebSocket.OPEN) await call('Browser.close') } catch { /* Transport may close before the response. */ }
  ws?.close()
  server.close()
  await sleep(1000)
  if (browser.exitCode === null) browser.kill()
  try { await rm(profile, { recursive: true, force: true }) } catch { /* Edge may release some profile files later. */ }
}
