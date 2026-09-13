/** Pure helpers shared by the web and native apps. */

/** `m:ss` for a millisecond value; hours are shown when needed. */
export function formatTime(ms: number | null | undefined): string {
  if (!ms || ms < 0 || !Number.isFinite(ms)) return "0:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** `m:ss.t` with tenths, for the clipper where precision matters. */
export function formatTimePrecise(ms: number): string {
  const tenths = Math.floor((Math.max(0, ms) % 1000) / 100);
  return `${formatTime(ms)}.${tenths}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function relativeDate(input: string | Date | undefined): string {
  if (!input) return "";
  const d = new Date(input);
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff < day) return "today";
  if (diff < 2 * day) return "yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  return d.toLocaleDateString();
}

/** YouTube thumbnail for a video id at a given size (all 16:9 except hq). */
export function youtubeThumbnail(videoId: string, size: "mq" | "hq" | "maxres" = "mq"): string {
  return `https://i.ytimg.com/vi/${videoId}/${size}default.jpg`;
}
