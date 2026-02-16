import { ConvexHttpClient } from "convex/browser";

// Server-side Convex client for Next.js route handlers
// Uses the same deployment URL as the browser client.
let _client: ConvexHttpClient | null = null;

export function getConvexServerClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
    _client = new ConvexHttpClient(url);
  }
  return _client;
}