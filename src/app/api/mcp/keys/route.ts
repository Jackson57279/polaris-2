import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

// ---------------------------------------------------------------------------
// Security constants
// ---------------------------------------------------------------------------

/** Hard cap on API keys per user. Prevents abuse / accidental proliferation. */
const MAX_KEYS_PER_USER = 10;

/** Max length for key label */
const MAX_NAME_LENGTH = 100;

/** Minimum allowed key name characters (strip to this after sanitize) */
const MIN_NAME_LENGTH = 1;

// ---------------------------------------------------------------------------
// In-memory rate limit for key creation (per Clerk userId)
// Separate from the MCP route limiter.
// ---------------------------------------------------------------------------

const createRateLimiter = new Map<string, { count: number; windowStart: number }>();
const CREATE_WINDOW_MS = 3_600_000; // 1 hour
const MAX_CREATES_PER_HOUR = 5;

function checkCreateRateLimit(userId: string): boolean {
  const now = Date.now();
  let state = createRateLimiter.get(userId);

  if (!state || now - state.windowStart >= CREATE_WINDOW_MS) {
    state = { count: 0, windowStart: now };
    createRateLimiter.set(userId, state);
  }

  if (state.count >= MAX_CREATES_PER_HOUR) return false;
  state.count++;
  return true;
}

// ---------------------------------------------------------------------------
// Key generation — rejection sampling for unbiased randomness
// ---------------------------------------------------------------------------

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generates a cryptographically secure API key.
 * Uses rejection sampling to eliminate modulo bias (256 % 62 ≠ 0).
 * Format: pk_<32 chars> — 32 * log2(62) ≈ 190 bits of entropy.
 */
function generateApiKey(): string {
  const CHAR_COUNT = CHARSET.length; // 62
  // Largest multiple of CHAR_COUNT that fits in a byte (0-255).
  // Bytes >= this threshold are rejected to ensure uniform distribution.
  const MAX_VALID_BYTE = 256 - (256 % CHAR_COUNT); // 248

  const KEY_LEN = 32;
  let result = "pk_";

  while (result.length < 3 + KEY_LEN) {
    // Over-sample to reduce iterations — expect ~3% rejection rate
    const needed = (3 + KEY_LEN - result.length) * 2;
    const bytes = crypto.getRandomValues(new Uint8Array(needed));
    for (const byte of bytes) {
      if (byte >= MAX_VALID_BYTE) continue; // reject to avoid bias
      result += CHARSET[byte % CHAR_COUNT];
      if (result.length === 3 + KEY_LEN) break;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Crypto
// ---------------------------------------------------------------------------

async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createBodySchema = z.object({
  name: z
    .string()
    .optional()
    .transform((v) => (v ?? "My API Key").trim().replace(/[\x00-\x1f\x7f]/g, ""))
    .pipe(
      z
        .string()
        .min(MIN_NAME_LENGTH, "Name cannot be empty")
        .max(MAX_NAME_LENGTH, `Name too long (max ${MAX_NAME_LENGTH} chars)`)
    ),
});

const deleteBodySchema = z.object({
  keyId: z.string().min(1, "keyId is required").max(64, "keyId too long"),
});

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/** GET /api/mcp/keys — list the current user's API keys (ids + names only) */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
  if (!internalKey) {
    console.error("[Polaris MCP] POLARIS_CONVEX_INTERNAL_KEY not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const keys = await convex.query(api.system.listApiKeys, {
      internalKey,
      clerkUserId: userId,
    });
    // Return metadata only — never the hashes
    return NextResponse.json({ keys });
  } catch (e) {
    console.error("[Polaris MCP] Failed to list API keys:", e);
    return NextResponse.json({ error: "Failed to list keys" }, { status: 500 });
  }
}

/** POST /api/mcp/keys — create a new API key (Pro users only) */
export async function POST(request: Request) {
  const { userId, has } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!has({ plan: "pro" })) {
    return NextResponse.json(
      { error: "Pro plan required to create MCP API keys" },
      { status: 403 }
    );
  }

  // Rate limit key creation per user
  if (!checkCreateRateLimit(userId)) {
    return NextResponse.json(
      { error: "Too many keys created recently. Try again in 1 hour." },
      { status: 429 }
    );
  }

  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
  if (!internalKey) {
    console.error("[Polaris MCP] POLARIS_CONVEX_INTERNAL_KEY not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Validate body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { name } = parsed.data;

  // Enforce per-user key cap
  let existingKeys: unknown[];
  try {
    existingKeys = await convex.query(api.system.listApiKeys, {
      internalKey,
      clerkUserId: userId,
    });
  } catch (e) {
    console.error("[Polaris MCP] Failed to list existing keys:", e);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (existingKeys.length >= MAX_KEYS_PER_USER) {
    return NextResponse.json(
      {
        error: `Maximum of ${MAX_KEYS_PER_USER} API keys allowed per user. Revoke an existing key first.`,
      },
      { status: 409 }
    );
  }

  // Generate + store key
  const plainKey = generateApiKey();
  const keyHash = await hashKey(plainKey);

  try {
    await convex.mutation(api.system.createApiKey, {
      internalKey,
      clerkUserId: userId,
      name,
      keyHash,
    });
  } catch (e) {
    console.error("[Polaris MCP] Failed to store API key:", e);
    return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
  }

  return NextResponse.json({
    key: plainKey,
    name,
    message: "Store this key securely — it will not be shown again.",
  });
}

/** DELETE /api/mcp/keys — revoke an API key by ID */
export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
  if (!internalKey) {
    console.error("[Polaris MCP] POLARIS_CONVEX_INTERNAL_KEY not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = deleteBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  try {
    await convex.mutation(api.system.revokeApiKey, {
      internalKey,
      keyId: parsed.data.keyId as Id<"api_keys">,
      clerkUserId: userId, // Convex verifies ownership — can't delete someone else's key
    });
  } catch (e) {
    console.error("[Polaris MCP] Failed to revoke key:", e);
    return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
