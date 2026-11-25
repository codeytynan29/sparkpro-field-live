// @ts-nocheck
// Shot Clock 21 — voice strategy endpoint for a Siri Shortcut.
// Engine + parser are copied verbatim from shotclock/index.html so the
// web trainer and Siri give identical answers.
'use strict';
/* =====================================================================
   STRATEGY ENGINE
   Up-card values: 2..10, 11 = Ace.
   Hand: {type:'hard'|'soft'|'pair'|'bj', total, rank, cards?, multi?}
   ===================================================================== */
const A = 11;
const NAME = { H:'HIT', S:'STAND', D:'DOUBLE', P:'SPLIT', R:'SURRENDER', I:'INSURE', N:'NO INS', BJ:'BLACKJACK' };
const upL = u => u === A ? 'A' : String(u);
const rankL = r => r === A ? 'A' : r === 10 ? 'T' : String(r);

function hardBasic(t, u, r){
  if (t <= 8) return 'H';
  if (t === 9) return (u >= 3 && u <= 6) ? 'D' : 'H';
  if (t === 10) return u <= 9 ? 'D' : 'H';
  if (t === 11) return u <= 10 ? 'D' : (r.h17 ? 'D' : 'H');
  if (t === 12) return (u >= 4 && u <= 6) ? 'S' : 'H';
  if (t === 13 || t === 14) return u <= 6 ? 'S' : 'H';
  if (t === 15){ if (u <= 6) return 'S'; if (r.ls && (u === 10 || (r.h17 && u === A))) return 'R'; return 'H'; }
  if (t === 16){ if (u <= 6) return 'S'; if (r.ls && u >= 9) return 'R'; return 'H'; }
  if (t === 17) return (r.ls && r.h17 && u === A) ? 'R' : 'S';
  return 'S';
}
function softBasic(t, u, r){
  if (t <= 12) return 'H';
  if (t <= 14) return (u === 5 || u === 6) ? 'D' : 'H';
  if (t <= 16) return (u >= 4 && u <= 6) ? 'D' : 'H';
  if (t === 17) return (u >= 3 && u <= 6) ? 'D' : 'H';
  if (t === 18){ if ((u >= 3 && u <= 6) || (r.h17 && u === 2)) return 'D'; if (u <= 8) return 'S'; return 'H'; }
  if (t === 19) return (r.h17 && u === 6) ? 'D' : 'S';
  return 'S';
}
function pairSplits(k, u){ // DAS chart; null = don't split, play as total
  switch (k){
    case A: case 8: return true;
    case 10: case 5: return false;
    case 9: return (u <= 6 || u === 8 || u === 9);
    case 7: return u <= 7;
    case 6: return u <= 6;
    case 4: return u === 5 || u === 6;
    case 3: case 2: return u <= 7;
  }
  return false;
}

// Illustrious 18 + Fab 4 (Hi-Lo, multi-deck S17). cmp 'ge': do act when TC >= idx. 'lt': do act when TC < idx.
const DEVS = [
  { id:'16v10', t:16, u:10, act:'S', cmp:'ge', idx:0,  set:'I18', noLS:true },
  { id:'15v10', t:15, u:10, act:'S', cmp:'ge', idx:4,  set:'I18', noLS:true },
  { id:'10v10', t:10, u:10, act:'D', cmp:'ge', idx:4,  set:'I18' },
  { id:'12v3',  t:12, u:3,  act:'S', cmp:'ge', idx:2,  set:'I18' },
  { id:'12v2',  t:12, u:2,  act:'S', cmp:'ge', idx:3,  set:'I18' },
  { id:'11vA',  t:11, u:A,  act:'D', cmp:'ge', idx:1,  set:'I18', s17:true },
  { id:'9v2',   t:9,  u:2,  act:'D', cmp:'ge', idx:1,  set:'I18' },
  { id:'10vA',  t:10, u:A,  act:'D', cmp:'ge', idx:4,  set:'I18' },
  { id:'9v7',   t:9,  u:7,  act:'D', cmp:'ge', idx:3,  set:'I18' },
  { id:'16v9',  t:16, u:9,  act:'S', cmp:'ge', idx:5,  set:'I18', noLS:true },
  { id:'13v2',  t:13, u:2,  act:'H', cmp:'lt', idx:-1, set:'I18' },
  { id:'12v4',  t:12, u:4,  act:'H', cmp:'lt', idx:0,  set:'I18' },
  { id:'12v5',  t:12, u:5,  act:'H', cmp:'lt', idx:-2, set:'I18' },
  { id:'12v6',  t:12, u:6,  act:'H', cmp:'lt', idx:-1, set:'I18' },
  { id:'13v3',  t:13, u:3,  act:'H', cmp:'lt', idx:-2, set:'I18' },
  { id:'14v10R',t:14, u:10, act:'R', cmp:'ge', idx:3,  set:'FAB4', ls:true },
  { id:'15v10R',t:15, u:10, act:'R', cmp:'ge', idx:0,  set:'FAB4', ls:true },
  { id:'15v9R', t:15, u:9,  act:'R', cmp:'ge', idx:2,  set:'FAB4', ls:true },
  { id:'15vAR', t:15, u:A,  act:'R', cmp:'ge', idx:1,  set:'FAB4', ls:true, s17:true },
];
const PAIR_DEVS = [
  { id:'TTv5', k:10, u:5, act:'P', cmp:'ge', idx:5, set:'I18' },
  { id:'TTv6', k:10, u:6, act:'P', cmp:'ge', idx:4, set:'I18' },
];
const INS_IDX = 3;
const fires = (d, tc) => d.cmp === 'ge' ? tc >= d.idx : tc < d.idx;
const sgn = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
function devText(d){
  const what = d.t ? `${d.t} v ${upL(d.u)}` : `T,T v ${upL(d.u)}`;
  return d.cmp === 'ge'
    ? `${what} → ${NAME[d.act]} at TC ≥ ${sgn(d.idx)}`
    : `${what} → STAND at TC ≥ ${sgn(d.idx)}, else HIT`;
}

function decide(hand, u, tcRaw, rules){
  const tc = Math.floor(tcRaw + 1e-9);
  const out = { action:null, basic:null, dev:null, devOn:false, note:null, ins:null, tc };
  if (u === A) out.ins = { take: tc >= INS_IDX, idx: INS_IDX };
  if (hand.type === 'bj'){ out.action = out.basic = 'BJ'; return out; }

  let t = hand.total, soft = hand.type === 'soft';
  if (hand.type === 'pair'){
    const k = hand.rank;
    if (k === 10){
      const pd = PAIR_DEVS.find(d => d.u === u);
      out.basic = 'S';
      if (pd){ out.dev = pd; out.devOn = fires(pd, tc); }
      out.action = out.devOn ? 'P' : 'S';
      return out;
    }
    if (k === 8 && u === A && rules.h17 && rules.ls && !hand.multi){ out.action = out.basic = 'R'; return out; }
    if (pairSplits(k, u)){ out.action = out.basic = 'P'; return out; }
    if (k === A){ t = 12; soft = true; } else t = k * 2;
  }
  const r = hand.multi ? { ...rules, ls:false } : rules;

  if (soft){
    let a = softBasic(t, u, r);
    if (hand.multi && a === 'D') a = t >= 18 ? 'S' : 'H';
    out.action = out.basic = a;
    return out;
  }

  // hard
  out.basic = hardBasic(t, u, r);
  let act = hardBasic(t, u, { ...r, ls:false });
  const usable = d => d.t === t && d.u === u && !(d.s17 && r.h17);
  const plain = DEVS.find(d => usable(d) && !d.ls);
  if (plain){ out.dev = plain; if (fires(plain, tc)){ act = plain.act; out.devOn = true; } }
  if (r.ls){
    const fab = DEVS.find(d => usable(d) && d.ls);
    if (fab){
      if (plain && plain.noLS) out.note = `No surrender? ${devText(plain)}`;
      out.dev = fab; out.devOn = false;
      if (fires(fab, tc)){ act = 'R'; out.devOn = true; }
      else if (plain && plain.noLS && fires(plain, tc)){ /* stand dev unreachable when fab misses, keep act */ }
    } else if (out.basic === 'R'){
      act = 'R';
      if (plain && plain.noLS){ out.note = `No surrender? ${devText(plain)}`; out.dev = null; out.devOn = false; }
    }
  }
  if (hand.multi && act === 'D') act = 'H';
  out.action = act;
  return out;
}

/* ---------- hand helpers ---------- */
function handFromCards(cs){ // cs: values 2..11
  if (cs.length === 2){
    if (cs[0] === cs[1]) return { type:'pair', rank:cs[0], total: cs[0] === A ? 12 : cs[0]*2, cards:cs };
    if (cs.includes(A)){ const o = cs[0] === A ? cs[1] : cs[0]; if (o === 10) return { type:'bj', total:21, cards:cs }; return { type:'soft', total: 11 + o, cards:cs }; }
    return { type:'hard', total: cs[0] + cs[1], cards:cs };
  }
  let h = 0, ace = false; for (const c of cs){ h += c === A ? 1 : c; if (c === A) ace = true; }
  const soft = ace && h + 10 <= 21;
  return { type: soft ? 'soft' : 'hard', total: soft ? h + 10 : h, cards:cs, multi:true };
}
function handLabel(h){
  if (h.type === 'bj') return 'BLACKJACK';
  if (h.type === 'pair') return h.rank === A ? 'A,A' : h.rank === 10 ? 'T,T' : `${h.rank}s`;
  if (h.type === 'soft' && !h.multi && h.total <= 20) return `SOFT ${h.total}`;
  return `${h.type === 'soft' ? 'SOFT' : 'HARD'} ${h.total}${h.multi ? ' (3+)' : ''}`;
}
/* =====================================================================
   PARSER — speech + typed shorthand
   ===================================================================== */
const WORDS = { zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12,
  thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20, thirty:30, too:2, ate:8, sixty:16 };
const PLURALS = { twos:'2 pl', threes:'3 pl', fours:'4 pl', fives:'5 pl', sixes:'6 pl', sevens:'7 pl', eights:'8 pl', nines:'9 pl',
  tens:'10 pl', kings:'10 pl', queens:'10 pl', jacks:'10 pl', faces:'10 pl', aces:'ace pl' };
const FACES = { king:'10', queen:'10', jack:'10', face:'10', picture:'10', t:'10' };
const SEPS = new Set(['vs','v','versus','verses','against','dealer','dealers','into','facing','showing','shows','on','bs','up','dealing','upcard']);

function normalize(raw){
  let s = ' ' + raw.toLowerCase() + ' ';
  s = s.replace(/[×]/g, ' ').replace(/[’‘`]/g, "'").replace(/'/g, '');
  s = s.replace(/(^|\s)\+\s?(\d)/g, ' plus $2').replace(/(^|\s)[-−–]\s?(\d)/g, ' minus $2');
  s = s.replace(/(?<!\d)\.|\.(?!\d)/g, ' ').replace(/[,!?;:"()]/g, ' ');
  s = s.replace(/[-–—\/]/g, ' ');
  s = s.replace(/\b(\w+)\b/g, w => PLURALS[w] ?? w);
  s = s.replace(/(\d+)\s?'?s\b/g, '$1 pl');
  s = s.replace(/\b[a-z]+\b/g, w => (w in WORDS) ? String(WORDS[w]) : w);
  s = s.replace(/\b(20|30) ([1-9])\b/g, (m, a, b) => String(+a + +b));
  s = s.replace(/(\d+) and a half/g, (m, d) => String(+d + 0.5)).replace(/\bhalf a deck\b/g, '0.5 deck').replace(/\ba half\b/g, '0.5');
  s = s.replace(/([a-z])(\d)/g, '$1 $2').replace(/(\d)([a-z])/g, '$1 $2');
  s = s.replace(/\b([a-z]+)\b/g, w => FACES[w] ?? w);
  s = s.replace(/\b2 (\d+|ace) pl\b/g, 'pair $1');
  return s.replace(/\s+/g, ' ').trim();
}

function parseSigned(sign, n){ n = parseFloat(n); return /minus|negative/.test(sign || '') ? -n : n; }
function extractCount(s){
  const cmds = [];
  if (/\b(reset( count| shoe)?|new shoe|shuffle( up)?)\b/.test(s)){ cmds.push({ reset:true }); s = s.replace(/\b(reset( count| shoe)?|new shoe|shuffle( up)?)\b/g, ' '); }
  s = s.replace(/\b(?:true count|tc)(?: is| of| at| equals)? (plus |minus |negative |positive )?(\d+(?:\.\d+)?)/g, (x, sg, n) => { cmds.push({ tc: parseSigned(sg, n) }); return ' '; });
  s = s.replace(/\b(?:running count|count is|count of|count at|count equals|rc)(?: is)? (plus |minus |negative |positive )?(\d+)/g, (x, sg, n) => { cmds.push({ rc: parseSigned(sg, n) }); return ' '; });
  s = s.replace(/\b(?:count )?(plus|add|minus|subtract|count up|count down) (\d+)/g, (x, sg, n) => { cmds.push({ drc: /minus|subtract|down/.test(sg) ? -n : +n }); return ' '; });
  s = s.replace(/\b(\d+(?:\.\d+)?) decks?(?: left| remaining| to go)?\b/g, (x, n) => { cmds.push({ decks: parseFloat(n) }); return ' '; });
  s = s.replace(/\bdecks?(?: left| remaining)?(?: is)? (\d+(?:\.\d+)?)/g, (x, n) => { cmds.push({ decks: parseFloat(n) }); return ' '; });
  const order = c => c.reset ? 0 : c.decks !== undefined ? 1 : c.rc !== undefined ? 2 : c.drc !== undefined ? 3 : 4;
  return { cmds: cmds.sort((a, b) => order(a) - order(b)), rest: s.replace(/\s+/g, ' ').trim() };
}

function cardTok(tok, dealerSide){
  if (tok === 'ace' || tok === 'a' || tok === 'aces') return A;
  if (/^\d+$/.test(tok)){ const n = +tok; if (dealerSide && (n === 1 || n === 11)) return A; return n; }
  return null;
}
function parseHand(s){
  let toks = s.split(' ').filter(Boolean);
  // typed pair shorthand: 88, tt, aa, 1010
  toks = toks.flatMap((t, i) => {
    if (i === 0 || !SEPS.has(toks[i - 1])){
      if (/^(22|33|44|55|66|77|88|99)$/.test(t)) return ['pair', t[0]];
      if (t === 'tt' || t === '1010') return ['pair', '10'];
      if (t === 'aa') return ['pair', 'ace'];
    }
    return [t];
  });
  toks = toks.filter(t => !['of','the','an','and','got','have','i','my','is','me','with','hand','total','what','about','do'].includes(t));
  const si = toks.findIndex(t => SEPS.has(t));
  let left, right;
  if (si >= 0){ left = toks.slice(0, si); right = toks.slice(si + 1).filter(t => !SEPS.has(t)); }
  else {
    const idxs = toks.map((t, i) => cardTok(t, false) !== null && t !== 'a' ? i : -1).filter(i => i >= 0);
    if (idxs.length < 2) return null;
    const last = idxs[idxs.length - 1];
    left = toks.slice(0, last); right = toks.slice(last);
  }
  // dealer
  let u = null;
  for (let i = 0; i < right.length; i++){
    const t = right[i];
    if (t === 'a' && right.slice(i + 1).some(x => /^\d+$/.test(x) || x === 'ace')) continue; // article
    const c = cardTok(t, true); if (c !== null){ u = c; break; }
  }
  if (u === null || u < 2 || u > A) return null;

  // player
  const flags = { soft:false, hard:false, pair:false, bj:false };
  const vals = [];
  left.forEach((t, i) => {
    if (t === 'soft' || t === 's') flags.soft = true;
    else if (t === 'hard' || t === 'h') flags.hard = true;
    else if (['pair','pairs','p','split','pl','double','doubles'].includes(t)) flags.pair = true;
    else if (t === 'blackjack' || t === 'natural' || t === 'bj') flags.bj = true;
    else if (t === 'a'){ const nx = left[i + 1]; if (nx === undefined || /^\d+$/.test(nx) || ['pl','a','ace'].includes(nx) || left[i - 1] === 'a') vals.push(1); }
    else if (t === 'ace' || t === 'aces') vals.push(1);
    else { const c = cardTok(t, false); if (c !== null) vals.push(c); }
  });
  let hand = null;
  if (flags.bj) hand = { type:'bj', total:21 };
  else if (!vals.length) return null;
  else if (flags.pair){
    let k = vals[0]; if (k === 1) k = A;
    if (k > A && k % 2 === 0 && k / 2 <= 10) k = k / 2;
    if (k < 2 || k > A) return null;
    hand = { type:'pair', rank:k, total: k === A ? 12 : k * 2 };
  } else if (vals.length >= 2 && vals.every(v => v >= 1 && v <= 10)){
    hand = handFromCards(vals.map(v => v === 1 ? A : v));
  } else if (vals.length === 1){
    const n = vals[0];
    if (n === 1) return null;
    if (flags.soft){
      if (n >= 13 && n <= 21) hand = n === 21 ? { type:'bj', total:21 } : { type:'soft', total:n };
      else if (n === 12) hand = { type:'pair', rank:A, total:12 };
      else if (n >= 2 && n <= 10) hand = n === 10 ? { type:'bj', total:21 } : { type:'soft', total: 11 + n };
      else return null;
    } else {
      if (n < 4 || n > 21) return null;
      hand = { type:'hard', total:n };
    }
  } else return null;
  return { hand, u };
}

/* =====================================================================
   SIRI / HTTP HANDLER
   GET  ?q=16 against a 10      POST {"q": "..."} | form q=... | raw text
   Options: ls=1|0 (late surrender, default 1), h17=1|0 (default 0), tc=<n>
   Replies with one short line of plain text for Siri to speak.
   ===================================================================== */
const SPOKEN_ACT = { H:'Hit', S:'Stand', D:'Double', P:'Split', R:'Surrender', BJ:'Blackjack' };
const upWord = u => u === A ? 'an ace' : String(u);
function spokenHand(h){
  if (h.type === 'bj') return 'blackjack';
  if (h.type === 'pair') return h.rank === A ? 'pair of aces' : h.rank === 10 ? 'pair of tens' : `pair of ${h.rank}s`;
  return `${h.type === 'soft' ? 'soft' : 'hard'} ${h.total}`;
}
// "dealer 10, I have 16" / "dealer shows 9 and I've got soft 18"
function parseLoose(s){
  const m = s.match(/\b(?:dealer|dealers)(?: (?:has|shows|showing|is|up|got|an|a(?= ace)))* (ace|a|\d+)\b/);
  if (!m) return null;
  const rest = (s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length)).trim();
  const p = parseHand(rest + ' vs ' + (m[1] === 'a' ? 'ace' : m[1]));
  return p;
}
function answer(raw, opts){
  const norm = normalize(raw || '');
  const rules = { ls: opts.ls, h17: opts.h17 };
  if (/\b(no|without) surrender\b/.test(norm)) rules.ls = false;
  else if (/\bsurrender\b/.test(norm)) rules.ls = true;
  if (/\b(hits?|hit on) soft 17\b|\bh 17\b/.test(norm)) rules.h17 = true;
  const { cmds, rest } = extractCount(norm);
  let tc = opts.tc;
  let decks = opts.decks;
  let rc = null;
  for (const c of cmds){ if (c.tc !== undefined) tc = c.tc; if (c.decks !== undefined) decks = c.decks; if (c.rc !== undefined) rc = c.rc; if (c.drc !== undefined) rc = (rc || 0) + c.drc; }
  if (rc !== null) tc = rc / Math.max(0.5, decks);
  const counted = rc !== null || cmds.some(c => c.tc !== undefined) || opts.tcGiven;
  const wantsIns = /\binsurance|insure|even money\b/.test(norm);
  const cleaned = (rest || '').replace(/\b(no|without) surrender\b|\bsurrender\b|\b(dealer )?(hits?|hit on|stands?|stand on) soft 17\b/g, ' ').replace(/\s+/g, ' ').trim();
  let p = cleaned ? parseHand(cleaned) : null;
  if (!p) p = parseLoose(cleaned || norm);
  if (!p) return { ok:false, text:"Didn't catch the hand. Say it like: 16 against 10." };
  const d = decide(p.hand, p.u, tc, rules);
  // App blackjack reshuffles constantly: with no count given, play the basic chart, not count indices.
  if (!counted){
    let b = d.basic;
    if (p.hand.multi && b === 'D') b = (p.hand.type === 'soft' && p.hand.total >= 18) ? 'S' : 'H';
    if (p.hand.multi && b === 'R') b = 'H';
    d.action = b; d.devOn = false; if (d.ins) d.ins.take = false;
  }
  let text = `${SPOKEN_ACT[d.action]}. ${spokenHand(p.hand)} against ${upWord(p.u)}.`;
  if (d.action === 'BJ') text = p.u === A ? 'Blackjack. Decline even money.' : 'Blackjack. Get paid.';
  if (d.devOn && d.action !== d.basic) text += ' Index play.';
  if (d.ins && (d.ins.take || wantsIns) && d.action !== 'BJ') text += d.ins.take ? ' Take insurance.' : ' No insurance.';
  return { ok:true, text, action:d.action, hand:handLabel(p.hand), up:upL(p.u), tc:d.tc, deviation: d.dev ? devText(d.dev) : null, heard: raw };
}
const CORS = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS' };
async function handle(req){
  if (req.method === 'OPTIONS') return new Response(null, { headers:CORS });
  const url = new URL(req.url);
  let q = url.searchParams.get('q') || url.searchParams.get('text') || '';
  if (!q && req.method === 'POST'){
    const ct = req.headers.get('content-type') || '';
    const body = await req.text();
    if (ct.includes('json')){ try{ const j = JSON.parse(body); q = j.q || j.text || j.hand || ''; }catch(e){ q = body; } }
    else if (ct.includes('form')){ const f = new URLSearchParams(body); q = f.get('q') || f.get('text') || ''; }
    else q = body;
  }
  const flag = (k, d) => { const v = url.searchParams.get(k); return v === null ? d : v === '1' || v === 'true'; };
  const opts = { ls: flag('ls', true), h17: flag('h17', false), tc: parseFloat(url.searchParams.get('tc') || '0') || 0, tcGiven: url.searchParams.has('tc'), decks: parseFloat(url.searchParams.get('decks') || '6') || 6 };
  const out = answer(String(q).slice(0, 300), opts);
  if (url.searchParams.get('format') === 'json') return new Response(JSON.stringify(out), { headers:{ ...CORS, 'Content-Type':'application/json' } });
  return new Response(out.text, { headers:{ ...CORS, 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store' } });
}
Deno.serve(handle);
