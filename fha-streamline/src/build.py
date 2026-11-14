"""Build calculators/fha-streamline/index.html from src/original.html.
Usage (from this folder):  python3 build.py   [or: python3 build.py original.html ../index.html]
Visual and wiring changes only: the calculation code is left exactly as it was."""
import base64, sys, pathlib

KIT = pathlib.Path(__file__).resolve().parent
SRC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else KIT / 'original.html'
OUT = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else KIT.parent / 'index.html'
ASSETS = KIT / 'assets'
s = SRC.read_text()
b64 = lambda p: base64.b64encode((ASSETS / p).read_bytes()).decode()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'expected {count} match(es), found {n}: {old[:70]!r}'
    s = s.replace(old, new)

fonts = ''.join(
    f"@font-face{{font-family:'Barlow';font-style:normal;font-weight:{w};font-display:swap;"
    f"src:url(data:font/woff2;base64,{b64(f'barlow-{w}.woff2')}) format('woff2')}}"
    for w in (400, 500, 600, 700, 800))
skin = (KIT / 'moxie-skin.css').read_text() + '\n' + (KIT / 'fha-layout.css').read_text()

# 1. proper document shell
rep('<title>FHA Streamline Calculator</title>',
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    '<title>Moxie FHA Streamline — LO Worksheet</title>')

# 2. Google Fonts (Barlow Semi Condensed / Public Sans) -> embedded Barlow + brand skin
rep('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@600;700;800&family=Public+Sans:wght@400;500;600;700&display=swap">\n',
    f'<style>{fonts}</style>\n<style>\n{skin}</style>\n</head>\n<body>\n')

# 3. header: gradient band with the white wordmark
rep('<div class="brand"><h1>Moxie FHA <b>Streamline</b></h1></div>',
    f'<div class="brand"><img class="mx-wm" src="data:image/png;base64,{b64("moxie-wordmark-white.png")}" alt="Moxie Mortgage" width="138" height="30">'
    '<span class="mx-sep" aria-hidden="true"></span><div><p class="mx-eb">Loan officer worksheet</p><h1>FHA Streamline</h1></div></div>')

# 4. sheet logo: text mark -> blue wordmark image
rep('<div class="logo"><span class="mm">M</span><span class="m1">MOXIE</span><span class="m2">MORTGAGE</span><span class="m3">DIVISION OF NEXA MORTGAGE</span></div>',
    f'<div class="logo"><img class="mx-wm-n" src="data:image/png;base64,{b64("moxie-wordmark-blue.png")}" alt="Moxie Mortgage"><span class="m3">DIVISION OF NEXA MORTGAGE</span></div>')

# 5. hand the results to the automation API (read-only copy; no math touched)
rep("  if(old) checks+=pill(true,'Pre-6/2009: 0.01% UF / 0.55% MIP');\n",
    "  if(old) checks+=pill(true,'Pre-6/2009: 0.01% UF / 0.55% MIP');\n"
    "  window.MX_LAST={currentTotal:body.curTot, newTotal:newTotPay, monthlySavings:body.save, annualSavings:body.save*12,\n"
    "    newRate:c.nrate, newTermMonths:c.nterm, newPI, newMonthlyMIP:mMIP, newMIPRate:mipRate, newLoanAmount:loan, maxBaseLoan:base, cappedAtOriginal:capped,\n"
    "    currentBalance:c.bal, currentBalanceEstimated:!(gv('fha_balov',0)>0), currentPI:c.curPI, currentMIP:c.curMI, currentMIPEstimated:mipEst, currentEscrow:c.curEsc,\n"
    "    payoff:c.payoff, ufmipRefund:refund, ufmipRefundPct:refPct, newUFMIP:newUF, prepaidInterest:prepaidInt, escrowDeposit:escDep, newEscrow:c.esc.monthly,\n"
    "    cashToClose:cashDue, fundsDueAtClosing:collect, collectOnePayment:bringOn, unusedLenderCredit:excessCredit, payoffShortfall:trueShort, effectiveCompPct:effCompPct,\n"
    "    paymentsMade:c.made, paymentsLeft:c.remaining, interestLeftCurrent:c.curPI*c.remaining-c.bal, interestNew:totInterest(loan,c.nrate,c.nterm),\n"
    "    seasoningMet:seasonOK, seasoningEligibleDate:iso(eligible), closingDate:iso(c.nclose), fundingDate:iso(c.fund), paymentsSkipped:c.skipped,\n"
    "    escrowRefund:c.escRefund, escrowRefundEstimated:c.escRefundEst,\n"
    "    suggestions:sug.map(x=>x.replace(/<[^>]+>/g,''))};\n")

# 5b. Barlow draws '~' like a dash, so '~1' read as '-1' on the client sheet: show it as '≈ 1' (same as the escrow refund)
rep("'~'+c.skipped", "'≈ '+c.skipped")

# 5c. Robert's review (Nov 14): column head just "New"; section title "New loan"
rep("sheetOut('New — FHA Streamline'", "sheetOut('New'")
rep("let h=sect('New loan build');", "let h=sect('New loan');")

# 6. automation API + check capture, appended after the calculator script
api = r"""<script>
/* ================= Refi Engine API =================
   Lets the Refi Engine (or anyone in the browser console) run this calculator without clicking through it.
     MX_FHA.fields()          -> every input id with its current value
     MX_FHA.run({...})        -> set inputs by id (numbers, 'YYYY-MM-DD' dates, select values, true/false checkboxes),
                                 plus optional collectOnePayment:true|false, then recalculate and return the results
     MX_FHA.result()          -> the latest results without changing anything
   Results include every headline number plus checks[] = {status:'pass'|'fail'|'review', text}. Uses the same
   calculations as the screen; nothing here does math of its own. */
(function(){
'use strict';
const PILLS=[];
const _pill=pill; pill=function(ok,txt){ PILLS.push({status:ok===true?'pass':ok===false?'fail':'review', text:String(txt).replace(/<[^>]+>/g,'')}); return _pill(ok,txt); };
const _render=render; render=function(){ PILLS.length=0; _render(); if(window.MX_LAST) window.MX_LAST.checks=PILLS.slice(); };
const fields=()=>{ const o={}; document.querySelectorAll('#inputs input[id], #inputs select[id]').forEach(el=>{ o[el.id]=el.type==='checkbox'?el.checked:el.value; }); return o; };
function run(vals){
  vals=vals||{}; const unknown=[];
  Object.keys(vals).forEach(k=>{
    if(k==='collectOnePayment'){ S.fhaBring=!!vals[k]; return; }
    const el=document.getElementById(k); if(!el){ unknown.push(k); return; }
    const v=vals[k];
    if(el.type==='checkbox') el.checked=!!v; else el.value=(v==null?'':String(v));
  });
  syncTaxRows(); syncFhaRows(); render();
  const r=JSON.parse(JSON.stringify(window.MX_LAST||{})); if(unknown.length) r.unknownFields=unknown; return r;
}
window.MX_FHA={fields, run, result:()=>JSON.parse(JSON.stringify(window.MX_LAST||{}))};
render();
})();
</script>
"""
rep('full();\n</script>\n', 'full();\n</script>\n' + api + '<script>\n' + (KIT / 'fha-layout.js').read_text() + '</script>\n')
s = s.rstrip() + '\n</body>\n</html>\n'
OUT.write_text(s)
print('wrote', OUT, len(s), 'bytes')
# the internal site serves only what is in /site — keep its copy in step (default build only)
SITE = KIT.parents[2] / 'site' / 'fha-streamline' / 'index.html'
if len(sys.argv) <= 2 and SITE.parent.is_dir():
    SITE.write_text(s); print('wrote', SITE)
