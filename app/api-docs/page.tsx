"use client";
import { useState } from "react";

export default function ApiDocsPage() {
  const [apiKey, setApiKey] = useState("");
  const [text, setText] = useState("Hello from API test");
  const [voicesResponse, setVoicesResponse] = useState<string | null>(null);

  async function testVoices() {
    try {
      const res = await fetch('/api/voices', { headers: { 'x-api-key': apiKey } });
      const json = await res.json();
      setVoicesResponse(JSON.stringify(json, null, 2));
    } catch {
      setVoicesResponse('Request failed');
    }
  }

  async function testTts() {
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }, body: JSON.stringify({ text }) });
      if (!res.ok) throw new Error('failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'api-test.wav';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setVoicesResponse('TTS request failed');
    }
  }

  return (
    <main className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">API Documentation & Test</h1>
        <p className="text-sm text-gray-600">Use the controls below to test the API from the browser. Set your API key first.</p>

        <div className="p-4 bg-white dark:bg-gray-900 border rounded-lg">
          <label className="text-sm">API Key</label>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="mt-2 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800" />
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border rounded-lg">
          <h3 className="font-medium">List Voices</h3>
          <p className="text-xs text-gray-500">GET /api/voices</p>
          <div className="mt-3 flex gap-3">
            <button onClick={testVoices} className="px-3 py-2 bg-black text-white rounded-md">Test Voices</button>
          </div>
          {voicesResponse && <pre className="mt-3 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded">{voicesResponse}</pre>}
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border rounded-lg">
          <h3 className="font-medium">Generate Audio</h3>
          <p className="text-xs text-gray-500">POST /api/tts</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="mt-2 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800" />
          <div className="mt-3 flex gap-3">
            <button onClick={testTts} className="px-3 py-2 bg-black text-white rounded-md">Export WAV</button>
          </div>
        </div>
      </div>
    </main>
  );
}
