# HRMS Attendance PWA

An installable Progressive Web App for office-based employee attendance — punch in/out with geofence validation, a live working-hours counter, and web-push reminders for missed punches.

Deployed as a scoped slice at **`https://hrms.netkathir.com/punch/`** and backed by **`https://api.hrms.netkathir.com/api/v1`**.

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | React 18 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| PWA / SW | vite-plugin-pwa + Workbox (injectManifest) |
| State | React Context + useReducer |
| Auth | Bearer token (localStorage) |
| Push | Web Push API + VAPID |

---

## Project Structure

```text
hrms_pwa/
├── public/
│   └── punch/
│       ├── manifest.webmanifest     # Standalone PWA manifest (scope + start_url = /punch/)
│       └── icons/
│           ├── icon-192.png         # Required — replace placeholder
│           ├── icon-512.png         # Required — replace placeholder
│           └── maskable-512.png     # Required — replace placeholder
│
├── src/
│   ├── main.jsx                     # App entry point + SW registration
│   ├── App.jsx                      # Auth-gate router: booting → login | punch | profile
│   ├── index.css                    # Tailwind base + Google Fonts (Inter)
│   ├── sw.js                        # Service worker: Workbox precache, NetworkFirst API, push handlers
│   ├── config.js                    # Env vars: API base, VAPID key, office coords, geofence radius
│   │
│   ├── api/
│   │   └── client.js                # All fetch wrappers — signIn, forgotPassword, otpValidation,
│   │                                #   confirmPassword, getProfile, getAttendance, postAttendance,
│   │                                #   subscribePush; wires 401 → logout handler
│   │
│   ├── context/
│   │   └── AuthContext.jsx          # useReducer auth state; login (hash pwd → sign-in → profile),
│   │                                #   logout, token restore on boot, 401 mid-session handling
│   │
│   ├── hooks/
│   │   ├── useInstallPrompt.js      # Captures beforeinstallprompt (Android); detects iOS standalone
│   │   └── usePushSubscription.js   # Requests notification permission, VAPID subscribe, POST /push/subscribe
│   │
│   ├── screens/
│   │   ├── LoginScreen.jsx          # Email + password (show/hide), remember me, field validation
│   │   ├── ForgotPasswordScreen.jsx # 3-step flow: email → OTP verify (resend / back) → reset password
│   │   ├── PunchScreen.jsx          # Greeting, live IST clock, working-hours counter (1s tick),
│   │   │                            #   punch button (all 5 states), today's event timeline, menu
│   │   └── ProfileScreen.jsx        # Full profile details card + logout
│   │
│   ├── components/
│   │   ├── InstallBanner.jsx        # Android: native install prompt; iOS: "Share → Add to Home Screen" hint
│   │   ├── PushPrompt.jsx           # Silently requests push permission 3s after install
│   │   └── ui/
│   │       ├── Button.jsx           # primary / outline / ghost variants + loading spinner
│   │       ├── Input.jsx            # Text / email / password (with show-hide toggle) + error label
│   │       ├── Card.jsx             # White rounded card wrapper
│   │       └── Alert.jsx            # error / success / warning / info inline alerts
│   │
│   └── utils/
│       ├── crypto.js                # hashPassword(): base64(SHA-256(plaintext)) — confirmed API format
│       ├── storage.js               # Token + profile persistence in localStorage; strips password field
│       ├── date.js                  # IST date/time formatting, duration formatter (X hr Y mins)
│       ├── attendance.js            # computeWorked() from sorted events; findTodayRecord() IST-normalised
│       └── push.js                  # urlBase64ToUint8Array() for VAPID application server key
│
├── .env                             # Local env vars (not committed)
├── .env.example                     # Template — copy to .env and fill in values
├── vite.config.js                   # Vite + VitePWA config (base=/punch/, injectManifest)
├── tailwind.config.js               # Brand green palette (brand-50 … brand-900)
├── postcss.config.js
└── package.json
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE=https://api.hrms.netkathir.com/api/v1
VITE_VAPID_PUBLIC_KEY=<your_vapid_public_key>
VITE_OFFICE_LAT=11.9321154
VITE_OFFICE_LNG=79.7899261
VITE_GEOFENCE_RADIUS_M=100
VITE_ACCURACY_THRESHOLD_M=50
```

### 3. Generate VAPID keys (one-time)

```bash
npx web-push generate-vapid-keys
```

- **Public key** → `VITE_VAPID_PUBLIC_KEY` in `.env`
- **Private key** → store securely on the backend server only

### 4. Add app icons

Place PNG files in `public/punch/icons/`:

| File | Size | Notes |
| --- | --- | --- |
| `icon-192.png` | 192 × 192 | Standard home-screen icon |
| `icon-512.png` | 512 × 512 | Splash / store icon |
| `maskable-512.png` | 512 × 512 | Safe-zone design for adaptive icons |

### 5. Run locally

```bash
npm run dev
# → http://localhost:5173/punch/
```

### 6. Production build

```bash
npm run build
# Output: dist/
```

Deploy the contents of `dist/` so they are served at `/punch/` on `hrms.netkathir.com`.

---

## Deployment (nginx example)

```nginx
location /punch/ {
    alias /var/www/hrms_pwa/dist/;
    try_files $uri $uri/ /punch/index.html;
}
```

The service worker at `/punch/sw.js` is scoped to `/punch/` and will not interfere with the main HRMS SPA.

---

## API Endpoints

All calls use `Authorization: Bearer <token>` except the three password-reset endpoints.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/sign-in` | No | Login — returns token |
| `POST` | `/forgot-password` | No | Send OTP to email |
| `POST` | `/otp-validation` | No | Verify OTP |
| `POST` | `/confirm-password` | No | Set new password (plaintext body) |
| `GET` | `/profile` | Yes | Logged-in user profile |
| `GET` | `/attendance?user=<uid>` | Yes | Attendance records + events |
| `POST` | `/attendance` | Yes | Punch in/out (+ lat/lng/accuracy) |
| `POST` | `/push/subscribe` | Yes | Store push subscription |

### Password encoding

`sign-in` sends `base64(SHA-256(plaintext))` over the raw 32-byte digest.
`confirm-password` sends the new password as **plaintext** (per API sample — confirm with backend).

---

## Auth Flow

```text
App boot
  └── Token in localStorage?
        ├── Yes, not expired → fetch profile (if missing) → Punch screen
        └── No / expired → Login screen

Login screen
  └── POST /sign-in → store token → GET /profile → Punch screen

Any 401 mid-session
  └── Clear session → Login screen → return to last action
```

---

## Punch State Machine

The punch button cycles through five states:

| State | Label | Condition |
| --- | --- | --- |
| **Idle** | Punch In / Punch Out | Default; label from last event |
| **Locating** | Getting your location… | `navigator.geolocation` in progress |
| **Submitting** | Punching in… / out… | Awaiting `POST /attendance` |
| **Success** | Punched In! / Punched Out! | 200 response; auto-resets after 2s |
| **Error** | Inline alert | 403 out-of-range · 422 low accuracy · denied · unavailable |

Working-hours counter (`computeWorked`) sums all closed in/out pairs and adds elapsed time for an open punch, ticking every second while punched in.

---

## Geofence

Validation is **server-side only**. The client sends `lat`, `lng`, `accuracy` with every punch. The server computes Haversine distance and rejects if outside `radius_m`.

- Office coords and radius are set via `.env` (`VITE_OFFICE_LAT/LNG/GEOFENCE_RADIUS_M`)
- Current config: `11.9321154, 79.7899261` — radius `100 m`
- Accuracy gate: reject and prompt retry if accuracy worse than `VITE_ACCURACY_THRESHOLD_M` (`50 m`)

> **Backend dependency:** `POST /attendance` must be extended to accept and validate location. Until then, geofence is not enforced.

---

## Web Push

1. Generate VAPID keys (once) and configure the public key in `.env`
2. After install, the app silently requests notification permission (3s delay)
3. On grant: subscribes via `PushManager`, posts subscription to `POST /push/subscribe`
4. The server sends reminders via the push library:
   - **11:00 IST** — missed punch-in reminder
   - **20:00 IST** — missed punch-out reminder

> **Backend dependency:** `POST /push/subscribe` and the scheduled reminder jobs must be implemented server-side.

---

## Backend Dependencies (open items)

These are required for full end-to-end operation:

| # | Item | Impact |
| --- | --- | --- |
| 1 | Extend `POST /attendance` to accept `lat`, `lng`, `accuracy` + server-side geofence | Geofence not enforced without this |
| 2 | Confirm sign-in response shape (token field name, expiry, refresh token) | "Stay logged in" and silent refresh |
| 3 | Implement `POST /push/subscribe` endpoint | Push reminders won't reach devices |
| 4 | Remove `password` field from `GET /profile` response | PWA strips it client-side as a workaround |
| 5 | Confirm CORS for `https://hrms.netkathir.com` + `Authorization` header | API calls will fail without this |
| 6 | Confirm `confirm-password` expects plaintext or hashed password | Reset flow may break |

---

## Environment Variables Reference

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_BASE` | Yes | — | API base URL including `/api/v1` |
| `VITE_VAPID_PUBLIC_KEY` | Yes (push) | — | VAPID public key for web push |
| `VITE_OFFICE_LAT` | Yes | `0` | Office latitude |
| `VITE_OFFICE_LNG` | Yes | `0` | Office longitude |
| `VITE_GEOFENCE_RADIUS_M` | No | `200` | Geofence radius in metres |
| `VITE_ACCURACY_THRESHOLD_M` | No | `100` | Max GPS accuracy to accept (metres) |

---

## Security Notes

- Passwords are never stored. Only the hashed form (`base64(SHA-256)`) is sent over HTTPS.
- The `password` field from `/profile` is stripped before being saved to `localStorage`.
- Bearer tokens are JS-readable (XSS exposure is the known trade-off for "stay logged in" on a PWA). Keep the codebase tight.
- Geofence distance is never computed or trusted client-side.
- GPS spoofing is a known limitation — not detectable in a PWA. Acceptable for this use case.
