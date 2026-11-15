/* ================= Streamlined layout (Nov 14) =================
   Re-arranges what the calculator already rendered: it moves existing rows and input fields, renames labels and
   adds a verdict strip that reads the calculator's own results (window.MX_LAST). It never computes a number,
   never changes an input id and never touches the formulas. */
(function(){
'use strict';
const q=(s,r)=>(r||document).querySelector(s), qa=(s,r)=>[...(r||document).querySelectorAll(s)];
const rowOf=id=>{ const el=document.getElementById(id); return el?(el.closest('.f')||el):null; };
const ICON_OK='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>';
const ICON_NO='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>';
const escT=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ---------- 2. inputs: essentials card + collapsed sections ---------- */
const SECTIONS=[
  {key:'cur',  title:'Current loan details', ids:['fha_arm','fha_term','fha_ptype']},
  {key:'new',  title:'New loan',             ids:['fha_nclose','fha_holding']},
  {key:'esc',  title:'Escrows',              ids:['fha_escnow','fha_hoi','#fha_hoiauto','#fha_hoimrow','fha_tax','fha_taxfreq','fha_taxm','#fha_taxm2row']},
  {key:'fee',  title:'Fees &amp; comp',      ids:['fha_uw','fha_proc','fha_comp']},
  {key:'ovr',  title:'Overrides',            ids:['#fha_optslot','fha_mipnow','fha_escbal','fha_val','fha_miprate','fha_netfund']},
  {key:'bor',  title:'Borrower',             ids:['bor_name','bor_addr','bor_zip','bor_fico']},
  {key:'one',  title:'One-off scenarios',    ids:['fha_old','fha_inv']}
];
const ESS_CUR=[['fha_close','Closing date'],['fha_rate','Rate %'],['fha_price','Purchase price / value $'],['fha_dp','Down payment %'],['fha_curpay','Total payment today $']];
const ESS_NEW=[['fha_nrate','Rate %'],['fha_nterm','Term'],['fha_title','Title fees $'],['fha_ysp','YSP %']];
const pick=sel=>sel[0]==='#'?document.getElementById(sel.slice(1)):rowOf(sel);
function arrange(){
  const box=document.getElementById('inputs'); if(!box||!document.getElementById('fha_close')||q('.mx-ess',box)) return;
  const open={}; /* nothing to restore on first build */
  const ess=document.createElement('section'); ess.className='mx-ess'; ess.setAttribute('aria-label','Essentials');
  ess.innerHTML='<p class="mx-ess-h">Essentials</p><div class="card mx-esscard"><h2>Current loan</h2><div class="body" id="mxEssCur"></div></div><div class="card mx-esscard"><h2>New loan</h2><div class="body" id="mxEssNew"></div></div>';
  const fill=(list,dest)=>list.forEach(([id,lbl])=>{ const r=rowOf(id); if(!r) return; r.classList.add('mx-essrow'); const l=r.querySelector('label'); if(l) l.textContent=lbl; dest.appendChild(r);
    if(id==='fha_curpay'){ const slot=document.getElementById('fha_reqslot'); if(slot) dest.appendChild(slot); } });
  fill(ESS_CUR,q('#mxEssCur',ess)); fill(ESS_NEW,q('#mxEssNew',ess));
  const more=document.createElement('div'); more.className='mx-more';
  SECTIONS.forEach(s=>{
    const d=document.createElement('details'); d.className='mx-sec'; d.dataset.sec=s.key; if(open[s.key]) d.open=true;
    d.innerHTML=`<summary><b>${s.title}</b><span data-sum="${s.key}"></span></summary><div class="mx-sec-body"></div>`;
    const body=q('.mx-sec-body',d); s.ids.forEach(sel=>{ const n=pick(sel); if(n) body.appendChild(n); });
    more.appendChild(d);
  });
  /* the property-taxes "show more" wrapper is now empty: drop it, and drop the emptied original cards */
  qa('details',box).forEach(d=>{ if(!d.classList.contains('mx-sec')&&!d.querySelector('input,select')) d.remove(); });
  qa(':scope > .card',box).forEach(c=>c.remove());
  box.prepend(more); box.prepend(ess);
}
const v=id=>{ const el=document.getElementById(id); if(!el) return ''; return el.type==='checkbox'?el.checked:String(el.value||'').trim(); };
const selTxt=id=>{ const el=document.getElementById(id); return el&&el.selectedOptions&&el.selectedOptions[0]?el.selectedOptions[0].textContent:''; };
function summaries(){
  const set=(k,t)=>{ const el=q(`[data-sum="${k}"]`); if(el) el.textContent=t; };
  set('cur',[selTxt('fha_ptype'),selTxt('fha_term'),v('fha_arm')?'ARM':''].filter(Boolean).join(' · '));
  const nc=parseDate(v('fha_nclose'));
  set('new',(nc?'Closes '+fmtDate(nc):'No closing date')+' · '+(v('fha_holding')?'holding payment':'not holding'));
  set('esc',[v('fha_escnow')?'$'+v('fha_escnow')+'/mo':'',v('fha_hoi')?'HOI $'+v('fha_hoi'):'',v('fha_tax')?'tax $'+v('fha_tax'):''].filter(Boolean).join(' · '));
  set('fee','UW $'+(v('fha_uw')||'0')+(v('fha_proc')?' + processor':'')+' · comp '+(v('fha_comp')||'0').replace(/%?$/,'%'));
  const ov=['fha_oamt_ov','fha_balov','fha_mipnow','fha_escbal','fha_val'].filter(id=>v(id)!==''&&document.getElementById(id)&&document.getElementById(id).closest('#fha_reqslot')===null).length
    +(v('fha_miprate')&&v('fha_miprate')!=='auto'?1:0)+(v('fha_netfund')?1:0);
  set('ovr',ov?ov+' set':'None set');
  set('bor',v('bor_name')||'No name');
  set('one',[v('fha_old')?'Pre-6/2009':'',v('fha_inv')?'Investment':''].filter(Boolean).join(' · ')||'None');
  /* essentials counter: the fields the calculator flags as REQUIRED */
  const need=['fha_curpay','fha_title'].concat(v('fha_ptype')==='refi'?['fha_oamt_ov']:[]).concat(v('fha_arm')?['fha_balov']:[]);
  const miss=need.filter(id=>!(parseFloat(String(v(id)).replace(/[,$%\s]/g,''))>0)).length;
  const c=document.getElementById('mxEssCount'); if(c){ c.textContent=miss?miss+' required missing':'All required filled'; c.className=miss?'miss':''; }
}

/* ---------- 4. sheet: three blocks, plain-word differences ---------- */
const keyRow=(sheet,id)=>{ const b=q(`.srow > .eye[data-eye="fha:${id}"]`,sheet); return b?b.parentElement:null; };
function setLabel(row,txt){ const l=row&&q('.lblc',row); if(!l) return; const t=[...l.childNodes].find(n=>n.nodeType===3); if(t) t.textContent=txt; else l.insertBefore(document.createTextNode(txt),l.firstChild); }
function addSub(cell,txt){ if(!cell||!txt) return; const s=document.createElement('span'); s.className='mx-vs'; s.textContent=txt; cell.appendChild(s); }
function sect(t){ const d=document.createElement('div'); d.className='srow'; d.innerHTML=(S.client?'':'<span></span>')+'<div class="secttl">'+t+'</div>'; return d; }
function plainDelta(row,id){
  const sp=row&&q('.dcell > span',row); if(!sp) return; const cell=sp.parentElement, good=cell.classList.contains('save'), t=sp.textContent.trim();
  const amt=t.replace(/^[−-]/,'').replace(/\/mo$/,'').replace(/ (saved|added|fewer)$/,'');
  if(id==='d_rate') sp.textContent=amt+(good?' lower':' higher');
  else if(id==='d_msave') sp.textContent=amt+(good?' lower':' more');
  else if(id==='d_shaved'){ sp.textContent=amt+(good?' fewer payments':' more payments'); if(!good) cell.classList.add('mx-trade'); }
  else if(id==='d_isave') sp.textContent=amt+(good?' less':' more');
}
function restructureSheet(){
  const sheet=q('#results .sheet'); if(!sheet) return;
  const R=id=>keyRow(sheet,id);
  /* column headings */
  const ch=qa('.shead .colhead',sheet); if(ch.length===3){ ch[0].textContent='Today'; ch[1].textContent='New'; ch[2].textContent='Difference'; }
  /* labels */
  [['rate','Rate'],['pi','Principal & interest'],['mi','Mortgage insurance'],['esc','Taxes & insurance'],['tot','Total payment'],['ysave','Every year'],
   ['term','Term'],['intleft','Interest left to pay'],['b_cash','Funds due at closing'],['x_skip','Payments skipped'],['x_escref','Escrow refund']].forEach(([id,t])=>setLabel(R(id),t));
  const tot=R('tot'); if(tot){ tot.classList.add('mx-tot'); q('.lblc',tot).classList.add('mx-totl'); }
  /* loan balance: today's balance and the new loan amount on one row (unless the original amount is missing) */
  const bal=R('bal'), cb=R('curbal');
  if(bal&&cb&&!bal.classList.contains('missingrow')){
    const newCell=bal.children[3], blank=cb.children[3];
    if(newCell&&blank){ cb.replaceChild(newCell,blank); addSub(newCell,'new loan amount'); }
    setLabel(cb,'Loan balance');
    bal.remove();
  }
  if(cb&&!cb.classList.contains('missingrow')){ const l=q('.lblc',cb); if(l&&!q('.sub',l)){ const s=document.createElement('span'); s.className='sub subc'; s.textContent=gv('fha_balov',0)>0?'today’s from the statement':'today’s is an estimate'; l.appendChild(s); } }
  /* term: fold payments made / left into it */
  const term=R('term'), pm=R('pmade'), pl=R('pleft');
  if(term&&pm&&pl){
    const made=pm.children[2].textContent.trim(), left=pl.children[2].textContent.trim(), nleft=pl.children[3].textContent.trim();
    addSub(term.children[2],made+' paid · '+left+' left'); addSub(term.children[3],nleft+' payments');
    const d=pl.children[4]; if(d&&term.children[4]) term.replaceChild(d,term.children[4]);
    pm.remove(); pl.remove();
  }
  [['rate','d_rate'],['tot','d_msave'],['term','d_shaved'],['intleft','d_isave']].forEach(([r,d])=>plainDelta(R(r),d));

  /* split: client sheet vs deal structure */
  const all=qa(':scope > .srow, :scope > .gap',sheet).filter(n=>!n.classList.contains('shead'));
  const pay=['rate','pi','mi','esc','tot','ysave'].map(R).filter(Boolean);
  const loan=['curbal','bal','term','intleft'].map(R).filter(Boolean);
  const cnote=all.find(n=>q('.cnote',n));
  const close=[R('b_cash'),R('x_skip'),cnote,R('x_escref'),R('x_be')].filter(Boolean);
  const ack=all.find(n=>q('[data-tgl="ackOver"]',n));
  const keep=new Set([...pay,...loan,...close]);
  const deal=all.filter(n=>!keep.has(n)&&n!==ack&&!n.classList.contains('gap')&&!q('.secttl',n));
  all.forEach(n=>{ if(!keep.has(n)) n.remove(); });
  const ys=R('ysave'), tr=R('tot');
  const frag=document.createDocumentFragment();
  /* three cards; each heading carries its answer (text taken from the cells already rendered) */
  const dTxt=row=>{ const sp=row&&q('.dcell > span',row); return sp?sp.textContent.trim():''; };
  const totD=dTxt(R('tot')), intD=dTxt(R('intleft')), cashRow=R('b_cash');
  const cashV=cashRow?(cashRow.children[3]||{}).textContent||'':'', cashBad=!!(cashRow&&q('.vbox.bad',cashRow));
  const head=(k,html)=>`<div class="mx-sh"><p class="k">${k}</p><p class="h">${html}</p></div>`;
  const big=(t,cls)=>`<span class="${cls||'g'}">${escT(t)}</span>`;
  const payH=/ lower$/.test(totD)?big(totD.replace(/ lower$/,' lower'))+' a month':/ more$/.test(totD)?big(totD,'b')+' a month':'Your payment';
  const loanH=/ less$/.test(intD)?big(intD)+' interest':/ more$/.test(intD)?big(intD,'b')+' interest':'Your loan';
  const closeH=cashV.trim()&&cashV.trim()!=='—'?big(cashV.trim(),cashBad?'b':'n')+' due':'At closing';
  const th='<div class="srow mx-th"><span></span><span></span><span>Today</span><span>New</span><span>Difference</span></div>';
  const card=(cls,k,h,rows,withTh)=>{ const c=document.createElement('section'); c.className='mx-scard '+cls; c.innerHTML=head(k,h)+(withTh?th:''); rows.forEach(n=>c.appendChild(n)); return c; };
  frag.appendChild(card('mx-c-pay','Your payment',payH,pay,true));
  frag.appendChild(card('mx-c-loan','Your loan',loanH,loan,true));
  const cc=card('mx-c-close','At closing',closeH,[],false);
  const tiles=document.createElement('div'); tiles.className='mx-tiles';
  [R('b_cash'),R('x_skip'),R('x_escref'),R('x_be')].filter(Boolean).forEach(n=>tiles.appendChild(n));
  cc.appendChild(tiles); if(cnote) cc.appendChild(cnote);
  frag.appendChild(cc);
  /* "Every year" folds under the total's difference; its eye still controls the client sheet */
  if(ys&&tr&&tr.children[4]){ const vc=[...ys.children].filter(c=>c.classList.contains('vbox')&&!c.classList.contains('blank')).pop(); const v=vc?(vc.querySelector('span')||vc).textContent.replace(/\/yr$/,''):''; if(v.trim()){ const sp=document.createElement('span'); sp.className='mx-yr'+(ys.classList.contains('off')?' off':'');
    sp.innerHTML=`${escT(v.trim())} a year <button type="button" class="eye mx-yreye" data-eye="fha:ysave" aria-label="Show or hide the yearly amount for the client" title="Show/hide for client"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"></path><circle cx="12" cy="12" r="2.6"></circle></svg></button>`;
    tr.children[4].appendChild(sp); } ys.classList.add('mx-folded'); }
  const nHid=[...pay,...loan,...close].filter(n=>n.classList.contains('off')&&!n.classList.contains('missingrow')).length;
  if(nHid){ const p=document.createElement('p'); p.className='mx-hidden-line';
    p.innerHTML=nHid+' row'+(nHid===1?'':'s')+' hidden from client · <button type="button" data-mx-showhid>'+(document.body.classList.contains('mx-showhid')?'hide them':'show')+'</button>'; frag.appendChild(p); }
  sheet.appendChild(frag);

  /* ---------- 3. LO panel: checks · deal structure · suggestions · assumptions ---------- */
  const panel=q('#results .lopanel'); if(!panel) return;
  /* checks now live in the verdict bar: take them (and the acknowledge button) out of the panel */
  const h=q('.lp-h',panel); if(h) h.remove();
  const pills=q('.pills',panel); if(pills) pills.remove();
  window.__mxAckBtn=ack?q('[data-tgl="ackOver"]',ack):null;
  const ds=document.createElement('div'); ds.className='mx-deal'; ds.innerHTML='<div class="lp-h">Deal structure</div>';
  const ZERO=['b_bpcomp','b_excess','b_short','b_netesc','b_ysp'];
  deal.forEach(n=>{ const e=q(':scope > .eye',n), id=e?e.dataset.eye.split(':')[1]:'';
    if(ZERO.includes(id)&&n.classList.contains('off')) n.classList.add('mx-zero');
    if(id==='b_loan'){ n.classList.remove('off'); }
    ds.appendChild(n); });
  const sm=q('[data-tgl="showMore"]',ds); if(sm){ sm.textContent='View max loan calc ⤢'; sm.setAttribute('aria-haspopup','dialog'); }
  panel.prepend(ds);
  const note=q('.note',panel); if(note){ const d=document.createElement('details'); d.className='mx-assume'; if(window.__mxAssumeOpen) d.open=true;
    d.innerHTML='<summary>Assumptions</summary>'; note.replaceWith(d); d.appendChild(note); d.addEventListener('toggle',()=>{ window.__mxAssumeOpen=d.open; }); }
}

/* ---------- 1. verdict strip ---------- */
const FIELD_FOR=[[/current total payment/i,'fha_curpay'],[/title fees/i,'fha_title'],[/original loan amount/i,'fha_oamt_ov'],[/statement balance/i,'fha_balov']];
function verdict(){
  const r=window.MX_LAST; let el=document.getElementById('mxVerdict');
  if(!el){ el=document.createElement('section'); el.id='mxVerdict'; el.className='mx-verdict'; el.setAttribute('aria-label','Verdict'); const g=q('.wrap > .grid'); if(!g) return;
    /* sticky bar: verdict tiles on the left, the LO View / Client View switch on the right (same buttons, moved from the header) */
    const bar=document.createElement('div'); bar.className='mx-bar'; bar.id='mxBar'; const slot=document.createElement('div'); slot.className='mx-modeslot';
    const mode=q('header.app .mode'); if(mode) slot.appendChild(mode);
    bar.appendChild(el); bar.appendChild(slot); g.before(bar); }
  if(!r){ el.innerHTML=''; return; }
  const checks=r.checks||[];
  const ntb=checks.find(c=>/^NTB/.test(c.text)), sea=checks.find(c=>/^Seasoning/.test(c.text));
  const rest=t=>t.replace(/^(NTB|Seasoning) (passed|fails)\s*(—|-)?\s*/i,'');
  const tile=(c,label)=>{ const ok=c&&c.status==='pass';
    return `<div class="mx-vt ${ok?'pass':'fail'}"><p class="k">${label}</p><p class="big">${ok?ICON_OK:ICON_NO}${ok?(label==='Seasoning'?'Met':'Passes'):'Fails'}</p>${ok?'':`<p class="s">${escT(c?rest(c.text):'')}</p>`}</div>`; };
  const sv=r.monthlySavings, good=sv>=0;
  const pay=`<div class="mx-vt hero ${good?'':'neg'}"><p class="k">Monthly payment</p><p class="big">${fmt$(Math.abs(sv))} ${good?'lower':'higher'}</p></div>`;
  const fsub=(()=>{ const b=keyRow(q('#results .sheet')||document,'b_cash'); const s=b&&q('.lblc .sub',b); return s?s.textContent:''; })();
  const cashBad=(()=>{ const r2=keyRow(q('#results .sheet')||document,'b_cash'); return !!(r2&&q('.vbox.bad',r2)); })();
  const funds=`<div class="mx-vt ${cashBad?'fail':''}"><p class="k">Funds due at closing</p><p class="big">${fmt$(r.fundsDueAtClosing)}</p><p class="s">${escT(fsub)}</p></div>`;
  const extra=[]; { const er=keyRow(q('#results .sheet')||document,'x_escref'), es=er&&q('.lblc .sub',er);
    if(es&&/ESTIMATE/i.test(es.textContent)) extra.push({status:'review', text:'Escrow refund is an estimate — enter the statement escrow balance to confirm.', field:'fha_escbal'}); }
  const items=checks.filter(c=>c.status!=='pass'&&!/^NTB|^Seasoning/.test(c.text)).concat(extra);
  const fails=items.filter(c=>c.status==='fail'), first=fails[0]||items[0];
  let rev;
  if(!items.length) rev=`<div class="mx-vt pass"><p class="k">Needs attention</p><p class="big">${ICON_OK}All clear</p><p class="s">Nothing to fix</p></div>`;
  else { const miss=/^MISSING:/.test(first.text);
    let short=first.text.replace(/^(RESTRUCTURE|MISSING):\s*/,'').split(/(?<=\.)\s/)[0].replace(/\.$/,'');
    if(miss) short='Missing: '+short.split(/\s[—-]\s/)[0]; short=short.charAt(0).toUpperCase()+short.slice(1);
    const f=first.field?[null,first.field]:FIELD_FOR.find(([re])=>/^MISSING/.test(first.text)&&re.test(first.text));
    rev=`<button type="button" class="mx-vt rev ${fails.length?'fail':'warnonly'}" data-mx-rev="${f?f[1]:''}" aria-label="${items.length} item${items.length===1?'':'s'} need attention. ${escT(short)}"><p class="k">Needs attention</p><p class="big">${items.length} item${items.length===1?'':'s'}</p><p class="s">${escT(short)}</p><span class="mx-chev" aria-hidden="true">›</span></button>`; }
  el.innerHTML=tile(ntb,'Net tangible benefit')+tile(sea,'Seasoning')+pay+funds+rev;
  /* every open check, full text, attached under the bar (scrolls away; the tiles stay pinned) */
  let dr=document.getElementById('mxChecks');
  if(!dr){ dr=document.createElement('section'); dr.id='mxChecks'; dr.className='mx-checks'; dr.setAttribute('aria-label','Checks'); (document.getElementById('mxBar')||el).after(dr); }
  const open=checks.filter(c=>c.status!=='pass');
  open.push(...extra);
  const sugs=(r.suggestions||[]).filter(t=>!/no comp bump from collect-1-payment/.test(t));
  if(!open.length&&!sugs.length){ dr.innerHTML=''; dr.hidden=true; return; }
  dr.hidden=false;
  const tagOf=t=>/^MISSING:/.test(t)?'Missing':/^RESTRUCTURE:/.test(t)?'Restructure':/^(NTB|Seasoning)/.test(t)?t.split(' ')[0]:'Review';
  const list=open.length?'<ul class="mx-cklist">'+open.map(c=>{ const tag=tagOf(c.text), tx0=c.text.replace(/^(MISSING|RESTRUCTURE):\s*/,'').replace(/ under Funds Due/,''), tx=tx0.charAt(0).toUpperCase()+tx0.slice(1);
    const f=c.field?[null,c.field]:(/^MISSING/.test(c.text)&&FIELD_FOR.find(([re])=>re.test(c.text)));
    return `<li class="mx-ck ${c.status==='fail'?'fail':'warn'}"><span class="tag">${tag}</span><span class="tx">${escT(tx)}</span>${f?`<button type="button" class="go" data-mx-rev="${f[1]}">Go to field ›</button>`:''}</li>`; }).join('')+'</ul>'
    :'<p class="mx-ck-none">'+ICON_OK+'No checks need attention.</p>';
  /* suggestions: the term ladder becomes a small table, the rest one line each */
  let term='', facts=[];
  sugs.forEach(t=>{ const m=t.match(/^Term options vs ([\d.]+) yrs left/);
    if(m){ const rows=[...t.matchAll(/(\d+)-yr \(([^)]+)\) — saves (\S+)\/mo, cuts (-?\d+) pmts/g)];
      if(rows.length){ term=`<div class="mx-term"><p class="mx-sgh">Term options <span>vs ${m[1]} yrs left · every one still saves</span></p><table><thead><tr><th>Term</th><th>Saves</th><th>Payments cut</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${x[1]} yr</b> <span>${escT(x[2])}</span></td><td>${escT(x[3])}/mo</td><td>${x[4]}</td></tr>`).join('')}</tbody></table></div>`; return; } }
    facts.push(t); });
  const sg=(term||facts.length)?`<div class="mx-sg"><p class="mx-grp-h">LO suggestions</p>${term}${facts.length?`<ul class="mx-facts">${facts.map(t=>`<li>${escT(t)}</li>`).join('')}</ul>`:''}</div>`:'';
  dr.innerHTML=`<div class="mx-ckcol"><p class="mx-grp-h">Needs attention${open.length?' · '+open.length:''}</p>${list}</div>${sg}`;
  const ab=window.__mxAckBtn;
  if(ab){ const host=qa('.mx-ck',dr).find(li=>/Restructure/.test(li.textContent)); if(host) host.appendChild(ab); else { const ul=q('.mx-cklist',dr)||q('.mx-ckcol',dr); const li=document.createElement('li'); li.className='mx-ck warn'; li.appendChild(ab); ul.appendChild(li); } }
  /* the panel's own suggestions box is no longer needed */
  const sb=q('#results .lopanel .sugg'); if(sb) sb.remove();
}


/* ---------- max loan calc: pop-out breakdown ----------
   The "View max loan calc" button opens a full-size panel listing the same rows the calculator rendered
   (A, B, UFMIP refund, max base loan, new UFMIP, new loan amount…). Read-only: nothing is recalculated. */
function openMaxLoan(){
  const ds=q('#results .mx-deal'); if(!ds) return;
  const rows=qa(':scope > .srow',ds).filter(r=>{ const e=q(':scope > .eye',r), id=e?e.dataset.eye.split(':')[1]:''; return r.classList.contains('morerow')||id==='b_loan'; });
  const RESULT=['b_base','b_loan'];
  const items=rows.map(r=>{ const e=q(':scope > .eye',r), id=e?e.dataset.eye.split(':')[1]:'';
    const l=q('.lblc',r); const lab=l?[...l.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim():'';
    const sub=l&&q('.sub',l)?q('.sub',l).textContent.trim():'';
    const vb=[...r.children].filter(c=>c.classList.contains('vbox')&&!c.classList.contains('blank')&&!c.classList.contains('dcell')).pop();
    const val=vb?vb.textContent.trim():''; const bad=vb&&vb.classList.contains('bad'), good=vb&&vb.classList.contains('save');
    return {id,lab,sub,val,bad,good}; }).filter(x=>x.lab&&!((x.id==='b_short'||x.id==='b_excess'||x.id==='b_bpcomp')&&/^\$0$/.test(x.val)));
  let ov=document.getElementById('mxModal');
  if(!ov){ ov=document.createElement('div'); ov.id='mxModal'; ov.className='mx-modal'; document.body.appendChild(ov);
    ov.addEventListener('click',e=>{ if(e.target===ov||e.target.closest('[data-mx-close]')) closeMaxLoan(); }); }
  ov.innerHTML=`<div class="mx-dlg" role="dialog" aria-modal="true" aria-labelledby="mxDlgT">
    <div class="mx-dlg-h"><div><p class="k">FHA Streamline</p><h2 id="mxDlgT">Max loan calculation</h2><p class="s">How the new loan amount is built, step by step.</p></div>
    <button type="button" class="mx-x" data-mx-close aria-label="Close">✕</button></div>
    <ol class="mx-steps">${items.map(x=>`<li class="${RESULT.includes(x.id)?'res':''} ${x.bad?'bad':''}"><div><b>${escT(x.lab)}</b>${x.sub?`<span>${escT(x.sub)}</span>`:''}</div><em class="${x.good?'good':''}">${escT(x.val)}</em></li>`).join('')}</ol>
    <div class="mx-dlg-f"><button type="button" class="mx-done" data-mx-close>Done</button></div></div>`;
  ov.hidden=false; document.body.classList.add('mx-modal-open');
  window.__mxLastFocus=document.activeElement; q('.mx-x',ov).focus();
}
function closeMaxLoan(){ const ov=document.getElementById('mxModal'); if(!ov||ov.hidden) return; ov.hidden=true; document.body.classList.remove('mx-modal-open'); if(window.__mxLastFocus) window.__mxLastFocus.focus(); }
document.addEventListener('click',e=>{ const b=e.target.closest('[data-tgl="showMore"]'); if(!b) return; e.preventDefault(); e.stopImmediatePropagation(); openMaxLoan(); },true);
document.addEventListener('keydown',e=>{ const ov=document.getElementById('mxModal'); if(!ov||ov.hidden) return;
  if(e.key==='Escape'){ e.preventDefault(); closeMaxLoan(); }
  if(e.key==='Tab'){ const f=qa('button',ov); if(!f.length) return; const i=f.indexOf(document.activeElement); if(e.shiftKey&&i<=0){ e.preventDefault(); f[f.length-1].focus(); } else if(!e.shiftKey&&i===f.length-1){ e.preventDefault(); f[0].focus(); } } });


/* ---------- embedded on a web page (sealed iframe, like the Debt Consolidation worksheet) ----------
   The host page sizes the frame to our height and tells us which part of the frame is on screen
   (two numbers: how far down it is scrolled, and the window height). We use that to keep the verdict bar
   pinned, to open the max loan pop-out where the LO is looking, and to scroll the page to a field.
   Only numbers cross the frame boundary — never any client or loan data. */
const EMB=window.parent!==window;
const VIEW={top:0,vh:window.innerHeight};
function mxScrollTo(el){
  if(!EMB){ if(el) el.scrollIntoView({block:'center',behavior:'smooth'}); else window.scrollTo({top:0,behavior:'smooth'}); return; }
  const y=el?Math.max(0,el.getBoundingClientRect().top+window.scrollY-Math.round(VIEW.vh*0.4)):0;
  window.parent.postMessage({mxLo:'scrollTo',y:y},'*');
}
function pinBar(){
  const bar=document.getElementById('mxBar'); if(!EMB||!bar) return;
  if(window.matchMedia('(max-width:760px)').matches){ bar.style.transform=''; return; }
  bar.style.transform='';
  const natural=bar.getBoundingClientRect().top+window.scrollY;
  const end=(q('.wrap > .grid')||document.body).getBoundingClientRect().bottom+window.scrollY-bar.offsetHeight;
  const shift=Math.max(0,Math.min(VIEW.top+10-natural,end-natural));
  bar.style.transform=shift?`translateY(${Math.round(shift)}px)`:'';
  bar.classList.toggle('mx-pinned',shift>0);
}
function placeModal(){ const r=document.documentElement.style, avail=document.documentElement.scrollHeight-VIEW.top; r.setProperty('--mx-vtop',Math.round(VIEW.top)+'px'); r.setProperty('--mx-vh',Math.round(Math.max(320,Math.min(VIEW.vh,avail)))+'px'); }
if(EMB){
  document.documentElement.classList.add('mx-embed');
  let lastH=0;
  const send=()=>{ const h=Math.ceil(document.documentElement.getBoundingClientRect().height); if(h!==lastH){ lastH=h; window.parent.postMessage({mxLo:'height',h:h},'*'); } };
  new ResizeObserver(send).observe(document.documentElement); send();
  window.addEventListener('message',e=>{ if(e.source!==window.parent||!e.data||typeof e.data!=='object') return;
    const v=e.data.mxLoView; if(v&&typeof v.top==='number'&&typeof v.vh==='number'&&v.vh>200&&v.vh<5000&&v.top>=0&&v.top<50000){ VIEW.top=v.top; VIEW.vh=v.vh; pinBar(); placeModal(); } });
  window.parent.postMessage({mxLo:'ready'},'*');
}

/* ---------- wiring ---------- */
document.addEventListener('click',e=>{
  const hb=e.target.closest('[data-mx-showhid]'); if(hb){ document.body.classList.toggle('mx-showhid'); render(); return; }
  const rv=e.target.closest('[data-mx-rev]');
  if(rv){ const id=rv.dataset.mxRev, f=id&&document.getElementById(id);
    if(f){ const sec=f.closest('details'); if(sec) sec.open=true; mxScrollTo(f); f.focus({preventScroll:true}); }
    else { mxScrollTo(null); } }
});
const _renderInputs=renderInputs; renderInputs=function(){ _renderInputs(); arrange(); };

/* ---------- client view: designed like the Debt Consolidation client sheet ----------
   Reads the numbers already shown on the sheet (same text, same rounding) and respects every eye toggle. */
const EHO='<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4 3 17h4v18h26V17h4z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><rect x="12" y="19" width="16" height="3.5" fill="currentColor"/><rect x="12" y="26" width="16" height="3.5" fill="currentColor"/></svg>';
function clientView(){
  const sheet=q('#results .sheet'); if(!sheet) return;
  const R=id=>keyRow(sheet,id), shown=id=>{ const r=R(id); return !!r&&!r.classList.contains('off'); };
  const txt=(row,i)=>{ const c=row&&row.children[i]; if(!c) return ''; return [...c.childNodes].filter(n=>n.nodeType===3||(n.tagName&&!n.classList.contains('mx-vs')&&!n.classList.contains('eye'))).map(n=>n.textContent).join('').trim(); };
  const sub=(row)=>{ const s=row&&q('.lblc .sub',row); return s?s.textContent.trim():''; };
  const dOn=k=>!S.hidden['fha:'+k];
  const r=window.MX_LAST||{}; const E=escT;
  /* date in the header row */
  const sh=q('.shead',sheet); if(sh&&!q('.mx-cvdate',sh)){ const d=document.createElement('div'); d.className='mx-cvdate'; d.innerHTML='Prepared '+new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+'<span>Rates change daily</span>'; sh.appendChild(d); }
  const tot=R('tot'), cur=txt(tot,2), neu=txt(tot,3), sv=r.monthlySavings, good=sv>=0, showSave=dOn('d_msave');
  const saveTxt=(q('.dcell > span',tot||document)||{}).textContent||'';
  const amt=saveTxt.replace(/ (lower|more)$/,'');
  /* 1. snapshot */
  let h='';
  if(tot&&shown('tot')){
    const flat=Math.abs(sv||0)<1;
    const head=flat?`Your payment stays about the same: <b>${E(neu)}</b> a month`:showSave?(good?`You’d pay <b>${E(amt)} less</b> every month`:`Your new payment would be <b>${E(amt)} more</b> a month`):`Your new payment would be <b>${E(neu)}</b> a month`;
    const yr=!flat&&good&&showSave&&shown('ysave')?` That’s <b>${E(txt(R('ysave'),3))}</b> a year.`:'';
    const mx=Math.max(r.currentTotal||0,r.newTotal||0)||1, w=v=>(Math.max(0,v)/mx*100).toFixed(2)+'%';
    const keep=good&&showSave&&sv>=1?`<i class="keep" style="width:${w(sv)}"><span data-short="▼ ${E(amt)}">▼ Yours to keep ${E(amt)}</span></i>`:'';
    h+=`<div class="cv-card cv-snap ${showSave&&!good&&!flat?'neg':''}"><p class="cv-h">${head}</p><p class="cv-s">Today you pay <b>${E(cur)}</b> a month. With your new loan, <b>${E(neu)}</b>.${yr}</p>
      <div class="cv-bars"><div class="r"><span class="l">Today</span><div class="bar"><i class="now" style="width:${w(r.currentTotal)}"><span>Mortgage ${E(cur)}</span></i></div><b class="v now">${E(cur)}<small>/mo</small></b></div>
      <div class="r"><span class="l">New loan</span><div class="bar"><i class="new" style="width:${w(r.newTotal)}"><span>New payment ${E(neu)}</span></i>${keep}</div><b class="v new">${E(neu)}<small>/mo</small></b></div></div>`;
    const tiles=[];
    if(shown('curbal')) tiles.push(['Loan amount',E(txt(R('curbal'),3)),'']);
    if(shown('rate')){ const ds=(q('.dcell > span',R('rate'))||{}).textContent||''; tiles.push(['Interest rate',E(txt(R('rate'),3)),dOn('d_rate')&&/lower/.test(ds)?E(ds):'']); }
    if(shown('term')) tiles.push(['Term',E(txt(R('term'),3).replace(/^(\d+) yr$/,'$1-year fixed')),'']);
    if(shown('b_cash')) tiles.push(['Due at closing',E(txt(R('b_cash'),3)),'est.']);
    if(tiles.length) h+=`<div class="cv-loan"><p>Your new loan</p><dl>${tiles.map(t=>`<div><dt>${t[0]}</dt><dd>${t[1]}${t[2]?`<small>${t[2]}</small>`:''}</dd></div>`).join('')}</dl></div>`;
    h+='</div>';
  }
  /* 2. what's in the payment */
  const lines=[['pi','Principal & interest'],['mi','Mortgage insurance'],['esc','Taxes & insurance']].filter(([id])=>shown(id));
  if(tot&&shown('tot')&&lines.length){
    const li=(i)=>lines.map(([id,l])=>`<li><span>${l}</span><b>${E(txt(R(id),i))}</b></li>`).join('');
    h+=`<p class="cv-sect">Your monthly payment</p><div class="cv-two">
      <div class="cv-pc now"><h3>Today</h3><ul>${li(2)}</ul><div class="cv-tot"><span>Every month</span><b>${E(cur)}</b></div></div>
      <div class="cv-pc new"><h3>After closing</h3><ul>${li(3)}</ul><div class="cv-tot"><span>Every month</span><b>${E(neu)}</b></div></div></div>`;
  }
  /* 3. interest */
  if(shown('intleft')){
    const ir=R('intleft'), a=txt(ir,2), b=txt(ir,3), ds=(q('.dcell > span',ir)||{}).textContent||'', igood=/less$/.test(ds)&&dOn('d_isave');
    const mx=Math.max(r.interestLeftCurrent||0,r.interestNew||0)||1, w=v=>(Math.max(0,v)/mx*100).toFixed(1)+'%';
    const tl=shown('term');
    h+=`<p class="cv-sect">Interest</p><div class="cv-card cv-int"><div class="cv-int-hero ${igood?'':'plain'}"><div><p class="k">${igood?'Interest you’d save':'Interest left to pay'}</p><p class="n">${E(igood?ds.replace(/ less$/,''):b)}</p></div>
      <p class="t">${igood?'Less interest over the life of the loan than you’d pay by keeping your current mortgage.':'Total interest left on the new loan, before any extra payments.'}</p></div>
      <div class="cv-int-bars"><div class="r"><span class="l">Current loan${tl&&r.paymentsLeft!=null?`<small>${r.paymentsLeft} payments left</small>`:''}</span><span class="b"><i style="width:${w(r.interestLeftCurrent)}; background:#F46744"></i></span><b>${E(a)}</b></div>
      <div class="r"><span class="l">New loan${tl&&r.newTermMonths?`<small>${r.newTermMonths} payments</small>`:''}</span><span class="b"><i style="width:${w(r.interestNew)}; background:#0E2A47"></i></span><b>${E(b)}</b></div></div></div>`;
  }
  /* 4. at closing */
  const tl2=[];
  if(shown('b_cash')) tl2.push(['Funds due at closing',txt(R('b_cash'),3),sub(R('b_cash'))]);
  if(shown('x_skip')) tl2.push(['Payments you skip',txt(R('x_skip'),3),sub(R('x_skip'))]);
  if(shown('x_escref')) tl2.push(['Escrow refund',txt(R('x_escref'),3),'From your current servicer'+(r.escrowRefundEstimated?' · estimate':' · about 30 days after payoff')]);
  const cn=sheet.querySelector('.cnote'), cnRow=cn&&cn.closest('.srow'), cnOn=cn&&!cnRow.classList.contains('off');
  if(tl2.length||cnOn){ h+=`<p class="cv-sect">At closing</p>`+(tl2.length?`<div class="cv-three">${tl2.map(t=>`<div class="cv-tile"><p class="k">${E(t[0])}</p><p class="n">${E(t[1])}</p><p class="s">${E(t[2])}</p></div>`).join('')}</div>`:'')+(cnOn?`<p class="cv-note">${E(cn.textContent)}</p>`:''); }
  /* 5. disclosures */
  h+=`<div class="cv-disc"><p class="h">Important information</p>
    <p><b>Estimate only.</b> This worksheet is an estimate for discussion purposes. It is not a Loan Estimate, an offer or commitment to lend, or a rate lock. Rates, terms, payments and fees are subject to change and to credit approval, underwriting, payoff demand, final pricing, title and property and program eligibility. Your Loan Estimate will show the actual terms and costs.</p>
    <p><b>Rate and payment.</b> The interest rate shown is the note rate, not the annual percentage rate (APR); the APR, which includes certain loan costs, may be higher. The new payment includes estimated principal and interest, property taxes and homeowners insurance, and mortgage insurance where shown. Taxes and insurance are estimates and may change; escrow amounts are set at closing.</p>
    <p class="lic">${EHO}<span>Moxie Mortgage is a division of NEXA Mortgage, LLC (NEXA Lending). NMLS #1660690 · AZ Mortgage Banker License #0944059 · 5559 S Sossaman Rd, Bldg 1, Ste 101, Mesa, AZ 85212. Verify licensing at www.nmlsconsumeraccess.org. Equal Opportunity Lender.</span></p></div>`;
  let cv=q('.mx-cv',sheet); if(!cv){ cv=document.createElement('div'); cv.className='mx-cv'; sheet.appendChild(cv); }
  cv.innerHTML=h;
  fitBars();
}
/* bar labels: full text if it fits, else the short version, else nothing */
function fitBars(){ if(!document.body.classList.contains('client')) return;
  qa('.cv-bars .bar i span').forEach(sp=>{ if(sp.scrollWidth<=sp.clientWidth+1) return; if(sp.dataset.short){ sp.textContent=sp.dataset.short; if(sp.scrollWidth<=sp.clientWidth+1) return; } sp.textContent=''; }); }
window.addEventListener('resize',()=>{ clearTimeout(window.__mxFit); window.__mxFit=setTimeout(()=>{ if(document.body.classList.contains('client')) render(); },120); });

function tileNotes(){ qa('#results .mx-tiles > .srow').forEach(r=>{ const sb=q('.lblc .sub',r); if(sb){ const e=q(':scope > .eye',r)&&q(':scope > .eye',r).dataset.eye;
    if(/x_escref/.test(e||'')&&/ESTIMATE/i.test(sb.textContent)) sb.textContent='From the old servicer · estimate'; sb.classList.add('mx-tnote'); r.appendChild(sb); } }); }
(function(){ const b=q('header.app'); if(b&&!q('.mx-hmeta',b)){ const m=document.createElement('p'); m.className='mx-hmeta'; m.innerHTML='Prepared '+new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+'<span>Rates change daily</span>'; b.appendChild(m); } })();
const _render=render; render=function(){ _render(); restructureSheet(); verdict(); summaries(); clientView(); tileNotes(); pinBar(); };
arrange(); render();
})();
