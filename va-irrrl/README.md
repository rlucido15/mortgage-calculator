# VA IRRRL worksheet

Live at https://rlucido15.github.io/mortgage-calculator/va-irrrl/ (GitHub Pages).

Same design and behavior as the FHA Streamline worksheet: a single self-contained HTML file (`index.html`) that an LO
can open directly, that embeds on a web page with `embed-snippet.html` (sealed frame), and that the Refi Engine can
drive through a JavaScript API. The calculations are the original ones, untouched.

## Engine API

```js
MX_VA.fields()          // every input id → its current value
MX_VA.run({             // set inputs by id, recalculate, return results
  va_close: '2024-05-15', va_oamt: '385,000', va_rate: '6.875', va_escnow: '320',
  va_nrate: '5.25', va_nterm: '360', va_title: '1,400', va_pts: '0', va_exempt: false
})
MX_VA.result()          // latest results, no changes
```

Results include the headline numbers (monthly savings, new payment, loan amount, interest today vs. new, closing
costs, escrow refund…), `checks` as `{ status: 'pass' | 'fail' | 'review', text }`, and `unknownFields` for ids that
don't exist. The API reads the calculator's own results and never does math of its own.

## Folder layout

```
va-irrrl/
  index.html          built calculator; the file to use or host
  embed-snippet.html  paste into the Lofty page
  src/original.html   the calculator as handed over (formulas live here)
```

Shared design layer and build: `../shared/`. Number check: `python3 shared/compare.py va-irrrl` from the repo root.
