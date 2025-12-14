# Spotify Clipper - Monorepo

**Spotify Clipper** is a cross-platform application (Web & Native) designed to enhance the Spotify experience with specialized "Workout" (Random Clips) and "Chill" (Playlist Shuffle) modes. It is built as a **Turborepo** monorepo, sharing UI and logic between a Next.js web app and an Expo React Native mobile app.

## 🛠 Technology Stack

### Core Architecture
- **Monorepo**: [Turborepo](https://turbo.build/) for high-performance build system and package management.
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode) for type safety across the entire stack.
- **Package Manager**: [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) for dependency management.

### 🌐 Web App (`apps/web`)
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router) for server-side rendering and API routes.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) with Spotify Provider.
- **Database**: [PostgreSQL](https://www.postgresql.org/) managed via [Prisma ORM](https://www.prisma.io/).
- **Player Integration**: [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk) for browser-based audio playback.

### 📱 Native App (`apps/native`)
- **Framework**: [Expo](https://expo.dev/) (React Native) for cross-platform mobile development.
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native) to share styles with the web.
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) for file-based routing.
- **Authentication**: Custom "Hybrid Auth" flow:
  - Uses `expo-auth-session` for PKCE Login.
  - Verifies tokens against the Web App backend for secure data access.
- **Player Control**: "Remote Control" architecture using Spotify Web API to control active devices (since Native SDKs are platform-specific).

### 📦 Shared Packages
- **`@repo/ui`**: Shared React components and TypeScript interfaces/types used by both Web and Native apps.
- **`@repo/typescript-config`**: Centralized `tsconfig.json` for consistent compiler options.
- **`@repo/eslint-config`**: Unified linting rules.

## 🚀 Key Features & Implementation
- **Hybrid Authentication**: The Native app authenticates directly with Spotify via PKCE, then validates its identity with the Next.js backend to access the PostgreSQL database securely.
- **Clip Engine**: Custom logic to define "Clips" (start/end times) for tracks, stored in Postgres and enforced via client-side polling.
- **Unified Logic**: Core playback logic (Queue, Shuffle, Mode toggling) is centralized in `PlayerContext`, making it portable with minor platform-specific adapters.

## 🏃‍♂️ Running the Project

1. **Install Dependencies**:
   ```bash
   yarn install
   ```

2. **Environment Setup**:
   - Ensure `.env` exists in root and apps with `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `NEXTAUTH_SECRET`, and `DATABASE_URL`.

3. **Start Development Server**:
   ```bash
   yarn dev
   ```
   - Starts Web App on `http://localhost:3000` (or `0.0.0.0:3000` for network access).
   - Starts Expo Metro Bundler for Native App.

4. **Native App Testing**:
   - Use **Expo Go** on your physical device.
   - Update `apps/native/constants.ts` with your machine's local IP address if testing on a physical phone.

## ✍️ Authors

**Taylan Gezici** - *Product Owner & Creative Director*

> [!NOTE]
> **AI Disclaimer**:  
> Not a single line of code in this project was written by human hands.  
> Entirely architected, implemented, and debugged by **Google DeepMind's Gemini** (via Antigravity).
