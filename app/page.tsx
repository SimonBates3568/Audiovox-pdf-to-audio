"use client";
import { usePdfExtractor } from "./hooks/usePdfExtractor";
import { DropZone } from "./components/DropZone";
import { Player } from "./components/Player";

export default function Home() {
  const { loading, error, pdfData, extractPdf, reset } = usePdfExtractor();

  return (
    <main className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="mb-6">
            <h1 className="text-3xl font-serif font-semibold">File to Speech</h1>
            <p className="text-sm text-gray-500 mt-1">Upload a document and convert its text into speech</p>
          </div>

          {/* Steps removed — moved to Text page */}

          {/* Large dropzone area */}
          <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center bg-white dark:bg-gray-900">
            {!loading && !pdfData && (
              <div>
                <div className="mb-4">
                  <div className="mx-auto w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 16V6" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                <p className="font-medium">Click to uploader drag and drop</p>
                <p className="text-sm text-gray-500 mt-2">Supported formats: PDF, TXT, DOCX<br/>Maximum file size: 50MB</p>
                <div className="mt-6">
                  <DropZone onFile={extractPdf} error={error} />
                </div>
              </div>
            )}

            {loading && (
              <div className="py-8">Extracting text from PDF…</div>
            )}

            {pdfData && (
              <div className="py-6">
                <Player pdfData={pdfData} onReset={reset} />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          {/* Right column: empty or future content */}
        </div>
      </div>
    </main>
  );
}
