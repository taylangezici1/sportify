import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/request-user";
import { parseClipBody } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

async function ownedClip(req: Request, id: string) {
  const user = await getRequestUser(req);
  if (!user) return { status: 401 as const, error: "Unauthorized" };
  const clip = await prisma.clip.findUnique({ where: { id }, include: { user: true } });
  if (!clip) return { status: 404 as const, error: "Clip not found" };
  if (clip.user.email !== user.email) return { status: 403 as const, error: "Forbidden" };
  return { clip };
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const owned = await ownedClip(req, id);
  if ("error" in owned) return NextResponse.json({ error: owned.error }, { status: owned.status });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = parseClipBody({ ...owned.clip, ...body });
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const clip = await prisma.clip.update({ where: { id }, data: parsed });
  return NextResponse.json(clip);
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const owned = await ownedClip(req, id);
  if ("error" in owned) return NextResponse.json({ error: owned.error }, { status: owned.status });

  await prisma.clip.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
