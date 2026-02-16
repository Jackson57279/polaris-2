import { NextRequest, NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { getConvexServerClient } from "@/lib/convex-server";

/**
 * POST /api/wallet/ledger
 * Admin/Server-only endpoint to create a customer wallet ledger entry (credit/debit)
 * in Dodo Payments, and mirror it into Convex (wallet + wallet_ledger tables).
 *
 * Security:
 * - Requires header: x-internal-key = POLARIS_CONVEX_INTERNAL_KEY
 *
 * Body JSON:
 * {
 *   "dodo_customer_id": "cus_123",
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

  if (!process.env.DODO_PAYMENTS_API_KEY) {
    return NextResponse.json(
      { error: "DODO_PAYMENTS_API_KEY not configured" },
      { status: 500 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    dodo_customer_id,
    amount,
    currency,
    entry_type,
    reason,
    reference_object_id,
  } = body ?? {};

  if (
    !dodo_customer_id ||
    typeof amount !== "number" ||
    !currency ||
    (entry_type !== "credit" && entry_type !== "debit")
  ) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid fields. Required: dodo_customer_id, amount (number), currency, entry_type ('credit'|'debit')",
      },
      { status: 400 }
    );
  }

  // 1) Create ledger entry in Dodo Payments
  const client = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
    environment:
      (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode" | undefined) ??
      "live_mode",
  });

  try {
    await client.customers.wallets.ledgerEntries.create(dodo_customer_id, {
      amount,
      currency,
      entry_type,
      reason,
    });
  } catch (err) {
    console.error("Dodo wallet ledger create failed:", err);
    return NextResponse.json(
      { error: "Failed to create Dodo wallet ledger entry" },
      { status: 502 }
    );
  }

  // 2) Mirror into Convex wallet + ledger tables
  try {
    const convex = getConvexServerClient();
    await (convex as any).mutation("billing:recordWalletLedger", {
      internalKey: INTERNAL_KEY,
      dodoCustomerId: dodo_customer_id,
      currency,
      amount,
      isCredit: entry_type === "credit",
      reason,
      referenceObjectId: reference_object_id,
    });
  } catch (err) {
    console.error("Convex wallet mirror failed:", err);
    // We purposefully do not roll back Dodo here; return 207-style info
    return NextResponse.json(
      {
        success: true,
        warning:
          "Ledger entry created in Dodo but failed to mirror in Convex. Check server logs.",
      },
      { status: 207 }
    );
  }

  return NextResponse.json({ success: true });
}