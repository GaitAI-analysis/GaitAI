#!/usr/bin/env node
/**
 * Generate the two secrets a deployment needs besides the gateway keys:
 *   ENTITLEMENT_PRIVATE_JWK  Ed25519 private key (JSON) that signs
 *                            entitlement tokens and analysis grants
 *   CHECKOUT_TOKEN_SECRET    HMAC key for hosted-checkout page tokens
 *
 * Prints wrangler commands; nothing is written to disk. Keep the output
 * out of the repository. The matching PUBLIC key for the apps is served by
 * GET /v1/keys once the secret is set.
 */
import { webcrypto as crypto } from "node:crypto";

const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
const priv = await crypto.subtle.exportKey("jwk", pair.privateKey);
const pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
const kidBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pub.x));
const kid = Buffer.from(kidBytes).toString("hex").slice(0, 16);
const secret = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");

const configFlag = process.argv.includes("--sandbox") ? " -c wrangler.sandbox.jsonc" : "";
console.log("# Run these in billing/ (each prompts for the value shown):");
console.log(`npx wrangler secret put ENTITLEMENT_PRIVATE_JWK${configFlag}`);
console.log(JSON.stringify({ ...priv, kid }));
console.log(`npx wrangler secret put CHECKOUT_TOKEN_SECRET${configFlag}`);
console.log(secret);
console.log("\n# Public key the apps embed (also served at /v1/keys):");
console.log(JSON.stringify({ ...pub, kid, key_ops: ["verify"] }));
