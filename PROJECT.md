# GlowUp AI — Full Project Documentation

> **Your Personal AI Appearance Coach**
> Not a face-rating app. A transformation system.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js 16)                   │
│                                                             │
│  Landing → Upload → Analysis → Results → Premium → Login    │
│     ↓         ↓         ↓          ↓         ↓        ↓    │
│  Static    FormData   Polling    Fetch     Razorpay  OAuth  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────┐
│                      PROXY (proxy.js)                        │
│  CSRF check · Nonce generation · Path traversal block       │
│  Suspicious UA detection · Rate limit key injection         │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                     API ROUTES (Next.js)                     │
│                                                             │
│  /api/analyze      → Upload + AI analysis                   │
│  /api/results      → Fetch results (free/paid gating)       │
│  /api/payment/*    → Razorpay create + verify               │
│  /api/webhook/*    → Server-to-server payment confirmation  │
│  /api/auth/*       → Login/Signup/Google OAuth/Callback      │
│  /api/progress     → 30-day challenge tracking              │
│  /api/photo        → On-demand signed URL generation        │
│  /api/health       → Service health check                   │
└───────┬──────────────────┬──────────────────┬───────────────┘
        │                  │                  │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────────┐
│  Supabase    │  │  AI (Vision) │  │  Razorpay        │
│  • Auth      │  │  • Gemini    │  │  • Orders        │
│  • Database  │  │  • OpenAI    │  │  • Verify        │
│  • Storage   │  │    (fallback)│  │  • Webhooks      │
└──────────────┘  └──────────────┘  └──────────────────┘
```

---

## User Funnel (Complete Flow)

```
AWARENESS (Meta/Google Ads)
  ↓
LANDING PAGE (/)
  Hero → "Become the Best Version of Yourself"
  Social proof → 4.9/5, 2400 reviews
  How It Works → 4 steps
  Examples → Before/After cards
  Features → 12-item grid
  Pricing → Free / ₹199 / ₹499 / ₹999
  ↓
UPLOAD (/upload) — NO LOGIN REQUIRED
  Step 1: Age, Gender, Goal (dating/confidence/college/professional/wedding/social-media)
  Step 2: Drag-and-drop selfie (5MB max, JPEG/PNG/WebP/HEIC)
  ↓
ANALYSIS (/analysis?id=xxx)
  8-step animated progress (detecting landmarks → finding haircut → generating plan)
  Polls /api/results every 3s until status=completed
  ↓
FREE RESULTS (/results?id=xxx)
  Shows: Top 4 strengths with scores
  Shows: Count of locked improvements (e.g. "10 improvements found")
  Shows: Locked improvement labels (category + impact level only)
  Shows: AI Preview teaser (blurred)
  CTA: "Unlock Full Report — ₹199"
  ↓
PREMIUM (/premium?id=xxx)
  Plan selection: ₹199 Report / ₹499 Coach / ₹999 Monthly
  Email + Name collection
  Razorpay Checkout modal
  ↓
PAYMENT VERIFIED
  ↓
LOGIN ENFORCED (/login?reason=payment&redirect=/results?id=xxx&unlocked=true)
  "Payment successful! Create account to access your report"
  Options: Google OAuth OR Email/Password
  Skip button HIDDEN (enforced)
  ↓
FULL REPORT (/results?id=xxx&unlocked=true)
  Unlocked: Full improvements with recommendations
  Unlocked: Skincare routine (AM/PM)
  Unlocked: Color palette with hex codes
  Unlocked: 30-day plan (Coach/Monthly)
  Unlocked: Confidence + Photo tips (Monthly)
  Download PDF + Share (WhatsApp/X/Copy) + Upsell to higher tier
  ↓
RETENTION
  Email report delivery (Gmail SMTP fallback)
  30-day challenge with daily checklist
  Streak tracking
  Weekly selfie comparison (Coach+)
```

---

## Conversion Hooks (Psychology)

| Hook | Where | Psychology |
|------|-------|-----------|
| Free analysis (no signup) | Upload page | Zero friction → try before buy |
| Strengths shown first | Results page | Positive reinforcement → curiosity gap |
| "10 improvements found" | Results page | Curiosity + incomplete loop |
| Locked teasers (category visible) | Results page | They KNOW what's inside but can't access |
| AI Preview blur | Results page | Visual future → desire |
| Login after payment (not before) | Premium page | They already paid → sunk cost guarantees signup |
| Upsell based on plan | Results page | Smart: Report→Coach, Coach→Monthly |
| Streak rewards | Progress | Loss aversion (don't break the streak) |
| Weekly comparison | Progress | Measurable progress → motivation |
| Referral program | Results page | Social proof + growth loop |

---

## Pages

| Route | File | Auth | Purpose |
|-------|------|------|---------|
| `/` | `app/page.js` | None | Landing page with all sections |
| `/upload` | `app/upload/page.js` | None | 2-step selfie upload form |
| `/analysis` | `app/analysis/page.js` | None | Animated AI scanning progress |
| `/results` | `app/results/page.js` | None | Free/paid results view |
| `/premium` | `app/premium/page.js` | None | Plan selection + Razorpay checkout |
| `/login` | `app/login/page.js` | None | Login/Signup + Google OAuth |
| `/auth/complete` | `app/auth/complete/page.js` | None | OAuth callback → localStorage → redirect |

---

## API Routes

| Route | Method | Auth | Rate Limit | Purpose |
|-------|--------|------|-----------|---------|
| `/api/analyze` | POST | Origin check | 5/5min (Supabase/Upstash) | Upload selfie → Storage → AI → DB |
| `/api/results` | GET | sessionId param | None | Fetch results (gated by payment status) |
| `/api/payment/create` | POST | Origin check | 10/min (in-memory) | Create Razorpay order |
| `/api/payment/verify` | POST | Origin check | None | Verify HMAC signature → unlock |
| `/api/webhook/razorpay` | POST | HMAC signature | None | Idempotent server-to-server confirm |
| `/api/auth/login` | POST | Origin check | 10/5min (in-memory) | Email/password sign in |
| `/api/auth/signup` | POST | Origin check | 5/5min (in-memory) | Create account + link session |
| `/api/auth/google` | GET | None | None | Initiate Google OAuth |
| `/api/auth/callback` | GET | None | None | OAuth code exchange + session link |
| `/api/progress` | GET/POST | Supabase auth | None | 30-day challenge entries + streaks |
| `/api/photo` | GET | sessionId param | None | On-demand signed URL for stored photos |
| `/api/health` | GET | None | None | Service status check |

---

## Library Files

| File | Purpose |
|------|---------|
| `app/lib/ai/analyze.js` | AI vision analysis: prompt engineering, OpenAI (25s timeout) + Gemini (30s timeout), JSON response cleaner, result validation |
| `app/lib/email.js` | Dual-provider email: Resend (primary) + Gmail SMTP (fallback), 3 templates (report, payment, reminder) |
| `app/lib/security.js` | Input sanitization, file validation, in-memory rate limiting (legacy), CSRF origin check, env validation |
| `app/lib/rate-limit.js` | Production rate limiting: Upstash Redis (priority, <5ms) → Supabase table (fallback, ~100ms) → fail open |
| `app/lib/seo.js` | JSON-LD schema generators: Organization, SoftwareApplication, FAQPage, HowTo, WebPage, Breadcrumb, Review |
| `app/lib/supabase/client.js` | Browser-side Supabase client (anon key) |
| `app/lib/supabase/server.js` | Server-side Supabase client (cookies) + Admin client (service role) |

---

## Database Schema

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | References auth.users (PK) |
| email | TEXT | |
| full_name | TEXT | |
| avatar_url | TEXT | Google profile pic |
| age | INTEGER | 13-120 |
| gender | TEXT | male/female/other |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

### `analyses`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users (nullable for anonymous) |
| session_id | TEXT | Anonymous session tracking |
| age | INTEGER | Input |
| gender | TEXT | Input |
| goal | TEXT | Input |
| photo_url | TEXT | Legacy (empty now) |
| photo_path | TEXT | Supabase storage path |
| status | TEXT | pending/processing/completed/failed |
| strengths | JSONB | Array of {label, description, score} |
| improvements | JSONB | Array of {category, label, description, impact, recommendations, products} |
| full_report | JSONB | Complete AI response (skin_routine, color_palette, 30_day_plan, etc.) |
| ai_preview_url | TEXT | Future: AI-generated after image |
| overall_score | NUMERIC(4,2) | Not used (no ratings philosophy) |
| improvement_potential | NUMERIC(4,2) | e.g. 25 = "+25%" |
| ai_model | TEXT | gemini-3.1-flash-lite / gpt-4o |
| processing_time_ms | INTEGER | |
| error_message | TEXT | If status=failed |

### `payments`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users (nullable) |
| analysis_id | UUID | FK → analyses |
| session_id | TEXT | For anonymous→user linking |
| razorpay_order_id | TEXT | UNIQUE |
| razorpay_payment_id | TEXT | UNIQUE |
| razorpay_signature | TEXT | HMAC verification |
| amount | INTEGER | Paise (19900 = ₹199) |
| currency | TEXT | INR |
| plan | TEXT | report/coach/monthly |
| status | TEXT | created/authorized/captured/failed/refunded |
| receipt | TEXT | glowup_xxxxxxxx |
| notes | JSONB | {email, name} |

### `progress_entries`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users (NOT NULL) |
| analysis_id | UUID | FK → analyses |
| day_number | INTEGER | 1-30 |
| date | DATE | UNIQUE with user_id |
| checklist | JSONB | Array of completed items |
| selfie_url | TEXT | Weekly comparison |
| selfie_path | TEXT | Storage path |
| comparison_results | JSONB | AI diff |
| streak_count | INTEGER | |
| notes | TEXT | |

### `streaks`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK (UNIQUE) |
| current_streak | INTEGER | |
| longest_streak | INTEGER | |
| last_check_in | DATE | |
| total_check_ins | INTEGER | |

### `rate_limits`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL | PK |
| key | TEXT | e.g. "analyze:192.168.1.1" |
| created_at | TIMESTAMPTZ | For windowed counting |

---

## SEO / AEO / GEO / LLM Discovery Stack

### SEO (Search Engine Optimization)
- Dynamic `sitemap.xml` with all routes + priorities
- Canonical URLs + metadataBase on all pages
- Open Graph + Twitter Cards metadata
- PWA manifest (`manifest.webmanifest`)
- 16 targeted keywords in layout metadata
- Google Search Console verification placeholder

### AEO (Answer Engine Optimization)
- **FAQPage schema** — 8 Q&As targeting voice/AI search queries
- **HowTo schema** — 5-step guide with estimated time + cost
- Structured answers optimized for Google Featured Snippets
- Questions mirror "People Also Ask" patterns

### GEO (Generative Engine Optimization)
- `robots.js` explicitly allows: GPTBot, Google-Extended, CCBot
- Organization schema with entity markup (name, contact, social)
- SoftwareApplication schema with pricing + ratings
- Review schema with real testimonial text
- Content structured for LLM extraction (clean headings, lists)

### LLM Discovery
- `/robots.txt` allows AI crawlers (ChatGPT, Claude, Perplexity)
- FAQ content written to be extractable by LLMs
- Product descriptions are factual, not marketing-speak
- Pricing clearly stated in structured data

---

## Environment Variables

| Variable | Required | Free? | Purpose |
|----------|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes (free tier) | Database + Auth + Storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Client-side Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes | Server-side admin operations |
| `GOOGLE_AI_API_KEY` | Yes | Yes (1000/day) | Gemini 3.1 Flash-Lite vision |
| `GEMINI_MODEL` | No | — | Default: gemini-3.1-flash-lite |
| `OPENAI_API_KEY` | No | No ($5+) | GPT-4o vision (optional) |
| `RAZORPAY_KEY_ID` | Yes | Yes (test mode) | Payment processing |
| `RAZORPAY_KEY_SECRET` | Yes | Yes | Payment verification |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes | Yes | Client-side checkout |
| `SMTP_USER` | Yes* | Yes (Gmail) | Email sending (500/day free) |
| `SMTP_PASSWORD` | Yes* | Yes | Gmail App Password |
| `RESEND_API_KEY` | No | No | Production email (optional) |
| `UPSTASH_REDIS_REST_URL` | No | Yes (10K/day) | Fast rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Yes | Upstash auth |

*Either SMTP or Resend required. SMTP (Gmail) is free.

### Zero-Cost Stack
| Service | Provider | Free Tier |
|---------|----------|-----------|
| Database + Auth + Storage | Supabase | 500MB, 50K users |
| AI Vision | Gemini 3.1 Flash-Lite | 1,000 req/day |
| Email | Gmail SMTP | 500 emails/day |
| Payment | Razorpay Test Mode | Unlimited test |
| Rate Limiting | Upstash Redis | 10,000 req/day |
| Image CDN | Cloudinary | 10GB, 20GB bandwidth |
| Hosting | Vercel | 100GB bandwidth |
| **Total** | | **₹0** |

---

## Pricing Model + Revenue

| Plan | Price | Margin | What They Get |
|------|-------|--------|---------------|
| Free | ₹0 | — | Strengths + improvement count (lead gen) |
| Glow-Up Report | ₹199 | ~₹197 (AI cost ~₹2) | Full analysis + recommendations |
| 30-Day Coach | ₹499 | ~₹495 | Report + daily plan + tracking + streaks |
| Monthly Premium | ₹999/mo | ~₹995/mo | Everything + unlimited + community |

### Revenue Per Customer (LTV)
- **Minimum (report only):** ₹199
- **With Coach upsell:** ₹199 + ₹300 upgrade = ₹499
- **Monthly convert:** ₹999 × 3 months avg = ₹2,997
- **With referrals:** +₹199 per referred conversion

### Cost Per Analysis
- Gemini 3.1 Flash-Lite: ~4,000 tokens input + ~4,000 output ≈ ₹0.50-2.00
- Supabase Storage: negligible (<1MB/photo)
- Email: free (Gmail)

---

## Security: What IS vs ISN'T Implemented

### Implemented
- [x] CSP (Content-Security-Policy) with whitelist
- [x] HSTS (Strict-Transport-Security, 2-year max-age)
- [x] X-Frame-Options DENY (no iframe embedding)
- [x] X-Content-Type-Options nosniff
- [x] Referrer-Policy strict-origin-when-cross-origin
- [x] Permissions-Policy (camera self, no mic/geo)
- [x] CSRF origin validation on all POST routes
- [x] Input sanitization (XSS strip, length cap)
- [x] File upload validation (type, size, minimum)
- [x] Rate limiting (Upstash Redis / Supabase fallback)
- [x] Razorpay HMAC signature verification
- [x] Webhook idempotency check
- [x] Supabase RLS (Row Level Security)
- [x] Service role separation (admin vs anon client)
- [x] Path traversal blocking in proxy
- [x] Suspicious user-agent detection (sqlmap, nikto, etc.)
- [x] Placeholder API key detection (skips invalid keys)
- [x] AbortController timeouts on external API calls

### NOT Implemented (Known Gaps)
- [ ] Email verification on signup (users are auto-confirmed)
- [ ] Account lockout after N failed logins
- [ ] CAPTCHA/hCaptcha on upload or signup
- [ ] File content verification (magic bytes check)
- [ ] Image EXIF stripping before storage
- [ ] Audit logging (who accessed what, when)
- [ ] Session invalidation on password change
- [ ] Encrypted database fields (PII stored in plaintext)
- [ ] DDoS protection beyond rate limiting (need Cloudflare)
- [ ] Admin panel with access controls
- [ ] GDPR data deletion endpoint
- [ ] Two-factor authentication

---

## Technical Weak Points (Ranked by Severity)

### Critical
1. **No CAPTCHA** — Bots can spam /api/analyze with fake uploads, burning AI credits
2. **Photo stored indefinitely** — No auto-deletion after analysis (privacy risk + storage cost)
3. **In-memory rate limiting still used** for `/api/auth/login` and `/api/payment/create` (useless on serverless)
4. **No email verification** — Anyone can sign up with any email, claim reports

### Medium
5. **OOM risk at scale** — 5MB × 50 concurrent = 250MB (OK for now, not for 1000+ users)
6. **Single AI provider failure** — If both OpenAI + Gemini are down, no fallback
7. **No retry logic** — If AI returns invalid JSON, user must manually retry
8. **localStorage for session** — Cleared on browser data wipe = lost access to paid reports
9. **No webhook retry handling** — If our server is down when Razorpay sends webhook, payment might not be captured
10. **Supabase rate limit table grows indefinitely** — Needs pg_cron cleanup or manual DELETE

### Low
11. **Hydration mismatch warning** — Browser extensions adding `cz-shortcut-listen` attribute
12. **No image compression** — Sending full 5MB to AI (could resize to 1MB client-side first)
13. **Email templates have old purple colors** — Should match new Cold Luxury theme
14. **No analytics tracking** — GA/PostHog env vars exist but no actual event tracking code

---

## Known Limitations + Workarounds

| Limitation | Workaround |
|-----------|-----------|
| Gemini sometimes returns non-JSON | `cleanJsonResponse()` strips code fences + finds { } bounds |
| Razorpay `beforeInteractive` Script breaks in client components | Dynamic script loader in handlePayment() |
| `useSearchParams()` requires Suspense in Next.js 16 | All pages using it wrapped in Suspense boundary |
| OAuth state expires if user takes too long | User sees "OAuth state expired" → redirect to /login (retry) |
| Payment not recognized after login | Triple-strategy lookup: analysis_id → session_id → authorized status |
| html2canvas/jspdf are browser-only | Loaded via `next/dynamic` with `ssr: false` |
| Upstash SDK requires npm install | Replaced with plain fetch() to REST API (zero deps) |

---

## Code Structure

```
glowup/
├── app/
│   ├── page.js                    # Landing page (composes 7 components)
│   ├── layout.js                  # Root layout + SEO metadata + JSON-LD
│   ├── globals.css                # Cold Luxury theme (gold/ice/obsidian)
│   ├── sitemap.js                 # Dynamic sitemap generator
│   ├── robots.js                  # Crawler rules (allows AI bots)
│   ├── manifest.js                # PWA manifest
│   │
│   ├── upload/page.js             # 2-step selfie upload
│   ├── analysis/page.js           # AI scanning animation + polling
│   ├── results/page.js            # Free/paid results view + download/share/upsell
│   ├── premium/page.js            # Plan selection + Razorpay checkout
│   ├── login/page.js              # Login/Signup + Google OAuth
│   ├── auth/complete/page.js      # OAuth callback handler (client-side)
│   │
│   ├── components/
│   │   ├── Navbar.js              # Fixed nav with login state
│   │   ├── Hero.js                # Main hero section
│   │   ├── HowItWorks.js         # 4-step process grid
│   │   ├── Examples.js            # Transformation cards
│   │   ├── Features.js            # 12-feature grid
│   │   ├── Pricing.js             # 3 plan cards
│   │   ├── Footer.js              # Minimal footer
│   │   ├── StructuredData.js      # JSON-LD script injector
│   │   ├── DownloadReport.js      # PDF generation (html2canvas + jsPDF)
│   │   ├── ShareResults.js        # Share via WhatsApp/X/Copy
│   │   └── UpsellSection.js       # Smart upsell based on current plan
│   │
│   ├── api/
│   │   ├── analyze/route.js       # POST: Upload + AI analysis
│   │   ├── results/route.js       # GET: Fetch results (freemium gating)
│   │   ├── photo/route.js         # GET: On-demand signed URL
│   │   ├── health/route.js        # GET: Health check
│   │   ├── payment/
│   │   │   ├── create/route.js    # POST: Razorpay order
│   │   │   └── verify/route.js    # POST: HMAC verify + unlock
│   │   ├── webhook/
│   │   │   └── razorpay/route.js  # POST: Server-to-server confirm
│   │   ├── auth/
│   │   │   ├── login/route.js     # POST: Email/password
│   │   │   ├── signup/route.js    # POST: Create account
│   │   │   ├── google/route.js    # GET: Initiate OAuth
│   │   │   └── callback/route.js  # GET: OAuth code exchange
│   │   └── progress/route.js      # GET/POST: 30-day tracking
│   │
│   └── lib/
│       ├── ai/analyze.js          # AI service (OpenAI + Gemini)
│       ├── email.js               # Email (Resend + Gmail SMTP)
│       ├── security.js            # Sanitization + validation
│       ├── rate-limit.js          # Upstash Redis / Supabase
│       ├── seo.js                 # JSON-LD schema generators
│       └── supabase/
│           ├── client.js          # Browser client
│           └── server.js          # Server + Admin client
│
├── supabase/
│   ├── schema.sql                 # Main DB schema (5 tables + RLS + functions)
│   └── migrations/
│       ├── 001_rate_limits.sql    # Rate limit table
│       └── 002_fix_rls.sql        # Simplified RLS policies
│
├── __tests__/                     # 53 tests (Jest + RTL)
│   ├── lib/security.test.js
│   ├── lib/seo.test.js
│   └── components/StructuredData.test.js
│
├── public/
│   ├── icon-192.png               # PWA icon
│   ├── icon-512.png               # PWA icon
│   └── apple-touch-icon.png       # iOS icon
│
├── proxy.js                       # Next.js 16 proxy (security layer)
├── next.config.mjs                # Security headers + CSP + image domains
├── jest.config.js                 # Test config
├── .env.example                   # All env vars documented
└── package.json                   # Dependencies
```

---

## Quick Commands

```bash
# Development
npm run dev            # Start dev server (localhost:3000)
npm run build          # Production build
npm run start          # Start production server
npm run lint           # ESLint
npm test               # Run 53 tests
npm run test:coverage  # Tests with coverage report

# Database
# Run in Supabase SQL Editor:
# 1. supabase/schema.sql (initial setup)
# 2. supabase/migrations/001_rate_limits.sql
# 3. supabase/migrations/002_fix_rls.sql

# Deployment (Vercel)
# Push to main → auto-deploys
# Set env vars in Vercel dashboard
# Add Razorpay webhook: https://yourdomain.com/api/webhook/razorpay
```

---

## Business Plan Summary

**Target:** 18-28 year olds (India primary, global secondary) wanting to improve appearance for dating/confidence/professional/social media.

**Differentiation:** Not a face-rating app (those give you a "6.3/10" and make you feel bad). We give actionable plans — specific haircuts, skincare routines, outfits. Empowering, not judgmental.

**Acquisition:** Meta Ads (₹5-15 CPA target) + organic SEO/AEO + referrals.

**Monetization Ladder:**
1. Free analysis → email capture
2. ₹199 Report → impulse purchase
3. ₹499 Coach → accountability upsell
4. ₹999/mo Premium → recurring revenue

**Unit Economics (target):**
- CAC: ₹50 (via Meta Ads)
- First purchase: ₹199 (4x ROAS day-1)
- LTV with upsells: ₹500-2,997
- AI cost per analysis: ₹1-2
- Gross margin: >95%

**Moat:** Not the AI (anyone can call Gemini). The moat is:
1. The prompt engineering (200+ line prompt, tuned for actionable advice)
2. The 30-day retention loop (streaks, comparisons, community)
3. Brand positioning (coach, not judge)
4. Data flywheel (more analyses → better recommendations)

---

*Last updated: June 2026*
*PRs merged: 17*
*Total routes: 25 (8 static pages + 12 API routes + 5 generated files)*
