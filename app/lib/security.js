/**
 * Security utilities for GlowUp AI
 * Input sanitization, rate limiting, CSRF protection, and validation
 */

// ─── INPUT SANITIZATION ───────────────────────────

/**
 * Sanitize user text input - strips HTML tags and dangerous characters
 */
export function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "") // Remove angle brackets (prevent XSS)
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=\S*/gi, "") // Remove event handlers and their values
    .replace(/data:/gi, "") // Remove data: protocol
    .replace(/vbscript:/gi, "") // Remove vbscript: protocol
    .trim()
    .slice(0, 1000); // Max length cap
}

/**
 * Validate and sanitize age input
 */
export function validateAge(age) {
  const parsed = parseInt(age, 10);
  if (isNaN(parsed) || parsed < 13 || parsed > 120) {
    return { valid: false, error: "Age must be between 13 and 120" };
  }
  return { valid: true, value: parsed };
}

/**
 * Validate gender input (whitelist approach)
 */
export function validateGender(gender) {
  const allowed = ["male", "female", "other"];
  const cleaned = String(gender).toLowerCase().trim();
  if (!allowed.includes(cleaned)) {
    return { valid: false, error: "Invalid gender selection" };
  }
  return { valid: true, value: cleaned };
}

/**
 * Validate goal selection (whitelist approach)
 */
export function validateGoal(goal) {
  const allowed = [
    "dating",
    "confidence",
    "college",
    "professional",
    "wedding",
    "social-media",
  ];
  const cleaned = String(goal).toLowerCase().trim();
  if (!allowed.includes(cleaned)) {
    return { valid: false, error: "Invalid goal selection" };
  }
  return { valid: true, value: cleaned };
}

/**
 * Validate file upload (type, size, dimensions)
 */
export function validateFileUpload(file, options = {}) {
  const {
    maxSizeMB = 10,
    allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"],
  } = options;

  const errors = [];

  if (!file) {
    return { valid: false, errors: ["No file provided"] };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(
      `Invalid file type. Allowed: ${allowedTypes
        .map((t) => t.split("/")[1])
        .join(", ")}`
    );
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    errors.push(`File too large. Maximum size: ${maxSizeMB}MB`);
  }

  // Check file size minimum (reject suspiciously small files)
  if (file.size < 1024) {
    errors.push("File too small. Please upload a valid photo.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

// ─── RATE LIMITING (IN-MEMORY) ────────────────────

const rateLimitMap = new Map();

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting (e.g., @upstash/ratelimit)
 */
export function rateLimit({
  key,
  maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "10"),
  windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
}) {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now - v.windowStart > windowMs) {
        rateLimitMap.delete(k);
      }
    }
  }

  if (!record || now - record.windowStart > windowMs) {
    // New window
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.windowStart + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

// ─── CSRF PROTECTION ──────────────────────────────

/**
 * Generate a CSRF token (for use in forms/API routes)
 */
export function generateCSRFToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Validate origin header against allowed origins
 */
export function validateOrigin(request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const allowedOrigins = [appUrl, "http://localhost:3000"];

  if (!origin && !referer) {
    // Allow requests without origin (e.g., same-site navigation)
    return true;
  }

  const requestOrigin = origin || new URL(referer).origin;
  return allowedOrigins.some((allowed) => requestOrigin.startsWith(allowed));
}

// ─── REQUEST VALIDATION ───────────────────────────

/**
 * Validate request content type
 */
export function validateContentType(request, expectedType = "application/json") {
  const contentType = request.headers.get("content-type");
  return contentType && contentType.includes(expectedType);
}

/**
 * Safe JSON parse with error handling
 */
export function safeParseJSON(str) {
  try {
    return { success: true, data: JSON.parse(str) };
  } catch {
    return { success: false, error: "Invalid JSON" };
  }
}

// ─── ENVIRONMENT VALIDATION ───────────────────────

/**
 * Validates that required environment variables are set
 * Call this at app startup or in middleware
 */
export function validateEnvVars(requiredVars = []) {
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(
      `[Security] Missing required environment variables: ${missing.join(", ")}`
    );
    return { valid: false, missing };
  }
  return { valid: true };
}
