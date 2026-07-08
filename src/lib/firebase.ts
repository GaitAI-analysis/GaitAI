/**
 * Firebase Client SDK — single shared instance for the whole app.
 *
 * This file uses ONLY the public client SDK (`firebase/*`). It must never import
 * the Admin SDK, and it never touches service-account credentials.
 *
 * Configuration is env-driven (NEXT_PUBLIC_FIREBASE_*) to match the project's
 * existing `NEXT_PUBLIC_*` convention. The values below are *public* client keys
 * (safe to ship in a static bundle) — the `apiKey` is a client identifier, not a
 * secret. The fallbacks let the comment system work out-of-the-box even before
 * env vars are wired, while still allowing per-environment overrides.
 */
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyBvQFrPJPgGkizJC-loZjeEIZemAKA-eYw",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "gaitai-33c7f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "gaitai-33c7f",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "gaitai-33c7f.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "52857173308",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:52857173308:web:9ecefc164e3f6eea91da39",
};

// Re-use the existing app on hot reloads / repeated imports.
export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
