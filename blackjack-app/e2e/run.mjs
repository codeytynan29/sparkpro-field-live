// End-to-end checks in headless Chromium against the production build.
//   npm run build && npm run e2e
// Starts `vite preview`, drives the real UI, and fails with a non-zero exit code on any
// failed check. Hands are dealt from stacked shoes via the 'bj-test-shoe' test hook so
// every scenario is deterministic.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
let playwright
try { playwright = require('playwright') } catch { playwright = require('/opt/node22/lib/node_modules/playwright') }
const { chromium, devices } = playwright

const HERE = dirname(fileURLToPath(import.meta.url))
const SHOTS = join(HERE, 'shots')
mkdirSync(SHOTS, { recursive: true })
const PORT = 4179
const URL = `http://localhost:${PORT}/`

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: join(HERE, '..'), stdio: 'pipe' })
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview server did not start')), 20000)
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); resolve() } })
})

const results = []
async function check(name, fn) {
  try {
    await fn()
    results.push([true, name])
    console.log('  ✓', name)
  } catch (e) {
    results.push([false, name, e.message])
    console.log('  ✗', name, '\n     ', e.message.slice(0, 300).replace(/\n/g, ' | '))
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg) }

const browser = await chromium.launch()
const pageErrors = []

async function freshPage(opts = { viewport: { width: 1280, height: 900 } }) {
  const ctx = await browser.newContext({ ...opts, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => pageErrors.push(e.message))
  await page.goto(URL)
  return { ctx, page }
}

async function setProgress(page, fn) {
  await page.evaluate((src) => {
    const key = 'bj-the-table:v1'
    const p = JSON.parse(localStorage.getItem(key) || 'null')
    // eslint-disable-next-line no-new-func
    const out = new Function('p', src)(p)
    localStorage.setItem(key, JSON.stringify(out))
  }, `p = p || {}; ${fn}; return p`)
}

/** Seat at a venue with a stacked shoe. */
async function sit(page, shoe, venue = 'Practice Table') {
  await page.evaluate((s) => localStorage.setItem('bj-test-shoe', s), shoe)
  await setProgress(page, 'p.settings = p.settings || {}; p.settings.reduceMotion = true')
  await page.goto(URL + '#/')
  await page.reload()
  await page.goto(URL + '#/play')
  await page.getByRole('button', { name: new RegExp(venue) }).click()
}
async function deal(page) {
  await page.getByRole('button', { name: /^Deal/ }).click()
  await page.waitForTimeout(300)
}
async function press(page, label) {
  await page.getByRole('button', { name: new RegExp(`^${label}`) }).first().click()
  await page.waitForTimeout(300)
}
/** Poll an element's text until it matches (or time out), then return it. */
async function textOf(locator, re, ms = 6000) {
  const end = Date.now() + ms
  let t = ''
  while (Date.now() < end) {
    t = (await locator.count()) ? await locator.first().evaluate((el) => el.textContent) : ''
    if (!re || re.test(t)) return t
    await new Promise((r) => setTimeout(r, 150))
  }
  return t
}
const teach = (page, re = /decision|Blackjack|Dealer has/) => textOf(page.locator('section[aria-label="Teaching dealer"]'), re)
const table = (page, re) => textOf(page.locator('section[aria-label="Blackjack table"]'), re)

console.log('Navigation')
{
  const { ctx, page } = await freshPage()
  const routes = [['Home', /Learn the game/], ['Play Blackjack', /Play Blackjack/], ['Learn', /^Learn$/], ['Practice', /^Practice$/], ['Casino Etiquette', /Casino Etiquette/], ['Strategy', /^Strategy$/], ['Card Counting', /Card Counting/], ['My Progress', /My Progress/]]
  for (const [link, heading] of routes) {
    await check(`sidebar → ${link}`, async () => {
      await page.locator('aside').getByRole('link', { name: link, exact: true }).click()
      await page.getByRole('heading', { level: 1, name: heading }).waitFor({ timeout: 4000 })
    })
  }
  await check('settings page and unknown route', async () => {
    await page.goto(URL + '#/settings')
    await page.getByRole('heading', { level: 1, name: 'Settings' }).waitFor()
    await page.goto(URL + '#/nowhere')
    await page.getByText('No table here').waitFor()
  })
  await check('reference drawer opens with strategy chart', async () => {
    await page.goto(URL + '#/')
    await page.locator('aside').getByRole('button', { name: 'Reference' }).click()
    await page.getByRole('dialog', { name: 'Reference' }).getByText('Hard totals').waitFor()
    await page.keyboard.press('Escape')
  })
  await ctx.close()
}

console.log('Blackjack table')
{
  const { ctx, page } = await freshPage()
  await check('stand on 16 vs 10, dealer busts: won, but graded a wrong decision', async () => {
    await sit(page, '10S 10H 6D 6C 10D')
    await deal(page)
    await press(page, 'Stand')
    const t = await teach(page)
    assert(/Wrong decision/.test(t) && /Won/.test(t), t)
    assert(/doesn’t make it right/.test(t), 'should say winning does not make it right')
  })
  await check('hit 12 vs 10, bust: lost, but graded a correct decision', async () => {
    await sit(page, '10S KH 2D 7C KD')
    await deal(page)
    await press(page, 'Hit')
    const t = await teach(page)
    assert(/Correct decision/.test(t) && /Lost/.test(t) && /Bad luck, good decision/.test(t), t)
  })
  await check('double down: one card, double bet, pays $40 on $20', async () => {
    await sit(page, '6S 6H 5D 10C 10S 9H')
    await deal(page)
    await press(page, 'Double down')
    const t = await table(page, /Win/)
    assert(/Win \+\$40/.test(t), t)
    assert(/Correct decision/.test(await teach(page)), 'double 11 vs 6 is correct')
  })
  await check('split 8s into two hands, double after split, both reviewed', async () => {
    await sit(page, '8S 10H 8D 7C 3S KD 10C')
    await deal(page)
    await press(page, 'Split')
    await press(page, 'Double down')
    await press(page, 'Stand')
    const t = await teach(page, /Hand 2/)
    assert((t.match(/Hand \d/g) || []).length === 2, t)
    assert(/Win \+\$40[\s\S]*Win \+\$20/.test(await table(page, /Win \+\$40[\s\S]*Win \+\$20/)), await table(page))
  })
  await check('late surrender returns half the bet', async () => {
    await sit(page, '10S 10H 6D 7C')
    await deal(page)
    await press(page, 'Surrender')
    assert(/Surrendered −\$10/.test(await table(page, /Surrendered −\$10/)), await table(page))
    assert(/Correct decision/.test(await teach(page)), 'surrender 16 vs 10 is correct with LS')
  })
  await check('insurance: offered on Ace, pays 2:1 into a net push, graded not recommended', async () => {
    await sit(page, '10S AH 9D KC')
    await deal(page)
    await page.getByText('Insurance?', { exact: true }).waitFor()
    await press(page, 'Yes, insure')
    const t = await teach(page)
    assert(/Insurance offer/.test(t) && /Wrong decision/.test(t) && /Push/.test(t), t)
    assert(/Insured \$10/.test(await table(page, /Insured/)), 'insurance chips shown')
  })
  await check('blackjack pays 3:2', async () => {
    await sit(page, 'AS 9H KD 7C')
    await deal(page)
    assert(/Blackjack! \+\$30/.test(await table(page, /Blackjack! \+\$30/)), await table(page))
  })
  await check('blackjack pays 6:5 when the table says so', async () => {
    await setProgress(page, "p.settings.rules.blackjackPayout = '6:5'; p.settings.presetId = 'custom'")
    await sit(page, 'AS 9H KD 7C')
    await deal(page)
    assert(/Blackjack! \+\$24/.test(await table(page, /Blackjack! \+\$24/)), await table(page))
    await setProgress(page, "p.settings.rules.blackjackPayout = '3:2'")
  })
  await check('S17: dealer stands on soft 17 (18 wins)', async () => {
    await setProgress(page, 'p.settings.rules.dealerHitsSoft17 = false')
    await sit(page, '10S AH 8D 6C 4S')
    await deal(page)
    await press(page, 'No insurance')
    await press(page, 'Stand')
    assert(/Win \+\$20/.test(await table(page, /Win \+\$20/)), await table(page))
  })
  await check('H17: dealer hits soft 17 (draws to 21, 18 loses)', async () => {
    await setProgress(page, 'p.settings.rules.dealerHitsSoft17 = true')
    await sit(page, '10S AH 8D 6C 4S')
    await deal(page)
    await press(page, 'No insurance')
    await press(page, 'Stand')
    assert(/Lose −\$20/.test(await table(page, /Lose −\$20/)), await table(page))
    await setProgress(page, 'p.settings.rules.dealerHitsSoft17 = false')
  })
  await check('Atlantic City floor: other players and hand-signal controls', async () => {
    await page.evaluate(() => localStorage.removeItem('bj-test-shoe'))
    await page.goto(URL + '#/')
    await page.reload()
    await page.goto(URL + '#/play')
    await page.getByRole('button', { name: /Atlantic City Floor/ }).click()
    const t = await table(page)
    assert(/Marty/.test(t) && /Big Lou/.test(t), t)
    for (let i = 0; i < 4; i++) {
      await deal(page)
      for (let k = 0; k < 8; k++) {
        const ctl = await page.locator('section[aria-label=Controls]').innerText()
        if (/No insurance/.test(ctl)) await press(page, 'No insurance')
        else if (/Wave off/.test(ctl)) { await page.getByRole('button', { name: /Wave off/ }).first().click(); await page.waitForTimeout(300) }
        else if (/Deal next hand/.test(ctl)) break
        else await page.waitForTimeout(300)
      }
    }
    await page.screenshot({ path: join(SHOTS, 'atlantic-city.png') })
  })
  await check('progress persists across a reload, outcomes separate from decisions', async () => {
    await page.reload()
    await page.goto(URL + '#/progress')
    await page.getByRole('heading', { level: 1, name: 'My Progress' }).waitFor()
    const txt = await page.locator('main').textContent()
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('bj-the-table:v1')))
    assert(saved.hands.played >= 10, 'hands played: ' + saved.hands.played)
    assert(saved.hands.correctLosses >= 1 && saved.hands.mistakeWins >= 1, JSON.stringify(saved.hands))
    assert(saved.decisions.total >= 10, 'decisions: ' + saved.decisions.total)
    const shown = Number(/Hands played\s*([\d,]+)/.exec(txt)?.[1]?.replace(/,/g, ''))
    assert(shown === saved.hands.played, `progress page shows ${shown}, saved ${saved.hands.played}`)
    assert(/Right play, lost anyway[1-9]/.test(txt) && /Wrong play, won anyway[1-9]/.test(txt), 'dashboard separates outcomes from decisions')
    assert(/Hard 16 vs 10/.test(txt), 'most frequent mistakes lists 16 vs 10')
  })
  await ctx.close()
}

console.log('Learning and practice')
{
  const { ctx, page } = await freshPage()
  await check('complete lesson 1 and earn XP; it stays completed after reload', async () => {
    await page.goto(URL + '#/learn/l1-welcome')
    for (let i = 0; i < 10; i++) {
      const opt = page.getByRole('radio').first()
      if (await opt.count()) await opt.click()
      const fin = page.getByRole('button', { name: /Finish lesson/ })
      if (await fin.count()) { await fin.click(); break }
      await page.getByRole('button', { name: /^Continue/ }).click()
    }
    await page.getByText('Lesson complete').first().waitFor()
    await page.reload()
    await page.goto(URL + '#/learn')
    const xp = await page.locator('aside').innerText()
    assert(/[1-9]\d* XP/.test(xp) && !/ 0 XP/.test(xp), xp)
  })
  await check('challenge mode grades a decision with an explanation', async () => {
    await page.goto(URL + '#/practice?mode=challenge')
    await page.getByRole('button', { name: /^(Hit|Stand)$/ }).first().click()
    await page.getByRole('status').first().waitFor()
    const t = await page.locator('main').innerText()
    assert(/correct|Basic strategy says/.test(t), t)
  })
  await check('daily challenge runs 10 hands and records once', async () => {
    await page.goto(URL + '#/practice?mode=daily')
    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: /^(Stand)$/ }).click()
      await page.getByRole('button', { name: /Next hand|See results/ }).click()
    }
    await page.getByText(/^\d+ ?\/ ?10$/).first().waitFor()
    await page.goto(URL + '#/')
    assert(/Done today/.test(await page.locator('main').innerText()), 'home shows daily done')
  })
  await check('strategy chart cell explains itself', async () => {
    await page.goto(URL + '#/strategy')
    await page.getByRole('button', { name: /^16 versus 10/ }).click()
    assert(/16 vs 10/.test(await page.locator('main').innerText()), 'explanation shown')
  })
  await check('true-count drill grades an answer', async () => {
    await page.goto(URL + '#/counting')
    await page.getByRole('tab', { name: 'True count' }).click()
    await page.getByPlaceholder('e.g. 2').fill('0')
    await page.getByRole('button', { name: 'Check' }).click()
    assert(/Correct\.|rounds toward zero/.test(await page.locator('main').innerText()), 'graded')
  })
  await ctx.close()
}

console.log('Every lesson')
{
  const { ctx, page } = await freshPage()
  await setProgress(page, 'p.unlockedLevels = [1,2,3,4,5,6,7]; p.settings = p.settings || {}; p.settings.reduceMotion = true')
  await page.reload()
  const ids = await page.evaluate(async () => {
    const links = []
    location.hash = '#/learn'
    await new Promise((r) => setTimeout(r, 600))
    document.querySelectorAll('a[href^="#/learn/"]').forEach((a) => links.push(a.getAttribute('href').slice(8)))
    return links
  })
  await check(`all ${ids.length} lessons are listed`, async () => assert(ids.length >= 50, String(ids.length)))
  for (const id of ids) {
    await check(`lesson ${id} plays through to completion`, async () => {
      const before = pageErrors.length
      await page.goto(URL + '#/learn/' + id)
      for (let i = 0; i < 300; i++) {
        const radio = page.getByRole('radio').first()
        if (await radio.count() && await radio.isEnabled()) await radio.click()
        const choice = page.locator('main .grid button:is(:text-is("Hit"), :text-is("Stand"))').first()
        if (await choice.count() && await choice.isEnabled()) await choice.click()
        const cont = page.getByRole('button', { name: /^Continue/ })
        const fin = page.getByRole('button', { name: /Finish lesson/ })
        if (await fin.count() && await fin.isEnabled()) { await fin.click(); break }
        if (await cont.count() && await cont.isEnabled()) await cont.click()
        else await page.waitForTimeout(100)
      }
      await page.getByText('Lesson complete').first().waitFor({ timeout: 4000 })
      assert(pageErrors.length === before, pageErrors.slice(before).join('\n'))
    })
  }
  await check('finishing every lesson unlocks every level achievement', async () => {
    await page.goto(URL + '#/progress')
    await page.getByRole('heading', { level: 1, name: 'My Progress' }).waitFor()
    const t = await page.locator('main').textContent()
    assert(/Counting Room/.test(t) && /52\/52|\d+\/\d+/.test(t), 'progress shows completion')
    const got = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('bj-the-table:v1')).achievements))
    for (let n = 1; n <= 7; n++) assert(got.includes(`level-${n}`), `missing level-${n}`)
  })
  await ctx.close()
}

console.log('Cloud sync (two devices, server mocked with the same newer-wins rules)')
{
  const store = new Map()
  const mock = async (route) => {
    const body = JSON.parse(route.request().postData() || '{}')
    const code = String(body.p_code || '').toUpperCase()
    if (route.request().url().endsWith('/bj_pull')) return route.fulfill({ json: store.get(code) ?? null })
    const cur = store.get(code)
    if (!cur || body.p_updated_ms > cur.updated_ms) { store.set(code, { data: body.p_data, updated_ms: body.p_updated_ms }); return route.fulfill({ json: { stored: true } }) }
    return route.fulfill({ json: { stored: false, updated_ms: cur.updated_ms } })
  }
  const a = await freshPage()
  const b = await freshPage(devices['iPhone 13'])
  for (const x of [a, b]) await x.ctx.route('**/rest/v1/rpc/bj_*', mock)
  let code = ''
  await check('device A turns on sync and gets a code', async () => {
    await setProgress(a.page, "p.name = 'Ace'; p.xp = 777; p.updatedAt = Date.now()")
    await a.page.reload()
    await a.page.goto(URL + '#/settings')
    await a.page.getByRole('button', { name: 'Turn on sync' }).click()
    code = await a.page.getByLabel('Your sync code').textContent()
    assert(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code), 'code: ' + code)
    assert(store.size === 1, 'uploaded')
  })
  await check('device B enters the code and gets A’s progress', async () => {
    await b.page.goto(URL + '#/settings')
    await b.page.getByLabel('Sync code').fill(code.toLowerCase())
    await b.page.getByRole('button', { name: 'Link' }).click()
    await b.page.getByText('Progress loaded from the cloud').waitFor()
    const p = await b.page.evaluate(() => JSON.parse(localStorage.getItem('bj-the-table:v1')))
    assert(p.name === 'Ace' && p.xp === 777, JSON.stringify({ name: p.name, xp: p.xp }))
  })
  await check('progress made on B reaches A', async () => {
    await b.page.goto(URL + '#/practice?mode=challenge')
    await b.page.getByRole('button', { name: /^(Hit|Stand)$/ }).first().click()
    await b.page.waitForTimeout(2200) // debounce
    await a.page.reload()
    await a.page.waitForTimeout(800)
    const p = await a.page.evaluate(() => JSON.parse(localStorage.getItem('bj-the-table:v1')))
    assert(p.decisions.total >= 1, 'A got B’s decision: ' + p.decisions.total)
  })
  await check('a wrong code is refused politely', async () => {
    const c = await freshPage()
    await c.ctx.route('**/rest/v1/rpc/bj_*', mock)
    await c.page.goto(URL + '#/settings')
    await c.page.getByLabel('Sync code').fill('ZZZZ-ZZZZ-ZZZZ')
    await c.page.getByRole('button', { name: 'Link' }).click()
    await c.page.getByText('No saved progress was found for that code.').waitFor()
    await c.ctx.close()
  })
  await a.ctx.close()
  await b.ctx.close()
}

console.log('Mobile (iPhone 13)')
{
  const { ctx, page } = await freshPage(devices['iPhone 13'])
  for (const route of ['', 'play', 'learn', 'learn/l1-totals', 'practice', 'etiquette', 'strategy', 'counting', 'progress', 'settings']) {
    await check(`no horizontal scroll on /${route}`, async () => {
      await page.goto(URL + '#/' + route)
      await page.waitForTimeout(400)
      const w = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
      assert(w[0] <= w[1], `scrollWidth ${w[0]} > ${w[1]}`)
      await page.screenshot({ path: join(SHOTS, `mobile-${route.replace('/', '-') || 'home'}.png`) })
    })
  }
  await check('tab bar and More sheet reach every section', async () => {
    await page.goto(URL + '#/')
    await page.getByRole('navigation', { name: 'Main' }).last().getByRole('link', { name: 'Practice' }).click()
    await page.getByRole('heading', { level: 1, name: 'Practice' }).waitFor()
    for (const name of ['Casino Etiquette', 'Strategy', 'Card Counting', 'My Progress']) {
      await page.getByRole('button', { name: 'More' }).click()
      await page.getByRole('dialog', { name: 'More' }).getByRole('link', { name }).click()
      await page.getByRole('heading', { level: 1 }).first().waitFor()
    }
  })
  await check('a full hand is playable on a phone', async () => {
    await sit(page, '10S 10H 9D 7C')
    await deal(page)
    await press(page, 'Stand')
    assert(/Win \+\$20/.test(await table(page, /Win \+\$20/)), await table(page))
    await page.screenshot({ path: join(SHOTS, 'mobile-table.png'), fullPage: true })
  })
  await ctx.close()
}

await check('no uncaught page errors', async () => assert(pageErrors.length === 0, pageErrors.join('\n')))

await browser.close()
server.kill()
const failed = results.filter((r) => !r[0])
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
