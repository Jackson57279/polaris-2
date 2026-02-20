import { NextRequest, NextResponse } from "next/server";
import { getConvexServerClient } from "@/lib/convex-server";

/**
 * POST /api/wallet/ledger
 * Admin/Server-only endpoint to create a customer wallet ledger entry (credit/debit)
 * directly in Convex (wallet + wallet_ledger tables).
 *
 * Security:
 * - Requires header: x-internal-key = POLARIS_CONVEX_INTERNAL_KEY
 *
 * Body JSON:
 * {
 *   "clerk_user_id": "user_123",
 *   "amount": 5000,                 // smallest currency unit (e.g., cents)
 *   "currency": "USD",
 *   "entry_type": "credit" | "debit",
 *   "reason": "Promo credit",       // optional
 *   "reference_object_id": "abc",   // optional
 * }
 */
export async function POST(req: NextRequest) {
  const INTERNAL_KEY = process.env.POLARIS_CONVEX_INTERNAL_KEY;
  const headerKey = req.headers.get("x-internal-key") ?? undefined;

  if (!INTERNAL_KEY || headerKey !== INTERNAL_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const clerkUserId = payload.clerk_user_id;
  const amount = payload.amount;
  const currency = payload.currency;
  const entryType = payload.entry_type;
  const reason = payload.reason;
  const referenceObjectId = payload.reference_object_id;

  if (
    typeof clerkUserId !== "string" ||
    typeof amount !== "number" ||
    typeof currency !== "string" ||
    (entryType !== "credit" && entryType !== "debit")
  ) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid fields. Required: clerk_user_id, amount (number), currency, entry_type ('credit'|'debit')",
      },
      { status: 400 }
    );
  }

  try {
    const convex = getConvexServerClient();
    await (
      convex as unknown as {
        mutation: (
          name: string,
          args: Record<string, unknown>
        ) => Promise<unknown>;
      }
    ).mutation("billing:recordWalletLedger", {
      internalKey: INTERNAL_KEY,
      clerkUserId,
      currency,
      amount,
      isCredit: entryType === "credit",
      reason: typeof reason === "string" ? reason : undefined,
      referenceObjectId:
        typeof referenceObjectId === "string" ? referenceObjectId : undefined,
    });
  } catch (err) {
    console.error("Convex wallet ledger write failed:", err);
    return NextResponse.json(
      {
        error: "Failed to create wallet ledger entry",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}