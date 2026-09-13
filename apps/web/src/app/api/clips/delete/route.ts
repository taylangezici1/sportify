import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/request-user";

/** Legacy endpoint kept for older clients; prefer `DELETE /api/clips/:id`. */
export async function DELETE(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing clip ID" }, { status: 400 });

  const clip = await prisma.clip.findUnique({ where: { id }, include: { user: true } });
  if (!clip) return NextResponse.json({ error: "Clip not found" }, { status: 404 });
  if (clip.user.email !== user.email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.clip.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
