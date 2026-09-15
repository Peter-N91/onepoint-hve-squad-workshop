import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { agenda, prework, prompts } from '../src/content.ts'
import { storageKey } from '../src/state.ts'

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
  await check('09:00 opens Part 03 planning init then product request', `${visibleLesson}.querySelector('.big-number').textContent==='03' && ${visibleLesson}.querySelector('.eyebrow').textContent.includes('09:00–10:00 CEST · 60 live minutes') && ${visibleLesson}.querySelector('[data-setup-id="planning-team"] pre').textContent===${JSON.stringify(prompts.planningInit)} && ${visibleLesson}.querySelector('.phase-launch pre').textContent===${JSON.stringify(prompts.product)}`)
  await check('Product copy blocked before confirmation', `${visibleLesson}.querySelector('.phase-launch button').disabled`)
  await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text}}})`)
  await click(`${visibleLesson}.querySelector('[data-setup-id="planning-team"] input')`)
  await check('Planning confirmation unlocks copy', `!${visibleLesson}.querySelector('.phase-launch button').disabled`)
  await click(`${visibleLesson}.querySelector('.phase-launch button')`)
  assert.equal(await evaluate('window.__copied'), prompts.product)
  results.push('Exact product request copied, without internal instructions')
  await go('federation')
  await check('Delivery init copy blocked before promotion', `${visibleLesson}.querySelector('[data-setup-id="delivery-team"] button').disabled`)
  await click(`${visibleLesson}.querySelector('[data-setup-id="promote"] input')`)
  await click(`${visibleLesson}.querySelector('[data-setup-id="delivery-team"] input')`)
  await go('implementation')
  await check('Three confirmations unlock implementation', `!${visibleLesson}.querySelector('.phase-launch button').disabled`)
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
