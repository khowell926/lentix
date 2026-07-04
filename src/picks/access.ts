import { readJSON, writeJSON } from "@/lib/storage";
import type { AccessPass, Plan } from "./types";
import { PLANS } from "./data";

/**
 * Client-side access pass for the MVP paywall.
 *
 * Production swap: replace `purchase()` with a Stripe Checkout session
 * (server creates the session, webhook writes the entitlement, client
 * reads it from the API). The rest of the app only ever calls
 * `activePass()` so nothing else changes.
 */
const PASS_KEY = "lockroom.pass";

export function activePass(): AccessPass | null {
  const pass = readJSON<AccessPass | null>(PASS_KEY, null);
  if (!pass) return null;
  if (new Date(pass.expiresAt).getTime() <= Date.now()) return null;
  return pass;
}

export function hasAccess(): boolean {
  return activePass() !== null;
}

/** Simulated checkout — resolves like a payment redirect would. */
export function purchase(plan: Plan): Promise<AccessPass> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const now = new Date();
      const pass: AccessPass = {
        plan: plan.id,
        purchasedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + plan.durationDays * 86_400_000).toISOString(),
      };
      writeJSON(PASS_KEY, pass);
      resolve(pass);
    }, 1200);
  });
}

export function clearPass(): void {
  writeJSON<AccessPass | null>(PASS_KEY, null);
}

export function planFor(pass: AccessPass): Plan | undefined {
  return PLANS.find((p) => p.id === pass.plan);
}

export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}
