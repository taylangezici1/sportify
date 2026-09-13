---
trigger: always_on
---

Sportify — Project Rules & Guidelines
These rules keep both apps consistent: apps/web (Next.js) and apps/native (Expo SDK 57, Expo Go).

1. Technology Stack
Framework: Next.js 16 (App Router), React 19.
Language: TypeScript (strict). No `any` outside untyped third-party boundaries.
Styling: Tailwind CSS v4. Design tokens live in `apps/web/src/app/globals.css` under `@theme`
  (bg / surface / surface-2 / surface-3 / line / text / muted / subtle / brand / workout / chill / danger).
Database: PostgreSQL via Prisma 4. Singleton client in `src/lib/prisma.ts`.
Authentication: NextAuth v4, Google provider with `youtube.readonly`. Config in `src/lib/auth.ts`.
Music source: YouTube Data API v3 (server, `src/lib/youtube.ts`) + YouTube IFrame Player (client,
  `src/lib/player/youtube-engine.ts`).
Package manager: yarn 1 workspaces (always use yarn).

2. Architecture
2.1 PlayerContext (`src/context/PlayerContext.tsx`) is the single source of truth for playback:
  status, current item, position/duration, queue + index, mode (workout | chill), shuffle, volume,
  preview range (clipper loop), stage slots, playlists cache and chill playlist id.
  Consume it with `usePlayer()`. Never duplicate player state in component state.
2.2 Exactly one YouTube iframe exists, mounted by `PlayerStage` in the root layout. Screens that want to
  show the video register a slot with `useStageSlot(ref, interactive)`; the stage is positioned over the
  most recently registered slot. Never render a second player and never unmount the stage.
2.3 Track identity is the namespaced `uri` string (`youtube:<videoId>`; legacy `spotify:track:<id>`).
  Helpers: `trackSource`, `youtubeVideoId`, `youtubeUri`, `clipToTrack` in `packages/ui/src/types.ts`.
2.4 Server helpers in `src/lib/youtube.ts` are the only place that talks to Google APIs. API routes resolve
  the caller with `getRequestUser(req)` (`src/lib/request-user.ts`), then call the helper.
  Client code goes through `src/lib/client-api.ts` (`api.clips`, `api.search`, `api.playlists`, `api.me`).
2.5 Route files export only HTTP handlers. Shared logic lives in `src/lib`.

3. YouTube API quota
Search costs ~101 units of the 10,000/day budget. Search is explicit-submit only; do not add live search.
Prefer `videos.list` (1 unit) when a video id or link is available.

4. Modes
Workout: `startWorkout()` fetches clips, filters YouTube ones, shuffles, queues them; clip end -> next.
Chill: `startChill()` loads the chill playlist (cached per id), shuffles full tracks.
`playTrack` (single track from search/playlist) does not change the mode.

5. Design
Dark only. Near-black surfaces, white primary buttons, brand red (`brand`) for identity/progress only.
Workout = `workout` (orange), Chill = `chill` (cyan). Use `Button`, `IconButton`, `Page`, `PageHeader`,
`EmptyState`, `Thumb`, `Badge` from `src/components/ui/primitives.tsx`; icons from `src/components/ui/Icons.tsx`.
Pages must work at phone width; the mobile tab bar and mini player are fixed chrome.

6. Files
src/app: routes and API routes.   src/components/{layout,player,clips,tracks,search,playlists,ui}
src/context: PlayerContext.       src/lib: server helpers, client API, engine, formatting.
src/types: ambient type augmentations (next-auth, YouTube iframe globals).

7. Hygiene
Wrap async player and API calls in try/catch and surface errors with `react-hot-toast`.
Run `yarn --cwd apps/web tsc --noEmit` before finishing. Delete one-off scripts after use.

8. Native app (apps/native)
Expo Router 57: never import @react-navigation/* directly; use expo-router exports (Tabs and BottomTabBar
from "expo-router/js-tabs"; DarkTheme, ThemeProvider, useFocusEffect from "expo-router"). New architecture is on.
Auth: device token from /mobile/login stored in SecureStore (context/AuthContext). All backend calls go
through lib/api.ts, which adds the bearer token and signs out on 401.
Player: one YouTube WebView in components/PlayerStage, positioned over the active slot registered with
useStageSlot(ref). context/PlayerContext mirrors the web contract (queue, modes, preview range).
Styling: StyleSheet with tokens from lib/theme.ts; no NativeWind. Fonts: Lato via @expo-google-fonts/lato.
Checks: yarn --cwd apps/native typecheck, npx expo-doctor, yarn --cwd apps/native expo export --platform android.
