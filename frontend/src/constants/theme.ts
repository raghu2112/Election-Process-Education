/**
 * constants/theme.ts — Design token system
 * ==========================================
 * Single source of truth for all colour and spacing values.
 * Prevents scattered magic values and simplifies dark-mode switching.
 *
 * Usage:
 *   const theme = buildTheme(isDark);
 *   <div style={{ background: theme.surface }}>
 */

// ── Types ────────────────────────────────────────────────────

/**
 * Full set of theme tokens used across all components.
 * Exported so TypeScript can check prop types in every component.
 */
export interface Theme {
  // Backgrounds
  bg:         string;
  surface:    string;
  sidebar:    string;
  inputBg:    string;
  // Text
  text:       string;
  textMuted:  string;
  // Borders
  border:     string;
  inputBorder:string;
  // Accent
  accent:     string;
  accentText: string;
  // Chat bubbles
  userBubbleBg:   string;
  userBubbleText: string;
  aiBubbleBg:     string;
  aiBubbleText:   string;
  // Semantic states
  greenBg:    string;
  greenBorder:string;
  redBg:      string;
  redBorder:  string;
  rateBg:     string;
  rateBorder: string;
  rateText:   string;
  // Status
  success:    string;
  warning:    string;
  danger:     string;
}

// ── Builder ──────────────────────────────────────────────────

/**
 * Build the full theme token set from a dark-mode boolean.
 * Called in the root App component and memoised with useMemo.
 *
 * @param dark - true for dark theme, false for light
 * @returns Full Theme object
 *
 * @performance Stable object references when `dark` doesn't change —
 *             wrap call in useMemo(() => buildTheme(dark), [dark]).
 */
export function buildTheme(dark: boolean): Theme {
  return {
    // ── Backgrounds ──
    bg:         dark ? "#0D1117" : "#F1F5F9",
    surface:    dark ? "#161B22" : "#FFFFFF",
    sidebar:    dark ? "#0A0F1A" : "#0F172A",
    inputBg:    dark ? "#21262D" : "#F8FAFC",

    // ── Text ──
    text:       dark ? "#F0F6FC" : "#0F172A",
    textMuted:  dark ? "#8B949E" : "#64748B",

    // ── Borders ──
    border:      dark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
    inputBorder: dark ? "rgba(255,255,255,0.12)" : "#CBD5E1",

    // ── Accent ──
    accent:     "#4F46E5",
    accentText: "#FFFFFF",

    // ── Chat bubbles ──
    userBubbleBg:   dark ? "#1D4ED8" : "#DBEAFE",
    userBubbleText: dark ? "#EFF6FF" : "#1E3A8A",
    aiBubbleBg:     dark ? "#21262D" : "#F8FAFC",
    aiBubbleText:   dark ? "#F0F6FC" : "#0F172A",

    // ── Semantic states ──
    greenBg:     dark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.10)",
    greenBorder: dark ? "rgba(16,185,129,0.40)" : "rgba(16,185,129,0.30)",
    redBg:       dark ? "rgba(239,68,68,0.15)"  : "rgba(239,68,68,0.10)",
    redBorder:   dark ? "rgba(239,68,68,0.40)"  : "rgba(239,68,68,0.30)",
    rateBg:      dark ? "#451A03" : "#FEF3C7",
    rateBorder:  dark ? "#78350F" : "#FCD34D",
    rateText:    dark ? "#FDE68A" : "#92400E",

    // ── Status ──
    success: "#10B981",
    warning: "#F59E0B",
    danger:  "#EF4444",
  };
}

// ── Spacing scale ────────────────────────────────────────────
// Consistent spacing prevents scattered magic numbers in components.

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 32,
} as const;

// ── Border radius scale ──────────────────────────────────────

export const RADIUS = {
  sm:   6,
  md:  10,
  lg:  14,
  full:9999,
} as const;

// ── Font sizes ───────────────────────────────────────────────

export const FONT = {
  xs:  10,
  sm:  11,
  md:  13,
  lg:  15,
  xl:  18,
  xxl: 22,
} as const;
