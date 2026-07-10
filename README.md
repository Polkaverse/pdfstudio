# BharatPDF AI

BharatPDF AI is an AI-powered task-first PDF utility, OCR, eSign, translation, and document template generation platform designed specifically for Indian use cases (students, MSMEs, professionals, CA/legal offices).

## Technical owner

Interim technical owner: VOI Founding Full Stack Engineer (`FullStackEngineer`) via `VOI-40`.

## Current stack

- Next.js 16 with App Router
- React 19 with TypeScript
- `pdf-lib` for client-side and server-side PDF manipulation
- `tesseract.js` for client-side WASM OCR (English + Hindi/Devanagari/Tamil/Telugu)
- ESLint for CI validation gate

## Local setup

1. Install Node.js 20.19+ or 22.12+.
2. Copy `.env.example` to `.env` and fill in your values (e.g. `OPENAI_API_KEY` for GPT model routing).
3. Install dependencies with `npm install`.
4. Start the app with `npm run dev`.
5. Open `http://localhost:3001` (or `http://localhost:3000` depending on port availability).

## Available scripts

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run start` runs the production server.
- `npm run lint` runs the current validation check.

## Environment

The project ships with a `.env.example` template. If an `OPENAI_API_KEY` is present, the translation and summarization actions utilize GPT model routes; otherwise, the backend automatically routes tasks through a resilient local heuristic parser.

Deployment and rollback instructions live in [`docs/vercel-deployment.md`](docs/vercel-deployment.md).

## Fully Implemented Capabilities

- **PDF Utilities**: Fully functional client-side merging (with interactive list reordering), page splitting (using custom page ranges), page rotation (per-page selection), and compression.
- **Indian OCR**: WASM-based client-side OCR for English, Hindi (Devanagari), Tamil, and Telugu scripts, complete with editable textarea results and copy/download controls.
- **eSign & Audit Trails**: Interactive signature capture (drawing canvas, handwritten cursive generators, graphic upload) with visual coordinates drag/drop. Generates a custom **Signing Certificate** (containing doc hash, timestamp, signer email/phone) and appends it to the final PDF.
- **Local Templates**: Form-driven PDF generators for Indian paperwork: GST Invoices, Rent Agreements, Resume layouts, and HR Offer Letters.
- **AI Summary & Translation**: Combined translation (English-to-Hindi / Hindi-to-English) and page summarizer using Next.js routes.
