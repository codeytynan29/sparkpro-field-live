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

await test('week by week: this week on Today, and flip through every week like the book', async page => {
  await seed(page, 'dad', [], { prefs: { lmp: new Date(Date.now() - 5 * 7 * 864e5).toISOString().slice(0, 10), momName: 'Sarah' }, entries: [] })
  ok((await page.innerText('.baby')).includes("Sarah's body this week") && (await page.innerText('.baby')).includes('Your move this week'), 'weekly lines missing on Today')
  await page.click('.baby [data-week]')
  ok((await page.innerText('.week-nav')).includes('Week 5') && (await page.innerText('.week-nav')).includes('this week'), 'week view not on this week')
  await page.click('.week-nav [aria-label="Next week"]')
  ok((await page.innerText('.week-nav')).includes('Week 6') && (await page.innerText('main')).includes('lentil'), 'next week did not open')
  await page.click('.week-dots [aria-label="Week 40"]')
  ok((await page.innerText('main')).includes('Due date week'), 'jumping to week 40 failed')
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

const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('together.v1')))
const openTool = async (page, id) => { await page.click('[data-tab=plan]'); await page.click('[data-pv=tools]'); await page.click(`[data-tool=${id}]`) }

await test('tools: kick counter counts to 10 and saves; contractions time and list', async page => {
  await seed(page, 'mom')
  await openTool(page, 'kicks')
  ok((await page.innerText('.title')) === 'Kick counter', 'tool title missing')
  await page.click('[data-act=kick-start]')
  for (let i = 0; i < 10; i++) await page.click('[data-act=kick-tap]')
  let st = await stored(page)
  ok(st.entries.some(e => e.kind === 'kicks' && e.data.count === 10), 'kick session not saved')
  ok((await text(page)).includes('10 movements in'), 'recent counts not listed')
  await page.click('text=‹ All tools'); await page.click('[data-tool=contractions]')
  await page.click('[data-act=ctx-start]'); await page.waitForTimeout(1100)
  ok(/0:0[1-9]/.test(await page.innerText('#tick')), 'timer does not tick')
  await page.click('[data-act=ctx-stop]')
  st = await stored(page)
  ok(st.entries.filter(e => e.kind === 'contraction').length === 1, 'contraction not saved')
  ok((await text(page)).includes('in the last hour'), 'contraction stats missing')
})

await test('tools: 5-1-1 contractions show the call card', async page => {
  const now = Date.now(), list = Array.from({ length: 10 }, (_, i) => { const start = now - (50 - i * 5) * 60000; return { id: 'c' + i, kind: 'contraction', author_role: 'dad', created_at: new Date(start + 60000).toISOString(), synced: true, data: { start, end: start + 62000 } } })
  await seed(page, 'mom', list)
  await openTool(page, 'contractions')
  ok((await text(page)).includes('About 5 minutes apart'), '5-1-1 alert missing')
})

await test('tools: baby names only show a match when you both like it', async page => {
  await seed(page, 'mom', [{ id: 'v1', kind: 'namevote', author_role: 'dad', created_at: at(1), synced: true, data: { name: 'Juniper', like: true } }])
  await openTool(page, 'names')
  await page.fill('#nameAdd', 'Juniper'); await page.click('[data-act=name-add][data-sex=g]')
  await page.click('[data-nameview=matches]')
  ok((await page.innerText('main')).includes('💞 Juniper'), 'match not shown')
  await page.click('[data-nameview=swipe]')
  const before = (await stored(page)).entries.filter(e => e.kind === 'namevote').length
  await page.click('[data-vote][data-like="0"]')
  ok((await stored(page)).entries.filter(e => e.kind === 'namevote').length === before + 1, 'pass not saved')
})

await test('tools: hospital bag starter list, tick, and OB questions reach the summary', async page => {
  await seed(page, 'mom', [momCI(1, { mood: 4 })])
  await openTool(page, 'bag')
  await page.click('[data-act=bag-starter]'); await page.waitForTimeout(300)
  const n = (await stored(page)).entries.filter(e => e.kind === 'check' && e.data.list === 'bag').length
  ok(n > 20, 'starter list not added: ' + n)
  await page.locator('[data-check]').first().click()
  ok((await page.innerText('main')).includes('Packed (1)'), 'tick did not move it to packed')
  await page.click('text=‹ All tools'); await page.click('[data-tool=questions]')
  await page.fill('#checkAdd', 'Is my iron OK?'); await page.click('[data-act=check-add]')
  await page.click('text=‹ All tools'); await page.click('[data-tool=health]')
  await page.fill('#vBp', '150/95'); await page.fill('#vWeight', '150'); await page.click('[data-act=vitals-save]')
  ok((await text(page)).includes('BP 150/95'), 'vitals not listed')
  await page.click('[data-tab=today]')
  ok((await page.innerText('main')).includes('Blood pressure 150/95'), 'high BP not flagged on Today')
  await page.click('[data-tab=timeline]')
  await page.click('.seg [data-us=history]')
  await page.click('[data-act=ob-copy]')
  const clip = await page.evaluate(() => navigator.clipboard.readText())
  ok(clip.includes('Is my iron OK?') && clip.includes('BP 150/95'), 'OB summary missing questions or BP: ' + clip.slice(0, 200))
})

await test('tools: birth plan choices save and copy as text', async page => {
  await seed(page, 'mom')
  await openTool(page, 'birthplan')
  await page.locator('[data-bp]').first().click()
  ok(await page.locator('[data-bp].on').count() === 1, 'choice not highlighted')
  await page.click('[data-act=bp-copy]')
  const clip = await page.evaluate(() => navigator.clipboard.readText())
  ok(clip.startsWith('Birth preferences') && clip.includes('•'), 'birth plan text wrong: ' + clip.slice(0, 120))
})

await test('newborn mode: baby is here → feeds and diapers; mood check offers 988', async page => {
  await seed(page, 'mom')
  await page.click('[data-tab=settings]'); await page.click('[data-act=baby-here]')
  await page.fill('dialog.sheet input', 'Ava'); await page.click('dialog.sheet [data-r="1"]')
  await page.click('dialog.sheet [data-r="1"]')
  ok((await page.innerText('main')).includes('Ava') && (await text(page)).includes('born today'), 'newborn Today missing')
  await page.click('[data-feed=bottle]'); await page.click('[data-diaper=both]')
  const stat = await page.innerText('.stat-row')
  ok(stat.includes('1\nfeeds') || /1\s*feeds/.test(stat), 'feed not counted: ' + stat)
  await page.click('[data-tool=moodcheck]')
  await page.click('[data-mood-q=self_harm][data-yes="1"]')
  ok(await page.locator('a[href="tel:988"]').count() === 1, '988 not offered')
  ok(!(await stored(page)).entries.some(e => e.kind === 'moodcheck'), 'mood answers were saved')
})

await test('loss mode: Today shows support on both phones, and can be turned back', async page => {
  await seed(page, 'dad', [{ id: 'pl', kind: 'profile', author_role: 'mom', created_at: at(0), synced: true, data: { mode: 'loss' } }])
  const t = await page.innerText('main')
  ok(t.includes('For you, Codey') && !t.includes('Week '), 'loss Today wrong')
  ok(!(await page.locator('.tabs .badge').count()), 'check-in badge still nags')
  await page.click('[data-tab=settings]'); await page.click('[data-act=loss-off]'); await page.click('dialog.sheet [data-r="1"]')
  await page.click('[data-tab=today]')
  ok((await page.locator('.baby .wk').count()) === 1, 'pregnancy view did not come back')
})

await browser.close()
server.close()
for (const [mark, name] of results) console.log(mark, name)
console.log(failed ? `\n${failed} failed` : `\nall ${results.length} passed`)
process.exit(failed ? 1 : 0)
