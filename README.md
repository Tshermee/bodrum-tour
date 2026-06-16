# Bodrum Tour

A Goosechase-style self-guided tour app for Bodrum, Turkey — built with React + Vite + Tailwind + Supabase.

## Features

- **5 tours** with 30+ stops — history, food, photography, coastal, ancient
- **3 challenge types** — photo upload, riddle, code
- **Offline-first** gameplay — all state persisted in localStorage, synced to Supabase in background
- **Admin panel** at `/bodrum-tour/admin` — full CRUD for tours & stops, photo upload, purchase tracking, analytics
- **Analytics** — completion rates, revenue, stop-level drop-off charts

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Maps | React-Leaflet (CartoDB dark tiles) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Charts | Recharts |
| Routing (admin) | React Router v6 |

---

## Local Development

```bash
# 1. Clone and install
git clone https://github.com/Tshermee/bodrum-tour.git
cd bodrum-tour
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_SERVICE_ROLE_KEY

# 3. Run migrations (against your Supabase project)
# Paste supabase/migrations/001_initial_schema.sql into the Supabase SQL editor
# Then paste 002_seed_tours.sql for sample data

# 4. Start dev server
npm run dev

# App:   http://localhost:5173/bodrum-tour/
# Admin: http://localhost:5173/bodrum-tour/admin
```

---

## Supabase Setup

### New project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
3. (Optional) Run `supabase/migrations/002_seed_tours.sql` for sample tours
4. Go to **Storage** → create a public bucket named `tour-media`
5. Go to **Authentication → Users** → create your admin user
6. In SQL Editor: `INSERT INTO admin_users (id) VALUES ('<your-user-uuid>');`
7. Copy your project URL + anon key + service_role key into `.env.local`

### Environment variables

```
VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> ⚠️ The service role key bypasses RLS — it's only used by the admin panel. Keep `.env.local` out of git (it's in `.gitignore`).

---

## Admin Panel

Navigate to `/bodrum-tour/admin` and sign in with your admin email/password.

| Section | What you can do |
|---|---|
| **Dashboard** | KPI overview — revenue, purchases, starts, completion rate |
| **Tours** | Create / edit / delete / publish tours. Set name, price, duration, difficulty, colors, tags |
| **Stops** | Reorder stops, edit GPS coordinates, upload photos, set challenge type + answer + hint |
| **Purchases** | Full purchase list with email, team, tour, amount. Export to CSV |
| **Analytics** | Revenue by tour, completion rates, purchase share pie, per-stop drop-off line chart |

---

## Database Schema

```
tours            — tour metadata (price, colors, tags, etc.)
tour_stops       — individual stops with GPS + challenge data
admin_users      — admin user registry
purchases        — who bought which tour (device_id, email, team)
tour_progress    — per-session tour tracking
stop_progress    — per-stop completion with timestamps

views:
  tour_stats          — revenue, purchase count, completion rate per tour
  stop_dropoff_stats  — per-stop attempt/completion counts + drop-off %
```

---

## React Native / Offline Strategy (Roadmap)

The app is designed for easy offline-first React Native migration:

1. **On tour purchase**: download full tour JSON + images to device storage
2. **During play**: all progress tracked locally (no internet required)  
3. **On completion**: sync `stop_progress` and `tour_progress` to Supabase
4. Works in caves, narrow alleys, dead-zones — exactly what guided tours need

---

## Deployment

```bash
npm run build
# Deploy dist/ to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages)
```

For GitHub Pages, the base path `/bodrum-tour/` is already set in `vite.config.js`.

---

## Active Supabase Project

- **Project**: `bodrum-tour`  
- **Region**: `eu-central-1`  
- **URL**: `https://bkipxsboxfqmknhasyop.supabase.co`
- **Admin login**: `marco.cermusoni@bossinfo.ch` / `BodrumAdmin2026!`
