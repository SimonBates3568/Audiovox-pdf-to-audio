import { useEffect } from "react";

interface Handlers {
  onToggle?: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  onPrevPage?: () => void;
  onNextPage?: () => void;
}

export function useKeyboardShortcuts(h: Handlers) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.code === "Space") {
        e.preventDefault();
        h.onToggle?.();
      } else if (e.key === "ArrowLeft") {
        h.onSkipBack?.();
      } else if (e.key === "ArrowRight") {
        h.onSkipForward?.();
      } else if (e.key === "ArrowUp") {
        h.onPrevPage?.();
      } else if (e.key === "ArrowDown") {
        h.onNextPage?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [h]);
}
