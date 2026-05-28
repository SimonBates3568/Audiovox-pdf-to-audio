import { useState, useCallback } from "react";
import type { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api";

export interface PdfData {
  pages: string[];
  fileName: string;
  totalWords: number;
}

export function usePdfExtractor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const extractPdf = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setPdfData(null);
    setLastFile(file);

    try {
      let pdfjsLib: unknown;
      try {
        // Prefer the legacy build which is more self-contained and avoids
        // dynamic ESM worker imports in some bundler/dev setups.
  pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
      } catch {
        // fallback to the package entry
  pdfjsLib = await import("pdfjs-dist");
      }
      // We intentionally avoid setting pdfjsLib.GlobalWorkerOptions.workerSrc
      // because in development pdf.js may try to dynamically import the
      // ESM worker which can fail (protocol/CDN issues). We force
      // useWorker: false below so parsing happens on the main thread.

      const arrayBuffer = await file.arrayBuffer();
      // Point pdf.js at a local worker served from /public/pdf.worker.min.js.
      // Place the correct worker there (see README/commands below) so the
      // library can create a dedicated worker thread for parsing.
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      } catch {
        // ignore
      }
  // Force pdfjs to run without a worker in environments where loading the
  // worker fails (dev servers, protocol mismatches). This parses on the
  // main thread; it's acceptable for small PDFs used in this demo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          // Request normalized whitespace from pdf.js to reduce stray spacing
          // between characters. Some PDFs have glyphs separated into many
          // tiny text items which can produce spaced-out letters like
          // "A N V R A A G" — causing TTS to spell letters. normalizeWhitespace
          // helps combine adjacent spaces and ligatures.
          const content = await page.getTextContent({ normalizeWhitespace: true });
          let text = content.items
            .map((item: TextItem | TextMarkedContent) => ("str" in item ? item.str : ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          // Collapse sequences of single letters separated by spaces into a
          // continuous token (e.g. "A N V R A A G" -> "AANVRAAG"). This fixes
          // cases where PDF text extraction splits words into character items
          // and prevents the speech synthesizer from spelling letters.
          // Only collapse runs of 3+ single-letter tokens to avoid changing
          // intentional acronyms like "U K" (if short).
    text = text.replace(/\b(?:[A-Za-z]\s){2,}[A-Za-z]\b/g, (m: string) => m.replace(/\s+/g, ""));
          if (text.length > 10) pages.push(text);
        } catch (pageErr) {
          // If a single page fails, log and continue with other pages. This
          // happens for some malformed or image-only pages.
          console.error(`Failed to extract page ${i}:`, pageErr);
        }
      }

      if (pages.length === 0) {
        setError("No readable text found. This PDF may be scanned or image-based.");
        return;
      }

      const totalWords = pages.reduce(
        (acc, p) => acc + p.split(/\s+/).length,
        0
      );

      setPdfData({ pages, fileName: file.name, totalWords });
    } catch (err: unknown) {
      // Surface a more helpful error message and log the error to the console
      // so the developer can inspect the root cause.
      console.error("Failed to extract PDF:", err);
      let msg = String(err);
      if (err && typeof err === "object" && "message" in err) {
        msg = (err as { message?: unknown }).message as string || msg;
      }
      setError(`Could not read this PDF. ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const ocrExtract = useCallback(async (file?: File) => {
    const target = file || lastFile;
    if (!target) {
      setError("No file available for OCR.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
  const Tesseract = (await import("tesseract.js")).default;
      const arrayBuffer = await target.arrayBuffer();
      // create blob url so tesseract can read pages as images (pdf->image conversion is not trivial
      // client-side; instead use pdf.js to render each page to canvas and OCR that)
      let pdfjsLib: unknown;
      try {
  pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
      } catch {
  pdfjsLib = await import("pdfjs-dist");
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      } catch {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/png');
          const res = await Tesseract.recognize(dataUrl, 'eng');
          const text = (res?.data?.text || '').replace(/\s+/g, ' ').trim();
          if (text.length > 10) pages.push(text);
        } catch (e) {
          console.error('OCR failed for page', i, e);
        }
      }
      if (pages.length === 0) {
        setError('OCR did not find readable text.');
        return;
      }
      const totalWords = pages.reduce((acc, p) => acc + p.split(/\s+/).length, 0);
      setPdfData({ pages, fileName: target.name, totalWords });
    } catch (err) {
      console.error('OCR extraction failed:', err);
      setError('OCR failed. See console for details.');
    } finally {
      setLoading(false);
    }
  }, [lastFile]);

  const reset = useCallback(() => {
    setPdfData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, error, pdfData, extractPdf, reset, lastFile, ocrExtract };
}
