// Fake supabase-js: in-page server table, controllable latency, call log.
(function(){
  const srv = window.__srv = { rows: JSON.parse(localStorage.getItem('__srvrows')||'[]'), log: [], lat: 50, deleteNoop: localStorage.getItem('__noop')==='1', offline: localStorage.getItem('__offline')==='1' }
  const persist = () => localStorage.setItem('__srvrows', JSON.stringify(srv.rows))
  const wait = ms => new Promise(r => setTimeout(r, ms))
  function Q(table){ this.t=table; this.op='select'; this.f={} }
  Q.prototype.select=function(){ return this }
  Q.prototype.eq=function(k,v){ this.f[k]=v; return this }
  Q.prototype.order=function(){ return this }
  Q.prototype.limit=function(n){ this.lim=n; return this }
  Q.prototype.range=function(a,b){ this.rng=[a,b]; return this }
  Q.prototype.maybeSingle=function(){ this.single=true; return this }
  Q.prototype.upsert=function(row,opts){ this.op='upsert'; this.row=row; return this }
  Q.prototype.delete=function(){ this.op='delete'; return this }
  Q.prototype.then=function(res,rej){
    const self=this
    const snap = self.op==='select' ? JSON.parse(JSON.stringify(srv.rows)) : null // read snapshot at request time
    srv.log.push(self.t+' '+self.op+' '+(self.row?self.row.id:JSON.stringify(self.f))+' @'+Date.now()%100000)
    return wait(srv.lat).then(()=>{
      if(srv.offline) return {error:{message:'offline', code:''}}
      if(self.t==='tg_couples') return { data: { code: localStorage.getItem('__code') || 'ABCD2345' }, error: null }
      if(self.op==='upsert'){
        if(srv.rejectRole && self.row.author_role!==srv.rejectRole) return {error:{message:'rls', code:'42501'}}
        if(!srv.rows.some(r=>r.id===self.row.id)) srv.rows.push(JSON.parse(JSON.stringify(self.row))); persist(); return {error:null} }
      let d = snap.filter(r=>r.couple_id===self.f.couple_id).sort((a,b)=>a.created_at.localeCompare(b.created_at))
      if(self.rng) d = d.slice(self.rng[0], self.rng[1]+1)
      return { data: d, error:null }
    }).then(res,rej)
  }
  window.supabase = { createClient(){ return {
    auth:{ getSession: async()=>({data:{session:{}}}), signInAnonymously: async()=>({error:null}) },
    from:t=>new Q(t),
    rpc: async (name,args)=>{ srv.log.push('rpc '+name+' '+JSON.stringify(args)); await wait(srv.lat); if(srv.offline) return {error:{message:'offline', code:''}};
      if(name==='tg_join_couple'){ return {data:{couple_id:'11111111-1111-4111-8111-111111111111', code:args.p_code}, error:null} }
      if(name==='tg_patch'){ const r=srv.rows.find(r=>r.id===args.p_id); if(r) r.data={...r.data,...args.p_patch}; persist(); return {data:!!r,error:null} }
      if(name==='tg_delete'){ if(srv.deleteNoop) return {data:false,error:null}; const had=srv.rows.some(r=>r.id===args.p_id); srv.rows=srv.rows.filter(r=>r.id!==args.p_id); persist(); return {data:had,error:null} }
      if(name==='tg_my_role'){ return {data: srv.removed ? null : 'mom', error:null} }
      if(name==='tg_rotate_code'){ localStorage.setItem('__code','NEWC0DE9'); return {data:'NEWC0DE9',error:null} }
      return {data:null,error:null} },
    channel(){ return { on(){return this}, subscribe(cb){ cb('SUBSCRIBED'); return this } } },
    removeChannel(){},
    functions:{ invoke: async()=>({data:{},error:null}) },
  } } }
})();
