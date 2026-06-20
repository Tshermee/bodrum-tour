# Bodrum Tour — Project Guide

A Goosechase-style, self-guided walking-tour PWA for Bodrum, Turkey. Players pick
a tour, walk to GPS-gated stops, and solve a challenge at each one. There's a
separate admin SPA for managing tours, stops, purchases, analytics, and content.

## Stack

- **React 18 + Vite 5 + TailwindCSS 3** SPA. No SSR.
- **i18next** — 4 languages: `en`, `de`, `tr`, `fr` (detection via localStorage key `bodrum-lang`).
- **react-leaflet + leaflet-rotate** for maps (CartoDB dark/light tiles).
- **Supabase** — Postgres + Storage + Auth + RLS. Project ref `bkipxsboxfqmknhasyop` (eu-central-1), already linked to the CLI.
- **PWA** via `vite-plugin-pwa` (Workbox: offline-first static, NetworkFirst for Supabase API).
- **recharts** for admin analytics.
- Deployed to **GitHub Pages** (base path `/bodrum-tour/`) via **GitHub Actions** on push to `main`.

## Layout

```
src/
  App.jsx                  Root state machine: screens welcome→tourSelect→hub→mission→completion.
                           Progress lives in localStorage (bodrum-*-v2 keys); Supabase sync is fire-and-forget.
  components/screens/      WelcomeScreen, TourSelectScreen, MissionHubScreen, MissionScreen, CompletionScreen
  components/challenges/   PhotoChallenge, RiddleChallenge, CodeChallenge, MultipleChoiceChallenge, ImageHuntChallenge
  components/ui/           MapView (leaflet), PurchaseModal, RewardsModal, SuccessOverlay, LanguageSelector
  lib/api.js               ALL Supabase data access + the transform layer (see below)
  lib/supabase.js          Client init: `supabase` (anon) and `supabaseAdmin` (service role)
  hooks/                   useGeolocation, useDeviceHeading, useMapTheme, useLocalStorage
  i18n/locales/            en.json, de.json, tr.json, fr.json  ← update ALL FOUR when adding UI strings
  admin/                   Admin SPA: AdminApp (routes), AdminLayout, pages/{Dashboard,Tours,TourEdit,
                           Stops,StopEdit,Purchases,Analytics,SkipReports,WelcomeConfig}
supabase/migrations/       Numbered SQL (001…). Apply with `supabase db push`.
```

### The transform layer (`lib/api.js`)
DB rows are converted to the app's shape by `transformStop(stop, tour, lang)` and
`transformTour(raw, lang)`. This is where DB columns map to UI props and where
per-language overrides (`translations` JSONB) are applied. **When you add a
stop/tour field that the player UI needs, wire it through these transforms** —
the components never read raw DB rows.

### Challenge component contract
Every challenge component takes the same props:
`{ challenge, isCompleted, accentColor, gradient, onComplete }`, and calls
`onComplete(photoThumb, penalty)`. `challenge.type` is one of
`photo | riddle | code | multiple_choice | image_hunt`.

## Data model essentials

- **tours**: `tour_type` (`'sequential'` | `'free_roam'`), `translations` JSONB,
  `published`, `preview_token`, `bypass_gps`, `cover_image_url`, `show_cover_image`,
  gradient/accent colors, `price`, `tags`, `sort_order`.
- **tour_stops**: `order_index` (this is the in-app mission id), `challenge_type`,
  `challenge_prompt` / `challenge_answer` / `challenge_hint`, `challenge_options`
  (newline-separated for multiple_choice), `photo_url`, `audio_url`,
  `translations` JSONB, `show_photo`, `lat`/`lng`, `points`.
- **purchases**, **tour_progress**, **stop_progress**, **skip_reports**.
- **app_config**: `key` PK + `data` JSONB (e.g. key `'welcome'` for the editable welcome screen).

## Conventions & gotchas (read before changing schema)

- **Two Supabase clients**: `supabase` = anon (public reads, RLS applies);
  `supabaseAdmin` = service role (admin writes, **bypasses RLS**). Admin pages use `supabaseAdmin`.
- **A 400 on a PostgREST embed** (e.g. `select=*,tours(name)`) almost always means a
  **missing foreign key**, not an RLS problem. RLS returns 200-with-empty or 401/403.
- **Never rely on an inline FK inside `CREATE TABLE IF NOT EXISTS`.** If the table
  already exists on remote, the statement is a no-op and the FK is silently never
  added (this caused the skip_reports 400). Add FKs/columns in their own
  idempotent `ALTER`, guarded by an `IF NOT EXISTS (SELECT 1 FROM pg_constraint …)`
  check, and `NOTIFY pgrst, 'reload schema';` after relationship changes.
- **Sequential vs free_roam**: `buildDefaultMissions` in `App.jsx` unlocks only the
  first stop for `sequential`, all stops for `free_roam`. Free-roam has no fixed
  "next" — the hub lets the player pick any unlocked stop.
- **Riddle / image_hunt answer matching**: pipe-separated multi-answers
  (`doorhandle|door handle`) with Levenshtein ≤1 typo tolerance for words ≥5 chars
  (see `RiddleChallenge.jsx`).
- **The user tests the LIVE GitHub Pages site, not local dev.** Code changes aren't
  visible until pushed and the Action finishes (~1–2 min).
- **The Supabase MCP server is unauthorized in this environment** — use the
  `supabase` CLI for everything (`supabase db push`, `supabase projects list`).
- **i18n**: every new UI string must be added to all four locale JSON files.

## Commands

```bash
npm run dev                 # local dev server
npm run build               # production build — run this to verify before pushing
supabase db push            # apply new migrations in supabase/migrations/ to remote
```

## Deploy flow

1. **Schema change?** Add `supabase/migrations/NNN_short_name.sql` (next number), then `supabase db push`.
2. `npm run build` to confirm it compiles.
3. `git add … && git commit && git push` to `main`. GitHub Actions runs
   `npm ci --legacy-peer-deps && npm run build` and deploys to Pages.
4. Quick REST sanity check (relationships, RLS) — curl with the anon creds from `.env`:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" \
     "$VITE_SUPABASE_URL/rest/v1/<table>?select=*&limit=1" \
     -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY"
   ```
