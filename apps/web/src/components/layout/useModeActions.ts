"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { usePlayer, type Mode } from "@/context/PlayerContext";

/**
 * Starts a mode and routes the user to what is missing when it cannot start
 * (no clips yet, no chill playlist chosen).
 */
export function useModeActions() {
  const { mode, isActive, startWorkout, startChill } = usePlayer();
  const router = useRouter();
  const [starting, setStarting] = useState<Mode | null>(null);

  const start = useCallback(
    async (target: Mode, opts?: { force?: boolean }) => {
      if (!opts?.force && isActive && target === mode) return;
      setStarting(target);
      try {
        const result = target === "workout" ? await startWorkout() : await startChill();
        if (result.ok) return;
        if (result.reason === "no-clips") {
          toast("No clips yet. Search for a track and clip the part you want.", { icon: "✂️" });
          router.push("/search");
        } else if (result.reason === "no-playlist") {
          toast("Pick a playlist for chill mode first.", { icon: "🎧" });
          router.push("/playlists");
        }
      } finally {
        setStarting(null);
      }
    },
    [isActive, mode, startWorkout, startChill, router],
  );

  return { mode, start, starting };
}
