# Audiovox - PDF to Audio

A Next.js app that converts any PDF into an audiobook experience using the Web Speech API.

## Features

- 📄 Drag & drop or click to upload any PDF
- ▶️ Play/pause with skip controls (±10s, ±30s)
- 📖 Page-by-page navigation
- 🔤 Live word highlighting in text preview
- ⚡ Adjustable speed (0.5× – 2.5×) and pitch
- 🎙️ Choose from all available system voices
- 🌙 Full dark mode support

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **PDF.js** — PDF text extraction
- **Web Speech API** — Browser text-to-speech (no API key needed)
- **Lucide React** — Icons

## Notes

- Works best with text-based PDFs (not scanned/image-only PDFs)
- Voice quality depends on your OS/browser TTS voices
- Chrome and Edge offer the best voice selection
- On macOS: System Settings → Accessibility → Spoken Content to download premium voices

## Improvements & next steps (prioritized)

Below are concrete, actionable improvements arranged roughly by effort/impact so you can pick what to work on next. Each item includes a short implementation note and quick commands where relevant.

1) Quick wins (low effort, high value)

- Ensure the PDF worker is present before running the app
	- Add this to your local startup docs and CI: run `npm run fetch-worker` once after checkout (script added in `package.json`). This prevents runtime "fake worker" errors from pdf.js.

- Improve resilience of text extraction
	- Normalize whitespace, collapse runs of single-letter tokens, and trim page results (already implemented in the extractor hook). If you still see spelling, add a small heuristic to join short tokens when > N per page.

- Small UX polish
	- Persist user preferences (voice, rate, pitch) in localStorage so they survive refreshes.
	- Add keyboard shortcuts for play/pause, next/prev page and seek (use a tiny keyboard handler hook).

2) Medium effort (worth doing next)

- Add OCR fallback for scanned/image-only PDFs
	- Use Tesseract.js (client-side) or an optional server-side OCR step. Client-side OCR keeps the app privacy-friendly but will be slower and heavier in the browser.

- Add unit tests and a minimal CI pipeline
	- Add Jest + React Testing Library tests for the hooks (`usePdfExtractor`, `useSpeech`) and key components (`DropZone`, `Player`).
	- Add a GitHub Actions workflow to run `npm ci`, `npm run lint`, `npm run build`, and tests on PRs.

- Improve audio behavior and segmentation
	- Break long pages into sentence-level utterances (split on sentences) instead of sending whole pages to SpeechSynthesis at once — improves natural pauses and highlighting sync.
	- Queue utterances and use the `onboundary` event to highlight words more accurately.

3) Longer-term / higher effort

- Server-side TTS and caching
	- Offer an optional server mode that converts pages to pre-rendered audio (MP3) using providers like Google Cloud TTS, Amazon Polly, or ElevenLabs. Cache generated audio on the server (or S3) for repeat playback and to enable offline downloads.
	- Note: this requires API keys and a privacy policy. Keep a local-only option for users who prefer browser-only processing.

- Voice cloning / upload your voice
	- Allow users to upload a voice sample and optionally use a third-party voice-cloning API. This is powerful but legally/ethically sensitive — provide clear consent and storage rules.

- Desktop app packaging
	- Package as a small desktop app with Tauri (recommended) or Electron so users can run locally without a browser and have native audio controls and file access.

4) Accessibility, performance and production hardening

- Accessibility
	- Ensure all controls have ARIA labels, keyboard focus states, and high-contrast visuals. Make the text preview readable with scalable font sizes and allow users to increase highlight contrast.

- Performance
	- Make worker provisioning part of the build (copy required worker files into `public/` during CI/build). This removes the need to fetch on first run and avoids runtime fetches.
	- Lazy-load heavy modules (Tesseract.js, optional server TTS clients) only when required.

- Production worker packaging
	- In production, ensure `pdf.worker.min.mjs` (or the legacy worker) is present in `/public` and that `GlobalWorkerOptions.workerSrc` points at it. Add a small Next.js build step or `postinstall` script to copy the worker into `public/`.

Quality gates & quick checklist

- Local quick check (dev):

```bash
npm install
npm run fetch-worker   # ensure pdf worker is in public/
npm run dev
# open http://localhost:3000 and try a text-based PDF
```

- Build / lint / tests (recommended CI steps):

```bash
npm ci
npm run lint
npm run build
# run tests (after adding Jest): npx jest
```

Engineering contract (mini)

- Inputs: a PDF file (text-based or scanned)
- Outputs: per-page text, optional pre-rendered audio, and speech playback in the browser
- Error modes: scanning-only PDFs (no extractable text), missing worker file, browser without Web Speech support

Edge cases to verify

- PDFs with split-per-letter text items (we collapse runs of single-letter tokens)
- Very large PDFs (stream pages, show progress, avoid keeping whole-document text in memory)
- Image-only PDFs → OCR fallback or graceful error message
- Platforms without speechSynthesis or with limited voices (iOS/Safari) → provide graceful messaging

Suggested next hires / features to implement first (my recommendation)

1. Add CI (lint + build + tests) and a postinstall/build step to copy the worker into `public/` (reduces "works on my machine" friction).
2. Persist user preferences and add keyboard shortcuts (big UX win, quick to implement).
3. Implement sentence-level utterance queuing for smoother TTS and more accurate highlighting.

If you'd like, I can implement one of these for you now — pick which: CI + worker packaging, persistent settings + shortcuts, sentence-level speech queuing, or OCR fallback.
