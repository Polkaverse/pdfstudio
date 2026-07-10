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

Deployment and rollback instructions for the canonical repo live in [`docs/vercel-deployment.md`](docs/vercel-deployment.md).

## MVP surface in this repository

The app currently includes:

- a task-first landing experience that exposes one live workflow and clearly marks the rest as deferred
- a functional upload pipeline for text-based PDFs, `.txt`, and `.md` files
- local document storage under `.bharatpdf/uploads` with document ids and object-key boundaries
- embedded-text extraction plus heuristic summary generation without external service dependencies
- explicit deferred handling for scanned/image PDFs that still require OCR
- local setup instructions, environment template, ignore rules, and CI lint validation

## First functional workflow

The first real slice is `Summarize`:

- upload a text-based PDF, `.txt`, or `.md`
- store the original file locally inside `.bharatpdf/uploads/<documentId>/`
- extract embedded text on the server
- return summary bullets, preview text, parser metadata, and retention timestamps

If a PDF has no embedded text layer, the workflow returns a deferred OCR-needed state instead of faking completion.

## Deferred capabilities

These remain intentionally unfinished in this repo:

- scanned/image OCR
- translation based on OCR output
- signing flows
- template generation
- remote object storage, queues, and external AI integrations
