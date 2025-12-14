import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchTracks } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    // @ts-ignore
    const results = await searchTracks(session.accessToken, query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to search tracks" }, { status: 500 });
  }
}
