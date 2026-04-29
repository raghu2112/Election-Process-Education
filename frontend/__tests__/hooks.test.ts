/**
 * __tests__/hooks.test.ts — Unit tests for custom React hooks
 * =============================================================
 * Framework : Jest + @testing-library/react-hooks
 * Run       : npm test -- --watchAll=false --coverage
 */

import { renderHook, act } from "@testing-library/react";
import { useRateLimit, useDebounce, useDarkMode } from "../hooks";

// Mock localStorage for useDarkMode tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem:   (k: string) => store[k] ?? null,
    setItem:   (k: string, v: string) => { store[k] = v; },
    removeItem:(k: string) => { delete store[k]; },
    clear:     () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock window.matchMedia for useDarkMode
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media:   query,
    addEventListener:    jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

// ── useRateLimit ─────────────────────────────────────────────

describe("useRateLimit", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(()  => jest.useRealTimers());

  it("allows requests under the limit", () => {
    const { result } = renderHook(() => useRateLimit(3, 60_000));
    act(() => {
      expect(result.current.checkLimit()).toBe(true);
      expect(result.current.checkLimit()).toBe(true);
      expect(result.current.checkLimit()).toBe(true);
    });
    expect(result.current.isLimited).toBe(false);
  });

  it("blocks the request that exceeds the limit", () => {
    const { result } = renderHook(() => useRateLimit(2, 60_000));
    act(() => {
      result.current.checkLimit();
      result.current.checkLimit();
    });
    act(() => {
      expect(result.current.checkLimit()).toBe(false);
    });
    expect(result.current.isLimited).toBe(true);
  });

  it("resets after the window expires", () => {
    const { result } = renderHook(() => useRateLimit(1, 5_000));
    act(() => { result.current.checkLimit(); result.current.checkLimit(); });
    expect(result.current.isLimited).toBe(true);

    act(() => jest.advanceTimersByTime(5_001));
    expect(result.current.isLimited).toBe(false);
  });

  it("resets immediately when resetLimit() is called", () => {
    const { result } = renderHook(() => useRateLimit(1, 60_000));
    act(() => { result.current.checkLimit(); result.current.checkLimit(); });
    expect(result.current.isLimited).toBe(true);

    act(() => result.current.resetLimit());
    expect(result.current.isLimited).toBe(false);

    act(() => { expect(result.current.checkLimit()).toBe(true); });
  });
});

// ── useDebounce ──────────────────────────────────────────────

describe("useDebounce", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(()  => jest.useRealTimers());

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 300));
    expect(result.current).toBe("initial");
  });

  it("does not update before the delay", () => {
    const { result, rerender } = renderHook(
      ({ v }: { v: string }) => useDebounce(v, 300),
      { initialProps: { v: "initial" } },
    );
    rerender({ v: "updated" });
    act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe("initial");
  });

  it("updates after the full delay", () => {
    const { result, rerender } = renderHook(
      ({ v }: { v: string }) => useDebounce(v, 300),
      { initialProps: { v: "initial" } },
    );
    rerender({ v: "updated" });
    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe("updated");
  });

  it("resets timer on rapid updates (debounce behaviour)", () => {
    const { result, rerender } = renderHook(
      ({ v }: { v: string }) => useDebounce(v, 300),
      { initialProps: { v: "a" } },
    );
    rerender({ v: "ab" });
    act(() => jest.advanceTimersByTime(200));
    rerender({ v: "abc" });
    act(() => jest.advanceTimersByTime(200));
    // Only 400ms total but timer reset at 200ms, so only 200ms elapsed since last update
    expect(result.current).toBe("a");
    act(() => jest.advanceTimersByTime(100));
    expect(result.current).toBe("abc");
  });
});

// ── useDarkMode ──────────────────────────────────────────────

describe("useDarkMode", () => {
  beforeEach(() => localStorageMock.clear());

  it("defaults to false when no preference is stored", () => {
    const { result } = renderHook(() => useDarkMode());
    expect(result.current[0]).toBe(false);
  });

  it("reads stored preference from localStorage", () => {
    localStorageMock.setItem("electguide-dark", "true");
    const { result } = renderHook(() => useDarkMode());
    expect(result.current[0]).toBe(true);
  });

  it("toggles dark mode and persists to localStorage", () => {
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    expect(localStorageMock.getItem("electguide-dark")).toBe("true");
  });

  it("toggles back to light mode", () => {
    localStorageMock.setItem("electguide-dark", "true");
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
    expect(localStorageMock.getItem("electguide-dark")).toBe("false");
  });
});
