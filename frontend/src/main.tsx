/**
 * main.tsx — Application entry point
 * ====================================
 * Responsibilities:
 *  1. Initialise Firebase (Google Services) before React mounts
 *  2. Mount the React application into #root
 *  3. Wrap app in StrictMode for development warnings
 *
 * This file is kept intentionally minimal — all app logic lives in App.tsx.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import ReactDOM from "react-dom/client";

import { initFirebase } from "./services/firebase";
import App from "./App";

// ── Google Services: Firebase initialisation ─────────────────
// Must run before any component mounts to ensure Auth/Firestore
// are ready when the app first renders.
try {
  initFirebase();
} catch (err) {
  // Firebase is optional for the core chat experience.
  // Log the error but don't block the app from loading.
  console.warn("[ElectGuide] Firebase init skipped:", err);
}

// ── Error Boundary ────────────────────────────────────────────
// Catches unhandled React errors and renders a fallback UI
// instead of a blank screen. Critical for production resilience.

interface ErrorBoundaryState {
  hasError: boolean;
  message:  string;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ElectGuide] Unhandled error:", error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "100vh", gap: 12,
            fontFamily: "system-ui, sans-serif", color: "#0F172A",
            background: "#F1F5F9", padding: 24, textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#64748B", maxWidth: 340 }}>
            ElectGuide encountered an unexpected error. Please refresh the page.
          </p>
          <code style={{ fontSize: 11, color: "#94A3B8" }}>{this.state.message}</code>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8, padding: "10px 24px", background: "#4F46E5",
              color: "#fff", border: "none", borderRadius: 9,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Mount ─────────────────────────────────────────────────────

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root not found in index.html");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
