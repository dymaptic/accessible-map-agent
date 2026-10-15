# Accessible Map Agent

AI-powered map description generator designed with ADA Title II requirements in mind. Users authenticate via ArcGIS Online, select a web map, and the app uses Claude AI to generate text descriptions designed to support WCAG 2.1 Level AA guidelines for blind and low-vision users.

## Features

- **ArcGIS Integration**: OAuth 2.0 authentication with ArcGIS Online
- **AI-Powered Descriptions**: Uses Claude to generate comprehensive, accessible map descriptions
- **Subscription Tiers**: FREE, STARTER, PROFESSIONAL, and ENTERPRISE plans
- **Organization-Based Quotas**: Shared quota pools across all users in an organization
- **Bonus Credit System**: Flexible credit grants for customer service and promotions
- **Email Notifications**: Automated transactional emails via Brevo
- **Admin Panel**: Super admin interface for subscription management

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript strict mode
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: ArcGIS OAuth 2.0
- **AI**: Anthropic Claude API (streaming responses)
- **Email**: Brevo (Sendinblue) transactional API
- **Styling**: Tailwind CSS v4

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL (local or Docker)
- ArcGIS Developer account
- Anthropic API key

### Local Development

```bash
# Start local Postgres
docker compose up -d

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your values

# Push Prisma schema to database
npx prisma db push

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Useful Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npx prisma studio    # Database GUI
npx prisma db push   # Push schema changes to database
```

### Prisma Studio on Remote/Headless Server

If running on a server without a browser (e.g., a jump box):

```bash
# On the server - run without auto-opening browser
npx prisma studio --browser none --port 5555

# On your local machine - create SSH tunnel
ssh -L 5555:localhost:5555 your-server

# Then open in your local browser
open http://localhost:5555
```

### Database Migrations (Production)

For production databases accessed via a jump box, use the self-contained migration script. It has the full Prisma schema embedded so you don't need source code on the server.

**Step 1: Regenerate the migration script** (after schema changes)
```bash
# On your local machine
node scripts/generate-migration-script.js
```

**Step 2: Copy the script to a host that can reach the database** (for example, a jump box inside your private network)

**Step 3: Run it**
```bash
chmod +x run-migrations.sh
./run-migrations.sh "postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"
```

The script will install Node.js if needed, create a temp directory with the schema, run `prisma db push`, and clean up.

## Environment Variables

See `.env.example` for all required variables. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ARCGIS_CLIENT_ID` | ArcGIS OAuth client ID |
| `ANTHROPIC_API_KEY` | Claude API key |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app |
| `SESSION_SECRET` | Random 32+ character string for session encryption |
| `ADMIN_USERNAMES` | Comma-separated list of super admin usernames |
| `BREVO_API_KEY` | Brevo transactional email API key |
| `ADMIN_NOTIFICATION_EMAILS` | Comma-separated admin emails for notifications |
| `CRON_SECRET` | Bearer token for cron job authentication |
| `WEBHOOK_URL` | (Optional) URL for webhook delivery (e.g., Zapier) |
| `WEBHOOK_SECRET` | Secret for signing webhook payloads |
| `APP_ENVIRONMENT` | Set to `production` to remove [TEST] prefix from emails |

## Architecture

```
src/
├── app/
│   ├── (public)/           # Public pages (landing, privacy, cookies)
│   ├── (app)/              # Protected app pages (requires auth)
│   │   ├── app/            # Main map picker + generator
│   │   ├── history/        # Generation history
│   │   ├── settings/       # Org settings
│   │   └── admin/          # Super admin panel
│   └── api/
│       ├── auth/           # OAuth endpoints
│       ├── generate/       # AI generation (streaming)
│       ├── generations/    # Generation CRUD
│       ├── subscription-requests/  # User subscription requests
│       ├── admin/          # Admin APIs
│       └── cron/           # Background job endpoints
├── components/             # React components
└── lib/                    # Core business logic
    ├── subscriptions.ts    # Tier config, quota management
    ├── generations.ts      # Credit consumption, recording
    ├── bonus-credits.ts    # Bonus credit system
    ├── email.ts            # Email service
    └── webhooks.ts         # Webhook queue system
```

## Subscription Tiers

| Tier | Price | Maps/Period | History Retention |
|------|-------|-------------|-------------------|
| FREE | $0 | 3 lifetime | 7 days |
| STARTER | $49/mo or $499/yr | 25/period | 90 days |
| PROFESSIONAL | $199/mo or $1,999/yr | 150/period | 365 days |
| ENTERPRISE | Custom | Unlimited | Unlimited |

## Cron Jobs

The app has two cron endpoints for background tasks:

### Daily Tasks (`/api/cron/daily-tasks`)
Runs once per day (midnight):
- Monthly quota resets
- Subscription expirations and grace periods
- Scheduled downgrades
- Expired generation cleanup
- Expired bonus credit cleanup
- Old webhook cleanup
- Renewal reminder emails (30-day and 7-day)

### Hourly Tasks (`/api/cron/hourly-tasks`)
Runs every hour:
- **Webhook processing** (sends queued events to external systems like Zapier/HubSpot)

### Running Locally

```bash
# Start dev server first
npm run dev

# In another terminal, run cron jobs
./scripts/run-cron-local.sh          # daily (default)
./scripts/run-cron-local.sh daily    # daily tasks
./scripts/run-cron-local.sh hourly   # hourly tasks (webhooks)
```

### Production

Trigger via HTTP POST with `Authorization: Bearer YOUR_CRON_SECRET`:
- Daily: `POST /api/cron/daily-tasks` (schedule: `0 0 * * *`)
- Hourly: `POST /api/cron/hourly-tasks` (schedule: `0 * * * *`)

## Webhooks

Webhooks notify external systems (e.g., Zapier → HubSpot) of key events:

| Event | When |
|-------|------|
| `new_user_registered` | User signs up for the first time |
| `new_org_created` | New organization created |
| `subscription_requested` | User submits subscription request |
| `subscription_activated` | Admin activates a subscription |
| `maps_depleted` | Org exhausts quota + bonus credits |
| `professional_at_limit` | Professional tier org hits limit |

Configure with `WEBHOOK_URL` and `WEBHOOK_SECRET` environment variables. Webhooks are queued and processed by the hourly cron job in batches of 10 with rate limiting.

## License

Source code is released under the [MIT License](LICENSE).

The following are **not** covered by the MIT License:

- **Legal pages** — the Terms of Service, Privacy Policy, and Cookie Policy (`src/app/(public)/terms`, `privacy`, `cookies`) are specific to the hosted service run by Moravec Labs, LLC dba dymaptic. If you run your own instance, replace them with your own.
- **Trademarks** — the dymaptic name, logos, and brand assets (including the images in `public/images/` and the favicons in `public/`) are trademarks of Moravec Labs, LLC dba dymaptic and may not be used to imply endorsement or to brand a derived service.
