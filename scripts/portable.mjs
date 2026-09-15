import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve('dist')
let html = await readFile(resolve(root, 'index.html'), 'utf8')
const script = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/)
const style = html.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/)
if (!script || !style) throw new Error('Unexpected Vite structure: check the bundle before creating portable HTML.')
let js = await readFile(resolve(root, script[1]), 'utf8')
const css = await readFile(resolve(root, style[1]), 'utf8')
const logo = await readFile(resolve(root, 'hve-squad-logo.svg'))
const logoPath = /(["'`])\.\/hve-squad-logo\.svg\1/g
if (!js.match(logoPath)) throw new Error('The logo URL changed; reassess portable embedding before distributing.')
js = js.replaceAll(logoPath, JSON.stringify(`data:image/svg+xml;base64,${logo.toString('base64')}`))
// Vite produces one bundle without external imports; the script stays deferred until the body.
if (/\bimport\s*(?:\(|["'{*])|\bexport\s*\{/.test(js)) throw new Error('The bundle contains external modules; portable HTML must be reassessed.')
html = html.replace(script[0], '').replace(style[0], `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`)
html = html.replace('</body>', () => `<script>${js.replace(/<\/script/gi, '<\\/script')}</script></body>`)
await writeFile(resolve(root, 'onepoint-workshop-portable.html'), html, 'utf8')
console.log('Standalone portable HTML created: dist/onepoint-workshop-portable.html')
