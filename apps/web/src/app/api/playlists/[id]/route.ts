import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-user";
import { extractPlaylistId, getPlaylist, getPlaylistTracks } from "@/lib/youtube";
import { youtubeErrorResponse } from "@/lib/api";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = decodeURIComponent((await params).id);
  const id = extractPlaylistId(raw);
  if (!id) return NextResponse.json({ error: "Not a valid YouTube playlist id or link" }, { status: 400 });

  try {
    const auth = { accessToken: user.accessToken };
    const [playlist, tracks] = await Promise.all([getPlaylist(id, auth), getPlaylistTracks(id, auth)]);
    if (!playlist) return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    return NextResponse.json({ playlist: { ...playlist, itemCount: tracks.length }, tracks });
  } catch (error) {
    return youtubeErrorResponse(error, "Failed to load playlist");
  }
}
