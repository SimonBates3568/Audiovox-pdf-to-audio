"use client";
import "./styles.css";
import { useCallback, useState, useRef } from "react";
import { EbookDropZone } from "../components/EbookDropZone";

export default function EbookPage() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const onExtract = useCallback((t: string, name?: string) => {
    setText(t);
    setFileName(name);
  }, []);

  function handlePlay() {
    if (!text) return alert('No text to play');
    const u = new SpeechSynthesisUtterance(text.slice(0, 20000));
    window.speechSynthesis.cancel();
    u.onend = () => setIsPlaying(false);
    utterRef.current = u;
    window.speechSynthesis.speak(u);
    setIsPlaying(true);
  }

  function handleStop() {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }

  async function handleExportServer() {
    if (!text) return alert('No text to export');
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': '' }, body: JSON.stringify({ text }) });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName || 'ebook'}-export.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Make sure API key is configured.');
    }
  }

  return (
    <main className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Ebook to Audiobook</h1>
        <p className="mt-2 text-sm text-gray-500">Convert ebooks into audiobooks.</p>

        <EbookDropZone onExtract={onExtract} />

        {text && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium">{fileName || 'Uploaded text'}</div>
                <div className="text-xs text-gray-500">{text.length} characters</div>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePlay} className="px-3 py-2 rounded bg-black text-white">{isPlaying ? 'Playing…' : 'Play'}</button>
                <button onClick={handleStop} className="px-3 py-2 rounded bg-gray-100">Stop</button>
                <button onClick={handleExportServer} className="px-3 py-2 rounded bg-white border">Export WAV</button>
              </div>
            </div>
            <div className="max-h-96 overflow-auto p-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 rounded">
              {text}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
