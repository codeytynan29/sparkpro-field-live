// Together smoke tests: node together/tests/run.mjs
// Serves the app locally, drives it in headless Chromium (Playwright) as both
// partners, and checks the flows that have broken before. The Supabase backend
// is blocked, so tests run against the offline, on-phone behaviour.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let chromium
try { ({ chromium } = await import('playwright')) } catch {
  const g = execSync('npm root -g').toString().trim()
  ;({ chromium } = await import(pathToFileURL(path.join(g, 'playwright', 'index.mjs')).href))
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (p.endsWith(path.sep)) p += 'index.html'
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(d) })
}).listen(0)
const BASE = `http://localhost:${server.address().port}/`

const browser = await chromium.launch()
let failed = 0
const results = []
async function test(name, fn) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'] })
  await ctx.route(/supabase\.co|jsdelivr/, r => r.abort())
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('dialog', d => d.accept())
  try {
    await fn(page, ctx)
    if (errors.length) throw new Error('page errors: ' + errors.join(' | '))
    results.push(['✓', name])
  } catch (e) {
    failed++; results.push(['✗', name + '\n    ' + String(e.message || e).split('\n')[0]])
  }
  await ctx.close()
}
const ok = (cond, msg) => { if (!cond) throw new Error(msg) }
const text = page => page.innerText('body')
const at = d => new Date(Date.now() - d * 864e5).toISOString()
async function seed(page, role, entries = [], extra = {}) {
  await page.goto(BASE)
  await page.evaluate(([role, entries, extra]) => localStorage.setItem('together.v1', JSON.stringify({
    role, outbox: [], patches: {}, deletes: [], prefs: { due: '2027-06-20', momName: 'Sarah', dadName: 'Codey' },
    entries: [{ id: 'p0', kind: 'profile', author_role: 'mom', created_at: new Date(0).toISOString(), synced: true, data: { due: '2027-06-20', momName: 'Sarah', dadName: 'Codey' } }, ...entries], ...extra,
  })), [role, entries, extra])
  await page.reload()
  await page.waitForTimeout(300)
}
const momCI = (d, data) => ({ id: 'ci' + d, kind: 'checkin', author_role: 'mom', created_at: at(d), synced: true, data: { mood: 3, energy: 3, symptoms: {}, temp: '', note: '', ...data } })

await test('first run: pick role, skip connecting, enter doctor due date, land on Today', async page => {
  await page.goto(BASE)
  await page.click('[data-role=mom]')
  ok((await text(page)).includes('Connect with'), 'connect step missing')
  await page.click('[data-act=after-connect]')
  await page.fill('#due', '2027-06-20')
  await page.click('[data-act=save-dates]')
  ok((await text(page)).includes("You're all set"), 'done step missing')
  await page.click('[data-act=finish-onboard]')
  ok((await page.innerText('.top')).match(/Week \d+ \+ \d/), 'week not shown in header')
})

await test('her check-in saves, then editing it changes it in place', async page => {
  await seed(page, 'mom')
  await page.click('[data-tab=checkin]')
  await page.click('[data-mood="2"]'); await page.click('[data-sym=nausea]'); await page.click('[data-sym=nausea]')
  await page.click('[data-act=save-checkin]')
  await page.click('[data-edit-ci]'); await page.click('[data-mood="4"]'); await page.click('[data-act=save-checkin]')
  const n = await page.evaluate(() => JSON.parse(localStorage.getItem('together.v1')).entries.filter(e => e.kind === 'checkin'))
  ok(n.length === 1 && n[0].data.mood === 4, 'edit created a duplicate or did not apply')
})

await test('his Today shows "she logged X, try Y" and a game plan', async page => {
  await seed(page, 'dad', [momCI(0, { mood: 2, symptoms: { nausea: 2, fatigue: 1 } })])
  const t = await text(page)
  ok(t.includes('Sarah logged nausea & exhaustion today'), 'nudge headline missing')
  ok(t.includes('Your game plan today'), 'game plan missing')
})

await test('Us → his side: self-care on his phone, "support him" only on hers', async page => {
  const dc = { id: 'dc', kind: 'dadcheck', author_role: 'dad', created_at: at(0), synced: true, data: { stress: 4, feelings: ['worried'] } }
  await seed(page, 'dad', [momCI(0, { symptoms: { nausea: 1 } }), dc])
  await page.click('[data-tab=timeline]'); await page.click('[data-us=him]')
  let t = await text(page)
  ok(t.includes('Taking care of yourself') && t.includes('What you can do for') && !t.includes('How you can support him'), 'wrong cards on his phone')
  await seed(page, 'mom', [momCI(0, {}), dc])
  await page.click('[data-tab=timeline]'); await page.click('[data-us=him]')
  t = await text(page)
  ok(t.includes('How you can support him') && !t.includes('Taking care of yourself'), 'wrong cards on her phone')
})

await test('Is it safe? search finds brand names and shows the disclaimer', async page => {
  await seed(page, 'dad')
  await page.click('[data-tab=lookup]')
  await page.type('#q', 'advil')
  const t = await page.innerText('main')
  ok(t.includes('Ibuprofen') && t.includes('Avoid'), 'Advil → Ibuprofen not found')
  ok(t.includes('not yet been reviewed'), 'disclaimer missing')
})

await test('registry: Amazon link fills the name; delete can be undone', async page => {
  await seed(page, 'mom')
  await page.click('[data-tab=plan]'); await page.click('[data-pv=registry]')
  await page.fill('#regUrl', 'https://www.amazon.com/Graco-SnugRide-Infant-Car-Seat/dp/B0X'); await page.dispatchEvent('#regUrl', 'input')
  ok(await page.inputValue('#regName') === 'Graco SnugRide Infant Car Seat', 'name not filled from link')
  await page.click('[data-act=reg-save]')
  await page.click('[data-regf=all]')
  await page.click('.reg [data-del]')
  ok(!(await page.innerText('main')).includes('Graco SnugRide'), 'item not removed')
  await page.click('#toast .undo')
  ok((await page.innerText('main')).includes('Graco SnugRide'), 'undo did not restore')
})

await test('registry: suggestions add once, low rating asks why, recall link shows', async page => {
  await seed(page, 'mom')
  await page.click('[data-tab=plan]'); await page.click('[data-pv=registry]')
  await page.click('[data-sug-add=carseat]')
  let t = await page.innerText('main')
  ok(t.includes('Infant car seat') && t.includes('On your list'), 'suggestion not added / not marked')
  ok((await page.locator('#regSuggest .sug.have').count()) === 1, 'items not on the list are marked as on it')
  ok((await page.locator('#regSuggest a[href*="nhtsa.gov"]').count()) === 1 && (await page.locator('#regSuggest a[href*="cpsc.gov"]').count()) >= 1, 'suggestion recall links missing')
  ok((await page.locator('a[href*="nhtsa.gov"]').count()) >= 1, 'car seat recall link should go to NHTSA')
  await page.click('[data-sugcat=nursery]')
  ok((await page.innerText('#regSuggest')).includes('Bassinet'), 'category switch failed')
  await page.click('#regSuggest summary'); await page.click('[data-sugcat=gear]')
  ok(await page.locator('#regSuggest details').evaluate(d => d.open), 'skip list closed on redraw')
  await page.fill('#regUrl', 'https://www.amazon.com/Cheap-Bassinet/dp/B0ABCDEFGH'); await page.dispatchEvent('#regUrl', 'input')
  await page.fill('#regStars', '3.4'); await page.fill('#regReviews', '30'); await page.selectOption('#regCat', 'nursery')
  await page.click('[data-act=reg-save]')
  ok(await page.locator('dialog.sheet').isVisible() && (await page.innerText('dialog.sheet')).includes('rated low'), 'low-rating prompt missing')
  await page.click('dialog.sheet [data-r="0"]')
  await page.click('[data-regf=all]')
  t = await page.innerText('main')
  ok(t.includes('3.4★') && t.includes('few reviews'), 'rating not shown on item')
  ok((await page.locator('a[href*="product-reviews/B0ABCDEFGH"]').count()) === 1, 'why? link not pointing at critical reviews')
  await page.fill('#regName', 'Thing'); await page.fill('#regStars', '9'); await page.click('[data-act=reg-save]')
  ok((await page.innerText('#toast')).includes('0 to 5'), 'bad rating accepted')
})

await test('half-typed forms survive a redraw', async page => {
  await seed(page, 'mom')
  await page.click('[data-tab=plan]'); await page.click('[data-pv=registry]')
  await page.fill('#regName', 'Swaddles'); await page.fill('#regNotes', 'gray ones')
  await page.click('[data-regf=all]') // any click redraws the screen
  ok(await page.inputValue('#regName') === 'Swaddles' && await page.inputValue('#regNotes') === 'gray ones', 'form was wiped')
})

await test('History lists both partners by day, OB summary counts symptoms', async page => {
  await seed(page, 'mom', [momCI(0, { symptoms: { nausea: 2 } }), momCI(1, { symptoms: { nausea: 1 }, temp: '100.6' }), { id: 'dc', kind: 'dadcheck', author_role: 'dad', created_at: at(1), synced: true, data: { stress: 3, feelings: [] } }])
  await page.click('[data-tab=timeline]'); await page.click('[data-us=history]')
  const t = await page.innerText('main')
  ok(t.includes('Nausea: 2 days, strongest moderate'), 'summary symptom line wrong')
  ok(t.includes('Temperatures logged') && t.includes('Warning signs logged'), 'temp / warning lines missing')
  ok((await page.locator('.hday').count()) === 2, 'expected two days of history')
})

await test('paired phone writes the couple code into the address (personal link)', async page => {
  await seed(page, 'dad', [], { coupleId: '11111111-1111-4111-8111-111111111111', code: 'ABCD2345' })
  ok(page.url().includes('c=ABCD2345') && !page.url().includes('r='), 'address not stamped as one shared link: ' + page.url())
})

await test('dialogs are in-app, not browser pop-ups', async page => {
  await seed(page, 'mom')
  await page.click('[data-tab=checkin]')
  await page.click('[data-act=add-symptom]')
  ok(await page.locator('dialog.sheet').isVisible(), 'in-app dialog not shown')
  await page.fill('dialog.sheet input', 'Metallic taste'); await page.click('dialog.sheet [data-r="1"]')
  ok((await page.innerText('main')).includes('Metallic taste'), 'custom symptom not added')
})

await test('public registry page renders safely and claims', async page => {
  await page.route('**/functions/v1/tg-registry**', r => r.request().method() === 'GET'
    ? r.fulfill({ json: { names: ['Sarah', 'Codey'], dueMonth: 'June 2027', links: [], items: [
        { id: 'a', name: 'Car seat', url: 'https://www.amazon.com/x/dp/B0', price: '199', qty: '1', cat: 'gear', notes: '', taken: false },
        { id: 'b', name: '<img src=x onerror=alert(1)>', url: 'javascript:alert(1)', price: '', qty: '1', cat: 'other', notes: '', taken: false }] } })
    : r.fulfill({ json: { ok: true } }))
  await page.goto(BASE + 'registry.html?t=test_token_123456')
  await page.waitForTimeout(300)
  ok((await page.locator('a[href^="javascript"]').count()) === 0 && (await page.locator('main img').count()) === 0, 'unsafe content rendered')
  await page.click('button[data-id=a]'); await page.fill('#dlgName', 'Aunt Jo'); await page.click('#dlgOk'); await page.waitForTimeout(200)
  ok((await page.locator('.item.taken').count()) === 1, 'claim did not mark the item taken')
})

await browser.close()
server.close()
for (const [mark, name] of results) console.log(mark, name)
console.log(failed ? `\n${failed} failed` : `\nall ${results.length} passed`)
process.exit(failed ? 1 : 0)
