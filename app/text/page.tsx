"use client";
import { useCallback, useEffect, useState, useRef } from "react";

const CHAR_LIMIT = 2000;

export default function TextPage() {
  const [text, setText] = useState("");
  const [rate, setRate] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('audiovox:text:settings') || '{}'); return s.rate ?? 0; } catch { return 0; }
  });
  const [volume, setVolume] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('audiovox:text:settings') || '{}'); return s.volume ?? 0; } catch { return 0; }
  });
  const [pitch, setPitch] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('audiovox:text:settings') || '{}'); return s.pitch ?? 0; } catch { return 0; }
  });
  const [pauses, setPauses] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('audiovox:text:settings') || '{}'); return s.pauses ?? 'Pauses'; } catch { return 'Pauses'; }
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceIndex, setVoiceIndex] = useState<number>(() => {
    try { const s = JSON.parse(localStorage.getItem('audiovox:text:settings') || '{}'); return s.voiceIndex ?? 0; } catch { return 0; }
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  // server TTS not implemented yet; UI reserved

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    function loadVoices() {
      const v = window.speechSynthesis.getVoices();
      setVoices(v || []);
      // keep selection within range
      setVoiceIndex((idx) => Math.min(idx, Math.max(0, (v || []).length - 1)));
    }

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Load persisted settings
  useEffect(() => {
    try {
      localStorage.setItem('audiovox:text:settings', JSON.stringify({ voiceIndex, rate, volume, pitch, pauses }));
    } catch { /* ignore */ }
  }, [voiceIndex, rate, volume, pitch, pauses]);

  function handleClear() {
    setText("");
  }

  const handleGenerate = useCallback(() => {
    if (!text.trim()) {
      alert("Please enter some text first.");
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Speech Synthesis not supported in this browser.');
      return;
    }

    // Stop any existing speech
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1 + rate / 100; // map -50..50 to ~0.5..1.5
    utter.volume = Math.max(0, Math.min(1, 1 + volume / 100));
    utter.pitch = 1 + pitch / 100;
    if (voices[voiceIndex]) utter.voice = voices[voiceIndex];

    utter.onend = () => setIsPlaying(false);
    utter.onerror = () => setIsPlaying(false);

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsPlaying(true);
  }, [text, rate, volume, pitch, voiceIndex, voices]);

  function handleCopy() {
    if (!text) return;
    navigator.clipboard.writeText(text);
  }

  function handleDownload() {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'text-to-speech.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  const handlePause = useCallback(() => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleResume = useCallback(() => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  }, []);

  const handleStop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

  const handleSample = useCallback(() => {
    const sample = 'Hello, this is a sample of the selected voice. This helps you preview the tone and speed.';
    if (!('speechSynthesis' in window)) {
      alert('Speech Synthesis not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(sample);
    u.rate = 1 + rate / 100;
    u.volume = Math.max(0, Math.min(1, 1 + volume / 100));
    u.pitch = 1 + pitch / 100;
    if (voices[voiceIndex]) u.voice = voices[voiceIndex];
    u.onend = () => setIsPlaying(false);
    u.onerror = () => setIsPlaying(false);
    utterRef.current = u;
    window.speechSynthesis.speak(u);
    setIsPlaying(true);
  }, [rate, volume, pitch, voiceIndex, voices]);

  async function handleExportServer() {
    if (!text.trim()) return alert('Please enter text to export.');
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audiovox-export.wav';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export audio from server.');
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleGenerate(); }
      if (e.code === 'Space') { e.preventDefault(); if (window.speechSynthesis && window.speechSynthesis.speaking) handlePause(); else handleResume(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [text, isPlaying, handleGenerate, handlePause, handleResume]);


  return (
    <main className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <h1 className="text-3xl font-serif font-semibold">Text to Speech</h1>
          <p className="mt-2 text-sm text-gray-500">Type or paste text to convert to speech.</p>

          <div className="mt-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="inline-flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm">{text.length} / {CHAR_LIMIT}</div>
                <select
                  value={pauses}
                  onChange={(e) => setPauses(e.target.value)}
                  className="text-sm px-3 py-1 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                >
                  <option>Pauses</option>
                  <option>No Pauses</option>
                  <option>Long Pauses</option>
                </select>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <button onClick={handleCopy} title="Copy text" className="text-sm px-3 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">Copy</button>
                  <button onClick={handleDownload} title="Download text" className="text-sm px-3 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">Download</button>
                  <button onClick={handleClear} className="text-sm px-3 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">× Clear</button>
                </div>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, CHAR_LIMIT))}
              placeholder="Enter your text here..."
              className="w-full h-[40vh] sm:h-[48vh] md:h-[56vh] lg:h-[36rem] p-4 sm:p-6 bg-transparent resize-none outline-none text-gray-800 dark:text-gray-100"
            />

            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500">
              <div className="flex items-center gap-3">
                <div className="text-sm">Characters:</div>
                <div className="font-medium">{text.length}</div>
              </div>
              <div>Estimated usage: <span className="font-medium">{Math.ceil(text.length / 1000)} credits</span></div>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm uppercase tracking-wider text-gray-500">Voice Settings</h3>
              <button title="refresh" className="text-gray-400">⟳</button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-300 to-rose-300 flex items-center justify-center text-white font-bold">J</div>
              <div>
                <div className="font-medium">Jenny (Female)</div>
                <div className="text-xs text-gray-500">English (United States)</div>
              </div>
              <div className="ml-auto text-gray-400">⇅</div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-500">Voice</label>
              <select
                value={voiceIndex}
                onChange={(e) => setVoiceIndex(Number(e.target.value))}
                className="mt-2 w-full rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2 bg-white dark:bg-gray-900"
              >
                {voices.length === 0 && <option>Loading voices…</option>}
                {voices.map((v, i) => (
                  <option key={i} value={i}>{v.name} — {v.lang}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-500 mb-1"> <span>Rate</span> <span>{rate}%</span> </div>
                <input type="range" min={-50} max={50} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full" />
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-500 mb-1"> <span>Volume</span> <span>{volume}%</span> </div>
                <input type="range" min={-50} max={50} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full" />
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-500 mb-1"> <span>Pitch</span> <span>{pitch}%</span> </div>
                <input type="range" min={-50} max={50} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="w-full" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 flex gap-3">
                <button onClick={handleGenerate} disabled={!text.trim()} className={`flex-1 py-3 rounded-full ${!text.trim() ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-black text-white'}`}>
                  {isPlaying ? 'Playing…' : 'Play'}
                </button>
                <button onClick={handleSample} className="w-32 py-3 rounded-full bg-white border border-gray-200 dark:bg-gray-800">Sample</button>
              </div>
              <div className="flex sm:flex-col gap-2">
                <button onClick={handlePause} className="w-full bg-gray-100 dark:bg-gray-800 py-2 rounded-md">Pause</button>
                <button onClick={handleResume} className="w-full bg-gray-100 dark:bg-gray-800 py-2 rounded-md">Resume</button>
                <button onClick={handleStop} className="w-full bg-gray-100 dark:bg-gray-800 py-2 rounded-md">Stop</button>
              </div>
            </div>

            <div className="mt-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border flex items-center justify-center">+</div>
                <div>Create new voice</div>
              </div>
              <div className="text-gray-400">›</div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
