# Offers site

Public casino-offers comparison site with an admin panel and newsletter signup
that feeds the campaign manager (double opt-in).

```
offers-site/
  backend/   Express 5 + SQLite (better-sqlite3). Serves the API, /go redirects,
             /uploads (logos) and — in production — the built frontend.
  frontend/  Vue 3 + Vite + vue-router. Public site + /admin panel.
```

## Run locally

```bash
cd backend && npm install && cp .env.example .env   # set JWT_SECRET
npm run create-admin -- admin 'a-long-password'
npm run dev                                          # http://127.0.0.1:3010

cd ../frontend && npm install && npm run dev         # http://localhost:5173 (proxies to :3010)
```

Admin panel: `/admin` (add/edit/hide/reorder offers, upload logos, site texts).

## How it works

| URL | What |
|-----|------|
| `/` | Hero, all active offers (search, badge filter, sort), how it works, newsletter |
| `/offers/:slug` | Offer details, terms, "Claim" buttons |
| `/go/:slug` | Counts a claim and 302-redirects to the offer's affiliate URL (user click only) |
| `/confirm?token=` | Newsletter confirmation landing page |
| `/info/:page` | about, affiliate-disclosure, responsible-gambling, privacy, terms |
| `/admin` | Admin panel (JWT, 12h sessions) |

Affiliate URLs are never sent to the browser — only `/go/:slug` knows them.
Hidden offers disappear from the site and their `/go` link redirects home.

### Newsletter (double opt-in)

1. Visitor submits email + 18+/consent checkbox → `POST /api/subscribe`
   (rate-limited, honeypot field against bots).
2. Backend forwards to the controller `POST /api/public/subscribe` with header
   `X-Site-Key: $CONTROLLER_SITE_KEY`. The controller queues ONE confirmation email.
3. Visitor clicks the link → `/confirm?token=…` → controller `POST /api/public/confirm`
   → contact created/updated and added to the **Website subscribers** group.

Nothing enters the contacts list until the email owner confirms.

## Configuration

Offers site `backend/.env`: see `.env.example` (`JWT_SECRET`, `CONTROLLER_URL`,
`CONTROLLER_SITE_KEY`, `DB_PATH`, `TRUST_PROXY`, optional `UPLOAD_DIR`, `FRONTEND_DIST`).

Controller `.env` (mail-campaign-manager backend):

| Variable | Meaning |
|----------|---------|
| `OFFERS_SITE_KEY` | Shared secret; must equal `CONTROLLER_SITE_KEY` here. Unset = API disabled |
| `OFFERS_SITE_URL` | Public URL of this site (confirmation links point to `/confirm`) |
| `OFFERS_SITE_NAME` | Name used in the confirmation email |
| `OFFERS_CONFIRM_IDENTITY_ID` | Sender identity id that sends confirmation emails |
| `OFFERS_SUBSCRIBERS_GROUP` | Group name (default `Website subscribers`) |

## Production

```bash
cd frontend && npm ci && npm run build      # → frontend/dist, served by the backend
cd ../backend && npm ci --omit=dev && pm2 start index.js --name offers-site
```

nginx: proxy the site's domain to `127.0.0.1:3010`, TLS via certbot. Use a domain
that is **not** one of the mail sending domains.

## Tests

`cd backend && npm test` — API end-to-end tests (in-memory DB, controller mocked).

## SEO

`backend/services/seo.js` (wired in `backend/app.js`):
- `GET /robots.txt` (text/plain) and `GET /sitemap.xml` (application/xml). The sitemap is built from the DB on every request: `/`, every **active** offer `/offers/<slug>` (lastmod = `updated_at`) and the `/info/*` pages. Admin, API, `/go/`, `/confirm` and 404s are left out.
- The SPA fallback rewrites `index.html` per URL to set a unique `<title>`, meta description, canonical link and og tags. `/admin*`, `/confirm` and unknown URLs get `noindex`. Unknown URLs and unknown offers return a real **404**.
- Each page's real content (h1, offer text, terms, facts, links to every offer and info page) is rendered into `<div id="app">` so crawlers see it without JS; Vue replaces it on mount. JSON-LD: WebSite + ItemList (home), BreadcrumbList (offer/info pages). og:image = offer logo when set.
- `index.html` is read once at startup, so **restart pm2 after a frontend rebuild**.
- The `INFO_PAGES` titles in seo.js must stay in sync with `frontend/src/views/InfoView.vue`. The base URL comes from `SITE_URL` (default https://noradion.org).
