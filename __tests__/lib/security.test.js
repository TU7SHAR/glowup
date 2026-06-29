import {
  sanitizeInput,
  validateAge,
  validateGender,
  validateGoal,
  validateFileUpload,
  rateLimit,
  generateCSRFToken,
  validateOrigin,
  safeParseJSON,
  validateEnvVars,
} from "@/app/lib/security";

describe("Security Utilities", () => {
  // ─── INPUT SANITIZATION ─────────────────────────────
  describe("sanitizeInput", () => {
    it("should strip HTML tags", () => {
      expect(sanitizeInput("<script>alert('xss')</script>")).toBe(
        "scriptalert('xss')/script"
      );
    });

    it("should remove javascript: protocol", () => {
      expect(sanitizeInput("javascript:alert(1)")).toBe("alert(1)");
    });

    it("should remove event handlers", () => {
      expect(sanitizeInput('onerror= test')).not.toContain("onerror=");
      expect(sanitizeInput('onclick=alert(1)')).not.toContain("onclick=");
      expect(sanitizeInput('onload =evil()')).not.toContain("onload =");
    });

    it("should remove data: protocol", () => {
      expect(sanitizeInput("data:text/html,<h1>hi</h1>")).toBe(
        "text/html,h1hi/h1"
      );
    });

    it("should trim and cap length", () => {
      const longStr = "a".repeat(2000);
      expect(sanitizeInput(longStr).length).toBe(1000);
    });

    it("should handle non-string input", () => {
      expect(sanitizeInput(null)).toBe("");
      expect(sanitizeInput(undefined)).toBe("");
      expect(sanitizeInput(123)).toBe("");
    });

    it("should pass through clean input unchanged", () => {
      expect(sanitizeInput("Hello, World!")).toBe("Hello, World!");
    });
  });

  // ─── AGE VALIDATION ─────────────────────────────────
  describe("validateAge", () => {
    it("should accept valid ages", () => {
      expect(validateAge("18")).toEqual({ valid: true, value: 18 });
      expect(validateAge("25")).toEqual({ valid: true, value: 25 });
      expect(validateAge("13")).toEqual({ valid: true, value: 13 });
      expect(validateAge("120")).toEqual({ valid: true, value: 120 });
    });

    it("should reject ages below 13", () => {
      expect(validateAge("12")).toEqual({
        valid: false,
        error: "Age must be between 13 and 120",
      });
      expect(validateAge("5")).toEqual({
        valid: false,
        error: "Age must be between 13 and 120",
      });
    });

    it("should reject ages above 120", () => {
      expect(validateAge("121")).toEqual({
        valid: false,
        error: "Age must be between 13 and 120",
      });
    });

    it("should reject non-numeric input", () => {
      expect(validateAge("abc")).toEqual({
        valid: false,
        error: "Age must be between 13 and 120",
      });
      expect(validateAge("")).toEqual({
        valid: false,
        error: "Age must be between 13 and 120",
      });
    });
  });

  // ─── GENDER VALIDATION ──────────────────────────────
  describe("validateGender", () => {
    it("should accept valid genders", () => {
      expect(validateGender("male")).toEqual({ valid: true, value: "male" });
      expect(validateGender("female")).toEqual({ valid: true, value: "female" });
      expect(validateGender("other")).toEqual({ valid: true, value: "other" });
    });

    it("should be case-insensitive", () => {
      expect(validateGender("Male")).toEqual({ valid: true, value: "male" });
      expect(validateGender("FEMALE")).toEqual({ valid: true, value: "female" });
    });

    it("should reject invalid genders", () => {
      expect(validateGender("invalid")).toEqual({
        valid: false,
        error: "Invalid gender selection",
      });
      expect(validateGender("<script>")).toEqual({
        valid: false,
        error: "Invalid gender selection",
      });
    });
  });

  // ─── GOAL VALIDATION ────────────────────────────────
  describe("validateGoal", () => {
    it("should accept all valid goals", () => {
      const validGoals = [
        "dating",
        "confidence",
        "college",
        "professional",
        "wedding",
        "social-media",
      ];
      validGoals.forEach((goal) => {
        expect(validateGoal(goal)).toEqual({ valid: true, value: goal });
      });
    });

    it("should reject invalid goals", () => {
      expect(validateGoal("hacking")).toEqual({
        valid: false,
        error: "Invalid goal selection",
      });
    });
  });

  // ─── FILE UPLOAD VALIDATION ─────────────────────────
  describe("validateFileUpload", () => {
    it("should accept valid image files", () => {
      const validFile = { type: "image/jpeg", size: 2 * 1024 * 1024 };
      expect(validateFileUpload(validFile)).toEqual({ valid: true });
    });

    it("should reject null/undefined files", () => {
      expect(validateFileUpload(null)).toEqual({
        valid: false,
        errors: ["No file provided"],
      });
    });

    it("should reject invalid file types", () => {
      const invalidFile = { type: "application/pdf", size: 5000 };
      const result = validateFileUpload(invalidFile);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Invalid file type");
    });

    it("should reject files exceeding max size", () => {
      const largeFile = { type: "image/png", size: 15 * 1024 * 1024 };
      const result = validateFileUpload(largeFile);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("File too large");
    });

    it("should reject suspiciously small files", () => {
      const tinyFile = { type: "image/jpeg", size: 100 };
      const result = validateFileUpload(tinyFile);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("File too small");
    });
  });

  // ─── RATE LIMITING ──────────────────────────────────
  describe("rateLimit", () => {
    it("should allow requests within limit", () => {
      const result = rateLimit({
        key: "test-allow-" + Date.now(),
        maxRequests: 5,
        windowMs: 60000,
      });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should block requests exceeding limit", () => {
      const key = "test-block-" + Date.now();
      const opts = { key, maxRequests: 2, windowMs: 60000 };

      rateLimit(opts); // 1st
      rateLimit(opts); // 2nd (max)
      const result = rateLimit(opts); // 3rd - should be blocked

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  // ─── CSRF TOKEN ─────────────────────────────────────
  describe("generateCSRFToken", () => {
    it("should generate a non-empty string", () => {
      const token = generateCSRFToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });

    it("should generate unique tokens", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  // ─── ORIGIN VALIDATION ──────────────────────────────
  describe("validateOrigin", () => {
    it("should allow requests without origin (same-site)", () => {
      const request = { headers: new Map() };
      request.headers.get = (key) =>
        key === "origin" ? null : key === "referer" ? null : null;
      expect(validateOrigin(request)).toBe(true);
    });

    it("should allow valid origin", () => {
      const request = {
        headers: { get: (key) => (key === "origin" ? "http://localhost:3000" : null) },
      };
      expect(validateOrigin(request)).toBe(true);
    });

    it("should reject invalid origin", () => {
      const request = {
        headers: { get: (key) => (key === "origin" ? "https://evil.com" : null) },
      };
      expect(validateOrigin(request)).toBe(false);
    });
  });

  // ─── SAFE JSON PARSE ────────────────────────────────
  describe("safeParseJSON", () => {
    it("should parse valid JSON", () => {
      expect(safeParseJSON('{"key": "value"}')).toEqual({
        success: true,
        data: { key: "value" },
      });
    });

    it("should handle invalid JSON gracefully", () => {
      expect(safeParseJSON("{invalid}")).toEqual({
        success: false,
        error: "Invalid JSON",
      });
    });
  });

  // ─── ENV VALIDATION ─────────────────────────────────
  describe("validateEnvVars", () => {
    it("should pass when no vars are required", () => {
      expect(validateEnvVars([])).toEqual({ valid: true });
    });

    it("should detect missing env vars", () => {
      const result = validateEnvVars(["DEFINITELY_NOT_SET_VAR_XYZ"]);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain("DEFINITELY_NOT_SET_VAR_XYZ");
    });
  });
});
