# Shared design layer

Used by every Moxie worksheet in this repo (FHA Streamline, VA IRRRL, Conventional R&T). Each worksheet's math
stays in its own `src/original.html`; this folder only holds the look and layout, applied on top at build time.

```
shared/
  build.py         builds <calculator>/index.html from <calculator>/src/original.html + the files below
  moxie-skin.css   brand look (Barlow, colors, cards)
  mx-layout.css    layout: verdict bar, checks, cards, client view, pop-outs, embedding
  mx-layout.js     moves and relabels what the calculator rendered; per-product setup is in CONF at the top
  compare.py       number check for VA IRRRL and Conventional R&T
  assets/          Barlow fonts and Moxie wordmarks
```

## Changing a worksheet

1. Edit files here (all worksheets) or a worksheet's `src/original.html` (only when you mean to change its math).
2. From the repo root: `python3 shared/build.py all`
3. Run the checks; every case must print `OK`:
   - `python3 fha-streamline/tests/compare.py`
   - `python3 shared/compare.py va-irrrl`
   - `python3 shared/compare.py conventional-rt`
4. Commit the sources and the rebuilt `index.html` files together. GitHub Pages republishes on push to `main`.
