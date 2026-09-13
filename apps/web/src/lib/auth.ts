import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { refreshGoogleAccessToken } from "@/lib/google-tokens";

/**
 * Google sign-in with YouTube read access.
 *
 * `youtube.readonly` is what lets us list the signed-in user's YouTube Music
 * playlists (including "Liked Music"). Everything else (search, public
 * playlists, video details) works with the plain API key as a fallback.
 */
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

const REFRESH_SKEW_MS = 60_000;

async function refreshGoogleToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) return { ...token, error: "RefreshAccessTokenError" };
  try {
    const fresh = await refreshGoogleAccessToken(token.refreshToken);
    return {
      ...token,
      accessToken: fresh.accessToken,
      expiresAt: fresh.expiresAt,
      refreshToken: fresh.refreshToken ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("Failed to refresh Google access token", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          // Needed to receive a refresh token so the session survives the
          // one-hour Google access token lifetime.
          access_type: "offline",
          prompt: "consent",
        },
      },
      // Lets an existing user row (created under the old Spotify provider with
      // the same e-mail) link to the Google account instead of failing.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        // Prefer the live Google profile over whatever the DB row holds (a
        // user created in the Spotify era still carries a dead Spotify avatar).
        const google = profile as { name?: string; picture?: string } | undefined;
        if (google?.picture) token.picture = google.picture;
        if (google?.name) token.name = google.name;
        if (token.email && (google?.picture || google?.name)) {
          prisma.user
            .update({
              where: { email: token.email },
              data: { ...(google.picture ? { image: google.picture } : {}), ...(google.name ? { name: google.name } : {}) },
            })
            .catch(() => {});
        }
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token ?? token.refreshToken,
          expiresAt: (account.expires_at ?? 0) * 1000,
          error: undefined,
        };
      }
      if (token.expiresAt && Date.now() < token.expiresAt - REFRESH_SKEW_MS) {
        return token;
      }
      return refreshGoogleToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
};
