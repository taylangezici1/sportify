import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-user";
import { getMyPlaylists } from "@/lib/youtube";
import { youtubeErrorResponse } from "@/lib/api";

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.accessToken) {
    return NextResponse.json({ error: "Google session expired. Please sign in again." }, { status: 401 });
  }
  try {
    const playlists = await getMyPlaylists(user.accessToken);
    return NextResponse.json({ playlists });
  } catch (error) {
    return youtubeErrorResponse(error, "Failed to load playlists");
  }
}
