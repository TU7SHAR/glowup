import { NextResponse } from "next/server";

/**
 * Next.js 16 Proxy (formerly middleware.js)
 * Runs before every matched request. Handles security checks,
 * CSRF origin validation, and request-level headers.
 */
export function proxy(request) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // ─── SECURITY: Add nonce for inline scripts (CSP) ────
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  response.headers.set("x-nonce", nonce);

  // ─── SECURITY: Block suspicious request patterns ─────
  const userAgent = request.headers.get("user-agent") || "";
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burpsuite/i,
    /\.\.\//,
    /%2e%2e/i,
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(request.url + userAgent))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ─── SECURITY: Block path traversal attempts ─────────
  if (pathname.includes("..") || pathname.includes("//")) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  // ─── SECURITY: Protect API routes ───────────────────
  if (pathname.startsWith("/api/")) {
    // Validate origin for API calls (CSRF protection).
    // A same-origin request (origin host === the request's own host) is always
    // legitimate — this is what CSRF origin-checking is meant to allow — so we
    // derive the allow-list from the actual request host. This makes it work on
    // Vercel deployments, preview URLs and custom domains without hardcoding
    // each one, while still blocking cross-site POSTs.
    const origin = request.headers.get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const requestOrigin = request.nextUrl.origin; // scheme + host of this request

    const allowedOrigins = [requestOrigin, "http://localhost:3000"];
    if (appUrl) allowedOrigins.push(appUrl);

    if (
      request.method !== "GET" &&
      origin &&
      !allowedOrigins.some((o) => origin.startsWith(o))
    ) {
      // Respond with JSON so client-side `res.json()` parsing never throws.
      return NextResponse.json(
        { error: "Forbidden - Invalid Origin" },
        { status: 403 }
      );
    }

    // Add rate limit headers (actual enforcement happens in API routes)
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";
    response.headers.set("x-rate-limit-key", clientIp);
  }

  // ─── SECURITY: Prevent information leakage ──────────
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
