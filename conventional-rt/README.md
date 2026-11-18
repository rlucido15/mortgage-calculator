# Conventional Rate & Term worksheet

Live at https://rlucido15.github.io/mortgage-calculator/conventional-rt/ (GitHub Pages).

Same design and behavior as the FHA Streamline worksheet: a single self-contained HTML file (`index.html`) that an LO
can open directly, that embeds on a web page with `embed-snippet.html` (sealed frame), and that the Refi Engine can
drive through a JavaScript API. The calculations are the original ones, untouched.

## Engine API

```js
MX_CONV.fields()          // every input id → its current value
MX_CONV.run({             // set inputs by id, recalculate, return results
  conv_close: '2024-05-15', conv_oamt: '385,000', conv_rate: '6.875', conv_value: '560,000',
  conv_escnow: '320', conv_nrate: '5.5', conv_nterm: '360', conv_ntype: 'fixed', conv_pmi: '0', conv_title: '1,400'
})
MX_CONV.result()          // latest results, no changes
```

Results include the headline numbers (monthly savings, new payment, loan amount, interest today vs. new, closing
costs, escrow refund…), `checks` as `{ status: 'pass' | 'fail' | 'review', text }`, and `unknownFields` for ids that
don't exist. The API reads the calculator's own results and never does math of its own.

## Folder layout

```
conventional-rt/
  index.html          built calculator; the file to use or host
  embed-snippet.html  paste into the Lofty page
  src/original.html   the calculator as handed over (formulas live here)
```

Shared design layer and build: `../shared/`. Number check: `python3 shared/compare.py conventional-rt` from the repo root.
