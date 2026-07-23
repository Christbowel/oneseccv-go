# OneSecCV web app — go-live checklist

The web app has **no backend of its own**. It talks to exactly three things:

| What | Where | Why |
|---|---|---|
| Compilation server | your VPS (`92.5.60.171:8090`), proxied by `vercel.json` | LaTeX → PDF/PNG |
| Google Drive `appDataFolder` | the user's own Drive | CV history |
| Google Gemini | the user's own API key, straight from the browser | AI writing |

Nothing is stored on your side, so there is nothing to operate or back up.

---

## 1. Google OAuth client (required — this is the login)

1. <https://console.cloud.google.com/> → create (or pick) a project.
2. **APIs & Services ▸ Library** → enable **Google Drive API**.
3. **APIs & Services ▸ OAuth consent screen**
   - User type: **External**, publishing status **In production** *(while it is in
     "Testing", only the test users you list can sign in, and tokens expire after 7 days)*.
   - App name, support email, logo (`frontend/public/icon-512.png`), privacy policy URL.
   - **Scopes** — add exactly these:
     ```
     openid
     .../auth/userinfo.email
     .../auth/userinfo.profile
     .../auth/drive.appdata
     ```
   - `drive.appdata` is a **non-sensitive** scope: no Google verification review is
     required, and the app can only ever see the hidden folder it created itself.
4. **Credentials ▸ Create credentials ▸ OAuth client ID ▸ Web application**
   - *Authorised JavaScript origins*:
     ```
     https://your-domain.vercel.app
     https://your-custom-domain.com
     http://localhost:3000
     ```
   - No redirect URI is needed — the token flow uses a popup.
5. Copy the **Client ID** into `VITE_GOOGLE_CLIENT_ID`.

## 2. Google Analytics 4 (this is how you count your users)

1. <https://analytics.google.com/> → **Admin ▸ Create property** (or reuse one).
2. **Data streams ▸ Web** → enter your domain → copy the **Measurement ID**
   (`G-XXXXXXXXXX`) into `VITE_GA_MEASUREMENT_ID`.
3. Recommended: **Admin ▸ Data settings ▸ Data retention → 14 months**, so your
   historical user counts do not get trimmed after 2 months.

**Where the numbers live**

| Question | Report |
|---|---|
| How many people use it? | *Reports ▸ Retention*, or *Reports ▸ User ▸ User attributes* → **Total users** |
| How many right now? | *Reports ▸ Realtime* |
| How many signed up today? | *Reports ▸ Engagement ▸ Events* → `sign_up` |
| How many actually finished a CV? | events `generate_success` and `download_cv` |
| Do they come back? | *Reports ▸ Retention ▸ User retention* |

Because every signed-in visitor is tagged with `user_id` (their Google `sub`),
one person on a phone + a laptop + the installed PWA counts as **one** user.

Events emitted: `sign_up`, `login`, `generate_start`, `generate_success`,
`generate_failure`, `download_cv`, `save_cv_drive`, `open_history_cv`,
`refine_cv`, `pwa_install`, `gemini_key_saved`, `screen_view`.

> GA4 is deferred: signups appear in Realtime within seconds, but the standard
> reports settle after ~24 h. Do not panic on day one.

## 3. Vercel environment variables

Project ▸ Settings ▸ Environment Variables (Production **and** Preview):

```
VITE_GOOGLE_CLIENT_ID = <client id>.apps.googleusercontent.com
VITE_GA_MEASUREMENT_ID = G-XXXXXXXXXX
VITE_OWNER_EMAIL = christbowel10@gmail.com
VITE_COMPILER_URL =            # leave empty in production
```

Redeploy after changing them — Vite inlines `VITE_*` at build time.

## 4. Local development

```bash
cd frontend
cp .env.example .env.local     # fill in the client id
npm install
npm run dev                    # http://localhost:3000
```

Add `http://localhost:3000` to the OAuth client's authorised origins, or the
sign-in popup will refuse to open.

To point at a local compiler instead of the VPS:

```bash
# terminal 1
cd backend && go run ./cmd/server --templates ../templates
# terminal 2
VITE_COMPILER_URL=http://localhost:8090 npm run dev
```

## 5. PWA assets

Icons are generated from code, no design tool needed:

```bash
npm run icons     # regenerates public/icon-*.png
```

The service worker (`public/sw.js`) caches only the app shell. Compiler, Drive,
Gemini and Analytics calls always go to the network, so a stale response can
never be mistaken for a fresh CV.

## 6. What the user actually sees

- **Consent**: one popup, asking for name/email and "see, edit, create and delete
  its own configuration data in your Google Drive". That wording is Google's for
  `appdata` — it cannot touch anything else in their Drive.
- **Revoking**: <https://myaccount.google.com/permissions> — linked from the app's
  account menu and settings.
