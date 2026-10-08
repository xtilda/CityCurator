# City Curator

An Istanbul culture planner: explore official event listings, build a day around a screening or performance, and connect it with nearby cultural stops.

## Features

- Event search by category, date, neighborhood, source and free admission.
- Monthly calendar, source freshness information and links to official listings.
- Personal day plans with walking estimates, time conflict checks and calendar export.
- Curated city walks, interactive Leaflet maps and publicly published community routes.
- Editorial interface in Turkish, designed for Istanbul visitors and residents.

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Leaflet and Neon PostgreSQL. This export uses standard Next.js, with no Cloudflare D1, Wrangler, Vinext or ChatGPT authentication requirement.

## Local development

Use Node.js 22.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `DATABASE_URL` to a Neon PostgreSQL connection string and run `migrations/001_initial.sql` once in Neon SQL Editor. Do not commit `.env.local`.

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm start
```

## Vercel

1. Push the **contents** of this folder to a GitHub repository. `package.json` must be at the repository root.
2. Import the repository into Vercel; choose **Next.js**, root `./`, Node.js **22.x**. Keep the default install, build and output settings.
3. Add `DATABASE_URL` for Production and Preview; use Neon's pooled connection string.
4. Run `migrations/001_initial.sql` in the Neon database used by this project, then deploy.
5. Future commits to the production branch deploy automatically.

See [VERCEL-KURULUM-TR.md](VERCEL-KURULUM-TR.md) for beginner-friendly instructions. A database-free deployment shows curated walks and local planning screens, but the event feed, publishing and server-side saves need Neon.

## Data and identity

Interest preferences, bookmarked events, draft plans and completed day plans use browser `localStorage`. Walk saves use PostgreSQL and an opaque, HttpOnly visitor cookie; its hash identifies the browser. This is **anonymous browser identity**, not a user account or cross-device login. Clearing cookies loses access to previous walk saves. Clearing browser storage removes local plans.

Published walking routes are public. Route publishing is limited to 10 routes per browser per UTC day by an atomic PostgreSQL advisory lock. Cookies can be reset, so this is a light usage limit, not comprehensive abuse protection. There is no moderation dashboard yet.

## Event freshness

Adapters cover Filmekimi, İKSV theatre, Fiba Salon, Kültür İstanbul, İBB Kültür Sanat and Passo. Successfully fetched data is cached in PostgreSQL for six hours. A shared 40-second request budget bounds multi-page source refreshes within the Vercel function duration. Refresh locks prevent simultaneous source refreshes; failed sources retry after 30 minutes, and usable earlier records remain visible with source status.

These adapters depend on third-party page and API structures. They can return no events or fail when upstream pages change or block requests. A live deployment does not guarantee every provider is reachable. Never treat availability or ticket prices as confirmed: consult the official source before travelling or buying.

Walking times are estimates based on coordinates, not a live pedestrian routing service. Plans do not include automatic public transit routing between Istanbul's two shores.

## Validation

Production compilation and TypeScript validation are included in `npm run build`. `npm test` checks Istanbul date boundaries, event deduplication, conflicting sessions, official start times and PostgreSQL schema behavior using PGlite. PGlite validates PostgreSQL SQL locally; it is not a test of a live Neon connection. Lint retains non-blocking warnings for existing browser-state synchronization and image optimization opportunities.

Browser smoke checks also verified the main pages, visitor cookie creation, mobile navigation, absence of horizontal overflow and absence of JavaScript page errors. Live source probes retrieved Salon, Kültür İstanbul and Passo listings; the İBB and Filmekimi adapters failed at the time of testing. A live Neon deployment has not been tested.

## Attribution

Keep `public/PHOTO-CREDITS.txt` with the redistributed photographs. Photo credits also appear in the interface. Map tiles use OpenStreetMap attribution. No affiliation with the listed event providers is implied.
