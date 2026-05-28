"use client";
import { useState } from "react";
import { useRecorder } from "../hooks/useRecorder";

interface Clone { id: number; name: string; url: string }

function loadClones(): Clone[] {
  try { return JSON.parse(localStorage.getItem('audiovox:clones') || '[]') as Clone[]; } catch { return []; }
}

function saveClones(cs: Clone[]) { localStorage.setItem('audiovox:clones', JSON.stringify(cs)); }

export function VoiceCloner() {
  const { recording, audioUrl, start, stop, clear, error, permission } = useRecorder();
  const [name, setName] = useState('My Voice');
  const [clones, setClones] = useState<Clone[]>(() => typeof window !== 'undefined' ? loadClones() : []);

  const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const save = async () => {
    if (!audioUrl) return;
    try {
      let dataUrl = audioUrl;
      if (audioUrl.startsWith('blob:')) {
        const res = await fetch(audioUrl);
        const blob = await res.blob();
        dataUrl = await blobToDataUrl(blob);
      }
      const next = [...clones, { id: Date.now(), name, url: dataUrl }];
      setClones(next);
      saveClones(next);
      clear();
    } catch (e) {
      console.error('Failed to save clone', e);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
      <h3 className="font-medium mb-2">Voice Cloner (local demo)</h3>
      <p className="text-sm text-gray-500 mb-3">Record a short sample and save a local cloned voice. This is a demo — no ML is performed.</p>
      <div className="flex gap-2 items-center mb-3">
        <button
          onClick={async () => {
            if (recording) {
              stop();
            } else {
              try { await start(); } catch {}
            }
          }}
          className="px-3 py-1 rounded bg-blue-600 text-white"
        >
          {recording ? 'Stop' : 'Record'}
        </button>
        <input value={name} onChange={(e) => setName(e.target.value)} className="px-2 py-1 border rounded" />
        <button onClick={save} disabled={!audioUrl} className="px-3 py-1 rounded bg-green-600 text-white">Save</button>
      </div>
      {permission === 'denied' && (
        <div className="text-sm text-red-600 mb-3">Microphone access denied. Please enable microphone permissions for this site in your browser settings.</div>
      )}
      {error && (
        <div className="text-sm text-red-600 mb-3">{error}</div>
      )}
      {audioUrl && (
        <div className="mb-3">
          <audio src={audioUrl} controls />
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold">Local cloned voices</h4>
          <label className="text-xs text-gray-500 cursor-pointer">
            <input type="file" accept="audio/*" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const data = await blobToDataUrl(f);
              const next = [...clones, { id: Date.now(), name: f.name.replace(/\.[^/.]+$/, ''), url: data }];
              setClones(next);
              saveClones(next);
            }} />
            Import
          </label>
        </div>
        {clones.length === 0 && <p className="text-sm text-gray-500">No clones yet</p>}
        <ul className="space-y-2">
          {clones.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="font-medium">{c.name}</div>
                <audio src={c.url} controls className="ml-2" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  // download
                  const a = document.createElement('a');
                  a.href = c.url;
                  // try to determine extension from data URL
                  const m = c.url.match(/^data:(audio\/[a-z0-9.+-]+);/i);
                  const ext = m ? m[1].split('/')[1] : 'webm';
                  a.download = `${c.name || 'voice'}.${ext}`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Download</button>
                <button onClick={() => {
                  const next = clones.filter(x => x.id !== c.id);
                  setClones(next);
                  saveClones(next);
                }} className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
