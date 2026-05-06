# BookMe

A mobile-first freelancer booking platform. Freelancers get a shareable public page where clients can browse services, pick available dates and times, and submit booking requests — no client account required.

---

## Quick Start

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, then grab your credentials from **Settings → API**:
- `Project URL`
- `anon public` key

### 2. Run the database migration

Open the **SQL Editor** in your Supabase dashboard and paste the contents of:

```
supabase/migrations/001_initial.sql
```

Run it. This creates all 5 tables with RLS policies.

### 3. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Enable magic-link auth in Supabase

In your Supabase dashboard: **Authentication → Providers → Email**
- Make sure "Enable Email provider" is on
- "Confirm email" can be off for faster dev experience

Add your redirect URL: **Authentication → URL Configuration**
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

### 5. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Magic-link sign in |
| `/dashboard` | Freelancer dashboard (protected) |
| `/u/[username]` | Public booking page |

---

## Dashboard Tabs

| Tab | What you can do |
|-----|----------------|
| **Requests** | View, approve, or reject incoming booking requests |
| **Services** | Add service offerings with title, description, duration, price |
| **Availability** | Toggle days on/off and set working hours per weekday |
| **Profile** | Set your name, username, bio, avatar URL, and skills |

---

## How it works

1. **Freelancer** signs in → sets up profile with username → defines services and weekly availability
2. **Freelancer** shares their public link: `yourdomain.com/u/username`
3. **Client** opens the link (no account needed) → picks a date, duration, start time, and service → submits request
4. **Freelancer** approves or rejects in dashboard → approved bookings block those slots from future requests
5. **Client** can leave a review after an approved session by entering their booking email

---

## Tech Stack

- **Next.js 15** (App Router, Server Actions)
- **Supabase** (Auth, PostgreSQL, Row Level Security)
- **Tailwind CSS** (custom CSS variable theme system)
- **TypeScript**
- **Lucide React** (icons)

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel
```

In the Vercel dashboard, add your three env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (set to your Vercel domain, e.g. `https://bookme.vercel.app`)

Then update your Supabase redirect URLs to include your production domain.

---

## Data Model

```
profiles           — freelancer identity + public profile
availability_slots — weekly recurring windows (day_of_week + start/end time)
service_offerings  — title, duration, price, description per freelancer
booking_requests   — pending/approved/rejected, with date + time + duration
reviews            — rating + comment tied to an approved booking
```

---

## Recommended Next Steps (from PRD)

- [ ] Add `completed` status to booking lifecycle
- [ ] Tighten review eligibility to `completed` (not just `approved`) bookings
- [ ] Optional email notifications on request created / approved / rejected
- [ ] Timezone support per freelancer
- [ ] Google/Apple/Outlook calendar sync
