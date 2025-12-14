
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  console.log("API /api/clips HIT");
  try {
    let session = await getServerSession(authOptions);
    let userEmail = session?.user?.email;

    // Fallback: Check for Bearer token if no session (Native App)
    if (!userEmail) {
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                // Verify token with Spotify
                const spotifyRes = await fetch('https://api.spotify.com/v1/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (spotifyRes.ok) {
                    const spotifyUser = await spotifyRes.json();
                    userEmail = spotifyUser.email;
                    console.log("Authenticated via Token:", userEmail);
                }
            } catch (e) {
                console.error("Token verification failed", e);
            }
        }
    }

    if (!userEmail) {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { trackUri, trackName, startTime, endTime } = body;

    if (!trackUri || !trackName || startTime === undefined || endTime === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure user exists in DB
    // Use userEmail which is guaranteed to exist at this point
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
        // If we found the email via Spotify token but no user exists, create one
        // Note: We might lack name/image if coming from raw token unless we fetched it, 
        // but for now we rely on email existence or session data if available.
        // Fallback to email as name if session is null.
      const name = session?.user?.name || userEmail.split('@')[0];
      const image = session?.user?.image || "";
        
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: name,
          image: image,
        },
      });
    }

    const clip = await prisma.clip.create({
      data: {
        trackUri,
        trackName,
        startTime,
        endTime,
        userId: user.id,
      },
    });

    return NextResponse.json(clip);
  } catch (error) {
    console.error("Error creating clip:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
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

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        clips: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(user?.clips || []);
  } catch (error) {
    console.error("Error fetching clips:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
