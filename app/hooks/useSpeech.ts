import { useState, useCallback, useRef, useEffect } from "react";

export interface SpeechSettings {
  speed: number;
  pitch: number;
  voiceIndex: number;
}

export function useSpeech(pages: string[], totalWords: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [wordsSpoken, setWordsSpoken] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const STORAGE_KEY = "audiovox:speech-settings";
  const [settings, setSettings] = useState<SpeechSettings>(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as SpeechSettings;
      }
    } catch {
      // ignore
    }
    return { speed: 1, pitch: 1, voiceIndex: 0 };
  });
  const [highlightRange, setHighlightRange] = useState<{ charIndex: number; charLen: number } | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsSpokenRef = useRef(0);
  const currentPageRef = useRef(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef = useRef(settings);
  const sentenceOffsetsRef = useRef<number[]>([]);
  const currentSentenceRef = useRef(0);
  const speakPageRef = useRef<((p: number, o?: number) => void) | null>(null);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsRef.current));
      }
    } catch {
      // ignore
    }
  }, [settings]);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
  useEffect(() => { wordsSpokenRef.current = wordsSpoken; }, [wordsSpoken]);

  // Load voices
  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const en = all.filter((v) => v.lang.startsWith("en"));
      // load clones and append
      let mapped: SpeechSynthesisVoice[] = [];
      try {
        const raw = localStorage.getItem('audiovox:clones');
        if (raw) {
          const clones = JSON.parse(raw) as { id: number; name: string }[];
          mapped = clones.map((c) => ({ name: c.name, lang: 'en-US', voiceURI: `audiovox-clone-${c.id}` })) as unknown as SpeechSynthesisVoice[];
        }
      } catch {
        mapped = [];
      }
      const base = en.length > 0 ? en : all;
      setVoices([...base, ...mapped]);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const clearTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  // Helpers: split text into sentence-ish chunks. Keep reasonably short groups.
  const splitIntoSentences = useCallback((text: string) => {
    // Basic sentence split: split on punctuation followed by space+capital or line break.
    const raw = text.replace(/\n+/g, " ").trim();
    const parts = raw.split(/(?<=[.!?])\s+(?=[A-Z0-9“"'()\[\]])/g);
    // Group sentences so very short sentences are combined (improves TTS flow)
    const out: string[] = [];
    for (const p of parts) {
      if (!p) continue;
      const last = out[out.length - 1];
      if (!last) {
        out.push(p);
        continue;
      }
      if (last.length < 40 && p.length < 80) {
        // merge short sentence into previous
        out[out.length - 1] = `${last} ${p}`;
      } else {
        out.push(p);
      }
    }
    return out;
  }, []);

  const speakPage = useCallback(
    (pageIdx: number, wordOffset = 0) => {
      if (pageIdx >= pages.length) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        clearTimer();
        return;
      }

      window.speechSynthesis.cancel();
      const text = pages[pageIdx] || "";
      const sentences = splitIntoSentences(text);
      // compute offsets
      const offsets: number[] = [];
      let cum = 0;
      for (const s of sentences) {
        offsets.push(cum);
        cum += s.length + 1; // +1 for the split space/punct
      }
      sentenceOffsetsRef.current = offsets;
      currentSentenceRef.current = 0;

      // convert wordOffset -> sentence index + char index
      let startSentence = 0;
      let startCharOffset = 0;
      if (wordOffset > 0) {
        let cumWords = 0;
        for (let i = 0; i < sentences.length; i++) {
          const sWords = (sentences[i].match(/\S+/g) || []).length;
          if (cumWords + sWords > wordOffset) {
            startSentence = i;
            // find char index within sentence for the word offset
            const within = wordOffset - cumWords;
            if (within <= 0) {
              startCharOffset = 0;
            } else {
              // locate nth word start
              let idx = 0;
              let found = 0;
              const re = /\S+/g;
              let m: RegExpExecArray | null;
              while ((m = re.exec(sentences[i])) !== null) {
                found++;
                if (found >= within) { idx = m.index; break; }
              }
              startCharOffset = idx;
            }
            break;
          }
          cumWords += sWords;
        }
      }

      // speak the sentence at index, chaining to next onend
      const speakSentence = (sentIdx: number, charOffsetInSentence = 0) => {
        if (sentIdx >= sentences.length) {
          // finished page
          if (pageIdx < pages.length - 1) {
            const next = pageIdx + 1;
            currentPageRef.current = next;
            setCurrentPage(next);
            wordsSpokenRef.current = 0;
            setWordsSpoken(0);
            setHighlightRange(null);
            // start next page by scheduling on next tick to avoid referencing speakPage before stable
            setTimeout(() => { speakPageRef.current?.(next, 0); }, 0);
            return;
          }
          setIsPlaying(false);
          clearTimer();
          return;
        }

        const sentenceText = sentences[sentIdx];
        const utt = new SpeechSynthesisUtterance(sentenceText.slice(charOffsetInSentence));
        utt.rate = settingsRef.current.speed;
        utt.pitch = settingsRef.current.pitch;

        const voiceList = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
        const finalList = voiceList.length > 0 ? voiceList : window.speechSynthesis.getVoices();
        if (finalList[settingsRef.current.voiceIndex]) {
          utt.voice = finalList[settingsRef.current.voiceIndex];
        }

        let localWords = wordsSpokenRef.current;

        utt.onboundary = (e: SpeechSynthesisEvent) => {
          if (e.name === "word") {
            localWords++;
            wordsSpokenRef.current = localWords;
            setWordsSpoken(localWords);
            // compute global charIndex: offset of sentence + charIndex in sentence + charOffsetInSentence
            const sentenceBase = sentenceOffsetsRef.current[sentIdx] || 0;
            const globalChar = sentenceBase + (e.charIndex || 0) + charOffsetInSentence;
            setHighlightRange({ charIndex: globalChar, charLen: e.charLength || 6 });
          }
        };

        utt.onend = () => {
          currentSentenceRef.current = sentIdx + 1;
          // continue to next sentence
          // schedule next sentence on next tick to avoid nested calls
          setTimeout(() => { speakSentence(sentIdx + 1, 0); }, 0);
        };

        utteranceRef.current = utt;
        window.speechSynthesis.speak(utt);
        setIsPlaying(true);

        clearTimer();
        progressTimerRef.current = setInterval(() => {
          setWordsSpoken(wordsSpokenRef.current);
        }, 500);
      };

      // start
      currentSentenceRef.current = startSentence;
      speakSentence(startSentence, startCharOffset);
    },
    [pages, clearTimer, splitIntoSentences]
  );

  // keep ref to call from scheduled tasks
  useEffect(() => { speakPageRef.current = speakPage; return () => { speakPageRef.current = null; }; }, [speakPage]);

  const togglePlay = useCallback(() => {
    if (!pages.length) return;
    const synth = window.speechSynthesis;
    if (isPlaying) {
      synth.pause();
      setIsPlaying(false);
      clearTimer();
    } else {
      if (synth.paused) {
        synth.resume();
        setIsPlaying(true);
        progressTimerRef.current = setInterval(() => {
          setWordsSpoken(wordsSpokenRef.current);
        }, 500);
      } else {
        speakPage(currentPage, wordsSpoken);
      }
    }
  }, [isPlaying, currentPage, wordsSpoken, pages, speakPage, clearTimer]);

  const skip = useCallback(
    (secs: number) => {
      const wpm = 150 * settingsRef.current.speed;
      const delta = Math.round((wpm * Math.abs(secs)) / 60);
      const wordsBefore = pages.slice(0, currentPageRef.current).reduce((a, p) => a + p.split(/\s+/).length, 0);
  const target = Math.max(0, Math.min(totalWords - 1, wordsBefore + wordsSpokenRef.current + (secs > 0 ? delta : -delta)));
      let cum = 0;
      for (let i = 0; i < pages.length; i++) {
        const pw = pages[i].split(/\s+/).length;
        if (cum + pw > target || i === pages.length - 1) {
          currentPageRef.current = i;
          setCurrentPage(i);
          wordsSpokenRef.current = target - cum;
          setWordsSpoken(target - cum);
          setHighlightRange(null);
          if (isPlaying) speakPage(i, target - cum);
          return;
        }
        cum += pw;
      }
    },
    [pages, totalWords, isPlaying, speakPage]
  );

  const seekTo = useCallback(
    (pct: number) => {
      const target = Math.floor((pct / 100) * totalWords);
      let cum = 0;
      for (let i = 0; i < pages.length; i++) {
        const pw = pages[i].split(/\s+/).length;
        if (cum + pw > target || i === pages.length - 1) {
          currentPageRef.current = i;
          setCurrentPage(i);
          wordsSpokenRef.current = target - cum;
          setWordsSpoken(target - cum);
          setHighlightRange(null);
          if (isPlaying) speakPage(i, target - cum);
          return;
        }
        cum += pw;
      }
    },
    [pages, totalWords, isPlaying, speakPage]
  );

  const goToPage = useCallback(
    (dir: 1 | -1) => {
      const next = currentPage + dir;
      if (next < 0 || next >= pages.length) return;
      currentPageRef.current = next;
      setCurrentPage(next);
      wordsSpokenRef.current = 0;
      setWordsSpoken(0);
      setHighlightRange(null);
      if (isPlaying) speakPage(next, 0);
    },
    [currentPage, pages, isPlaying, speakPage]
  );

  const updateSettings = useCallback(
    (patch: Partial<SpeechSettings>) => {
      const next = { ...settingsRef.current, ...patch };
      settingsRef.current = next;
      setSettings(next);
      if (isPlaying) speakPage(currentPageRef.current, wordsSpokenRef.current);
    },
    [isPlaying, speakPage]
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    clearTimer();
    setCurrentPage(0);
    setWordsSpoken(0);
    setHighlightRange(null);
    currentPageRef.current = 0;
    wordsSpokenRef.current = 0;
  }, [clearTimer]);

  // Cleanup on unmount
  useEffect(() => () => {
    window.speechSynthesis.cancel();
    clearTimer();
  }, [clearTimer]);

  const progress = totalWords > 0
    ? ((pages.slice(0, currentPage).reduce((a, p) => a + p.split(/\s+/).length, 0) + wordsSpoken) / totalWords) * 100
    : 0;

  return {
    isPlaying,
    currentPage,
    wordsSpoken,
    voices,
    settings,
    highlightRange,
    progress,
    togglePlay,
    skip,
    seekTo,
    goToPage,
    updateSettings,
    stop,
  };
}
