import type { Metadata } from "next";
import NowPlaying from "@/components/player/NowPlaying";

export const metadata: Metadata = { title: "Now playing" };

export default function PlayerPage() {
  return <NowPlaying />;
}
