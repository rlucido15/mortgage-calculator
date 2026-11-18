# FHA Streamline worksheet

Live at https://rlucido15.github.io/mortgage-calculator/fha-streamline/ (GitHub Pages).


The calculator is a single self-contained HTML file (`index.html`). Fonts and logos are embedded and nothing loads from the network. It works in three ways:

1. **Opened directly** in a browser, for an LO working a file.
2. **Embedded on a web page** (e.g. Lofty) with `embed-snippet.html`. The calculator runs in a sealed frame, so the page's styles can't break it. The page and the calculator only trade numbers (frame height and scroll position), never client data.
3. **Driven by the Refi Engine** (a separate, private program) through a small JavaScript API, without anyone clicking through the screen.

## Engine API

The worksheet exposes `window.MX_FHA`:

```js
MX_FHA.fields()          // every input id → its current value
MX_FHA.run({             // set inputs by id, recalculate, return results
  fha_close: '2024-05-15', fha_rate: '6.875', fha_price: '398,000', fha_dp: '3.5',
  fha_curpay: '3,050', fha_nrate: '5.5', fha_nterm: '360', fha_title: '1,400', fha_ysp: '3.25',
  collectOnePayment: true
})
MX_FHA.result()          // latest results, no changes
```

The results include:

- **Headline numbers:** monthly savings, new payment, loan amount, funds due at closing, interest left today vs. new, UFMIP refund and more.
- **`checks`:** a list of `{ status: 'pass' | 'fail' | 'review', text }`.
- **`suggestions`:** the LO suggestions as plain text.
- **`unknownFields`:** any ids you passed that don't exist.

The API reads the calculator's own results. It never does math of its own.

## Folder layout

```
fha-streamline/
  index.html          built calculator; this is the file to use or host
  embed-snippet.html  paste into the Lofty page
  src/original.html   the calculator as it was handed over (formulas live here)
  tests/compare.py    proves the numbers match original.html and the controls work
```

The design layer (brand skin, layout script, fonts, logos and the build script) is shared with the VA IRRRL and
Conventional R&T worksheets and lives in `../shared/`. See the repo README for how to change and rebuild.
