# WinRips E2E audit suite

Playwright tests that crawl navigation surfaces and validate the Mystery Drops opening flow.

## Prerequisites

```bash
npm install
npx playwright install chromium
```

## Run

```bash
# Headless (starts Vite dev server on port 4444 automatically)
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Open last HTML report
npm run test:e2e:report
```

## What is covered

- **navigation-audit.spec.ts** — Sidebar, mobile nav, footer info pages, header auth modals, and a recursive pass over nav-zone buttons/links. Failures include the DOM element path, console errors, same-origin HTTP 404s, and stuck loading copy.
- **mystery-drops.spec.ts** — Opens the first lobby pack, asserts the drop table renders, runs **Demo Spin**, and waits for the reveal flow to finish without a transaction failure modal.

Age verification is bypassed in tests via `localStorage` (`winrips_age_verified`).
