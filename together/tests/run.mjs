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

await test('first run: one question per screen (due date → names → connect) and land on Today', async page => {
  await page.goto(BASE)
  await page.click('[data-role=mom]')
  ok((await text(page)).includes("When's the baby due?"), 'due date step missing')
  await page.fill('#due', '2027-06-20'); await page.click('[data-act=save-dates]')
  ok((await text(page)).includes('What should we call you?'), 'names step missing')
  await page.fill('#momName', 'Sarah'); await page.click('[data-act=save-dates]')
  ok((await text(page)).includes('Connect with'), 'connect step missing')
  await page.click('[data-act=after-connect]')
  ok((await page.innerText('.baby .wk')).match(/Week \d+/), 'week card missing on Today')
  ok((await page.innerText('main')).includes('How are you feeling today, Sarah'), 'check-in prompt missing')
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

await test('the stage card follows the pregnancy, and the check-in puts this stage first', async page => {
  await seed(page, 'dad', [momCI(0, { symptoms: { nausea: 2 } })])
  let t = await page.innerText('main')
  ok(t.includes('This stage') && /how you can help this stage/i.test(t) && t.includes("Today's tip") === false && t.includes("Partner's-eye view"), 'his stage card or tip missing')
  await seed(page, 'mom', [], { prefs: { lmp: new Date(Date.now() - 30 * 7 * 864e5).toISOString().slice(0, 10), momName: 'Sarah' }, entries: [] })
  t = await page.innerText('main')
  ok(t.includes('Third trimester begins') && t.includes("This stage's to-dos"), 'third-trimester stage not shown at week 30: ' + t.slice(0, 200))
  await page.click('.tabs .plus')
  ok(/common at week 30/i.test(await page.innerText('.sheet-body')) && await page.locator('.sheet-body [data-sym=breath]').count() === 1, 'check-in not ordered by stage')
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

await test('Today puts his own check-in first: prompt + tab dot, then a ✅ once done', async page => {
  await seed(page, 'dad')
  ok((await page.innerText('main')).includes("You haven't checked in today"), 'no check-in prompt on Today')
  ok(await page.locator('[data-tab=checkin] .badge').count() === 1, 'no dot on the check-in tab')
  await page.click('.cta [data-tab=checkin]'); await page.click('[data-stress="2"]'); await page.click('[data-act=save-dadcheck]')
  ok((await page.innerText('main')).includes('You checked in today'), 'no ✅ after checking in')
  ok(await page.locator('[data-tab=checkin] .badge').count() === 0, 'dot still showing')
})

await test('food search answers anything: list hits, warnings, and rules for unknown foods', async page => {
  await seed(page, 'mom')
  await page.click('[data-tab=lookup]')
  await page.fill('#q', 'is sushi ok')
  ok((await page.innerText('.list')).includes('Sushi (raw fish)'), 'sushi not found')
  await page.fill('#q', 'pink chicken')
  ok((await page.innerText('.list')).includes('Heads up'), 'no warning for pink chicken')
  await page.fill('#q', 'mimosa')
  ok((await page.innerText('.list')).includes('no known safe amount'), 'no alcohol rule for an unlisted drink')
  await page.fill('#q', 'pad thai')
  ok((await page.innerText('.list')).includes('pasteurized, washed, and cooked'), 'no general guidance for an unknown food')
})

await test('push present wishlist: she adds, he sees and secretly marks, she never sees the mark', async page => {
  await seed(page, 'mom')
  await page.click('[data-tab=plan]'); await page.click('[data-pv=registry]'); await page.click('[data-pv=wish]')
  await page.click('[data-act=wish-add]')
  await page.fill('#wishName', 'Birthstone necklace'); await page.check('#wishTop'); await page.click('[data-act=wish-save]')
  const wishes = await page.evaluate(() => JSON.parse(localStorage.getItem('together.v1')).entries.filter(e => e.kind === 'wish'))
  ok(wishes.length === 1 && wishes[0].data.top, 'wish not saved')
  await seed(page, 'dad', [{ ...wishes[0], synced: true }])
  await page.click('[data-tab=plan]'); await page.click('[data-pv=registry]'); await page.click('[data-pv=wish]')
  ok((await page.innerText('main')).includes('Birthstone necklace'), 'partner can\'t see the wish')
  await page.click(`[data-wish-got="${wishes[0].id}"]`)
  const marked = await page.evaluate(() => JSON.parse(localStorage.getItem('together.v1')).entries.find(e => e.kind === 'wish'))
  ok(marked.data.gotByPartner, 'secret mark not saved')
  await seed(page, 'mom', [{ ...marked, synced: true }])
  await page.click('[data-tab=plan]'); await page.click('[data-pv=registry]'); await page.click('[data-pv=wish]')
  const t = await page.innerText('main')
  ok(t.includes('Birthstone necklace') && !t.includes('got this') && !t.includes('✅'), 'the surprise leaked on her phone')
})

await test('pronouns and parent terms picked at setup flow through the app', async page => {
  await seed(page, 'dad', [momCI(0, { symptoms: { nausea: 2 } }), { id: 'p9', kind: 'profile', author_role: 'mom', created_at: new Date().toISOString(), synced: true, data: { momName: 'Sam', momPron: 'they', momTerm: 'Parent', dadName: 'Alex', dadPron: 'she', dadTerm: 'Mama' } }])
  const t = await page.innerText('main')
  ok(t.includes('Sam logged nausea'), 'name not used')
  ok(!/\bshe\b|\bher\b/i.test(t.replace(/Mama/g, '')), 'she/her still shown for a they/them person: ' + (t.match(/.{30}\b(she|her)\b.{30}/i) || [''])[0])
  await page.click('.avatar'); await page.click('[data-act=edit-dates]')
  ok(await page.inputValue('#momPron') === 'they' && await page.inputValue('#dadTerm') === 'Mama', 'setup fields not filled')
})

await test('Is it safe? search finds brand names and shows the disclaimer', async page => {
  await seed(page, 'dad')
  await page.click('[data-tab=lookup]')
  await page.type('#q', 'advil')
  const t = await page.innerText('main')
  ok(t.includes('Ibuprofen') && t.includes('Avoid'), 'Advil → Ibuprofen not found')
  ok(t.includes('not yet reviewed'), 'disclaimer missing')
})

await test('registry: Amazon link fills the name; delete can be undone', async page => {
  await seed(page, 'mom')
  await page.click('[data-tab=plan]'); await page.click('[data-pv=registry]'); await page.click('[data-act=reg-add]')
  await page.fill('#regUrl', 'https://www.amazon.com/Graco-SnugRide-Infant-Car-Seat/dp/B0X'); await page.dispatchEvent('#regUrl', 'input')
  ok(await page.inputValue('#regName') === 'Graco SnugRide Infant Car Seat', 'name not filled from link')
  await page.click('[data-act=reg-save]')
  await page.click('[data-regf=all]')
  await page.click('[data-edit-reg]'); await page.click('.sheet-body [data-del]')
  ok(!(await page.innerText('main')).includes('Graco SnugRide'), 'item not removed')
  await page.click('#toast .undo')
  ok((await page.innerText('main')).includes('Graco SnugRide'), 'undo did not restore')
})

await test('registry: suggestions add once, low rating asks why, recall link shows', async page => {
  await seed(page, 'mom')
  await page.click('[data-tab=plan]'); await page.click('[data-pv=registry]')
  await page.click('details[data-keep=sugg] > summary')
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
  await page.click('[data-act=reg-add]')
  await page.fill('#regUrl', 'https://www.amazon.com/Cheap-Bassinet/dp/B0ABCDEFGH'); await page.dispatchEvent('#regUrl', 'input')
  await page.fill('#regStars', '3.4'); await page.fill('#regReviews', '30'); await page.selectOption('#regCat', 'nursery')
  await page.click('[data-act=reg-save]')
  ok(await page.locator('dialog.sheet').isVisible() && (await page.innerText('dialog.sheet')).includes('rated low'), 'low-rating prompt missing')
  await page.click('dialog.sheet [data-r="0"]')
  await page.click('[data-regf=all]')
  t = await page.innerText('main')
  ok(t.includes('3.4★'), 'rating not shown on item')
  ok((await page.locator('a[href*="product-reviews/B0ABCDEFGH"]').count()) === 1, 'why? link not pointing at critical reviews')
  await page.click('[data-act=reg-add]'); await page.fill('#regName', 'Thing'); await page.fill('#regStars', '9'); await page.click('[data-act=reg-save]')
  ok((await page.innerText('#toast')).includes('0 to 5'), 'bad rating accepted')
})

await test('half-typed forms survive a redraw', async page => {
  await seed(page, 'mom')
  await page.click('[data-tab=plan]'); await page.click('[data-pv=registry]'); await page.click('[data-act=reg-add]')
  await page.fill('#regName', 'Swaddles'); await page.fill('#regNotes', 'gray ones')
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))) // redraws the screen
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
  await page.click('[data-act=more-syms]'); await page.click('[data-act=add-symptom]')
  ok(await page.locator('dialog.sheet').isVisible(), 'in-app dialog not shown')
  await page.fill('dialog.sheet input', 'Metallic taste'); await page.click('dialog.sheet [data-r="1"]')
  ok((await page.innerText('.sheet-body')).includes('Metallic taste'), 'custom symptom not added')
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
