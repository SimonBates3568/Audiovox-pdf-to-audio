"use client";
import { useRef, useState } from "react";

interface Props {
  onExtract: (text: string, fileName?: string) => void;
}

export function EbookDropZone({ onExtract }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(f: File | null) {
    if (!f) return;
    const name = f.name || 'ebook';
    if (f.name.endsWith('.txt')) {
      const txt = await f.text();
      // simple cleanup
      const cleaned = txt.replace(/\r\n/g, "\n").trim();
      onExtract(cleaned, name);
      return;
    }

    // EPUB handling not implemented yet
    if (f.name.endsWith('.epub')) {
      onExtract('', name);
      alert('EPUB parsing is not supported in this demo yet. Please upload a .txt file for now.');
      return;
    }

    alert('Unsupported file type. Please upload a .txt file.');
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all select-none ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400'}`}>
        <div className="text-gray-500 mb-2">Upload .txt (plain text) or .epub (not supported)</div>
        <div className="text-sm text-gray-400">Click here or drag a file to upload</div>
        <input ref={inputRef} type="file" accept=".txt,.epub" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
    </div>
  );
}
