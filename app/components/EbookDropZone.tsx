"use client";
import { useRef, useState } from "react";

interface Props {
  onExtract: (text: string, fileName?: string) => void;
}

export function EbookDropZone({ onExtract }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);

  async function parseEpub(buffer: ArrayBuffer) {
    // dynamic import so this code only runs in the browser
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(buffer);
    // Locate container.xml to find rootfile
    const containerPath = 'META-INF/container.xml';
    if (!zip.file(containerPath)) return '';
    const containerStr = await zip.file(containerPath)!.async('string');
    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerStr, 'application/xml');
    const rootfile = containerDoc.querySelector('rootfile')?.getAttribute('full-path');
    if (!rootfile) return '';
    const opfStr = await zip.file(rootfile)!.async('string');
    const opfDoc = parser.parseFromString(opfStr, 'application/xml');
  // no namespace resolver needed for this simple parse

    // map id->href from manifest
    const manifestItems: Record<string,string> = {};
    opfDoc.querySelectorAll('manifest > item').forEach((it) => {
      const id = it.getAttribute('id');
      const href = it.getAttribute('href');
      if (id && href) manifestItems[id] = href;
    });

    // get spine order
    const spineItemrefs: string[] = [];
    opfDoc.querySelectorAll('spine > itemref').forEach((ir) => {
      const idref = ir.getAttribute('idref');
      if (idref) spineItemrefs.push(idref);
    });

    // resolve base path for relative hrefs
    const baseParts = rootfile.split('/').slice(0, -1);
    const basePath = baseParts.length ? baseParts.join('/') + '/' : '';

    const texts: string[] = [];
    for (const idref of spineItemrefs) {
      const href = manifestItems[idref];
      if (!href) continue;
      const fullPath = basePath + href;
      const file = zip.file(fullPath) || zip.file(href);
      if (!file) continue;
      try {
        const xhtml = await file.async('string');
        const doc = parser.parseFromString(xhtml, 'text/html');
        // remove script/style
        doc.querySelectorAll('script, style, nav').forEach(n => n.remove());
        const bodyText = doc.body ? doc.body.textContent || '' : '';
        const cleaned = (bodyText || '').replace(/\s+/g, ' ').trim();
        if (cleaned) texts.push(cleaned);
      } catch {
        // skip
      }
    }

    return texts.join('\n\n');
  }

  async function handleFile(f: File | null) {
    if (!f) return;
    const name = f.name || 'ebook';

    // If it's a plain text file by extension or MIME type, read it
    const isTxtExt = name.toLowerCase().endsWith('.txt');
    const isTextMime = f.type && f.type.startsWith('text');

    if (isTxtExt || isTextMime) {
      try {
        const txt = await f.text();
        // simple cleanup
        const cleaned = txt.replace(/\r\n/g, "\n").trim();
        onExtract(cleaned, name);
      } catch {
        alert('Failed to read the file.');
      }
      return;
    }

    // EPUB handling: try to parse client-side (simple extraction)
    if (name.toLowerCase().endsWith('.epub')) {
      setParsing(true);
      try {
        const arrayBuffer = await f.arrayBuffer();
        // Try client-side parse first
        try {
          const text = await parseEpub(arrayBuffer);
          if (text && text.trim().length > 0) {
            onExtract(text, name);
            setParsing(false);
            return;
          }
        } catch {
          // continue to server fallback
        }

        // server fallback: upload file to /api/epub
        const form = new FormData();
        form.append('file', f);
        const res = await fetch('/api/epub', { method: 'POST', body: form });
        if (!res.ok) throw new Error('Server parse failed');
        const json = await res.json();
        if (json && json.text) {
          onExtract(json.text, name);
        } else {
          alert('Unable to extract readable text from this EPUB. Try converting to .txt or use another file.');
        }
      } catch (e) {
        console.error(e);
        alert('Failed to parse EPUB. Consider converting to .txt and try again.');
      } finally {
        setParsing(false);
      }
      return;
    }

    alert('Unsupported file type. Please upload a plain text (.txt) file.');
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all select-none ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400'}`}>
        <div className="text-gray-500 mb-2">Upload .txt (plain text). EPUB is not supported in this demo.</div>
  <div className="text-sm text-gray-400">{parsing ? 'Parsing EPUB… this may take a moment' : 'Click here or drag a file to upload'}</div>
        <input ref={inputRef} type="file" accept=".txt,.epub,text/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
    </div>
  );
}
