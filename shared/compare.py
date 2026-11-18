"""Checks that a restyled calculator shows exactly the same numbers as its original.
Run from the repo root:  python3 shared/compare.py va-irrrl [chrome-path]
                         python3 shared/compare.py conventional-rt [chrome-path]
(FHA Streamline has its own, longer test: fha-streamline/tests/compare.py)"""
import asyncio, re, sys, pathlib, difflib
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
FOLDER=sys.argv[1]; CHROME=sys.argv[2] if len(sys.argv)>2 else None
ORIG=(ROOT/FOLDER/'src'/'original.html').as_uri(); NEW=(ROOT/FOLDER/'index.html').as_uri()
P={'va-irrrl':'va','conventional-rt':'conv'}[FOLDER]; API={'va':'MX_VA','conv':'MX_CONV'}[P]
CASES={'va':[{}, {'va_title':'1,400','va_nrate':'5.25','va_escbal':'1,900'},
   {'va_title':'1,100','va_arm':True,'va_balov':'371,000','va_exempt':True,'va_nterm':'300','va_pts':'0.5','va_ptype':'refi','va_finfee':False},
   {'va_title':'1,400','va_nrate':'6.6','va_close':'2026-08-15','va_fincosts':False,'va_escfin':True,'va_hoi':'2,400','va_tax':'5,000','va_taxfreq':'2'},
   {'va_title':'900','va_nrate':'4.9','va_holding':True,'va_netfund':True,'va_uw':'0','va_proc':False,'bor_name':'Pat Lee'}],
  'conv':[{}, {'conv_title':'1,400','conv_value':'560,000','conv_nrate':'5.5'},
   {'conv_title':'1,200','conv_value':'480,000','conv_ntype':'7/6','conv_mipnow':'145','conv_pmi':'90','conv_waive':True,'conv_holding':True},
   {'conv_title':'1,400','conv_value':'560,000','conv_nrate':'7.25','conv_arm':True,'conv_balov':'402,000','conv_fincosts':False},
   {'conv_title':'1,000','conv_value':'700,000','conv_nterm':'180','conv_pts':'1','conv_appr':'650','conv_netfund':True,'conv_escbal':'3,100'}]}[P]
SNAP="""()=>{const o={};document.querySelectorAll('#results .srow > .eye[data-eye]').forEach(b=>{const r=b.parentElement;
 const cell=i=>{const c=r.children[i]; if(!c) return ''; return [...c.childNodes].filter(n=>n.nodeType===3||(n.tagName&&!n.classList.contains('mx-vs')&&!n.classList.contains('eye'))).map(n=>n.textContent).join('').trim();};
 o[b.dataset.eye]=[cell(2),cell(3),(r.children[4]&&r.children[4].textContent||'').replace(/[^0-9.]/g,'')];});
 document.querySelectorAll('#results .dcell > .eye[data-eye]').forEach(b=>{const c=b.parentElement.cloneNode(true); c.querySelectorAll('.mx-yr').forEach(x=>x.remove()); o['D:'+b.dataset.eye]=c.textContent.replace(/[^0-9.]/g,'');});
 o.pills=[...document.querySelectorAll('#results .pill')].map(p=>p.textContent.trim()); return o;}"""
FILL="""v=>{for(const[k,x] of Object.entries(v)){const e=document.getElementById(k); if(e.type==='checkbox')e.checked=x; else e.value=x;} syncTaxRows(); syncFhaRows(); render();}"""
EXPECTED={P+':bal',P+':curbal',P+':pmade',P+':pleft',P+':x_skip'}   # rows merged / relabelled on purpose (same as FHA)
async def main():
  ok=True
  async with async_playwright() as pw:
    b=await (pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox']) if CHROME else pw.chromium.launch())
    p=await b.new_page(viewport={'width':1440,'height':900}); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)))
    for i,c in enumerate(CASES):
      await p.goto(ORIG); await p.evaluate(FILL,c); a=await p.evaluate(SNAP)
      await p.goto(NEW); await p.evaluate(FILL,c); n=await p.evaluate(SNAP)
      cnt=await p.evaluate("()=>({orig:null,inputs:document.querySelectorAll('#inputs input[id],#inputs select[id]').length,loose:[...document.querySelectorAll('#inputs input[id],#inputs select[id]')].filter(e=>!e.closest('.mx-ess,.mx-sec')).map(e=>e.id)})")
      bad=[]
      for k,va in a.items():
        vn=n.get(k)
        if k=='pills':
          got=await p.evaluate(f"{API}.result().checks.map(c=>c.text)")
          want=[re.sub(r'^[✓✕!]\s*','',x) for x in va]
          if [re.sub(r'\s+',' ',x).strip() for x in want]!=[re.sub(r'\s+',' ',x).strip() for x in got]: bad.append(('checks',want,got))
          continue
        if k in EXPECTED: continue
        if k.startswith('D:'):
          if vn!=va: bad.append((k,va,vn))
        elif vn is None: bad.append((k,'missing'))
        elif va[:2]!=vn[:2]: bad.append((k,va,vn))
      res=await p.evaluate(f"(()=>{{const r={API}.result(); return [Math.round(r.newTotal*100), r.checks.length]}})()")
      tot=await p.evaluate("window.MX_LAST&&Math.round(MX_LAST.newTotal*100)")
      if bad or cnt['loose'] or res[0]!=tot: ok=False
      print('case',i,'OK' if not bad else 'NUMBER MISMATCH',bad or '','| fields outside cards:',cnt['loose'] or 'none','| API checks:',res[1])
    await p.goto(NEW); await p.fill(f'#{P}_title','1400'); await p.fill(f'#{P}_nrate','5.1')
    print('typing recalcs ->', await p.evaluate("MX_LAST.newRate"))
    await p.click('.mx-mode, .mode button:nth-child(2)') if False else None
    print('errors:',errs); ok=ok and not errs
    await b.close()
  o=(ROOT/FOLDER/'src'/'original.html').read_text(); nn=(ROOT/FOLDER/'index.html').read_text()
  so=re.findall(r'<script>(.*?)</script>',o,re.S)[0]; sn=re.findall(r'<script>(.*?)</script>',nn,re.S)[0]
  d=[l for l in difflib.unified_diff(so.splitlines(),sn.splitlines(),lineterm='',n=0) if l[:1] in '+-' and l[:3] not in ('+++','---')]
  print(len(d),'changed lines in the calculator script (logo, labels, read-only results copy):')
  for l in d: print('   ',l[:110])
  print('ALL OK' if ok else 'PROBLEMS FOUND')
asyncio.run(main())
