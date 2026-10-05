/**
 * Billing: the store's in-app purchase system behind one interface, with a
 * clearly marked development entitlement that can never be mistaken for a
 * purchase.
 *
 * - types.ts  shared types, product IDs, price/period helpers, entitlement copy
 * - store.ts  StoreBillingProvider — Google Play Billing (Android) and Apple
 *             StoreKit (iOS) through expo-iap; the platform picks itself
 * - dev.ts    DevEntitlementProvider (development builds only)
 *
 * States the app has to render (all of them reachable through `BillingState`):
 * unavailable, loading, ready, purchasing, pending, purchased, cancelled,
 * failed, restored. Prices come from the store's product metadata; nothing
 * here hardcodes a public price.
 */
export * from "./types";
export { DevEntitlementProvider } from "./dev";
export { StoreBillingProvider, OFFLINE_GRACE_MS, STORE_KIND, STORE_LABEL, toStoreProduct, toStoreProductAndroid, toStoreProductIOS, type StoreBillingConfig, type StoreKind } from "./store";

import { isEntitled } from "@gaitai/core";
import type { Entitlement } from "@gaitai/core";
/** True when the entitlement unlocks premium values. Same rule as core's gate(). */
export const isPro = (e: Entitlement): boolean => isEntitled(e);
