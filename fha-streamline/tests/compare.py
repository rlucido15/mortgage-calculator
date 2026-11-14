"""Checks that the restyled FHA Streamline calculator shows exactly the same numbers as the original,
and that its controls still work. Requires: pip install playwright && playwright install chromium
Run:  python3 tests/compare.py            (or pass a Chrome binary path as the first argument)"""
import asyncio, json, re
from playwright.async_api import async_playwright
import pathlib, sys, difflib
HERE=pathlib.Path(__file__).resolve().parent
ORIG=(HERE.parent/'src'/'original.html').as_uri()
NEW=(HERE.parent/'index.html').as_uri()
CHROME=sys.argv[1] if len(sys.argv)>1 else None  # optional path to a Chrome/Chromium binary
CASES=[{}, {'fha_curpay':'3,050','fha_title':'1,400','fha_ysp':'3.25','fha_nrate':'5.5','fha_escnow':'480'},
 {'fha_curpay':'2,900','fha_title':'1,200','fha_ptype':'refi','fha_oamt_ov':'410,000','fha_balov':'395,000','fha_nterm':'300','fha_holding':True,'fha_ysp':'1'},
 {'fha_curpay':'2,450','fha_title':'1,400','fha_ysp':'4.5','fha_arm':True,'fha_inv':True,'fha_netfund':True,'fha_escbal':'2,100'}]
SNAP="""()=>{const o={};document.querySelectorAll('#results .srow > .eye[data-eye]').forEach(b=>{const r=b.parentElement;
 const cell=i=>{const c=r.children[i]; if(!c) return ''; const t=[...c.childNodes].filter(n=>n.nodeType===3||(n.tagName&&!n.classList.contains('mx-vs')&&!n.classList.contains('eye'))).map(n=>n.textContent).join('').trim(); return t;};
 o[b.dataset.eye]=[cell(2),cell(3),(r.children[4]&&r.children[4].textContent||'').replace(/[^0-9.]/g,'')];});
 document.querySelectorAll('#results .dcell > .eye[data-eye]').forEach(b=>{const c=b.parentElement.cloneNode(true); c.querySelectorAll('.mx-yr').forEach(x=>x.remove()); o['D:'+b.dataset.eye]=c.textContent.replace(/[^0-9.]/g,'');});
 o.pills=[...document.querySelectorAll('#results .pill')].map(p=>p.textContent.trim()); return o;}"""
async def fill(p,vals):
  await p.evaluate("""v=>{for(const[k,x] of Object.entries(v)){const e=document.getElementById(k); if(e.type==='checkbox')e.checked=x; else e.value=x;} syncTaxRows(); syncFhaRows(); render();}""",vals)
  return await p.evaluate(SNAP)
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME, args=['--no-sandbox']) if CHROME else await pw.chromium.launch()
    p=await b.new_page(viewport={'width':1440,'height':900}); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)))
    for i,c in enumerate(CASES):
      await p.goto(ORIG); a=await fill(p,c)
      await p.goto(NEW); n=await fill(p,c)
      diffs=[]
      for k,va in a.items():
        if k=='pills': continue
        vn=n.get(k)
        if k.startswith('D:'):
          if vn!=va: diffs.append((k,va,vn)); continue
        if vn is None: diffs.append((k,'removed',va)); continue
        if va[:2]!=vn[:2]: diffs.append((k,va,vn))
      EXPECTED={'fha:bal','fha:curbal','fha:pmade','fha:pleft','fha:x_skip'}  # rows merged/relabelled on purpose
      bad=[d for d in diffs if d[0] not in EXPECTED]
      print('case',i,'OK' if not bad else 'NUMBER MISMATCH',bad if bad else '')
    # interactions: typing in a moved field must recalc
    await p.goto(NEW)
    await p.fill('#fha_curpay','3050'); await p.fill('#fha_title','1400'); await p.fill('#fha_nrate','5.5')
    print('after typing, total row:', await p.evaluate("[...document.querySelectorAll('#results .srow.mx-tot .vbox')].map(x=>x.textContent).join(' | ')"))
    print('API matches screen:', await p.evaluate("Math.round(MX_LAST.newTotal)"), await p.evaluate("JSON.stringify(MX_FHA.result().checks.map(c=>c.status))"))
    await p.click('#mxVerdict .mx-vt.rev') if await p.query_selector('#mxVerdict .mx-vt.rev') else None
    # refi moves override into essentials
    await p.click('summary:has-text("Current loan details")'); await p.select_option('#fha_ptype','refi')
    print('override in essentials:', await p.evaluate("!!document.querySelector('.mx-ess #fha_oamt_ov')"), '| verdict review:', await p.evaluate("document.querySelector('#mxVerdict .rev .big')?.textContent"))
    await p.select_option('#fha_ptype','purchase')
    # toggles
    await p.click('[data-tgl="fhaBring"]'); print('collect off ->', await p.evaluate("MX_LAST.collectOnePayment"))
    await p.click('[data-tgl="fhaBring"]')
    await p.click('[data-tgl="showMore"]'); print('max loan modal steps:', await p.evaluate("document.querySelectorAll('.mx-steps li').length")); await p.keyboard.press('Escape')
    await p.click('#results .sheet .srow > .eye[data-eye="fha:pi"]'); print('pi hidden ->', await p.evaluate("document.querySelector('.mx-hidden-line')?.textContent"))
    await p.click('#results .sheet [data-mx-showhid]'); await p.click('#results .sheet .srow > .eye[data-eye="fha:pi"]'); await p.click('#results .sheet [data-mx-showhid]')
    print('errors:',errs); await b.close()
def script_diff():
  import re
  o=(HERE.parent/'src'/'original.html').read_text(); n=(HERE.parent/'index.html').read_text()
  so=re.findall(r'<script>(.*?)</script>',o,re.S)[0]; sn=re.findall(r'<script>(.*?)</script>',n,re.S)[0]
  d=[l for l in difflib.unified_diff(so.splitlines(),sn.splitlines(),lineterm='',n=0) if l[:1] in '+-' and not l.startswith(('+++','---'))]
  print(len(d),'changed lines in the calculator script (expected 17: logo, 3 labels, the read-only results copy for the Refi Engine)')
  for l in d: print('   ',l[:100])
script_diff()
asyncio.run(main())
