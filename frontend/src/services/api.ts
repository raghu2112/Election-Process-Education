/**
 * services/api.ts — Typed API client
 * ====================================
 * Centralises all HTTP calls to the ElectGuide backend.
 * Never call fetch() directly from components — always go through this module.
 *
 * Security : Sanitises payloads before dispatch; never logs secrets.
 * Efficiency: Configurable timeout (AbortController); base URL from env.
 */

import { sanitizeInput } from "../utils/sanitize";

// ── Types ──────────────────────────────────────────────────

export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatResponse {
  reply: string;
  model: string;
  tokens_used: number;
  cached: boolean;
}

export interface ElectionPhase {
  id: string;
  phase: number;
  title: string;
  duration: string;
  description: string;
  keyActions: string[];
}

export interface PhasesResponse {
  phases: ElectionPhase[];
}

export type SupportedLanguage = "en" | "es" | "hi";

// ── Config ──────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const DEFAULT_TIMEOUT_MS = 15_000;

// ── Utility ──────────────────────────────────────────────────

/**
 * Fetch wrapper with timeout support (AbortController).
 * Throws a typed error on HTTP failure.
 *
 * @param url - Endpoint path (relative to BASE_URL)
 * @param init - Standard RequestInit options
 * @param timeoutMs - Abort after this many milliseconds (default 15 s)
 */
async function apiFetch<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      throw new Error(`API ${response.status}: ${text}`);
    }

    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

// ── API Methods ──────────────────────────────────────────────

/**
 * Send a conversation turn to the AI backend.
 *
 * Security: Each user message content is sanitised before dispatch.
 *
 * @param messages - Full conversation history
 * @param language - ISO 639-1 language code
 * @returns AI reply with usage metadata
 */
export async function sendChat(
  messages: ChatMessage[],
  language: SupportedLanguage = "en",
): Promise<ChatResponse> {
  // Sanitise all user-originated content before it leaves the client
  const safeMessages = messages.map((m) => ({
    role: m.role,
    content: m.role === "user" ? sanitizeInput(m.content) : m.content,
  }));

  return apiFetch<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages: safeMessages, language }),
  });
}

/**
 * Retrieve the list of election phases.
 * Cached server-side via lru_cache — fast repeat calls.
 */
export async function fetchPhases(): Promise<PhasesResponse> {
  return apiFetch<PhasesResponse>("/api/phases");
}

/**
 * Check backend liveness.
 * Used by health-check monitors and CI smoke tests.
 */
export async function checkHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/health");
}
