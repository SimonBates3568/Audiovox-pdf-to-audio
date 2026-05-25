"use client";
import { useCallback, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";

interface Props {
  onFile: (file: File) => void;
  error: string | null;
}

export function DropZone({ onFile, error }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type === "application/pdf") onFile(file);
    },
    [onFile]
  );

  return (
  <div className="space-y-3 max-w-full">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150 select-none w-full max-w-lg mx-auto
          ${dragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
          }
        `}
      >
        <div className={`flex justify-center mb-4 transition-colors ${dragging ? "text-blue-500" : "text-gray-400"}`}>
          {dragging ? <Upload size={44} /> : <FileText size={44} />}
        </div>
        <p className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
          Drop your PDF here
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          or click to browse — books, articles, documents
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
