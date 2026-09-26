"use client";

/**
 * Subscription gating — PLUGGABLE STUB.
 *
 * The site does not yet have a subscription backend, so this module is the
 * single seam where that logic will live. Today it reports "not subscribed" for
 * everyone, which means subscriber-only posts render the locked state for all
 * visitors. When a real subscription model exists (Firebase custom claims, a
 * `subscribers/{uid}` doc, Stripe, etc.), implement `resolveSubscription` and
 * nothing else in the comment UI needs to change.
 *
 * To wire a real check later, a typical implementation reads the signed-in
 * user's custom claims or a Firestore membership doc and returns `isSubscribed`
 * accordingly. The Firestore rules already contain a commented `isSubscriber()`
 * placeholder to mirror that enforcement server-side.
 */
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface SubscriptionState {
  /** Auth resolution still in flight. */
  loading: boolean;
  /** The signed-in user, if any. */
  user: User | null;
  /** Whether the user may access subscriber-only content. */
  isSubscribed: boolean;
}

/**
 * Override point. Return whether `user` is an active subscriber.
 * Currently always false (stub). Make it `async` so a real implementation can
 * query Firestore / read claims without changing the call site.
 */
async function resolveSubscription(_user: User | null): Promise<boolean> {
  // TODO: replace with real subscription lookup, e.g.
  //   const token = await _user?.getIdTokenResult();
  //   return token?.claims?.subscriber === true;
  return false;
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    loading: true,
    user: null,
    isSubscribed: false,
  });

  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      const isSubscribed = await resolveSubscription(user);
      if (!active) return;
      setState({ loading: false, user, isSubscribed });
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  return state;
}
