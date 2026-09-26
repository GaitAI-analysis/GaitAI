/**
 * Firebase Client SDK — single shared instance for the whole app.
 *
 * This file uses ONLY the public client SDK (`firebase/*`). It must never import
 * the Admin SDK, and it never touches service-account credentials.
 *
 * Configuration is 100% env-driven (NEXT_PUBLIC_FIREBASE_*) — no keys are
 * hardcoded in the repo. Values live in `.env.local` (gitignored); see
 * `.env.example` for the template. Next.js inlines NEXT_PUBLIC_* at build time.
 */
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  limit,
  query,
  type Firestore,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { fbLog, fbOk, fbFail } from "@/lib/firebase-logger";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    "Missing Firebase env vars (NEXT_PUBLIC_FIREBASE_*). " +
      "Copy .env.example to .env.local and fill in your Firebase config, then rebuild.",
  );
}

const maskedKey = `${firebaseConfig.apiKey.slice(0, 6)}…${firebaseConfig.apiKey.slice(-4)}`;
fbLog(
  `Config loaded from env — project: ${firebaseConfig.projectId}, authDomain: ${firebaseConfig.authDomain}, apiKey: ${maskedKey}`,
);

// Re-use the existing app on hot reloads / repeated imports.
export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);
fbOk("Firebase app initialized");

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

/**
 * One-time connectivity probe — DEVELOPMENT ONLY.
 *
 * Reads a single doc from the publicly-readable `posts` collection: success
 * (even when the collection is empty) proves the network + API key + Firestore
 * DB + security rules all work. This costs a network round-trip, so it is
 * skipped in production builds where it would slow down every page load.
 */
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  fbLog("Checking Firestore connection…");
  getDocs(query(collection(db, "posts"), limit(1)))
    .then(() => fbOk("CONNECTION ESTABLISHED — Firestore is reachable and public reads are allowed"))
    .catch((err) => fbFail("CONNECTION FAILED — Firestore probe read was rejected", err));
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
