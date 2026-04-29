/**
 * utils/analytics.ts — Google Analytics 4 event tracking
 * =========================================================
 * Thin, typed wrapper around the GA4 gtag() global.
 *
 * Why GA4?
 *  - Understand which election topics users ask about most
 *  - Identify wizard step drop-off points for UX improvement
 *  - Track dark/light mode and language preferences
 *  - Measure chatbot engagement (messages sent, response length)
 *
 * How it improves the system:
 *  Product decisions are driven by real usage data rather than
 *  guesswork. E.g. if 80% of wizard users drop at Step 3
 *  (polling station), that step needs better content.
 *
 * Security: No PII is ever sent — only event names + metadata.
 *
 * @integration Google Analytics 4 (gtag.js)
 *              Measurement ID: VITE_GA4_MEASUREMENT_ID env var
 */

/** GA4 event parameter map — keeps calls type-safe */
export type GA4Params = Record<string, string | number | boolean>;

/**
 * Fire a GA4 custom event.
 * Falls back to console.debug in development / when gtag is absent.
 *
 * @param eventName - GA4 event name (snake_case recommended)
 * @param params    - Optional event parameters (no PII)
 *
 * @example
 *   trackEvent('chat_send', { text_length: 42, language: 'en' });
 *   trackEvent('phase_toggle', { phase_id: 'voting' });
 *   trackEvent('wizard_answer', { step: 'register', answer: 'Yes' });
 */
export function trackEvent(eventName: string, params: GA4Params = {}): void {
  const enriched: GA4Params = {
    app: "electguide",
    app_version: "1.0.0",
    ...params,
  };

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, enriched);
  } else {
    // Development / test fallback — visible in browser console
    console.debug(`[GA4] ${eventName}`, enriched);
  }
}

// ── Semantic event helpers ──────────────────────────────────
// Typed wrappers prevent typos in event names across the codebase.

/** User sent a chat message */
export const trackChatSend = (textLength: number, language: string) =>
  trackEvent("chat_send", { text_length: textLength, language });

/** AI returned a response */
export const trackChatResponse = (replyLength: number, tokensUsed: number) =>
  trackEvent("chat_response", { reply_length: replyLength, tokens_used: tokensUsed });

/** User clicked a navigation tab */
export const trackNavClick = (tab: string) =>
  trackEvent("nav_click", { tab });

/** User expanded/collapsed a timeline phase */
export const trackPhaseToggle = (phaseId: string) =>
  trackEvent("phase_toggle", { phase_id: phaseId });

/** User selected a wizard option */
export const trackWizardAnswer = (stepId: string, answer: string) =>
  trackEvent("wizard_answer", { step: stepId, answer });

/** User changed language */
export const trackLanguageChange = (language: string) =>
  trackEvent("language_change", { language });

/** User toggled dark/light mode */
export const trackThemeToggle = (mode: "dark" | "light") =>
  trackEvent("theme_toggle", { mode });

/** User clicked a suggested question chip */
export const trackSuggestionClick = (question: string) =>
  trackEvent("suggestion_click", { question_length: question.length });

// Extend Window type for TypeScript to recognise gtag
declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}
