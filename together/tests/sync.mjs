// Together sync & edge-case tests: node together/tests/sync.mjs
// Swaps supabase-js for tests/fake-sb.js (an in-page fake server with
// adjustable latency), then replays the races and bugs found in the audit.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FAKE = fs.readFileSync(new URL('./fake-sb.js', import.meta.url))
let chromium
try { ({ chromium } = await import('playwright')) } catch {
  const g = execSync('npm root -g').toString().trim()
  ;({ chromium } = await import(pathToFileURL(path.join(g, 'playwright', 'index.mjs')).href))
}
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }
const server = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (p.endsWith(path.sep)) p += 'index.html'
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(d) })
}).listen(0)
const BASE = `http://localhost:${server.address().port}/`
const browser = await chromium.launch()
const CID = '11111111-1111-4111-8111-111111111111'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const ok = (cond, msg) => { if (!cond) throw new Error(msg) }

let failed = 0
const results = []
async function test(name, fn, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...opts })
  await ctx.route(/supabase\.co|jsdelivr/, r => r.abort())
  await ctx.route(/vendor\/supabase-js/, r => r.fulfill({ body: FAKE, contentType: 'text/javascript' }))
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  try {
    await fn(page)
    if (errors.length) throw new Error('page errors: ' + errors.join(' | '))
    results.push(['✓', name])
  } catch (e) { failed++; results.push(['✗', name + '\n    ' + String(e.message || e).split('\n')[0]]) }
  await ctx.close()
}

const prof = { id: 'p0', kind: 'profile', author_role: 'mom', created_at: new Date(0).toISOString(), synced: true, data: { due: '2027-06-20', momName: 'Sarah', dadName: 'Codey' } }
// paired phone + matching server rows; opened from the personal link
async function seed(page, role, { entries = [], srv = [], extra = {}, ls = {} } = {}) {
  await page.goto(BASE + 'repair.html') // same origin, harmless
  await page.evaluate(([role, entries, srv, extra, ls, CID, prof]) => {
    localStorage.clear()
    localStorage.setItem('together.v1', JSON.stringify({ role, coupleId: CID, code: 'ABCD2345', outbox: [], patches: {}, deletes: [], prefs: {}, entries: [prof, ...entries], ...extra }))
    localStorage.setItem('__srvrows', JSON.stringify([{ ...prof, couple_id: CID }, ...srv.map(e => ({ ...e, couple_id: CID }))]))
    for (const [k, v] of Object.entries(ls)) localStorage.setItem(k, v)
  }, [role, entries, srv, extra, ls, CID, prof])
  await page.goto(BASE + `?c=ABCD2345&r=${role}`); await sleep(500)
}
// unpaired phone with just these settings
async function local(page, state) {
  await page.goto(BASE + 'repair.html')
  await page.evaluate(s => { localStorage.clear(); localStorage.setItem('together.v1', JSON.stringify(s)) }, state)
  await page.goto(BASE); await sleep(400)
}
const L = page => page.evaluate(() => JSON.parse(localStorage.getItem('together.v1')))
const SRV = page => page.evaluate(() => window.__srv.rows)
const online = page => page.evaluate(() => window.dispatchEvent(new Event('online')))
const slow = (page, ms) => page.evaluate(ms => { window.__srv.lat = ms }, ms)

await test('quick tick then untick on a registry item keeps the last tap', async page => {
  const reg = { id: 'r1', kind: 'registry', author_role: 'mom', created_at: new Date(1000).toISOString(), synced: true, data: { name: 'Crib', got: false, cat: 'nursery', qty: '1' } }
  await seed(page, 'mom', { entries: [reg], srv: [reg] })
  await slow(page, 1500)
  await page.click('[data-tab=plan]'); await page.click('[data-pv=registry]'); await page.click('[data-regf=all]')
  await page.click('[data-reg-got=r1]'); await sleep(200); await page.click('[data-reg-got=r1]')
  await sleep(3500); await online(page); await sleep(3500)
  const l = (await L(page)).entries.find(e => e.id === 'r1').data.got, s = (await SRV(page)).find(e => e.id === 'r1').data.got
  ok(l === false && s === false, `phone got=${l}, server got=${s}`)
})

await test('deleting a note while it uploads removes only that note', async page => {
  await seed(page, 'mom')
  await slow(page, 1500)
  await page.click('[data-tab=timeline]'); await page.click('[data-us=feed]')
  await page.fill('#msg', 'note one'); await page.click('[data-act=send-msg]'); await sleep(100)
  await page.fill('#msg', 'note two'); await page.click('[data-act=send-msg]'); await sleep(100)
  const first = (await L(page)).entries.find(e => e.data.text === 'note one').id
  await page.click(`[data-del="${first}"]`)
  await sleep(10000); await online(page); await sleep(4000)
  const mine = (await L(page)).entries.filter(e => e.kind === 'note').map(e => e.data.text)
  const theirs = (await SRV(page)).filter(e => e.kind === 'note').map(e => e.data.text)
  ok(mine.join() === 'note two' && theirs.join() === 'note two', `phone=${mine} server=${theirs}`)
})

await test('coming back online uploads what was typed offline, and it stays on screen', async page => {
  const n = { id: 'q1', kind: 'note', author_role: 'mom', created_at: new Date().toISOString(), data: { text: 'typed offline' } }
  await seed(page, 'mom', { entries: [n], extra: { outbox: ['q1'] }, ls: { __offline: '1' } })
  await page.evaluate(() => { window.__srv.offline = false; window.__srv.lat = 800; window.dispatchEvent(new Event('online')) })
  await sleep(2500)
  ok((await L(page)).entries.some(e => e.id === 'q1') && (await SRV(page)).some(e => e.id === 'q1'), 'entry vanished or never uploaded')
})

await test('editing a check-in while it is still uploading reaches the server', async page => {
  await seed(page, 'mom')
  await slow(page, 1500)
  await page.click('[data-tab=checkin]'); await page.click('[data-mood="2"]'); await page.click('[data-act=save-checkin]'); await sleep(300)
  await page.click('[data-edit-ci]'); await page.click('[data-mood="5"]'); await page.click('[data-act=save-checkin]')
  await sleep(3000); await online(page); await sleep(3500)
  const l = (await L(page)).entries.find(e => e.kind === 'checkin').data.mood, s = (await SRV(page)).find(e => e.kind === 'checkin')?.data.mood
  ok(l === 5 && s === 5, `phone mood=${l}, server mood=${s}`)
})

await test('a phone removed from the couple keeps its entries on screen', async page => {
  const n = { id: 'n9', kind: 'note', author_role: 'mom', created_at: new Date(5000).toISOString(), synced: true, data: { text: 'keep me' } }
  await seed(page, 'mom', { entries: [n], srv: [n] })
  await page.evaluate(() => { window.__srv.removed = true; window.__srv.rows = []; window.dispatchEvent(new Event('online')) })
  await sleep(1500)
  ok((await L(page)).entries.some(e => e.id === 'n9'), 'local entries were wiped')
  ok((await page.innerText('.top')).includes('Disconnected'), 'no "Disconnected" status')
})

await test('week count is right across daylight saving (due date and period date)', async page => {
  await page.clock.install({ time: new Date('2026-10-16T12:00:00-07:00') })
  for (const prefs of [{ due: '2027-01-10' }, { lmp: '2026-04-05' }]) {
    await local(page, { role: 'mom', entries: [], prefs })
    ok((await page.innerText('.top')).includes('Week 27 + 5'), 'wrong week: ' + await page.innerText('.top'))
    const due = await page.innerText('.baby .due')
    ok(due.includes('Jan 10, 2027') && due.includes('86 days'), 'wrong due line: ' + due)
  }
}, { timezoneId: 'America/Los_Angeles' })

await test("his dates never blank her name or OB phone", async page => {
  await page.goto(BASE); await page.click('[data-role=dad]'); await page.click('[data-act=after-connect]')
  await page.fill('#due', '2027-06-21'); await page.click('[data-act=save-dates]')
  const his = (await L(page)).entries.find(e => e.kind === 'profile').data
  ok(JSON.stringify(his) === '{"due":"2027-06-21"}', 'saved blanks: ' + JSON.stringify(his))
  await local(page, { role: 'mom', prefs: {}, entries: [
    { id: 'p0', kind: 'profile', author_role: 'mom', created_at: '2026-10-01T10:00:00.000Z', synced: true, data: { due: '2027-06-20', momName: 'Sarah', dadName: 'Codey', obPhone: '555-1234' } },
    { id: 'p1', kind: 'profile', author_role: 'dad', created_at: '2026-10-02T10:00:00.000Z', synced: true, data: { due: '2027-06-21', momName: '', obPhone: '' } },
    { id: 'c1', kind: 'checkin', author_role: 'mom', created_at: new Date().toISOString(), synced: true, data: { mood: 2, symptoms: {}, temp: '101.2', note: '' } }] })
  ok(await page.locator('a[href^="tel:"]').count() === 1, 'Call OB button missing')
})

for (const act of ['unpair', 'reset']) {
  await test(`after ${act === 'reset' ? 'Erase everything' : 'Unpair'}, the home-screen icon doesn't re-pair`, async page => {
    page.on('dialog', d => d.accept())
    await page.goto(BASE + 'repair.html')
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('together.v1', JSON.stringify({ role: 'dad', coupleId: '11111111-1111-4111-8111-111111111111', code: 'ABCD2345', entries: [], prefs: { due: '2027-06-20' } })) })
    const icon = BASE + '?c=ABCD2345&r=dad'
    await page.goto(icon); await sleep(400)
    await page.click('[data-tab=plan]'); await page.click('[data-pv=settings]'); await page.click(`[data-act=${act}]`); await page.click('dialog.sheet [data-r="1"]')
    await sleep(800); await page.goto(icon); await sleep(800)
    ok(!(await L(page))?.coupleId, 'phone paired itself again')
  })
}

await test('editing a check-in with a symptom this phone doesn\'t know doesn\'t crash', async page => {
  await local(page, { role: 'mom', prefs: { due: '2027-06-20' }, entries: [
    { id: 'c1', kind: 'checkin', author_role: 'mom', created_at: new Date(Date.now() - 864e5).toISOString(), data: { mood: 3, symptoms: { c_gone_x1: 2, nausea: 1 }, temp: '', note: '' } }] })
  await page.click('[data-tab=timeline]'); await page.click('[data-us=her]'); await page.click('[data-edit-ci]')
  ok(!(await page.innerText('main')).includes('Something went wrong'), 'crash screen shown')
})

await test('checking in a second time today updates the first one', async page => {
  await local(page, { role: 'mom', prefs: { due: '2027-06-20' }, entries: [
    { id: 'c1', kind: 'checkin', author_role: 'mom', created_at: new Date().toISOString(), data: { mood: 2, symptoms: {}, temp: '', note: '' } }] })
  await page.click('[data-tab=checkin]')
  ok((await page.innerText('main')).includes('already checked in today'), 'no "already checked in" notice')
  await page.click('[data-mood="4"]'); await page.click('[data-act=save-checkin]')
  const cis = (await L(page)).entries.filter(e => e.kind === 'checkin')
  ok(cis.length === 1 && cis[0].data.mood === 4, `got ${cis.length} check-ins`)
})

await test('links and numbers from the other phone can\'t run code', async page => {
  await local(page, { role: 'mom', prefs: { due: '2027-06-20' }, entries: [
    { id: 'r1', kind: 'registry', author_role: 'dad', created_at: new Date().toISOString(), data: { name: 'Bad', url: 'javascript:alert(1)', cat: 'gear', stars: '<img src=x onerror=alert(2)>', got: false } },
    { id: 'p1', kind: 'profile', author_role: 'dad', created_at: new Date().toISOString(), data: { registryLinks: [{ name: 'x', url: 'javascript:alert(3)' }] } },
    { id: 'd1', kind: 'dadcheck', author_role: 'dad', created_at: new Date().toISOString(), data: { stress: '<img src=x onerror=alert(4)>', feelings: [] } }] })
  await page.click('[data-tab=plan]'); await page.click('[data-pv=registry]'); await page.click('[data-regf=all]')
  ok(await page.locator('a[href^="javascript"]').count() === 0, 'javascript: link rendered')
  ok(await page.locator('main img').count() === 0, 'injected <img> rendered')
  await page.click('[data-tab=timeline]'); await page.click('[data-us=him]')
  ok(await page.locator('main img').count() === 0, 'injected <img> rendered on his side')
})

await test('the empty registry button shows the real number', async page => {
  await local(page, { role: 'mom', entries: [], prefs: { due: '2027-06-20' } })
  await page.click('[data-tab=plan]'); await page.click('[data-pv=registry]')
  ok(/^Add all \d+ suggested basics$/.test(await page.innerText('[data-act=reg-starter]')), 'button text: ' + await page.innerText('[data-act=reg-starter]'))
})

await browser.close()
server.close()
for (const [mark, name] of results) console.log(mark, name)
console.log(failed ? `\n${failed} failed` : `\nall ${results.length} passed`)
process.exit(failed ? 1 : 0)
