# Nexar — Premium AI Decision Engine

## Original problem
Build a premium, futuristic, dark-mode AI web app (Nexar) that vets products, websites, companies, jobs, apps, courses, crypto and services. Landing + dashboard + AI report + chat + community + pricing + admin.

## Architecture
- Backend: FastAPI + MongoDB (motor) + JWT auth + bcrypt + emergentintegrations (Claude Sonnet 4.5)
- Frontend: React 19 + Tailwind + shadcn/ui + framer-motion + lucide-react + sonner
- All API under /api prefix; CORS open; URLs from env

## Implemented (Iteration 1 — 2026-06-26)
- Auth: signup, login, JWT, /api/auth/me
- AI Analysis: POST /api/analyze → multi-pass Claude-generated JSON with Trust/Risk/Value scores + pros/cons/hidden costs/scam indicators/alternatives/buying tips/long-term insights/warranty/url safety/tags
- Reports CRUD: list, view, bookmark
- Trending feeds: scams + products
- Chat: AI assistant /api/chat (session-based)
- Community: reviews + scam reports
- Admin: /api/admin/overview (role gated)
- Stats: /api/stats
- Frontend pages: Landing (hero w/ 3D orb, search, stats, marquee, features, categories, testimonials, pricing, FAQ, CTA, footer), Login, Signup, Dashboard (history, saved, trending), Report (full score viz + community)
- Floating AI chat drawer on dashboard & report pages
- Glassmorphism + animated grid + aurora + responsive

## User personas
- Buyers vetting purchases; job seekers vetting recruiters; investors vetting crypto/startups; consumers vetting websites/apps.

## Backlog
- P0: PDF export, full admin panel UI, more thorough scam pattern DB, mocked browser extension page
- P1: Light mode toggle, screenshot upload analysis, QR code scanner, email alerts
- P2: Browser extension, Stripe checkout for Pro/Business tiers, mobile app shell, leaderboards
