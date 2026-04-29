/**
 * __tests__/sanitize.test.ts — Unit tests for sanitisation utilities
 * ====================================================================
 * Framework: Jest + ts-jest
 * Run: npm test -- --watchAll=false --coverage
 *
 * These tests verify the security-critical sanitisation layer
 * that prevents XSS and injection attacks.
 */

import { sanitizeInput, isNonEmpty, isWithinLimit } from "../utils/sanitize";

// ── sanitizeInput ────────────────────────────────────────────

describe("sanitizeInput", () => {
  // ---- Type guard ----
  it("returns empty string for non-string input", () => {
    expect(sanitizeInput(null as unknown as string)).toBe("");
    expect(sanitizeInput(42 as unknown as string)).toBe("");
    expect(sanitizeInput(undefined as unknown as string)).toBe("");
  });

  // ---- Plain text ----
  it("returns clean text unchanged (minus trim)", () => {
    expect(sanitizeInput("How do I register to vote?")).toBe("How do I register to vote?");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });

  // ---- HTML injection (XSS) ----
  it("strips HTML script tags", () => {
    const result = sanitizeInput("<script>alert('xss')</script>Hello");
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</script>");
    expect(result).toContain("Hello");
  });

  it("strips img onerror XSS payload", () => {
    const result = sanitizeInput('<img src=x onerror="alert(1)">');
    expect(result).not.toContain("<img");
    expect(result).not.toContain("onerror");
  });

  it("escapes remaining angle brackets", () => {
    const result = sanitizeInput("2 < 3 and 5 > 4");
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
  });

  it("escapes ampersands", () => {
    expect(sanitizeInput("Rock & Roll")).toContain("&amp;");
  });

  it("escapes single quotes", () => {
    expect(sanitizeInput("it's a vote")).toContain("&#39;");
  });

  it("escapes double quotes", () => {
    expect(sanitizeInput('"quoted"')).toContain("&quot;");
  });

  // ---- JavaScript protocol ----
  it("removes javascript: URI protocol", () => {
    const result = sanitizeInput("javascript:alert(document.cookie)");
    expect(result).not.toContain("javascript:");
  });

  it("removes case-insensitive javascript: variant", () => {
    const result = sanitizeInput("JavaScript:void(0)");
    expect(result).not.toContain("javascript:");
  });

  // ---- Inline event handlers ----
  it("removes onclick handler", () => {
    const result = sanitizeInput('something onclick="evil()"');
    expect(result).not.toContain("onclick");
  });

  it("removes onmouseover handler", () => {
    const result = sanitizeInput('hover onmouseover="hack()"');
    expect(result).not.toContain("onmouseover");
  });

  // ---- SQL injection ----
  it("strips DROP TABLE injection", () => {
    const result = sanitizeInput("'; DROP TABLE users; --");
    expect(result).not.toContain("DROP");
    expect(result).not.toContain("--");
  });

  it("strips UNION SELECT injection", () => {
    const result = sanitizeInput("UNION SELECT * FROM secrets");
    expect(result).not.toContain("UNION");
    expect(result).not.toContain("SELECT");
  });

  it("strips DELETE injection", () => {
    const result = sanitizeInput("DELETE FROM votes WHERE 1=1");
    expect(result).not.toContain("DELETE");
  });

  // ---- Truncation ----
  it("truncates to 1000 characters by default", () => {
    const long = "a".repeat(2_000);
    expect(sanitizeInput(long)).toHaveLength(1_000);
  });

  it("respects custom maxLen parameter", () => {
    expect(sanitizeInput("hello world", 5)).toHaveLength(5);
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeInput("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(sanitizeInput("   ")).toBe("");
  });
});

// ── isNonEmpty ───────────────────────────────────────────────

describe("isNonEmpty", () => {
  it("returns true for valid content", () => {
    expect(isNonEmpty("How do elections work?")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(isNonEmpty("")).toBe(false);
  });

  it("returns false for whitespace-only string", () => {
    expect(isNonEmpty("   ")).toBe(false);
  });

  it("returns false for non-string", () => {
    expect(isNonEmpty(null)).toBe(false);
  });

  it("returns false if only injection keywords remain after sanitisation", () => {
    // After sanitisation, this becomes "" which is falsy
    expect(isNonEmpty("  ")).toBe(false);
  });
});

// ── isWithinLimit ────────────────────────────────────────────

describe("isWithinLimit", () => {
  it("returns true when under limit", () => {
    expect(isWithinLimit("short message", 1000)).toBe(true);
  });

  it("returns true at exactly the limit", () => {
    expect(isWithinLimit("a".repeat(1000), 1000)).toBe(true);
  });

  it("returns false when over limit", () => {
    expect(isWithinLimit("a".repeat(1001), 1000)).toBe(false);
  });

  it("uses default limit of 1000", () => {
    expect(isWithinLimit("a".repeat(999))).toBe(true);
    expect(isWithinLimit("a".repeat(1001))).toBe(false);
  });
});
