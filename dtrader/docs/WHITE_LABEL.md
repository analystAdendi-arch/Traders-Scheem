# White-Labeling Guide

This guide walks you through forking this repo and replacing the Deriv brand with your own — with **no source code changes required**.

---

## Quick Start (5 steps)

### 1. Fork and clone

```sh
git clone https://github.com/YOUR_ORG/dtrader-template.git
cd dtrader-template
npm run bootstrap
```

### 2. Edit `brand.config.json`

This is the **only config file you need to touch**. Update these fields:

```json
{
  "brand_name": "Your Company",
  "brand_logo": "brand/brand-logo.svg",
  "brand_logo_dark": "brand/brand-logo-dark.svg",
  "brand_domain": "yourdomain.com",
  "brand_hostname": {
    "staging": "staging.yourplatform.yourdomain.com",
    "production": "yourplatform.yourdomain.com"
  },
  "platform": {
    "name": "Your Platform Name",
    "description": "Your platform description for SEO and meta tags.",
    "logo": "brand/platform-logo.svg",
    "home_url": "https://home.yourdomain.com/dashboard",
    "help_centre_url": "https://yourdomain.com/help"
  },
  "signup_url": {
    "staging": "https://staging-home.yourdomain.com/dashboard/signup",
    "production": "https://home.yourdomain.com/dashboard/signup"
  },
  "deposit_url": {
    "staging": "https://staging.yourplatform.yourdomain.com/transfer",
    "production": "https://yourplatform.yourdomain.com/transfer"
  },
  "auth": {
    "staging": "https://staging-auth.deriv.com",
    "production": "https://auth.deriv.com",
    "oauth_scopes": ["read", "trade", "account_manage"],
    "oauth_redirect_uri_staging": "https://staging.yourplatform.yourdomain.com",
    "oauth_redirect_uri_production": "https://yourplatform.yourdomain.com",
    "oauth_app_id": ""
  },
  "derivws": {
    "staging": "https://staging-api.derivws.com/trading/v1/",
    "production": "https://api.derivws.com/trading/v1/"
  },
  "api_core": {
    "staging": "staging-api-core.deriv.com",
    "production": "api-core.deriv.com"
  },
  "api": {
    "staging": "staging-api.deriv.com",
    "production": "api.deriv.com"
  },
  "app_id": {
    "staging": YOUR_STAGING_APP_ID,
    "production": YOUR_PRODUCTION_APP_ID
  },
  "colors": {
    "primary": "#your-primary-color",
    "secondary": "#your-secondary-color",
    ...
  },
  "features": {
    "dark_mode": false,
    "language_switcher": false
  }
}
```

> **Note:** `auth`, `api_core`, `api`, and `derivws` endpoints connect to the Deriv trading API. Leave these as-is unless you are running your own backend infrastructure.
>
> **`OAUTH_CLIENT_ID` is not in `brand.config.json`** — it must be set as an environment variable (GitHub Actions secret or local `.env` file). See [Getting a Deriv OAuth Client ID](#getting-a-deriv-oauth-client-id) below.

### 3. Replace logo files in `assets/brand/`

Drop your SVG logo files into the `assets/brand/` directory:

| File                  | Purpose                   |
| --------------------- | ------------------------- |
| `brand-logo.svg`      | Header logo — light theme |
| `brand-logo-dark.svg` | Header logo — dark theme  |
| `platform-logo.svg`   | Platform icon (square)    |

See [Logo Requirements](#logo-requirements) below.

### 4. Regenerate color tokens

```sh
npm run generate:colors
```

This reads your colors from `brand.config.json` and regenerates all SCSS token files automatically.

### 5. Validate, build, and verify

```sh
# Validate your config
npm run verify:whitelabel

# Build everything
npm run build:all

# Start the dev server
npm run serve core
# → https://localhost:8443
```

---

## brand.config.json Reference

| Field                                | Type       | Required | Description                                                                                                                                                                                                                                             |
| ------------------------------------ | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `brand_name`                         | string     | ✅       | Your company/brand name. Appears in page title, meta tags, manifest.                                                                                                                                                                                    |
| `brand_logo`                         | string     | ✅       | Path to light-theme SVG logo (relative to site root, e.g. `brand/brand-logo.svg`).                                                                                                                                                                      |
| `brand_logo_dark`                    | string     | ✅       | Path to dark-theme SVG logo. Falls back to `brand_logo` if omitted.                                                                                                                                                                                     |
| `brand_domain`                       | string     | ✅       | Your production domain (e.g. `yourdomain.com`). Used for environment detection and security checks.                                                                                                                                                     |
| `brand_hostname.staging`             | string     | ✅       | Staging platform hostname — also used as the OAuth redirect URI for staging.                                                                                                                                                                            |
| `brand_hostname.production`          | string     | ✅       | Production platform hostname — used as canonical URL and OAuth redirect URI.                                                                                                                                                                            |
| `platform.name`                      | string     | ✅       | Platform display name (e.g. `"Derivatives Trader"`).                                                                                                                                                                                                    |
| `platform.description`               | string     | ✅       | Short description used in `<meta name="description">` and OG tags.                                                                                                                                                                                      |
| `platform.logo`                      | string     | ✅       | Path to platform icon SVG (square, used in platform config).                                                                                                                                                                                            |
| `platform.home_url`                  | string     | ✅       | URL the Home button in the sidebar navigates to.                                                                                                                                                                                                        |
| `platform.help_centre_url`           | string     | ✅       | URL for your help/support page.                                                                                                                                                                                                                         |
| `signup_url.staging`                 | string     | —        | Staging signup page URL. Used by the signup button when present.                                                                                                                                                                                        |
| `signup_url.production`              | string     | —        | Production signup page URL.                                                                                                                                                                                                                             |
| `deposit_url.staging`                | string     | ✅       | Staging deposit/transfer page URL. Used by the Deposit button in the account header.                                                                                                                                                                    |
| `deposit_url.production`             | string     | ✅       | Production deposit/transfer page URL.                                                                                                                                                                                                                   |
| `auth.staging`                       | string     | ✅       | Auth service base URL for staging.                                                                                                                                                                                                                      |
| `auth.production`                    | string     | ✅       | Auth service base URL for production.                                                                                                                                                                                                                   |
| `auth.oauth_scopes`                  | string[]   | ✅       | OAuth2 scopes to request (e.g. `["read", "trade", "account_manage"]`).                                                                                                                                                                                  |
| `auth.oauth_redirect_uri_staging`    | string     | ✅       | OAuth2 redirect URI for staging — must match your app registration exactly.                                                                                                                                                                             |
| `auth.oauth_redirect_uri_production` | string     | ✅       | OAuth2 redirect URI for production — must match your app registration exactly.                                                                                                                                                                          |
| `auth.oauth_app_id`                  | string     | —        | Your **Deriv API v1 app ID** (from [developers.deriv.com](https://developers.deriv.com)). When set, it is appended as `app_id=` to the OAuth2 authorize URL. Leave empty if you do not have one. This is separate from `app_id` (the WebSocket app ID). |
| `derivws.staging`                    | string     | ✅       | DerivWS WebSocket API base URL for staging.                                                                                                                                                                                                             |
| `derivws.production`                 | string     | ✅       | DerivWS WebSocket API base URL for production.                                                                                                                                                                                                          |
| `api_core.staging`                   | string     | ✅       | API core hostname for staging WebSocket connections.                                                                                                                                                                                                    |
| `api_core.production`                | string     | ✅       | API core hostname for production WebSocket connections.                                                                                                                                                                                                 |
| `api.staging`                        | string     | ✅       | REST API hostname for staging.                                                                                                                                                                                                                          |
| `api.production`                     | string     | ✅       | REST API hostname for production.                                                                                                                                                                                                                       |
| `app_id.staging`                     | number     | ✅       | Your Deriv API app ID for staging.                                                                                                                                                                                                                      |
| `app_id.production`                  | number     | ✅       | Your Deriv API app ID for production.                                                                                                                                                                                                                   |
| `colors.primary`                     | hex string | ✅       | Main brand color — buttons, links, highlights.                                                                                                                                                                                                          |
| `colors.secondary`                   | hex string | ✅       | Secondary accent color.                                                                                                                                                                                                                                 |
| `colors.tertiary`                    | hex string | ✅       | Tertiary accent color.                                                                                                                                                                                                                                  |
| `colors.success`                     | hex string | ✅       | Success/buy state color.                                                                                                                                                                                                                                |
| `colors.danger`                      | hex string | ✅       | Danger/sell/error state color.                                                                                                                                                                                                                          |
| `colors.warning`                     | hex string | ✅       | Warning state color.                                                                                                                                                                                                                                    |
| `colors.info`                        | hex string | ✅       | Info state color.                                                                                                                                                                                                                                       |
| `colors.neutral`                     | hex string | ✅       | Neutral/muted color.                                                                                                                                                                                                                                    |
| `colors.black`                       | hex string | ✅       | Darkest text/background color.                                                                                                                                                                                                                          |
| `colors.white`                       | hex string | ✅       | Lightest text/background color.                                                                                                                                                                                                                         |
| `color_variants.auto_generate`       | boolean    | —        | Auto-generate light/dark color variants. Default: `true`.                                                                                                                                                                                               |
| `color_variants.lighten_percentage`  | number     | —        | How much to lighten generated variants. Default: `10`.                                                                                                                                                                                                  |
| `color_variants.darken_percentage`   | number     | —        | How much to darken generated variants. Default: `10`.                                                                                                                                                                                                   |
| `features.dark_mode`                 | boolean    | —        | Show/hide the dark mode toggle in the sidebar and mobile menu. Default: `false`.                                                                                                                                                                        |
| `features.language_switcher`         | boolean    | —        | Show/hide the language switcher in the sidebar and mobile menu. Default: `false`.                                                                                                                                                                       |

---

## Logo Requirements

### Brand SVG logos (`assets/brand/`)

These are automatically copied into the build by webpack and referenced from `brand.config.json`.

| File                  | Dimensions           | Format | Notes                                                   |
| --------------------- | -------------------- | ------ | ------------------------------------------------------- |
| `brand-logo.svg`      | 200×48px recommended | SVG    | Transparent background, optimized for light backgrounds |
| `brand-logo-dark.svg` | 200×48px recommended | SVG    | Transparent background, optimized for dark backgrounds  |
| `platform-logo.svg`   | 64×64px recommended  | SVG    | Square icon                                             |

### PWA icons (`packages/core/src/public/images/common/logos/platform_logos/`)

These are the homescreen icons used when the app is installed as a PWA. The default files are named `ic_platform_deriv_NxN.png` — replace all of them with your own brand icons at the same sizes:

| File                            | Size    |
| ------------------------------- | ------- |
| `ic_platform_deriv_72x72.png`   | 72×72   |
| `ic_platform_deriv_96x96.png`   | 96×96   |
| `ic_platform_deriv_144x144.png` | 144×144 |
| `ic_platform_deriv_192x192.png` | 192×192 |
| `ic_platform_deriv_256x256.png` | 256×256 |
| `ic_platform_deriv_384x384.png` | 384×384 |
| `ic_platform_deriv_512x512.png` | 512×512 |

You can keep the same filenames or rename them — if you rename, update `manifest.json` icon `src` paths to match.

> `npm run verify:whitelabel` will warn if any `ic_platform_deriv_*` files are still present.

### Favicons (`packages/core/src/public/images/favicons/`)

Replace the PNG files at the required sizes: 16, 32, 96, 160, 192px (favicon) and 57, 60, 72, 76, 114, 120, 144, 152, 180px (apple-touch-icon).

---

## Getting a Deriv Developers App ID

The platform connects to the Deriv trading API via WebSocket. To avoid sharing the default `app_id`:

1. Go to [https://developers.deriv.com](https://developers.deriv.com) and log in
2. Click **Register new application**
3. Set the **OAuth Redirect URL** to your platform hostname (e.g. `https://trader.yourdomain.com`)
4. Copy the generated `App ID`
5. Set it in `brand.config.json` under `app_id.staging` and `app_id.production`

---

## Getting a Deriv OAuth Client ID

The platform uses OAuth2 with PKCE for authentication. You need a client ID issued by Deriv — this is separate from the App ID above.

1. Contact Deriv to register your OAuth2 client application
2. Provide your redirect URIs (must match `auth.oauth_redirect_uri_staging` and `auth.oauth_redirect_uri_production` in `brand.config.json`)
3. Receive your `client_id`

**Set it as an environment variable — never put it in `brand.config.json` or commit it to git:**

```sh
# Local development — add to a .env file in the repo root (already in .gitignore)
OAUTH_CLIENT_ID=your_client_id_here

# GitHub Actions — add as a repository secret named OAUTH_CLIENT_ID
# Settings → Secrets and variables → Actions → New repository secret
```

The webpack build injects it at build time via `DefinePlugin`. The app will throw an explicit error on startup if the variable is missing, so missing configuration is caught immediately.

---

## Setting Up Translations (Optional)

By default the app ships with English only, loaded from bundled locale files. To support multiple languages with dynamic loading from a CDN, you need to host translation files and point the build at them.

### How it works

The app uses [`@deriv-com/translations`](https://github.com/deriv-com/translations) for i18n. At startup it calls `initializeI18n({ cdnUrl })` — if `cdnUrl` is empty, only the bundled locale is used. If a URL is provided, it fetches translation JSON files from `{cdnUrl}/{language}.json`.

### Setting up your own translation CDN

1. **Get the source translation strings** — the translatable strings are extracted from the source code at build time. Run:

    ```sh
    npm run extract-translations  # generates a .pot or JSON source file
    ```

2. **Translate the strings** — you can use any translation platform (Crowdin, Lokalise, Phrase, etc.) or manage JSON files manually. The expected format per language is a flat key→value JSON file, e.g.:

    ```json
    { "Buy": "Kaufen", "Sell": "Verkaufen" }
    ```

3. **Host the translated files** — upload the per-language JSON files to any CDN or static hosting (Cloudflare R2, AWS S3, etc.) at a path like:

    ```
    https://cdn.yourdomain.com/translations/de.json
    https://cdn.yourdomain.com/translations/fr.json
    ```

4. **Set the CDN base URL** — add `TRANSLATIONS_CDN_URL` as a GitHub Actions variable (not a secret — it is not sensitive):
    ```
    # GitHub Actions → Settings → Variables → Actions → New repository variable
    Name:  TRANSLATIONS_CDN_URL
    Value: https://cdn.yourdomain.com/translations
    ```
    For local development, add it to your `.env` file:
    ```sh
    TRANSLATIONS_CDN_URL=https://cdn.yourdomain.com/translations
    ```

The webpack build injects this value at build time. If the variable is not set, the app silently falls back to the bundled English locale — no error, no broken build.

---

## Color Customization

The color pipeline works as follows:

1. You set hex values in `brand.config.json` → `colors`
2. Running `npm run generate:colors` reads those values and auto-generates:
    - `packages/shared/src/styles/constants/colors.scss` — SCSS variables (`$color-primary`, etc.)
    - `packages/shared/src/styles/tokens/brand.scss` — CSS custom properties (`--brand-primary`, etc.)
    - `packages/shared/src/styles/tokens/semantic.scss` — Semantic tokens for light/dark themes
    - `packages/shared/src/styles/tokens/components.scss` — Component-level tokens

**Never edit generated files directly** — your changes will be overwritten on the next `generate:colors` run.

The `color_variants.auto_generate: true` option creates lighter and darker variants of each color automatically (controlled by `lighten_percentage` and `darken_percentage`).

---

## External Dependencies

This platform uses several `@deriv-com/*` packages that are open source. Forkers inherit these:

| Package                           | Purpose                                               |
| --------------------------------- | ----------------------------------------------------- |
| `@deriv-com/translations`         | i18n translation provider and locale loading          |
| `@deriv-com/quill-ui`             | Design system: Quill UI components and theme provider |
| `@deriv-com/smartcharts-champion` | Trading chart library (candlestick, line, etc.)       |

These packages provide the core UI and charting infrastructure. Replacing them would require source code changes beyond the scope of this white-labeling guide.

---

## Logo Rendering

The platform renders your brand logo in two places, both driven by `brand.config.json`:

| Location                                | File                                                                 | Behaviour                                                                                          |
| --------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Sidebar header                          | `packages/trader/src/AppV2/Components/Layout/Sidebar/sidebar.tsx`    | `<img>` — switches between `brand_logo` (light) and `brand_logo_dark` (dark) based on active theme |
| Core package (available for header use) | `packages/core/src/App/Components/Elements/BrandLogo/brand-logo.tsx` | `BrandLogo` observer component — same light/dark switching logic                                   |

**Using the BrandLogo component in core:**

```tsx
import BrandLogo from 'App/Components/Elements/BrandLogo';

// In a header component:
<BrandLogo width={200} height={48} className='header__logo' />;
```

---

## Verification Checklist

Run the automated check first:

```sh
npm run verify:whitelabel
```

Then verify in the browser at `https://localhost:8443`:

- [ ] Page `<title>` shows your platform name and brand name
- [ ] Header logo renders correctly (light theme)
- [ ] Header logo renders correctly (dark theme — toggle via Settings, only visible when `features.dark_mode: true`)
- [ ] Brand colors match your `colors.primary` in buttons and links
- [ ] DevTools → Network → filter "WS" → WebSocket URL is `wss://api.derivws.com/trading/v1/options/ws/...` with an `otp=` query param (authenticated) or ends in `/public` (unauthenticated)
- [ ] Login flow: clicking Login redirects to `https://auth.deriv.com/oauth2/auth?...` with `code_challenge` in the URL
- [ ] `https://localhost:8443/manifest.json` → `name` field shows your `brand_name`
- [ ] View page source → `<meta name="author">` shows your brand name
- [ ] View page source → `<meta name="description">` shows your platform description

---

## Troubleshooting

**Logo not showing after build**

- Confirm SVG files exist in `assets/brand/`
- Run `npm run build:all` to trigger the webpack CopyPlugin
- Check `packages/core/dist/brand/` — your SVG files should appear there

**Colors not updating**

- Run `npm run generate:colors` after editing `brand.config.json`
- Then rebuild: `npm run build:all`

**`OAUTH_CLIENT_ID` error on startup**

- The app throws `OAUTH_CLIENT_ID environment variable is not set` if the variable is missing
- Local dev: add `OAUTH_CLIENT_ID=your_client_id` to a `.env` file in the repo root
- CI/CD: add it as a GitHub Actions repository secret named `OAUTH_CLIENT_ID`
- Never put the client ID in `brand.config.json` — it is intentionally absent from that file

**Login redirects to wrong URL / OAuth callback fails**

- Confirm `auth.oauth_redirect_uri_staging` and `auth.oauth_redirect_uri_production` in `brand.config.json` exactly match the redirect URIs registered with Deriv (including trailing slash if any)
- The redirect URI must point to your **root URL** (e.g. `https://trader.yourdomain.com`), not a `/callback` path
- Check browser DevTools → Application → Session Storage → confirm `oauth_code_verifier` and `oauth_csrf_token` are set before the redirect

**WebSocket connection errors (401/403)**

- Verify your `app_id` is registered at [https://developers.deriv.com](https://developers.deriv.com)
- Confirm the OAuth redirect URL in your app registration matches `auth.oauth_redirect_uri_production` exactly
- Check `brand.config.json` → `app_id.staging` and `app_id.production` match what you registered
- Confirm `OAUTH_CLIENT_ID` is set correctly — a wrong client ID causes the token exchange to fail before the WebSocket opens

**`npm run verify:whitelabel` fails**

- Read the error messages — each one points to a specific field in `brand.config.json`
- Ensure all logo `.svg` files exist in `assets/brand/`

**Build errors after editing brand.config.json**

- Validate JSON syntax (no trailing commas, all strings quoted)
- Run `node -e "require('./brand.config.json')"` to check for JSON parse errors
- Run `npm run bootstrap` if packages are out of sync

---

## package.json Metadata

After forking, update these fields in `packages/core/package.json`:

```json
{
    "description": "Your Platform Name",
    "author": "Your Organisation",
    "repository": {
        "type": "git",
        "url": "https://github.com/YOUR_ORG/YOUR_REPO.git"
    },
    "bugs": {
        "url": "https://github.com/YOUR_ORG/YOUR_REPO/issues"
    },
    "homepage": "https://github.com/YOUR_ORG/YOUR_REPO"
}
```

> `npm run verify:whitelabel` will warn if `author`, `description`, or `repository.url` still contain the default Deriv values.

---

## What You Cannot Change Without Source Code Edits

| Limitation                                      | Reason                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| `@deriv/quill-icons` icon set                   | Icons are referenced by component name from this library               |
| `@deriv-com/smartcharts-champion` chart library | Tightly coupled to the SmartChart module                               |
| `@deriv-com/translations` translation provider  | Core i18n infrastructure                                               |
| Deriv options trading API protocol              | The WebSocket v3 protocol and contract types are Deriv-specific        |
| Internal package names (`@deriv/*`)             | Monorepo workspace names — changing them requires updating all imports |
