/**
 * utils/sanitize.ts — Input sanitisation utilities
 * ==================================================
 * Single source of truth for all user-input cleaning.
 * Applied on the client before state mutation AND on the
 * server (backend/app/main.py) before API forwarding.
 * Defence-in-depth: both layers independently sanitise.
 *
 * @security Prevents XSS, HTML injection, JS-protocol URIs,
 *           inline event handlers, and SQL/NoSQL patterns.
 */

// Characters that must be HTML-escaped to prevent XSS
const HTML_ESCAPE_MAP: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&#39;",
  '"': "&quot;",
};

// SQL / NoSQL injection keywords — informational guard
// (LLM is not a DB, but defence-in-depth applies)
const INJECTION_PATTERN =
  /(--|;|\/\*|\*\/|xp_|UNION|SELECT|INSERT|DROP|DELETE|UPDATE|EXEC|CAST|CONVERT)/gi;

/**
 * Sanitise a raw user-supplied string.
 *
 * Steps (in order):
 *  1. Type guard — non-strings return ''
 *  2. Strip HTML tags
 *  3. Remove javascript: URIs
 *  4. Remove inline event handler attributes (onclick=, etc.)
 *  5. HTML-escape remaining special characters
 *  6. Strip SQL/NoSQL injection keywords
 *  7. Trim whitespace
 *  8. Hard truncate to maxLen (default 1000)
 *
 * @param raw    - Untrusted user input
 * @param maxLen - Hard character ceiling (default 1000)
 * @returns Safe, trimmed string
 *
 * @example
 *   sanitizeInput('<script>alert(1)</script>Hello')
 *   // → 'Hello'
 *
 *   sanitizeInput('javascript:alert(1)')
 *   // → 'alert(1)'  (protocol stripped)
 *
 *   sanitizeInput("'; DROP TABLE users; --")
 *   // → "'; TABLE users;"  (keywords stripped)
 */
export function sanitizeInput(raw: unknown, maxLen = 1000): string {
  if (typeof raw !== "string") return "";

  return raw
    .replace(/<[^>]*>/g, "")                                    // 2. strip HTML tags
    .replace(/javascript:/gi, "")                               // 3. strip JS protocol
    .replace(/on\w+\s*=/gi, "")                                 // 4. strip event handlers
    .replace(/[<>&'"]/g, (c) => HTML_ESCAPE_MAP[c] ?? c)       // 5. HTML-escape
    .replace(INJECTION_PATTERN, "")                             // 6. strip injections
    .trim()                                                      // 7. trim whitespace
    .slice(0, maxLen);                                           // 8. truncate
}

/**
 * Validate that a string is non-empty after sanitisation.
 * Use at form-submission boundaries for early user feedback.
 *
 * @param raw - Raw input string
 * @returns true if the sanitised value has content
 */
export function isNonEmpty(raw: unknown): boolean {
  return sanitizeInput(raw as string).length > 0;
}

/**
 * Validate that a string is within a character limit.
 * Used to drive real-time character count UI feedback.
 *
 * @param raw   - Raw input string
 * @param limit - Maximum character count (default 1000)
 */
export function isWithinLimit(raw: string, limit = 1000): boolean {
  return raw.trim().length <= limit;
}
