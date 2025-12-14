---
trigger: always_on
---

Spotify Clipper - Project Rules & Guidelines
These rules are designed to maintain consistency, stability, and code quality for the Sportify (Spotify Clipper) project.

1. Technology Stack
Framework: Next.js 14+ (App Router).
Language: TypeScript (strict mode).
Styling: Tailwind CSS (Utility-first).
Database: PostgreSQL (via Prisma ORM).
Authentication: NextAuth.js (Spotify Provider).
State Management: React Context (src/context).
Spotify Integration:
Playback: Spotify Web Playback SDK (Client-side).
Data Fetching: Spotify Web API (via fetch or custom helpers in src/lib/spotify.ts).
2. Architecture & Patterns
2.1 State Management (PlayerContext)
Central Truth: PlayerContext is the single source of truth for:
Playback state (isActive, isPaused, currentPosition, duration).
Track metadata (trackUri, currentTrack).
Clipper Logic: activeClip, queue management, and clip boundary enforcement.
Modes: Workout vs Chill mode state and toggling logic.
User Data: Cached playlists to avoid redundant fetching.
Usage: Consume context via usePlayer() hook.
Rule: Do not duplicate player state in local component state. If multiple components need it, put it in Context.
2.2 Component Types
Client Components: Use "use client" when:
Accessing PlayerContext or useSession.
Using React hooks (useState, useEffect).
Handling user interactions (clicks, player controls).
Example: Sidebar.tsx, SpotifyPlayer.tsx, SpotifyWebPlayer wrapper.
Server Components: Default choice for:
Static UI.
SEO-critical pages (though this is an app behind auth).
Initial data fetching (if not dependent on PlayerContext state).
2.3 Data Fetching
Server-Side: Use helpers in src/lib/spotify.ts (e.g., getUserPlaylists, searchTracks) when possible.
Client-Side: For player-dependent actions (shuffle, play specific context), use direct fetch to Spotify API within PlayerContext or components, using the access token from useSession.
Rate Limiting: Be mindful of Spotify API rate limits. Cache expensive calls (like playlists) in Context if used frequently.
2.4 Database (Prisma)
Schema: Defined in prisma/schema.prisma.
Migrations: Run yarn prisma migrate dev after schema changes.
Access: Use the global singleton prisma instance from src/lib/prisma.ts.
3. Core Features Implementation Details
3.1 Workout / Chill Mode
Workout Mode:
Goal: High energy, random clips.
Logic: Fetches all user clips from internal API (/api/clips), shuffles them, and plays.
Visual: Red theme / Fire icon.
Chill Mode:
Goal: Relaxed, full tracks.
Logic: Fetches user's first playlist, enables Spotify Shuffle (PUT /me/player/shuffle), and plays the playlist context.
Visual: Blue theme / Ice icon.
Switching: Handled in toggleMode within PlayerContext.
3.2 Clip Playback
Mechanism: The player polls getCurrentState() (interval).
Boundary: If currentPosition >= activeClip.endTime, it triggers nextClip().
Seeking: When a clip starts, it seeks to startTime.
4. Design & Styling
Font: Lato (Variable weight). Configured in layout.tsx and applied globally via globals.css variable --font-lato.
Theme: Dark Mode default.
Background: Black (bg-black, bg-neutral-900).
Text: White (text-white, text-neutral-400).
Accents: Green (Spotify-like), Red (Workout), Indigo (Chill).
Tailwind: Use standard Tailwind utilities. Avoid arbitrary values ([123px]) unless absolutely necessary.
5. File Structure
src/app: Page routes and API routes.
src/components: Reusable UI components.
src/context: React Context Providers.
src/lib: Logic helpers (Auth, DB, Spotify wrappers).
src/types: TypeScript interfaces.
6. Future Development Rules
Strict Types: No any types unless interacting with untyped external SDKs (like parts of the Spotify Web Playback SDK).
Auth First: Always check session/auth before making API calls.
Mobile Responsive: Ensure Sidebar toggles correctly and Player is usable on mobile (handled in Sidebar.tsx and MiniPlayer.tsx).
Error Handling: Wrap asynchronous player calls in try/catch blocks to handle network failures or "Device Not Found" errors gracefully.
Cleanup Scripts: Always delete one-off script files (like extraction scripts) after they are executed to keep the project clean.