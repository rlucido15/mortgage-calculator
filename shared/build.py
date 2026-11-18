"""Build a Moxie calculator's index.html from its src/original.html plus the shared design layer.

Usage (from the repo root):
    python3 shared/build.py fha-streamline
    python3 shared/build.py va-irrrl
    python3 shared/build.py conventional-rt
    python3 shared/build.py all

Visual and wiring changes only: the calculation code is left exactly as it was. Every edit below is an
exact-match text replacement that must match the expected number of times, or the build stops.
"""
import base64, sys, pathlib

SHARED = pathlib.Path(__file__).resolve().parent
ROOT = SHARED.parent
ASSETS = SHARED / 'assets'
b64 = lambda p: base64.b64encode((ASSETS / p).read_bytes()).decode()

# Read-only copy of the results for the Refi Engine API. Added just before each product's sheetOut(); uses only
# variables that function already computed, so no number is ever calculated here.
MX_FHA = (
    "  window.MX_LAST={currentTotal:body.curTot, newTotal:newTotPay, monthlySavings:body.save, annualSavings:body.save*12,\n"
    "    newRate:c.nrate, newTermMonths:c.nterm, newPI, newMonthlyMIP:mMIP, newMIPRate:mipRate, newLoanAmount:loan, maxBaseLoan:base, cappedAtOriginal:capped,\n"
    "    currentBalance:c.bal, currentBalanceEstimated:!(gv('fha_balov',0)>0), currentPI:c.curPI, currentMIP:c.curMI, currentMIPEstimated:mipEst, currentEscrow:c.curEsc,\n"
    "    payoff:c.payoff, ufmipRefund:refund, ufmipRefundPct:refPct, newUFMIP:newUF, prepaidInterest:prepaidInt, escrowDeposit:escDep, newEscrow:c.esc.monthly,\n"
    "    cashToClose:cashDue, fundsDueAtClosing:collect, collectOnePayment:bringOn, unusedLenderCredit:excessCredit, payoffShortfall:trueShort, effectiveCompPct:effCompPct,\n"
    "    paymentsMade:c.made, paymentsLeft:c.remaining, interestLeftCurrent:c.curPI*c.remaining-c.bal, interestNew:totInterest(loan,c.nrate,c.nterm),\n"
    "    seasoningMet:seasonOK, seasoningEligibleDate:iso(eligible), closingDate:iso(c.nclose), fundingDate:iso(c.fund), paymentsSkipped:c.skipped,\n"
    "    escrowRefund:c.escRefund, escrowRefundEstimated:c.escRefundEst,\n"
    "    suggestions:sug.map(x=>x.replace(/<[^>]+>/g,''))};\n")
MX_VA = (
    "  window.MX_LAST={currentTotal:body.curTot, newTotal:body.newTot, monthlySavings:body.save, annualSavings:body.save*12,\n"
    "    newRate:c.nrate, newTermMonths:c.nterm, newPI, newLoanAmount:loan, fundingFee:ffee, fundingFeeWaived:exempt, fundingFeeFinanced:finFee, closingCostsFinanced:finCosts,\n"
    "    currentBalance:c.bal, currentBalanceEstimated:!(gv('va_balov',0)>0), currentPI:c.curPI, currentEscrow:c.curEsc,\n"
    "    payoff:c.payoff, closingCosts:c.costs, prepaidInterest:c.prepaidInt, escrowDeposit:c.esc.deposit, newEscrow:c.esc.monthly,\n"
    "    paymentsMade:c.made, paymentsLeft:c.remaining, interestLeftCurrent:c.curPI*c.remaining-c.bal, interestNew:totInterest(loan,c.nrate,c.nterm),\n"
    "    rateDrop:drop, recoupMonths:isFinite(recoup)?recoup:null, seasoningMet:seasonOK, seasoningEligibleDate:iso(eligible),\n"
    "    closingDate:iso(c.nclose), fundingDate:iso(c.fund), paymentsSkipped:c.skipped, escrowRefund:c.escRefund, escrowRefundEstimated:c.escRefundEst,\n"
    "    suggestions:[]};\n")
MX_CONV = (
    "  window.MX_LAST={currentTotal:body.curTot, newTotal:body.newTot, monthlySavings:body.save, annualSavings:body.save*12,\n"
    "    newRate:c.nrate, newTermMonths:c.nterm, newLoanType:ntype, newPI, newMonthlyPMI:pmi, newLoanAmount:loan, homeValue:val, ltv:isFinite(ltv)?ltv:null, closingCostsFinanced:finCosts,\n"
    "    currentBalance:c.bal, currentBalanceEstimated:!(gv('conv_balov',0)>0), currentPI:c.curPI, currentPMI:c.curMI, currentEscrow:c.curEsc, escrowsWaived:c.waive,\n"
    "    payoff:c.payoff, closingCosts:c.costs, prepaidInterest:c.prepaidInt, escrowDeposit:c.esc.deposit, newEscrow:c.esc.monthly,\n"
    "    paymentsMade:c.made, paymentsLeft:c.remaining, interestLeftCurrent:c.curPI*c.remaining-c.bal, interestNew:totInterest(loan,c.nrate,c.nterm),\n"
    "    rateDrop:drop, closingDate:iso(c.nclose), fundingDate:iso(c.fund), paymentsSkipped:c.skipped, escrowRefund:c.escRefund, escrowRefundEstimated:c.escRefundEst,\n"
    "    suggestions:[]};\n")

CALCS = {
    'fha-streamline': dict(
        name='FHA Streamline', api='MX_FHA', title_old='<title>FHA Streamline Calculator</title>',
        brand_old='<div class="brand"><h1>Moxie FHA <b>Streamline</b></h1></div>',
        edits=[
            ("  if(old) checks+=pill(true,'Pre-6/2009: 0.01% UF / 0.55% MIP');\n",
             "  if(old) checks+=pill(true,'Pre-6/2009: 0.01% UF / 0.55% MIP');\n" + MX_FHA),
            ("sheetOut('New — FHA Streamline'", "sheetOut('New'"),   # Robert, Nov 14: column head just "New"
        ]),
    'va-irrrl': dict(
        name='VA IRRRL', api='MX_VA', title_old='<title>VA IRRRL Calculator</title>',
        brand_old='<div class="brand"><h1>Moxie VA <b>IRRRL</b></h1></div>',
        edits=[
            ("  sheetOut('New — VA IRRRL', body.h, checks, '',\n", MX_VA + "  sheetOut('New', body.h, checks, '',\n"),
        ]),
    'conventional-rt': dict(
        name='Conventional Rate &amp; Term', api='MX_CONV', title_old='<title>Conventional R&T Calculator</title>',
        brand_old='<div class="brand"><h1>Moxie Conventional <b>Rate &amp; Term</b></h1></div>',
        edits=[
            ("  sheetOut('New — Conventional', body.h, checks, '',\n", MX_CONV + "  sheetOut('New', body.h, checks, '',\n"),
        ]),
}

API = r"""<script>
/* ================= Refi Engine API =================
   Lets the Refi Engine (or anyone in the browser console) run this calculator without clicking through it.
     __API__.fields()          -> every input id with its current value
     __API__.run({...})        -> set inputs by id (numbers, 'YYYY-MM-DD' dates, select values, true/false checkboxes),
                                 then recalculate and return the results (FHA also takes collectOnePayment:true|false)
     __API__.result()          -> the latest results without changing anything
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
window.__API__={fields, run, result:()=>JSON.parse(JSON.stringify(window.MX_LAST||{}))};
render();
})();
</script>
"""


def build(folder):
    cfg = CALCS[folder]
    src = ROOT / folder / 'src' / 'original.html'
    out = ROOT / folder / 'index.html'
    s = src.read_text()

    def rep(old, new, count=1):
        nonlocal s
        n = s.count(old)
        assert n == count, f'{folder}: expected {count} match(es), found {n}: {old[:70]!r}'
        s = s.replace(old, new)

    fonts = ''.join(
        f"@font-face{{font-family:'Barlow';font-style:normal;font-weight:{w};font-display:swap;"
        f"src:url(data:font/woff2;base64,{b64(f'barlow-{w}.woff2')}) format('woff2')}}"
        for w in (400, 500, 600, 700, 800))
    skin = (SHARED / 'moxie-skin.css').read_text() + '\n' + (SHARED / 'mx-layout.css').read_text()
    plain = cfg['name'].replace('&amp;', '&')

    # 1. proper document shell
    rep(cfg['title_old'], '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f'<title>Moxie {plain} — LO Worksheet</title>')
    # 2. Google Fonts -> embedded Barlow + brand skin and layout styles
    rep('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@600;700;800&family=Public+Sans:wght@400;500;600;700&display=swap">\n',
        f'<style>{fonts}</style>\n<style>\n{skin}</style>\n</head>\n<body>\n')
    # 3. header: gradient band with the white wordmark
    rep(cfg['brand_old'],
        f'<div class="brand"><img class="mx-wm" src="data:image/png;base64,{b64("moxie-wordmark-white.png")}" alt="Moxie Mortgage" width="138" height="30">'
        f'<span class="mx-sep" aria-hidden="true"></span><div><p class="mx-eb">Loan officer worksheet</p><h1>{cfg["name"]}</h1></div></div>')
    # 4. sheet logo: text mark -> blue wordmark image
    rep('<div class="logo"><span class="mm">M</span><span class="m1">MOXIE</span><span class="m2">MORTGAGE</span><span class="m3">DIVISION OF NEXA MORTGAGE</span></div>',
        f'<div class="logo"><img class="mx-wm-n" src="data:image/png;base64,{b64("moxie-wordmark-blue.png")}" alt="Moxie Mortgage"><span class="m3">DIVISION OF NEXA MORTGAGE</span></div>')
    # 5. product-specific: results copy for the engine, "New" column head
    for old, new in cfg['edits']:
        rep(old, new)
    # 6. Barlow draws '~' like a dash, so '~1' read as '-1': show it as '≈ 1' (same as the escrow refund)
    rep("'~'+c.skipped", "'≈ '+c.skipped")
    # 7. Robert, Nov 14: section title "New loan"
    rep("let h=sect('New loan build');", "let h=sect('New loan');")
    # 8. engine API + shared layout script, after the calculator's own script
    layout = (SHARED / 'mx-layout.js').read_text()
    rep('full();\n</script>\n', 'full();\n</script>\n' + API.replace('__API__', cfg['api']) + '<script>\n' + layout + '</script>\n')
    s = s.rstrip() + '\n</body>\n</html>\n'
    out.write_text(s)
    print('wrote', out.relative_to(ROOT), len(s), 'bytes')


if __name__ == '__main__':
    targets = sys.argv[1:] or ['all']
    for t in (CALCS if targets == ['all'] else targets):
        build(t)
