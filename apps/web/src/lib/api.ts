import { NextResponse } from "next/server";
import { YouTubeApiError } from "@/lib/youtube";

/** Maps YouTube API failures to friendly JSON errors; logs anything else. */
export function youtubeErrorResponse(error: unknown, fallback: string) {
  if (error instanceof YouTubeApiError) {
    const quota = error.reason === "quotaExceeded";
    const status = quota ? 429 : error.status;
    const message = quota
      ? "YouTube API quota is used up for today. It resets at midnight Pacific time."
      : error.reason === "missingApiKey"
        ? "YOUTUBE_API_KEY is not configured on the server."
        : error.message;
    return NextResponse.json({ error: message }, { status });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export type ParsedClip = {
  trackUri: string;
  trackName: string;
  startTime: number;
  endTime: number;
  artist: string | null;
  imageUrl: string | null;
  durationMs: number | null;
};

/** Validates a clip payload from the client. Returns `{ error }` on bad input. */
export function parseClipBody(body: Record<string, unknown>): ParsedClip | { error: string } {
  const trackUri = typeof body.trackUri === "string" ? body.trackUri.trim() : "";
  const trackName = typeof body.trackName === "string" ? body.trackName.trim() : "";
  const startTime = Number(body.startTime);
  const endTime = Number(body.endTime);

  if (!trackUri || !trackName) return { error: "trackUri and trackName are required" };
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return { error: "Times must be numbers" };
  if (startTime < 0 || endTime <= startTime) return { error: "End time must be after start time" };

  const durationMs = Number(body.durationMs);
  return {
    trackUri,
    trackName,
    startTime: Math.round(startTime),
    endTime: Math.round(endTime),
    artist: typeof body.artist === "string" ? body.artist : null,
    imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : null,
    durationMs: Number.isFinite(durationMs) && durationMs > 0 ? Math.round(durationMs) : null,
  };
}
