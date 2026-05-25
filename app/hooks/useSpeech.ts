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
  const [settings, setSettings] = useState<SpeechSettings>({
    speed: 1,
    pitch: 1,
    voiceIndex: 0,
  });
  const [highlightRange, setHighlightRange] = useState<{ charIndex: number; charLen: number } | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsSpokenRef = useRef(0);
  const currentPageRef = useRef(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef = useRef(settings);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
  useEffect(() => { wordsSpokenRef.current = wordsSpoken; }, [wordsSpoken]);

  // Load voices
  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const en = all.filter((v) => v.lang.startsWith("en"));
      setVoices(en.length > 0 ? en : all);
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

  const speakPage = useCallback(
    (pageIdx: number, wordOffset = 0) => {
      if (pageIdx >= pages.length) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        clearTimer();
        return;
      }

      window.speechSynthesis.cancel();
      const text = pages[pageIdx];
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = settingsRef.current.speed;
      utt.pitch = settingsRef.current.pitch;

      const voiceList = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
      const finalList = voiceList.length > 0 ? voiceList : window.speechSynthesis.getVoices();
      if (finalList[settingsRef.current.voiceIndex]) {
        utt.voice = finalList[settingsRef.current.voiceIndex];
      }

      let localWords = wordOffset;

      utt.onboundary = (e) => {
        if (e.name === "word") {
          localWords++;
          wordsSpokenRef.current = localWords;
          setWordsSpoken(localWords);
          setHighlightRange({ charIndex: e.charIndex, charLen: e.charLength || 6 });
        }
      };

      utt.onend = () => {
        if (currentPageRef.current < pages.length - 1) {
          const next = currentPageRef.current + 1;
          currentPageRef.current = next;
          setCurrentPage(next);
          wordsSpokenRef.current = 0;
          setWordsSpoken(0);
          setHighlightRange(null);
          speakPage(next, 0);
        } else {
          setIsPlaying(false);
          clearTimer();
        }
      };

      utteranceRef.current = utt;
      window.speechSynthesis.speak(utt);
      setIsPlaying(true);

      clearTimer();
      progressTimerRef.current = setInterval(() => {
        setWordsSpoken(wordsSpokenRef.current);
      }, 500);
    },
    [pages, clearTimer]
  );

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
      let target = Math.max(0, Math.min(totalWords - 1, wordsBefore + wordsSpokenRef.current + (secs > 0 ? delta : -delta)));
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
