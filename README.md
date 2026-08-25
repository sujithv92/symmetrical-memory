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

## Disclaimer

This is an unofficial study aid. It is not affiliated with, endorsed by, or
sponsored by Oracle. Exam names and codes are trademarks of Oracle.
