"use client";
import { useEffect, useRef } from "react";

interface Props {
  text: string;
  highlightRange: { charIndex: number; charLen: number } | null;
}

export function TextPreview({ text, highlightRange }: Props) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) {
      spanRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightRange]);

  if (!highlightRange) {
    return (
      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-4 max-h-44 overflow-y-auto text-sm leading-relaxed text-gray-500 dark:text-gray-400 break-words whitespace-pre-wrap break-all">
        {text}
      </div>
    );
  }

  const { charIndex, charLen } = highlightRange;
  const before = text.slice(0, charIndex);
  const word = text.slice(charIndex, charIndex + charLen);
  const after = text.slice(charIndex + charLen);

  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-4 max-h-44 overflow-y-auto text-sm leading-relaxed text-gray-500 dark:text-gray-400 break-words whitespace-pre-wrap break-all">
      {before}
      <span
        ref={spanRef}
        className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded px-0.5"
      >
        {word}
      </span>
      {after}
    </div>
  );
}
