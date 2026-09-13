import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-user";
import { searchTracks } from "@/lib/youtube";
import { youtubeErrorResponse } from "@/lib/api";

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  try {
    const tracks = await searchTracks(q, { accessToken: user.accessToken });
    return NextResponse.json({ tracks });
  } catch (error) {
    return youtubeErrorResponse(error, "Search failed");
  }
}
