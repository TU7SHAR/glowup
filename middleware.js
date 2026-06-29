import { NextResponse } from "next/server";

/**
 * Next.js Middleware
 * Handles security checks, rate limiting signals, and request validation
 */
export function middleware(request) {
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
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ─── SECURITY: Block path traversal attempts ─────────
  if (pathname.includes("..") || pathname.includes("//")) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // ─── SECURITY: Protect API routes ───────────────────
  if (pathname.startsWith("/api/")) {
    // Validate origin for API calls (CSRF protection)
    const origin = request.headers.get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const allowedOrigins = [appUrl, "http://localhost:3000"];

    if (
      request.method !== "GET" &&
      origin &&
      !allowedOrigins.some((o) => origin.startsWith(o))
    ) {
      return new NextResponse("Forbidden - Invalid Origin", { status: 403 });
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
  // Run middleware on all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
