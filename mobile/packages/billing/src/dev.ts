/**
 * Development entitlement. Compiled only into development builds (app-state
 * checks `__DEV__` before constructing it). It shows no prices, performs no
 * purchase, never touches Google Play and labels itself everywhere as a DEV
 * entitlement, so it cannot be mistaken for one.
 */
import type { Entitlement } from "@gaitai/core";
import { FREE_ENTITLEMENT, type BillingProvider, type BillingState } from "./types";

export class DevEntitlementProvider implements BillingProvider {
  readonly name = "dev" as const;
  private pro = false;
  private listeners = new Set<(s: BillingState) => void>();
  constructor(private readonly persist: { get(): Promise<boolean>; set(v: boolean): Promise<void> }) {}
  private entitlement(): Entitlement {
    return this.pro
      ? { status: "PRO", tier: "pro", source: "dev", productId: "dev_entitlement", reason: "Development entitlement. Not a purchase." }
      : FREE_ENTITLEMENT;
  }
  private state(): BillingState {
    const s: BillingState = {
      status: this.pro ? "purchased" : "ready",
      products: [],
      entitlement: this.entitlement(),
      message: "DEVELOPMENT ENTITLEMENT — not a purchase. Toggle from Profile → Developer.",
    };
    this.listeners.forEach((l) => l(s));
    return s;
  }
  async init() { this.pro = await this.persist.get(); return this.state(); }
  async purchase() { this.pro = true; await this.persist.set(true); return this.state(); }
  async restore() { return this.init(); }
  async refresh() { return this.init(); }
  async revoke() { this.pro = false; await this.persist.set(false); return this.state(); }
  subscribe(l: (s: BillingState) => void) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }
  async manage() { return false; }
  manageUrl() { return null; }
  dispose() { this.listeners.clear(); }
}
