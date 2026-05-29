import JSZip from 'jszip';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const containerPath = 'META-INF/container.xml';
    if (!zip.file(containerPath)) return NextResponse.json({ text: '' });
    const containerStr = await zip.file(containerPath)!.async('string');
    const rootMatch = containerStr.match(/full-path="([^"]+)"/i);
    const rootfile = rootMatch ? rootMatch[1] : null;
    if (!rootfile) return NextResponse.json({ text: '' });

    const opfStr = await zip.file(rootfile)!.async('string');
    // naive manifest and spine parse
    const manifest: Record<string,string> = {};
  const manifestMatches = Array.from(opfStr.matchAll(/<item\s+[^>]*id="([^"]+)"[^>]*href="([^"]+)"/gi)) as RegExpMatchArray[];
  for (const m of manifestMatches) if (m[1] && m[2]) manifest[m[1]] = m[2];

  const spineMatches = Array.from(opfStr.matchAll(/<itemref\s+[^>]*idref="([^"]+)"/gi)) as RegExpMatchArray[];
  const spine = spineMatches.map((m) => m[1]);

    const baseParts = rootfile.split('/').slice(0, -1);
    const basePath = baseParts.length ? baseParts.join('/') + '/' : '';

    const texts: string[] = [];
    for (const idref of spine) {
      const href = manifest[idref];
      if (!href) continue;
      const fullPath = basePath + href;
      const entry = zip.file(fullPath) || zip.file(href);
      if (!entry) continue;
      try {
        const xhtml = await entry.async('string');
        // strip tags
        const cleaned = xhtml.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
        const collapsed = cleaned.replace(/\s+/g, ' ').trim();
        if (collapsed) texts.push(collapsed);
      } catch {
        // skip
      }
    }

    return NextResponse.json({ text: texts.join('\n\n') });
  } catch {
    return NextResponse.json({ error: 'parse error' }, { status: 500 });
  }
}
