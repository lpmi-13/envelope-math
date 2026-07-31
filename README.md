# Back of the Napkin

A single-page learning app for practising back-of-the-envelope system-design calculations. It teaches the reasoning around an estimate—formula selection, order of magnitude, units, and design consequences—not only the final number.

## Run locally

Use Node 22 or newer, then:

```bash
npm install
npm run dev
```

The development server prints its local URL, normally `http://localhost:5173`.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

The end-to-end command builds the production app and runs the main flows in installed Chrome at desktop and mobile viewport sizes.

## Learning model

- Six focused modules: foundations, load, storage, bandwidth, latency, and compute.
- One worked example followed by four varied scenarios per module.
- Formula, magnitude, unit, and design implication are assessed separately.
- Immediate component-level feedback with two attempts per scenario.
- Hints fade after repeated success; mixed practice removes module cues.
- Distinct successful scenarios count toward progress, rather than repeated answers to one problem.
- Practice older than one day is marked for a cold review.
- Progress remains in versioned browser `localStorage`; no account or backend is required.

## Project structure

```text
src/
  content/       lesson definitions and scenario variants
  domain/        units, grading, and progress rules
  test/          browser-test setup
  App.tsx        application views and learning flow
  styles.css     responsive visual system
e2e/             Playwright browser flows
```

## Deploy to Netlify

The committed `netlify.toml` configures:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 24
- A deny-by-default Content Security Policy and strict browser isolation headers
- One-year immutable browser and CDN caching for content-hashed `/assets/*` files
- Revalidated browser caching and deploy-aware, one-year CDN caching for HTML

Production builds emit JavaScript and CSS as `assets/<name>-<content-hash>.<ext>` and
run `npm run verify:build` automatically. The build fails if a compiled asset or an
asset reference in `index.html` does not contain a hash. `social-preview.png` keeps a
stable URL for social crawlers, so it uses a shorter browser TTL while Netlify's CDN
invalidates it atomically on the next deploy.

Connect the repository to a Netlify project. Pushes to the production branch will build and publish automatically, while pull requests receive deploy previews. The app has no client-side URL routes, so it does not require an SPA fallback rewrite.
