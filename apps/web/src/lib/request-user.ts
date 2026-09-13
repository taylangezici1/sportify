import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyApiToken } from "@/lib/mobile-auth";
import { getGoogleAccessTokenForUser } from "@/lib/google-tokens";

export interface RequestUser {
  email: string;
  name?: string | null;
  image?: string | null;
  /** Google access token for YouTube calls that need the user's identity. */
  accessToken?: string;
  /** Present when the caller authenticated with a mobile API token. */
  apiToken?: string;
}

/**
 * Resolves the caller of an API route.
 *
 * 1. NextAuth cookie session (the web app).
 * 2. `Authorization: Bearer <api token>` minted by /api/mobile/token (the native app).
 *    The Google access token is then derived from the stored account.
 * 3. `Authorization: Bearer <google access token>` as a last resort.
 */
export async function getRequestUser(req: Request): Promise<RequestUser | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return {
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      accessToken: session.accessToken,
    };
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length).trim();
  if (!token) return null;

  const user = await verifyApiToken(token);
  if (user?.email) {
    return {
      email: user.email,
      name: user.name,
      image: user.image,
      accessToken: await getGoogleAccessTokenForUser(user.id),
      apiToken: token,
    };
  }

  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const info = await res.json();
      if (info.email) {
        return { email: info.email, name: info.name, image: info.picture, accessToken: token };
      }
    }
  } catch (e) {
    console.error("Bearer token verification failed", e);
  }
  return null;
}

/** Finds the DB user for a request, creating it on first contact. */
export async function getOrCreateDbUser(user: RequestUser) {
  const existing = await prisma.user.findUnique({ where: { email: user.email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      email: user.email,
      name: user.name ?? user.email.split("@")[0],
      image: user.image ?? "",
    },
  });
}
