import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser, getRequestUser } from "@/lib/request-user";

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { chillPlaylistId: true, name: true, image: true, email: true },
  });
  return NextResponse.json(dbUser ?? { chillPlaylistId: null });
}

export async function PUT(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { chillPlaylistId } = await req.json();
    if (chillPlaylistId !== null && typeof chillPlaylistId !== "string") {
      return NextResponse.json({ error: "chillPlaylistId must be a string or null" }, { status: 400 });
    }
    const dbUser = await getOrCreateDbUser(user);
    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: { chillPlaylistId },
      select: { chillPlaylistId: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update profile", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
