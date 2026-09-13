import "server-only";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 days
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Mints a bearer token for a device. Only the hash is stored. */
export async function createApiToken(userId: string, label?: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await prisma.apiToken.create({ data: { tokenHash: hashToken(token), userId, label, expiresAt } });
  return { token, expiresAt };
}

/** Resolves a bearer token to its user, or null when unknown or expired. */
export async function verifyApiToken(raw: string) {
  const record = await prisma.apiToken.findUnique({ where: { tokenHash: hashToken(raw) }, include: { user: true } });
  if (!record || record.expiresAt < new Date()) return null;

  if (!record.lastUsedAt || Date.now() - record.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
    prisma.apiToken.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  }
  return record.user;
}

export async function revokeApiToken(raw: string): Promise<void> {
  await prisma.apiToken.deleteMany({ where: { tokenHash: hashToken(raw) } });
}

/** Deep-link targets the mobile login page may redirect to. */
export function isAllowedMobileRedirect(url: string): boolean {
  return /^(sportify|exp|exps):\/\//i.test(url);
}
