import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser, getRequestUser } from "@/lib/request-user";
import { parseClipBody } from "@/lib/api";

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { clips: { orderBy: { createdAt: "desc" } } },
  });
  return NextResponse.json(dbUser?.clips ?? []);
}

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseClipBody(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const dbUser = await getOrCreateDbUser(user);
    const clip = await prisma.clip.create({ data: { ...parsed, userId: dbUser.id } });
    return NextResponse.json(clip, { status: 201 });
  } catch (error) {
    console.error("Error creating clip:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
