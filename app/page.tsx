"use client";
import { Headphones } from "lucide-react";
import { usePdfExtractor } from "./hooks/usePdfExtractor";
import { DropZone } from "./components/DropZone";
import { Player } from "./components/Player";

export default function Home() {
  const { loading, error, pdfData, extractPdf, reset } = usePdfExtractor();

  return (
    <main className="min-h-screen flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
              <Headphones size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Audiovox</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload any PDF and listen to it like an audiobook
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Extracting text from PDF…</p>
          </div>
        )}

        {/* Drop zone */}
        {!loading && !pdfData && (
          <DropZone onFile={extractPdf} error={error} />
        )}

        {/* Player */}
        {!loading && pdfData && (
          <Player pdfData={pdfData} onReset={reset} />
        )}
      </div>
    </main>
  );
}
