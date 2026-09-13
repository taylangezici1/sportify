# Sportify

**The best 30 seconds of every song, back to back, at the gym.**

Most songs have one part that actually gets you moving: the drop, the riff, the chorus. Sportify lets you
mark that part on any YouTube Music track and then plays those clips one after another, so a workout never
sits through an intro. When you are done lifting, the same app shuffles a normal playlist in full.

- **Workout mode** shuffles your clips. Each one plays from its start to its end, then the next begins.
- **Chill mode** shuffles one of your YouTube Music playlists, full tracks.
- **Clipper**: pick a track, drag two handles around the part you want, nudge by 0.1 s, save. The player
  loops the selection while you adjust it.
- Clips, the chill playlist choice and your account live in one PostgreSQL database shared by the web app
  and the phone app.

Music comes from **YouTube / YouTube Music**, sign-in is **Google**. There are two clients on one backend:

| Client                   | Where it runs                 | Player                                    |
| ------------------------ | ----------------------------- | ----------------------------------------- |
| `apps/web` (Next.js 16)  | Desktop or phone browser      | YouTube IFrame Player, in the page        |
| `apps/native` (Expo 57)  | Expo Go on iPhone / Android   | YouTube in a WebView, controlled from RN  |

> Sportify started in 2025 as a Spotify clipper. Spotify was dropped in September 2026 when the owner stopped
> using it. Clips from that era are still listed under "From your Spotify days" with a one-tap "Find on
> YouTube" flow that pre-fills the old start and end times and replaces the old clip on save.

## Repository layout

```
apps/web        Next.js app: the web client and the API used by both clients
apps/native     Expo Router app for the phone
packages/ui     Shared TypeScript types (Track, Clip, PlaylistSummary) and pure helpers (formatTime, shuffle…)
```

Yarn 1 workspaces, Turbo for `dev` / `build` / `lint`. Prisma 4 on PostgreSQL. Tailwind CSS v4 on the web,
plain `StyleSheet` with the same colour tokens on the phone.

## Setup

### 1. Google Cloud project

1. Create a project at <https://console.cloud.google.com/>.
2. **APIs & Services → Library**: enable **YouTube Data API v3**.
3. **OAuth consent screen**: External. Add yourself under **Test users**. Add the scope
   `https://www.googleapis.com/auth/youtube.readonly`.
4. **Credentials → Create credentials → OAuth client ID** (Web application). Authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your ngrok host>/api/auth/callback/google` (needed for the phone app)
5. **Credentials → Create credentials → API key**, restricted to the YouTube Data API v3.

Notes:

- While the consent screen is in *Testing*, Google expires refresh tokens after 7 days, so you sign in again
  weekly. Publishing the app (no verification needed for personal use; you click through an "unverified app"
  warning once) removes that limit.
- The Data API has a 10,000 unit/day quota. A search costs ~101 units, everything else 1–2, so the apps never
  search while you type. Pasting a YouTube link costs 1 unit.

### 2. Environment

Copy `apps/web/.env.example` to `apps/web/.env`:

| Variable               | Value                                                        |
| ---------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`         | PostgreSQL connection string                                 |
| `NEXTAUTH_URL`         | `http://localhost:3000`, or your ngrok URL for the phone app |
| `NEXTAUTH_SECRET`      | any long random string                                       |
| `GOOGLE_CLIENT_ID`     | from step 4                                                  |
| `GOOGLE_CLIENT_SECRET` | from step 4                                                  |
| `YOUTUBE_API_KEY`      | from step 5                                                  |

For the phone app, copy `apps/native/.env.example` to `apps/native/.env` and set `EXPO_PUBLIC_BACKEND_URL`
to the same URL as `NEXTAUTH_URL`.

### 3. Run

```bash
yarn install
yarn --cwd apps/web prisma migrate deploy   # `prisma migrate dev` while developing
yarn dev                                     # web on http://localhost:3000 + the Expo dev server
```

Sign in with the Google account that owns your YouTube Music library. A user created in the Spotify era
with the same e-mail is linked automatically and keeps its clips.

## Web app

| Route            | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `/login`         | Google sign-in                                                 |
| `/`              | Start workout / chill, recent clips, your playlists            |
| `/search`        | Search YouTube Music or paste a link; Play or Clip any result  |
| `/clips`         | List / grid of clips: play, edit, delete, legacy Spotify clips |
| `/playlists`     | Your YouTube playlists and Liked Music; pick the chill one     |
| `/playlist/[id]` | Tracks in a playlist: Play, Shuffle, Clip, open by pasted link |
| `/player`        | Now Playing: video, clip range, transport, up next             |
| `/mobile/login`  | Hand-off page the phone app opens to obtain a device token     |

API: `GET/POST /api/clips`, `PUT/DELETE /api/clips/:id`, `GET/PUT /api/me`, `GET /api/search?q=`,
`GET /api/playlists`, `GET /api/playlists/:id`, `POST/DELETE /api/mobile/token`. Every route accepts either
the NextAuth cookie session or `Authorization: Bearer <device token>`.

Keyboard: `space` play/pause, `←`/`→` seek 5 s, `n`/`p` next/previous, `s` shuffle, `m` mute.
Lock-screen and headset buttons work through the Media Session API. The page ships a web manifest, so it can
be added to a phone's home screen.

### How playback works

```
PlayerContext        queue of { clip | track }, workout / chill modes, shuffle, preview loop for the clipper
  └─ YouTubeEngine   typed wrapper over YT.Player (loadVideoById, seekTo, …)
  └─ 200 ms poller   enforces clip end → next(), keeps the progress bar moving
PlayerStage          the single iframe, positioned over whichever "stage slot" is registered
```

One YouTube iframe lives in the root layout. Screens that want to show the video register a slot element
(mini-player thumbnail, Now Playing hero, clipper preview) and the stage is drawn over the most recent one.
Moving an iframe in the DOM would reload the video; this avoids it. Clips use YouTube's `endSeconds` so the
player stops on its own, with the poller as a fallback.

## Phone app (Expo SDK 57, Expo Go)

Same features as the web app, laid out for one hand: Home (mode cards, recent clips), Search, Clips,
Playlists as tabs, with a mini player docked above the tab bar; Now Playing and the clipper open as modals.

### Sign-in

The phone never talks to Google directly. Tapping "Continue with Google" opens `/mobile/login` on the
backend in the system browser; the web app signs you in as usual, mints a long-lived device token
(`ApiToken` table, only its hash is stored) and deep-links back into the app (`exp://…` in Expo Go). The
token goes to the device keychain. For playlist calls the backend refreshes a Google access token from the
refresh token NextAuth stored at web sign-in.

### Run it

1. Google's callback must reach the backend from the phone, so expose it on https:
   `ngrok http 3000`. A free static ngrok domain saves reconfiguring every run.
2. `apps/web/.env`: `NEXTAUTH_URL=https://<host>`; add `https://<host>/api/auth/callback/google` to the
   OAuth client in Google Cloud.
3. `apps/native/.env`: `EXPO_PUBLIC_BACKEND_URL=https://<host>`.
4. `yarn --cwd apps/web dev`, then in `apps/native`: `yarn expo login` once, `yarn start`, scan the QR code
   with Expo Go (signed in to the same Expo account).

Use `yarn expo …` rather than `npx expo …` in this repo: on Windows, npx mis-resolves the yarn workspace
shim and fails with a `node_modules\node_modules\expo` path.

Free ngrok shows a "you are about to visit" page the first time the phone browser opens the link; tap through.

### How playback works

```
context/PlayerContext   same state machine as the web (queue, modes, preview loop, 250 ms position poller)
components/PlayerStage  the single YouTube WebView (react-native-youtube-iframe), positioned over the active
                        slot View; slots come from useStageSlot(ref) in MiniPlayer, player.tsx, clipping.tsx
```

Three details worth knowing:

- The page the player library loads only reports events and has no handler for the commands behind its
  `play` / `mute` / `volume` props, so pause never reached YouTube. `PlayerStage` injects a small message
  handler into that page after load; play, pause, mute and volume work through it.
- A newly loaded track is seeked to its start once, then the poller verifies the position a single time.
  Re-seeking on every "playing" event caused a buffering loop.
- The mini player draws the track thumbnail over the live player, because YouTube's own overlay covers a
  78 × 44 px video. Playback keeps running underneath; the Now Playing screen shows the real video.

In development the Metro terminal prints `[stage] …` lines for every player event and prop change. Paste
them when reporting a playback problem.

### Limits

- YouTube's terms require a visible player, so audio stops when the screen locks or the app is backgrounded.
  Keep the phone unlocked on the machine, or use the web app on a laptop.
- The YouTube API quota is shared with the web app.

### Structure

```
app/_layout.tsx        providers, auth-gated Stack, the single PlayerStage
app/login.tsx          Google hand-off
app/(tabs)/            index (home) · search · clips · playlists
app/player.tsx         Now Playing (modal)     app/clipping.tsx  clipper (modal)     app/playlist/[id].tsx
context/AuthContext    device token in SecureStore, browser sign-in
context/PlayerContext  playback state machine
components/            PlayerStage, MiniPlayer, TransportControls, ProgressBar, RangeSlider, rows, ui primitives
lib/api.ts             typed client for the backend; lib/theme.ts colour tokens; lib/config.ts env
```

## Development notes

- **Prisma on Windows:** stop the web dev server before `prisma migrate dev` or `prisma generate`. The
  running server locks the query engine file; the client then keeps running with the old schema and API
  routes fail with "Could not find mapping for model …".
- Expo Router 57 forbids importing `@react-navigation/*` directly. Use `expo-router` and
  `expo-router/js-tabs` exports.
- Checks: `yarn --cwd apps/web typecheck` and `next build`; `yarn --cwd apps/native typecheck`,
  `yarn --cwd apps/native expo lint`, `npx expo-doctor` in `apps/native`, and
  `yarn --cwd apps/native expo export --platform android` to prove the bundle builds.
- Design tokens: `apps/web/src/app/globals.css` (`@theme`) mirrored in `apps/native/lib/theme.ts`.
  Brand red for identity and progress, orange for workout, cyan for chill.

## Author

Taylan Gezici, product owner. Code written with AI assistance: the original 2025 version with Gemini, the
YouTube rebuild and the phone app in September 2026 with Claude.
