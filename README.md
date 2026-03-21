# Engagr

Instagram engagement automation for creators and businesses. Turn comments into conversations, automatically.

## What it does

When someone comments on your Instagram post, Engagr automatically:
1. Posts a public reply (e.g., "Check your DMs! 📩")
2. Sends a private DM with a greeting and confirmation button
3. Delivers your content (text, links) after the user confirms
4. Optionally verifies the user follows you before delivering

Also handles reel/post shares via DM, @mentions, and logs all interactions to a dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | JavaScript / React |
| Styling | Tailwind CSS v4 + CSS Custom Properties |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (jose) + bcrypt |
| Hosting | Vercel (serverless) |
| APIs | Instagram Graph API v25.0 |
| OAuth | Instagram Business Login (OAuth 2.0) |
| Webhooks | Meta Webhooks (X-Hub-Signature-256) |
| Icons | Lucide React |
| Notifications | Sonner |
| Cron | Vercel Cron |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Meta Developer account with an app configured for Instagram Business Login
- Instagram Business or Creator account for testing

### 1. Clone and install

```bash
git clone https://github.com/your-username/engagr.git
cd engagr
npm install
```

### 2. Environment variables

Create a `.env.local` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/engagr

# Auth
JWT_SECRET=your-random-jwt-secret-min-32-chars

# Meta / Instagram
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
WEBHOOK_VERIFY_TOKEN=your-custom-webhook-verify-token

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin
ADMIN_KEY=your-secret-admin-key

# Cron
CRON_SECRET=your-random-cron-secret
```

### 3. Meta App Dashboard setup

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Create a new app → Use case: "Other" → App type: "Business"
3. Add the Instagram product
4. Configure Business Login:
   - **Redirect URI:** `http://localhost:3000/api/auth/callback`
   - **Deauthorize callback:** `http://localhost:3000/api/auth/deauthorize`
   - **Data deletion URL:** `http://localhost:3000/api/auth/data-deletion`
5. Configure Webhooks:
   - **Callback URL:** `http://localhost:3000/api/webhook`
   - **Verify token:** same value as `WEBHOOK_VERIFY_TOKEN` in your env
   - Subscribe to: `comments`, `live_comments`, `mentions`, `messages`, `message_reactions`, `messaging_postbacks`, `messaging_referral`
6. Add your Instagram test account under Instagram → API Setup

### 4. Run locally

```bash
npm run dev
```

App runs at `http://localhost:3000`.

For webhook testing locally, use ngrok:

```bash
ngrok http 3000
```

Then update your Meta webhook callback URL to the ngrok URL.

### 5. Deploy to Vercel

```bash
vercel --prod
```

Add all environment variables in Vercel → Settings → Environment Variables. Update your Meta App Dashboard URLs to use your production domain.

## Project Structure

```
engagr/
├── app/
│   ├── (auth)/           # Login, signup pages
│   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── home/         # Overview with stats
│   │   ├── automation/   # Trigger & response config
│   │   ├── contacts/     # User interaction history
│   │   ├── activity/     # Full event log
│   │   └── settings/     # Account & Instagram settings
│   ├── admin/            # Admin dashboard
│   ├── api/
│   │   ├── webhook/      # Meta webhook handler
│   │   ├── auth/         # OAuth callback, deauth, data deletion
│   │   └── cron/         # Token refresh cron
│   └── layout.js         # Root layout with ThemeProvider
├── lib/
│   ├── actions/          # Server Actions (auth, instagram, automation)
│   ├── models/           # Mongoose models (User, Event, ProcessedMid)
│   ├── db.js             # MongoDB connection
│   └── auth.js           # JWT utilities
├── components/
│   ├── ui/               # Reusable UI components
│   ├── ThemeProvider.js   # Light/dark mode context
│   └── Sidebar.js        # Navigation sidebar
└── public/               # Static assets
```

## API Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/webhook` | GET | Meta webhook verification (`hub.verify_token`) |
| `/api/webhook` | POST | Receive & process Instagram webhook events |
| `/api/auth/callback` | GET | Instagram OAuth redirect handler |
| `/api/auth/logout` | GET | Clear auth cookie |
| `/api/auth/deauthorize` | POST | Meta deauthorize callback |
| `/api/auth/data-deletion` | POST | Meta data deletion request |
| `/api/cron/refresh-tokens` | GET | Scheduled token refresh (protected by `CRON_SECRET`) |

## Key Server Actions

| Action | Purpose |
|--------|---------|
| `signUp` | Register new user |
| `signIn` | Authenticate user |
| `getAccountsFromToken` | Exchange Instagram OAuth code for tokens |
| `saveDiscoveredAccount` | Store connected Instagram account |
| `getInstagramAccount` | Fetch account details + recent media |
| `saveAutomation` | Save automation config |
| `toggleAutomation` | Enable/disable automation |
| `deleteAutomation` | Remove automation |
| `getDashboardStats` | Home page stats |
| `getContacts` | Aggregated contact list |
| `getAllInteractions` | Event log with filtering |

## Webhook Processing Flow

```
Instagram Event (comment/DM/mention/share)
    ↓
Meta sends POST to /api/webhook
    ↓
Verify HMAC-SHA256 signature
    ↓
Parse event type (comment, messaging, mention)
    ↓
Look up user in MongoDB by Instagram ID
    ↓
Check deduplication (Event collection + ProcessedMid)
    ↓
Run automation logic:
  - Comment → public reply + DM flow
  - Postback → follower check / content delivery
  - Reel share → auto-reply with metadata
  - Mention → reply to mention
    ↓
Log event to MongoDB
```

## Token Lifecycle

1. **OAuth:** User connects → short-lived token received
2. **Exchange:** Short-lived → long-lived token (60-day expiry)
3. **Storage:** Token saved to MongoDB (server-side only)
4. **Auto-refresh:** Vercel Cron hits `/api/cron/refresh-tokens` before expiry
5. **Inline refresh:** If token expires mid-operation, system attempts refresh
6. **Failure:** If refresh fails, user is marked as disconnected and notified

## Deduplication

Two layers prevent duplicate responses:

1. **Event-level:** Before processing a comment, check if an Event document with matching `commentId` and status `sent` or `skipped` already exists
2. **Atomic mid-level:** For DMs, use `findOneAndUpdate` with `upsert: true` on the `ProcessedMid` collection to prevent race conditions from duplicate webhook deliveries

## Design System

Deep Indigo theme with full light/dark mode:

| Token | Light | Dark |
|-------|-------|------|
| Primary | `#4338CA` | `#818CF8` |
| Accent | `#14B8A6` | `#2DD4BF` |
| Background | `#FAFAFA` | `#09090B` |
| Card | `#FFFFFF` | `#18181B` |
| Sidebar | `#1E1B4B` | `#0F0D2B` |

Theme toggle persists to `localStorage` with system preference fallback.

## Admin Dashboard

Access at `/admin` with the `ADMIN_KEY` environment variable:

- User management (view all users, delete with cascade)
- Global stats (total users, connected accounts, active automations, events today)
- Recent events feed across all users
- Independent light/dark mode

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (min 32 chars) |
| `META_APP_ID` | Yes | Meta app ID from developer dashboard |
| `META_APP_SECRET` | Yes | Meta app secret |
| `INSTAGRAM_APP_ID` | Yes | Instagram app ID |
| `INSTAGRAM_APP_SECRET` | Yes | Instagram app secret |
| `WEBHOOK_VERIFY_TOKEN` | Yes | Custom string for webhook verification |
| `NEXT_PUBLIC_APP_URL` | Yes | Your app's public URL |
| `ADMIN_KEY` | Yes | Secret key for admin dashboard access |
| `CRON_SECRET` | Yes | Secret for protecting cron endpoints |

## License

Proprietary. All rights reserved.
