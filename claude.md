# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered map description generator designed with ADA Title II requirements in mind. Users authenticate via ArcGIS Online, select a web map, and the app uses Claude to generate text descriptions designed to support WCAG 2.1 Level AA guidelines for blind and low-vision users.

## Commands

```bash
# Start local Postgres
docker compose up -d

# Install dependencies
npm install

# Push Prisma schema to database
npx prisma db push

# Run dev server
npm run dev

# Database GUI (local)
npx prisma studio

# Database GUI (headless/remote server)
npx prisma studio --browser none --port 5555
# Then SSH tunnel: ssh -L 5555:localhost:5555 your-server
# Open http://localhost:5555 in your local browser

# Lint
npm run lint

# Build for production
npm run build
```

## Tech Stack

- Next.js 16 (App Router) with TypeScript strict mode
- PostgreSQL + Prisma ORM
- ArcGIS OAuth 2.0 + ArcGIS Maps SDK for JS
- Anthropic Claude API (streaming responses)
- Tailwind CSS v4

## Architecture

### Route Structure (Not Yet Implemented)

```
app/
├── (public)/           # No auth required
│   ├── page.tsx        # Landing page with demos
│   ├── privacy/
│   └── cookies/
├── (app)/              # Auth required (protected by middleware)
│   ├── app/            # Main map picker + generator
│   ├── history/        # Previous generations
│   └── admin/          # Admin panel (hardcoded username list)
└── api/
    ├── auth/           # login, callback, logout, session
    ├── generate/       # Main generation endpoint (streaming)
    ├── generations/    # List, stats, CRUD operations
    └── admin/          # Organization and allotment management
```

### Key Flows

**Authentication**: Custom ArcGIS OAuth (not NextAuth). Sessions stored in database, session ID in HttpOnly cookie.

**Generation Pipeline**:
1. Client sends screenshot + map metadata via FormData
2. Server verifies auth and checks org quota (3 free/month, then paid allotments)
3. Reverse geocode map center via ArcGIS World Geocoder
4. Stream response from Claude with map screenshot + built prompt
5. Save generation to database, decrement quota (FIFO for paid allotments)

**Quota System**: Organizations share quota across all users. Free generations reset monthly. Paid allotments expire 12 months from purchase.

### Database Models

See `prisma/schema.prisma` for the full schema. Key models:
- `Organization` - ArcGIS org, linked to users/generations/allotments
- `User` - ArcGIS username as primary identifier
- `Generation` - Map title, description (markdown), soft delete (30-day retention)
- `GenerationAllotment` - Purchased generation packs with expiry
- `Session` - OAuth tokens and session management

## Environment Variables

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/accessible_map_agent"
ARCGIS_CLIENT_ID="your-client-id"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."
SESSION_SECRET="random-32-char-string"
ADMIN_USERNAMES="your_arcgis_username"  # comma-separated
CRON_SECRET="any-random-string"    # for running cron jobs
WEBHOOK_URL="https://..."          # optional, for Zapier/HubSpot integration
WEBHOOK_SECRET="random-string"     # required if WEBHOOK_URL is set
```

## Cron Jobs & Webhooks

The app has two cron endpoints:

### Daily Tasks (`/api/cron/daily-tasks`)
Runs once per day:
- Reset monthly quotas for orgs past their billing period
- Process subscription expirations and grace periods
- Apply scheduled downgrades
- Clean up expired generations and bonus credits
- Clean up old webhooks
- Send renewal reminder emails (30-day and 7-day)

### Hourly Tasks (`/api/cron/hourly-tasks`)
Runs every hour:
- **Process webhook queue** (sends to Zapier/HubSpot)

### Running Cron Jobs Locally

```bash
# Make sure dev server is running first
npm run dev

# In another terminal, run cron jobs
./scripts/run-cron-local.sh          # daily (default)
./scripts/run-cron-local.sh daily    # daily tasks
./scripts/run-cron-local.sh hourly   # hourly tasks (webhooks)
```

### Webhooks

Webhooks are queued to a database table and processed by the hourly cron job. Events:
- `new_user_registered` - User signs up
- `new_org_created` - New organization created
- `subscription_requested` - User submits subscription request
- `subscription_activated` - Admin activates a subscription
- `maps_depleted` - Org runs out of maps (quota + bonus exhausted)
- `professional_at_limit` - Professional tier org hits limit (upsell opportunity)

Webhooks are processed in batches of 10 with a 2-second delay between each to avoid rate limiting.

To test webhooks locally:
1. Set `WEBHOOK_URL` to a test endpoint (e.g., https://webhook.site or Zapier)
2. Set `WEBHOOK_SECRET` to any string
3. Trigger an action (e.g., submit subscription request)
4. Run `./scripts/run-cron-local.sh hourly` to process the queue
5. Check `WebhookQueue` table in Prisma Studio to see status
