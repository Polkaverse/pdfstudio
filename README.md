# BharatPDF AI

BharatPDF AI is a task-first PDF utility for Indian mobile-web users. The product direction is a no-login-first app for upload, OCR, summarization, translation, signing, and export flows around PDFs.

## Technical owner

Interim technical owner: VOI Founding Full Stack Engineer (`FullStackEngineer`) via `VOI-40`.

## Current stack

- Next.js 16 with App Router
- React 19 with TypeScript
- ESLint for a cheap CI validation gate

The current MVP keeps the stack intentionally small and reversible while still shipping the main user-facing flows in a runnable form.

## Local setup

1. Install Node.js 20.19+ or 22.12+.
2. Copy `.env.example` to `.env.local` and fill in any values you need.
3. Install dependencies with `npm install`.
4. Start the app with `npm run dev`.
5. Open `http://localhost:3000`.

## Available scripts

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run start` runs the production server.
- `npm run lint` runs the current validation check used by CI.

## Environment

The project ships with a committed `.env.example` template only. Do not commit real secrets.

## MVP surface in this repository

The app currently includes:

- a task-first landing experience for quick PDF, OCR, summary, translation, template, and signing tasks
- upload, progress, and retention messaging shaped by the BharatPDF UX and security baselines
- OCR review, editable output presentation, and template/signature flow previews
- explicit trust copy for quarantine, worker isolation, signed downloads, and short-lived retention
- local setup instructions, environment template, ignore rules, and CI lint validation
