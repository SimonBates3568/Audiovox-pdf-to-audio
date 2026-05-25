"use client";
import { useState } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Rewind, FastForward,
  ChevronLeft, ChevronRight, Mic, Gauge, Music2,
} from "lucide-react";
import { useSpeech } from "../hooks/useSpeech";
import { TextPreview } from "./TextPreview";
import { PdfData } from "../hooks/usePdfExtractor";

function fmtTime(s: number) {
  s = Math.max(0, Math.round(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function fmtDuration(totalWords: number, speed: number) {
  const wpm = 150 * speed;
  const mins = Math.ceil(totalWords / wpm);
  return mins < 60 ? `~${mins} min` : `~${Math.floor(mins / 60)}h ${mins % 60}m`;
}

interface Props {
  pdfData: PdfData;
  onReset: () => void;
}

export function Player({ pdfData, onReset }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { pages, fileName, totalWords } = pdfData;

  const {
    isPlaying, currentPage, voices, settings, highlightRange,
    progress, togglePlay, skip, seekTo, goToPage, updateSettings, stop,
  } = useSpeech(pages, totalWords);

  const wpm = 150 * settings.speed;
  const wordsDone = pages.slice(0, currentPage).reduce((a, p) => a + p.split(/\s+/).length, 0);
  const timeDone = Math.ceil(wordsDone / wpm * 60);
  const timeTotal = Math.ceil(totalWords / wpm * 60);

  const handleReset = () => { stop(); onReset(); };

  return (
  <div className="space-y-4 max-w-lg mx-auto">
      {/* File info */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-red-600 dark:text-red-400">PDF</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {pages.length} page{pages.length !== 1 ? "s" : ""} · {fmtDuration(totalWords, settings.speed)}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
        >
          Change
        </button>
      </div>

      {/* Player card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
        {/* Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{fmtTime(timeDone)}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(-1)}
                disabled={currentPage === 0}
                className="text-gray-500 disabled:opacity-25 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-medium">
                Page {currentPage + 1} / {pages.length}
              </span>
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === pages.length - 1}
                className="text-gray-500 disabled:opacity-25 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{fmtTime(timeTotal)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={(e) => seekTo(parseFloat(e.target.value))}
            className="w-full"
            aria-label="Playback progress"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => skip(-30)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 transition-all" aria-label="Skip back 30s" title="−30s">
            <Rewind size={20} />
          </button>
          <button onClick={() => skip(-10)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 transition-all" aria-label="Skip back 10s" title="−10s">
            <SkipBack size={20} />
          </button>
          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all active:scale-95"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={26} /> : <Play size={26} />}
          </button>
          <button onClick={() => skip(10)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 transition-all" aria-label="Skip forward 10s" title="+10s">
            <SkipForward size={20} />
          </button>
          <button onClick={() => skip(30)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 transition-all" aria-label="Skip forward 30s" title="+30s">
            <FastForward size={20} />
          </button>
        </div>

        {/* Settings */}
        <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
          {/* Mobile: toggle to show/hide settings */}
          <div className="sm:hidden flex items-center justify-between">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {settingsOpen ? "Hide settings" : "Show settings"}
            </button>
          </div>

          <div className={`${settingsOpen ? "block" : "hidden"} sm:block`}> 
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Speed */}
          <div className="flex items-center gap-2 min-w-0">
            <Gauge size={15} className="text-gray-400 flex-shrink-0" />
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Speed</label>
            <input
              type="range" min={0.5} max={2.5} step={0.25}
              value={settings.speed}
              onChange={(e) => updateSettings({ speed: parseFloat(e.target.value) })}
              className="flex-1"
              aria-label="Speed"
            />
            <span className="text-xs font-medium w-8 text-right">{settings.speed}×</span>
          </div>

          {/* Pitch */}
          <div className="flex items-center gap-2 min-w-0">
            <Music2 size={15} className="text-gray-400 flex-shrink-0" />
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Pitch</label>
            <input
              type="range" min={0.5} max={2} step={0.1}
              value={settings.pitch}
              onChange={(e) => updateSettings({ pitch: parseFloat(e.target.value) })}
              className="flex-1"
              aria-label="Pitch"
            />
            <span className="text-xs font-medium w-8 text-right">{settings.pitch.toFixed(1)}</span>
          </div>

          {/* Voice */}
          <div className="flex items-center gap-2 min-w-0">
            <Mic size={15} className="text-gray-400 flex-shrink-0" />
            <select
              value={settings.voiceIndex}
              onChange={(e) => updateSettings({ voiceIndex: parseInt(e.target.value) })}
              className="flex-1 max-w-[160px] text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 truncate"
              aria-label="Voice"
            >
              {voices.length === 0 && <option value={0}>Default voice</option>}
              {voices.map((v, i) => (
                <option key={i} value={i}>
                  {v.name.replace(/\(.*?\)/g, "").trim()}
                </option>
              ))}
            </select>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Text preview */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Text preview
        </p>
        <TextPreview text={pages[currentPage] || ""} highlightRange={highlightRange} />
      </div>
    </div>
  );
}
