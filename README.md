# Traders Scheeme

Trading bots and analysis tools on Deriv, at **https://traderscheem.com**: a visual bot
builder (Blockly), free bots, auto and bulk trading, copy trading, the market scanner and
analysis tool, and a built-in Manual Trader in the style of Deriv Trader. Every login,
quote and trade goes through the Traders Scheeme Deriv app id.

Support is by WhatsApp only: **+254741030460** (header button and landing page).

Built with [Rsbuild](https://rsbuild.dev) + React Router as a single-page app.

## Settings

The live values are in `.env.production` (all of them end up in the browser bundle, so
none is secret):

| Variable | Value | What it does |
|---|---|---|
| `NEXT_PUBLIC_DERIV_APP_ID` | `34AhEfRe2X1oVGu2p3e0J` | Deriv app id for OAuth login/sign-up and the trading socket. |
| `NEXT_PUBLIC_DERIV_APP_NAME` | `Traders Scheeme` | App name in the header, tab title, splash and landing page. |
| `NEXT_PUBLIC_DERIV_REFERRAL_LINK` | `https://t.deriv.link?t=63PLZ8T6L73Q` | Sign-up referral link; its `t=` code is sent with every sign-up. |
| `NEXT_PUBLIC_DERIV_ENV` | `production` | Live Deriv endpoints (`staging` for the staging ones). |

These are baked in at **build time** (`rsbuild.config.ts`), so rebuild after changing them.
The WhatsApp number lives in `src/constants/contact.ts`.

### Deriv app settings

In the Deriv app registration for `34AhEfRe2X1oVGu2p3e0J`, the redirect URL must be
exactly:

```
https://traderscheem.com/callback
```

## Local development

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

The app runs at `http://localhost:4003`.

## Hosting

```bash
npm run build
npm start
```

`npm run build` writes the site to `dist/`; `npm start` runs `server.js`, a dependency-free
static server on `$PORT` (default 3000). It answers unknown paths with `index.html` so
Deriv's `/callback` return reaches the app, gzips each asset once and caches hashed assets
for a year.

`railway.json` is set up for Railway (build `npm run build`, start `npm start`). On any
other Node host use the same two commands; on a static host, publish `dist/` and send
unknown paths to `index.html`.

## Google Drive integration (optional)

Saving/loading strategies to Google Drive stays disabled unless `GD_CLIENT_ID`,
`GD_APP_ID`, and `GD_API_KEY` are all set. **If it's not set up in your host
environment yet:**

1. **Get the credentials** — follow Google's [Picker set-up guide](https://developers.google.com/workspace/drive/picker/guides/web-picker#set-up-environment):
   enable the **Google Picker API** + **Drive API**, then create an **OAuth 2.0
   Client ID** (Web application) and an **API key**. Use the project number as `GD_APP_ID`.
2. **Authorize your domain** — add your deployed URL (e.g. `https://your-app.vercel.app`)
   to the OAuth client's **Authorized JavaScript origins** (exact origin; no wildcards).
3. **Set them in your host env — not in source** — add the three vars to your host
   (Vercel → Settings → Environment Variables; Heroku → Settings → Config Vars).
   Don't commit them to the repo.
4. **Rebuild** — they're baked in at build time (`source.define`), so trigger a new build/deploy.

> Deploying via Deriv App Builder? Open your app in **Edit** mode and enter these
> three values — App Builder injects them into your host environment for you
> (never into the app source).

## Branding & White-labeling

Branding (logo, primary color, fonts, app name) is driven by **`brand.config.json`**,
not Next.js config:

- **Colors / fonts / app name** — edit `brand.config.json`, then run
  `npm run generate:brand-css` to bake the values into the theme CSS variables. This
  runs automatically on `npm install`, `npm run dev`, and `npm run build`.
- **Logo** — drop a `public/logo.<png|jpg|jpeg|webp>` to set the header logo; it is also
  used as the favicon. Without it, a letter badge (the app name's first letter) is shown.
- **Theme** — a light/dark toggle lives in the header; the chart re-themes with it.

When assembled by the App Builder, these are configured for you (logo upload, color,
font, and app name are injected at deploy time).
