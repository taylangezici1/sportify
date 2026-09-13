import "server-only";
import { prisma } from "@/lib/prisma";

export interface RefreshedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
  refreshToken?: string;
}

/** Exchanges a Google refresh token for a fresh access token. Throws on failure. */
export async function refreshGoogleAccessToken(refreshToken: string): Promise<RefreshedToken> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description ?? data?.error ?? `Google token refresh failed (${res.status})`);
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshToken: data.refresh_token,
  };
}

/**
 * A valid Google access token for a user who is not in a browser session
 * (the mobile app), using the refresh token NextAuth stored at sign-in.
 */
export async function getGoogleAccessTokenForUser(userId: string): Promise<string | undefined> {
  const account = await prisma.account.findFirst({ where: { userId, provider: "google" } });
  if (!account) return undefined;

  const stillValid = account.access_token && account.expires_at && account.expires_at * 1000 > Date.now() + 60_000;
  if (stillValid) return account.access_token!;
  if (!account.refresh_token) return undefined;

  try {
    const fresh = await refreshGoogleAccessToken(account.refresh_token);
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: fresh.accessToken,
        expires_at: Math.floor(fresh.expiresAt / 1000),
        ...(fresh.refreshToken ? { refresh_token: fresh.refreshToken } : {}),
      },
    });
    return fresh.accessToken;
  } catch (e) {
    console.error("Could not refresh Google token for user", userId, e);
    return undefined;
  }
}
