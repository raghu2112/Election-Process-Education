/**
 * services/firebase.ts — Firebase initialisation
 * ================================================
 * Google Services Integration rationale:
 *
 *  1. Firebase Hosting  — CDN-backed static deployment, HTTPS by default,
 *                         preview channels per PR (zero-config CI/CD)
 *  2. Firebase Auth     — Optional: future authenticated personalised flows
 *                         (saved voter journey, multi-device sync)
 *  3. Firestore         — Optional: conversation logs for analytics and
 *                         abuse detection without a custom DB
 *
 * All Firebase config values come from environment variables.
 * Never hardcode API keys — they are not secret but best practice
 * is to keep them in .env so they can be rotated without code changes.
 *
 * @integration Firebase (Google Services)
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics }             from "firebase/analytics";
import { getAuth, type Auth }                       from "firebase/auth";
import { getFirestore, type Firestore }             from "firebase/firestore";

// ── Config from environment ──────────────────────────────────

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY       as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN   as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID    as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_ID  as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID        as string,
  measurementId:     import.meta.env.VITE_GA4_MEASUREMENT_ID     as string,
};

// ── Singleton initialisation ─────────────────────────────────
// Guard against double-initialisation in React Strict Mode / HMR

let app:       FirebaseApp | null = null;
let analytics: Analytics   | null = null;
let auth:      Auth        | null = null;
let db:        Firestore   | null = null;

/**
 * Initialise Firebase lazily (called once at app boot).
 * Returns all service instances.
 *
 * Pattern: singleton via getApps() guard — safe in SSR and HMR.
 */
export function initFirebase(): {
  app: FirebaseApp;
  analytics: Analytics | null;
  auth: Auth;
  db: Firestore;
} {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Analytics only available in browser (not SSR / Node)
  if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
  }

  auth = getAuth(app);
  db   = getFirestore(app);

  return { app, analytics, auth, db };
}

/**
 * Returns the already-initialised Firestore instance.
 * Call initFirebase() first (done in main.tsx).
 */
export function getDb(): Firestore {
  if (!db) throw new Error("Firebase not initialised. Call initFirebase() first.");
  return db;
}

export { app, analytics, auth, db };
