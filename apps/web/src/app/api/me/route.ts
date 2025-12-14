import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let session = await getServerSession(authOptions);
  let userEmail = session?.user?.email;

  if (!userEmail) {
      const headersList = await (await import('next/headers')).headers();
      const authHeader = headersList.get('authorization');
      
      if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          try {
              const spotifyRes = await fetch('https://api.spotify.com/v1/me', {
                  headers: { 'Authorization': `Bearer ${token}` }
              });
              if (spotifyRes.ok) {
                  const spotifyUser = await spotifyRes.json();
                  userEmail = spotifyUser.email;
              }
          } catch (e) {}
      }
  }

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { chillPlaylistId: true },
  });

  return NextResponse.json(user || {});
}

export async function PUT(req: Request) {
  let session = await getServerSession(authOptions);
  let userEmail = session?.user?.email;

  if (!userEmail) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          try {
              const spotifyRes = await fetch('https://api.spotify.com/v1/me', {
                  headers: { 'Authorization': `Bearer ${token}` }
              });
              if (spotifyRes.ok) {
                  const spotifyUser = await spotifyRes.json();
                  userEmail = spotifyUser.email;
              }
          } catch (e) {}
      }
  }

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chillPlaylistId } = await req.json();

    const user = await prisma.user.update({
        where: { email: userEmail },
        data: { chillPlaylistId },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
