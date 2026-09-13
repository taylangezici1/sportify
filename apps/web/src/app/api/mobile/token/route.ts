import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createApiToken, revokeApiToken } from "@/lib/mobile-auth";

/** Mints a device token. Requires a browser session (the /mobile/login page). */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let label: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.label === "string") label = body.label.slice(0, 80);
  } catch {
    /* no body */
  }

  const { token, expiresAt } = await createApiToken(user.id, label ?? req.headers.get("user-agent")?.slice(0, 80));
  return NextResponse.json({ token, expiresAt });
}

/** Revokes the bearer token used to make the call (mobile sign-out). */
export async function DELETE(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await revokeApiToken(auth.slice("Bearer ".length).trim());
  return NextResponse.json({ success: true });
}
