"use client";
import { useEffect, useState, useMemo } from "react";

const STORAGE_KEY = 'audiovox:settings';
const TEXT_SETTINGS_KEY = 'audiovox:text:settings';
const SPEECH_SETTINGS_KEY = 'audiovox:speech-settings';

type ThemeOpt = 'light' | 'dark' | 'system';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw).apiKey || ''; } catch { /*ignore*/ } return '';
  });
  const [defaultRate, setDefaultRate] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw).defaultRate ?? 0; } catch { /*ignore*/ } return 0;
  });
  const [defaultPitch, setDefaultPitch] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw).defaultPitch ?? 0; } catch { /*ignore*/ } return 0;
  });
  const [theme, setTheme] = useState<ThemeOpt>(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw).theme || 'system'; } catch { /*ignore*/ } return 'system';
  });

  type ApiVoice = { name: string; lang?: string };
  const [voices, setVoices] = useState<ApiVoice[]>([]);
  const [defaultVoiceIndex, setDefaultVoiceIndex] = useState<number>(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw).defaultVoiceIndex ?? 0; } catch { /*ignore*/ } return 0;
  });
  const [exportFormat, setExportFormat] = useState<'wav'|'mp3'>(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw).exportFormat || 'wav'; } catch { /*ignore*/ } return 'wav';
  });
  const [ocrEnabled, setOcrEnabled] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw).ocrEnabled ?? false; } catch { /*ignore*/ } return false;
  });
  const [ocrLang, setOcrLang] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw).ocrLang || 'eng'; } catch { /*ignore*/ } return 'eng';
  });

  const credits = useMemo(() => {
    try { const v = localStorage.getItem('audiovox:credits'); return v ? Number(v) : 0; } catch { return 0; }
  }, []);

  // persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey, defaultRate, defaultPitch, theme, defaultVoiceIndex, exportFormat, ocrEnabled, ocrLang }));
    } catch {}
  }, [apiKey, defaultRate, defaultPitch, theme, defaultVoiceIndex, exportFormat, ocrEnabled, ocrLang]);

  // Load voices: try server API then fallback to browser
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (apiKey) {
          const res = await fetch('/api/voices', { headers: { 'x-api-key': apiKey } });
          if (res.ok) {
              const json = await res.json() as { voices?: ApiVoice[] };
              if (!cancelled && Array.isArray(json.voices)) setVoices(json.voices.map((v) => ({ name: v.name, lang: v.lang })));
              return;
            }
        }
      } catch {
        // ignore
      }
      // fallback to browser voices
      try {
        const all = window.speechSynthesis.getVoices();
        if (all && all.length > 0 && !cancelled) setVoices(all.map((v) => ({ name: v.name, lang: v.lang })));
      } catch {}
    }
    load();
    const onVoices = () => {
      try { const all = window.speechSynthesis.getVoices(); if (all && all.length > 0 && !cancelled) setVoices(all.map((v) => ({ name: v.name, lang: v.lang }))); } catch {}
    };
    window.speechSynthesis.addEventListener('voiceschanged', onVoices);
    return () => { cancelled = true; window.speechSynthesis.removeEventListener('voiceschanged', onVoices); };
  }, [apiKey]);

  function clearStorage() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TEXT_SETTINGS_KEY);
    localStorage.removeItem(SPEECH_SETTINGS_KEY);
    setApiKey(''); setDefaultRate(0); setDefaultPitch(0); setTheme('system'); setDefaultVoiceIndex(0); setExportFormat('wav'); setOcrEnabled(false); setOcrLang('eng');
  }

  function applyDefaultsToApp() {
    try {
      const textSettings = { pauses: 'Pauses', rate: defaultRate, volume: 0, pitch: defaultPitch, voiceIndex: defaultVoiceIndex };
      const speechSettings = { speed: 1 + (defaultRate/100), pitch: 1 + (defaultPitch/100), voiceIndex: defaultVoiceIndex };
      localStorage.setItem(TEXT_SETTINGS_KEY, JSON.stringify(textSettings));
      localStorage.setItem(SPEECH_SETTINGS_KEY, JSON.stringify(speechSettings));
      alert('Defaults applied to Text and Speech settings.');
    } catch { alert('Failed to apply defaults.'); }
  }

  async function testExport() {
    if (!apiKey) return alert('Please enter API key');
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }, body: JSON.stringify({ text: 'API export test' }) });
      if (!res.ok) throw new Error('export failed');
      alert('Export succeeded (download will begin)');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `audiovox-test.${exportFormat}`; a.click(); URL.revokeObjectURL(url);
    } catch { alert('Export failed. Check API key and server.'); }
  }

  // theme live update
  useEffect(() => {
    try {
      const el = document.documentElement;
      if (theme === 'dark') el.classList.add('dark');
      else if (theme === 'light') el.classList.remove('dark');
      else { /* system: don't override */ }
    } catch {}
  }, [theme]);

  return (
    <main className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-gray-900 border rounded-lg space-y-3">
            <label className="text-sm">API Key</label>
            <input className="w-full rounded-md border px-3 py-2" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            <div className="text-xs text-gray-500">Your server API key for server-side exports (kept in localStorage for demo).</div>
            <div className="flex gap-2 mt-3">
              <button onClick={testExport} className="px-3 py-2 bg-black text-white rounded-md">Test Export</button>
              <button onClick={() => { navigator.clipboard?.writeText(apiKey); }} className="px-3 py-2 bg-gray-100 rounded-md">Copy Key</button>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-900 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">Credits</label>
              <div className="font-medium">{credits}</div>
            </div>
            <div className="text-xs text-gray-500">Purchase more credits via the Upgrade button in the sidebar.</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border rounded-lg space-y-3">
          <label className="text-sm">Default Voice</label>
          <select value={defaultVoiceIndex} onChange={(e) => setDefaultVoiceIndex(Number(e.target.value))} className="w-full rounded-md border px-3 py-2">
            {voices.length === 0 && <option>Loading voices…</option>}
            {voices.map((v, i) => (<option key={i} value={i}>{v.name} {v.lang ? `— ${v.lang}` : ''}</option>))}
          </select>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Default Rate</label>
              <input type="range" min={-50} max={50} value={defaultRate} onChange={(e) => setDefaultRate(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="text-sm">Default Pitch</label>
              <input type="range" min={-50} max={50} value={defaultPitch} onChange={(e) => setDefaultPitch(Number(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-gray-900 border rounded-lg space-y-3">
            <label className="text-sm">Export Format</label>
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'wav'|'mp3')} className="w-full rounded-md border px-3 py-2">
              <option value="wav">WAV</option>
              <option value="mp3">MP3 (server-side)</option>
            </select>
            <div className="text-xs text-gray-500">WAV is supported by the demo server. MP3 requires provider support.</div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-900 border rounded-lg space-y-3">
            <label className="text-sm">OCR Fallback</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={ocrEnabled} onChange={(e) => setOcrEnabled(e.target.checked)} />
              <div className="text-sm">Enable OCR fallback for scanned PDFs</div>
            </div>
            <label className="text-sm">OCR Language</label>
            <select value={ocrLang} onChange={(e) => setOcrLang(e.target.value)} className="w-full rounded-md border px-3 py-2">
              <option value="eng">English (eng)</option>
              <option value="spa">Spanish (spa)</option>
              <option value="fra">French (fra)</option>
              <option value="deu">German (deu)</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border rounded-lg space-y-3">
          <label className="text-sm">Theme</label>
          <select value={theme} onChange={(e) => { const v = e.target.value as ThemeOpt; setTheme(v); }} className="w-full rounded-md border px-3 py-2">
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button onClick={applyDefaultsToApp} className="px-3 py-2 bg-black text-white rounded-md">Apply Defaults to App</button>
          <button onClick={clearStorage} className="px-3 py-2 bg-red-100 rounded-md">Reset All Local Settings</button>
        </div>
      </div>
    </main>
  );
}
