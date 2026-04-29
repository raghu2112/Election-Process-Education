/**
 * hooks/index.ts — Custom React hooks
 * =====================================
 * Each hook has a single responsibility (SRP).
 * Extracted from App so components stay lean and logic is testable.
 *
 * Hooks:
 *  - useRateLimit   — sliding-window rate limiter state
 *  - useAnnounce    — screen-reader live-region manager
 *  - useDebounce    — debounced value (performance)
 *  - useDarkMode    — persisted dark/light preference
 *  - useSpeech      — Web Speech API (voice input — bonus feature)
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

// ── useRateLimit ─────────────────────────────────────────────

interface RateLimitState {
  /** true when limit has been hit */
  isLimited: boolean;
  /** Call before each API request; returns false if limited */
  checkLimit: () => boolean;
  /** Reset the window (e.g. after 60 s timeout) */
  resetLimit: () => void;
}

/**
 * Sliding-window rate limiter hook.
 * Tracks request timestamps in a ref (no re-renders for internal state).
 * Exposes `isLimited` state for UI feedback.
 *
 * @param maxRequests - Max requests allowed in the window (default 10)
 * @param windowMs    - Window duration in ms (default 60 000)
 * @returns RateLimitState
 *
 * @security Prevents runaway API calls from rapid user input or automation.
 */
export function useRateLimit(
  maxRequests = 10,
  windowMs = 60_000,
): RateLimitState {
  const [isLimited, setIsLimited] = useState(false);
  const timestamps = useRef<number[]>([]);
  const resetTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkLimit = useCallback((): boolean => {
    const now = Date.now();
    // Purge timestamps outside the current window
    timestamps.current = timestamps.current.filter((t) => t > now - windowMs);

    if (timestamps.current.length >= maxRequests) {
      setIsLimited(true);
      // Auto-reset after window expires
      if (!resetTimer.current) {
        resetTimer.current = setTimeout(() => {
          timestamps.current = [];
          setIsLimited(false);
          resetTimer.current = null;
        }, windowMs);
      }
      return false;
    }

    timestamps.current.push(now);
    return true;
  }, [maxRequests, windowMs]);

  const resetLimit = useCallback(() => {
    timestamps.current = [];
    setIsLimited(false);
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }
  }, []);

  // Clean up timer on unmount
  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  return { isLimited, checkLimit, resetLimit };
}

// ── useAnnounce ──────────────────────────────────────────────

/**
 * Manages a screen-reader live-region announcement string.
 * Clears after `clearAfterMs` to allow the same message to be
 * re-announced on subsequent identical actions.
 *
 * @param clearAfterMs - Auto-clear delay in ms (default 3 000)
 * @returns [announcement string, setter function]
 *
 * @accessibility Critical for informing screen-reader users of
 *               dynamic content changes (AI response, errors, etc.)
 */
export function useAnnounce(clearAfterMs = 3_000): [string, (msg: string) => void] {
  const [announcement, setAnnouncement] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setAnnouncement("");                     // reset first so same message re-fires
    // Defer by one tick so the DOM registers the change
    requestAnimationFrame(() => {
      setAnnouncement(msg);
      timer.current = setTimeout(() => setAnnouncement(""), clearAfterMs);
    });
  }, [clearAfterMs]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return [announcement, announce];
}

// ── useDebounce ──────────────────────────────────────────────

/**
 * Returns a debounced copy of `value`.
 * Updates only after `delay` ms of no changes.
 *
 * @param value - Reactive value to debounce
 * @param delay - Debounce delay in ms (default 300)
 *
 * @performance Prevents a fetch on every keystroke for
 *             future typeahead / search features.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// ── useDarkMode ──────────────────────────────────────────────

/**
 * Persists dark-mode preference to localStorage.
 * Falls back to system prefers-color-scheme on first visit.
 *
 * @returns [isDark, toggleFn]
 */
export function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("electguide-dark");
      if (stored !== null) return stored === "true";
    } catch { /* localStorage unavailable (private browsing) */ }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  const toggle = useCallback(() => {
    setDark((d) => {
      try { localStorage.setItem("electguide-dark", String(!d)); } catch { /* ignore */ }
      return !d;
    });
  }, []);

  return [dark, toggle];
}

// ── useSpeech (Bonus: Voice Input) ──────────────────────────

interface SpeechState {
  /** Whether the browser supports Web Speech API */
  isSupported: boolean;
  /** Whether recognition is currently active */
  isListening: boolean;
  /** Most recent transcript text */
  transcript: string;
  /** Start voice recognition */
  startListening: () => void;
  /** Stop voice recognition */
  stopListening: () => void;
}

/**
 * Wraps the Web Speech API for voice-based chat input.
 * Bonus feature — degrades gracefully when API is unavailable.
 *
 * @param onResult - Callback fired with the final transcript string
 * @returns SpeechState
 *
 * @accessibility Enables users who cannot type to interact with ElectGuide.
 *               Falls back silently on unsupported browsers.
 */
export function useSpeech(onResult: (text: string) => void): SpeechState {
  const [isListening, setIsListening] = useState(false);
  const [transcript,  setTranscript]  = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognition = (window as any).SpeechRecognition
    ?? (window as any).webkitSpeechRecognition;
  const isSupported = Boolean(SpeechRecognition);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang          = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      onResult(text);
    };

    recognition.onend  = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isSupported, onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // Clean up on unmount
  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { isSupported, isListening, transcript, startListening, stopListening };
}
