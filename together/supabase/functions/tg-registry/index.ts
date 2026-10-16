// ── Together: the public registry ───────────────────────────────────────────
// Family and friends open registry.html?t=TOKEN. This function is the only way
// in: it returns the couple's registry items (and nothing else: no check-ins,
// no notes, no symptoms), and lets a guest claim an item by name.
//   GET  ?t=TOKEN                      public read
//   POST { action: 'claim', t, id, name }  guest says "I'll get this"
//   POST { action: 'status' | 'publish' | 'unpublish' | 'new-link', show_due }
//        the couple manages sharing; needs their Supabase JWT
// The share token is separate from the couple code, so a public link can never
// be used to join the couple. verify_jwt is off because guests have no login.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const newToken = () => {
  const b = crypto.getRandomValues(new Uint8Array(15))
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function byToken(t: unknown) {
  if (typeof t !== 'string' || t.length < 10 || t.length > 64) return null
  const { data } = await sb.from('tg_public').select('couple_id, show_due').eq('token', t).maybeSingle()
  return data
}

async function membership(req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data: u } = await sb.auth.getUser(token)
  if (!u.user) return null
  const { data } = await sb.from('tg_members').select('couple_id, role').eq('user_id', u.user.id)
    .order('joined_at', { ascending: false }).limit(1)
  return data?.[0] || null
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    if (req.method === 'GET') {
      const pub = await byToken(new URL(req.url).searchParams.get('t'))
      if (!pub) return json({ error: 'This registry link isn\'t active.' }, 404)
      const { data: rows, error } = await sb.from('tg_entries').select('id, kind, data, created_at')
        .eq('couple_id', pub.couple_id).in('kind', ['registry', 'profile']).order('created_at', { ascending: true })
      if (error) throw error
      // deno-lint-ignore no-explicit-any
      const profile: Record<string, any> = {}
      for (const r of rows) if (r.kind === 'profile') Object.assign(profile, r.data)
      let dueMonth = null
      if (pub.show_due) {
        const due = profile.due ? new Date(profile.due + 'T12:00:00') : profile.lmp ? new Date(new Date(profile.lmp + 'T12:00:00').getTime() + 280 * 864e5) : null
        if (due && !isNaN(+due)) dueMonth = due.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }
      const items = rows.filter(r => r.kind === 'registry').map(r => {
        const d = r.data || {}
        // guests see that something is taken, never who took it
        return { id: r.id, name: d.name, url: d.url || '', price: d.price || '', qty: d.qty || '1', cat: d.cat || 'other', notes: d.notes || '', taken: !!(d.got || d.claimed) }
      })
      const links = Array.isArray(profile.registryLinks) ? (profile.registryLinks as { name: string; url: string }[]).filter(l => /^https?:\/\//.test(l.url)) : []
      return json({ names: [profile.momName, profile.dadName].filter(Boolean), dueMonth, items, links })
    }

    const body = await req.json().catch(() => ({}))

    if (body.action === 'claim') {
      const pub = await byToken(body.t)
      if (!pub) return json({ error: 'This registry link isn\'t active.' }, 404)
      const { data: row } = await sb.from('tg_entries').select('id, data').eq('id', String(body.id || ''))
        .eq('couple_id', pub.couple_id).eq('kind', 'registry').maybeSingle()
      if (!row) return json({ error: 'That item is no longer on the registry.' }, 404)
      if (row.data?.got || row.data?.claimed) return json({ error: 'Someone already got this one.' }, 409)
      const name = String(body.name || '').trim().slice(0, 40) || 'A guest'
      const { error } = await sb.from('tg_entries').update({ data: { ...row.data, claimed: { name, at: new Date().toISOString() } } }).eq('id', row.id)
      if (error) throw error
      return json({ ok: true })
    }

    const m = await membership(req)
    if (!m) return json({ error: 'not signed in' }, 401)
    const { data: current } = await sb.from('tg_public').select('token, show_due').eq('couple_id', m.couple_id).maybeSingle()

    if (body.action === 'status') return json({ published: !!current, token: current?.token || null, show_due: current?.show_due ?? true })
    if (body.action === 'publish') {
      const row = { couple_id: m.couple_id, token: current?.token || newToken(), show_due: body.show_due !== false }
      const { error } = await sb.from('tg_public').upsert(row, { onConflict: 'couple_id' })
      if (error) throw error
      return json({ published: true, token: row.token, show_due: row.show_due })
    }
    if (body.action === 'new-link') {
      const token = newToken()
      const { error } = await sb.from('tg_public').update({ token }).eq('couple_id', m.couple_id)
      if (error) throw error
      return json({ published: true, token, show_due: current?.show_due ?? true })
    }
    if (body.action === 'unpublish') {
      await sb.from('tg_public').delete().eq('couple_id', m.couple_id)
      return json({ published: false, token: null })
    }
    return json({ error: 'unknown action' }, 400)
  } catch (e) {
    console.error(e)
    return json({ error: (e as Error).message }, 500)
  }
})
