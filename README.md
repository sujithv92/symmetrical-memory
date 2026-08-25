# OCI Generative AI Professional — Quiz (1Z0-1127-25)

A single-page quiz app to practice for the **Oracle Cloud Infrastructure 2025
Generative AI Professional** certification exam (`1Z0-1127-25`).

## What it does

- **100+ practice questions** covering the exam's domains:
  - LLM Fundamentals
  - OCI Generative AI Service
  - LangChain & LLM Applications
  - RAG & Vector Search
  - Generative AI Agents
- **Three session types** — full practice exam, per-domain practice, or a 10-question quick quiz.
- **Two feedback modes** — *Study* (instant feedback with explanations) and *Exam* (scored at the end, like the real test).
- **Results screen** — pass/fail against the 68% passing score, per-domain breakdown, and a full answer review with explanations.
- Questions and answer options are shuffled on every attempt.

## Where the questions come from

Questions were collected from GitHub repositories that publish practice material
for **1Z0-1127-25 specifically** (no other exam codes), then supplemented with
publicly available sample questions and cross-checked against Oracle's official
Generative AI documentation:

- [`harshit01010/Oracle_Certifications`](https://github.com/harshit01010/Oracle_Certifications) — 1Z0-1127-25 practice exam & skill checks
- [`PatrickWiloak/cloud-data-ai-security-zero-to-hero`](https://github.com/PatrickWiloak/cloud-data-ai-security-zero-to-hero) — OCI Generative AI Professional question bank
- Public sample questions (e.g. [certificationpractice.com](https://certificationpractice.com/practice-exams/oracle-cloud-infrastructure-generative-ai-professional))

The question bank lives in [`src/data/questions.ts`](src/data/questions.ts), with
each question tagged by domain and source.

## Run locally

```bash
npm install
npm run dev
```

The Vite dev server binds to `0.0.0.0`, so it works in preview environments.

```bash
npm run build
npm run preview
```

Static output is written to `dist/` and can be served from any static host.

## Deploying

This is a static site, so it runs on any static host. The Vite `base` is
configurable via the `BASE_PATH` environment variable (defaults to `/`), which
is what GitHub Pages project sites need.

### Option 1 — GitHub Pages (free, recommended)

1. In the repo, create `.github/workflows/deploy.yml` with the content below
   (GitHub's **Add file → Create new file** in the web UI is easiest):

   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   concurrency:
     group: pages
     cancel-in-progress: true

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: npm
         - run: npm ci
         - run: npm run build
           env:
             BASE_PATH: /symmetrical-memory/   # change to your repo name if you fork
         - uses: actions/configure-pages@v5
         - uses: actions/upload-pages-artifact@v3
           with:
             path: dist
     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - id: deployment
           uses: actions/deploy-pages@v4
   ```

2. Go to **Settings → Pages → Build and deployment**, set **Source** to
   **GitHub Actions**, and save.

3. Push to `main` (or run the workflow manually from the **Actions** tab).

Your site will be published at
`https://<your-username>.github.io/symmetrical-memory/`.

### Option 2 — Netlify, Vercel, or Cloudflare Pages

Connect the repository, then set:

- **Build command:** `npm run build`
- **Output directory:** `dist`

No `BASE_PATH` is needed on these platforms (they serve from the domain root,
so the default base `/` is correct).

### Option 3 — OCI Object Storage (fitting, given the exam 😉)

Upload the contents of `dist/` to a public Object Storage bucket and enable
**Static Website** hosting in the bucket's **Resources** menu. Point a custom
domain at it, or use the bucket's object URL, if you want an Oracle-flavored
deployment.

### Option 4 — Any static server locally

```bash
npm run build
npm run preview   # serves dist/ at http://localhost:4173
```

## Disclaimer

This is an unofficial study aid. It is not affiliated with, endorsed by, or
sponsored by Oracle. Exam names and codes are trademarks of Oracle.
