"use client";
import { useState, useRef, useCallback } from "react";

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const checkPermission = useCallback(async () => {
    try {
      // Permissions API may not be available in all browsers
      if (navigator.permissions && navigator.permissions.query) {
        const p = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (p.state === 'granted') setPermission('granted');
        else if (p.state === 'denied') setPermission('denied');
        else setPermission('prompt');
      } else {
        setPermission('unknown');
      }
    } catch {
      setPermission('unknown');
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    await checkPermission();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Media devices are not available in this browser/context. Use HTTPS or a modern browser.');
      throw new Error('Media devices not available');
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // stop tracks
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
      setPermission('granted');
    } catch (err: unknown) {
      // Handle permission denied or other errors gracefully
      const name = (err as { name?: string } | undefined)?.name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('Microphone access was denied. Please allow microphone permissions in your browser and reload the page.');
        setPermission('denied');
      } else {
        setError(String(err || 'Failed to access microphone'));
      }
      throw err;
    }
  }, [checkPermission]);

  const stop = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop();
    }
    setRecording(false);
  }, []);

  const clear = useCallback(() => {
    if (audioUrl) { URL.revokeObjectURL(audioUrl); }
    setAudioUrl(null);
  }, [audioUrl]);

  return { recording, audioUrl, error, permission, start, stop, clear, checkPermission };
}
