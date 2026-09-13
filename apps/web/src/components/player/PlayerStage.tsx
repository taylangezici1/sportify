"use client";

import { useEffect, useRef } from "react";
import { PLAYER_HOST_ID, usePlayer } from "@/context/PlayerContext";

/**
 * The one and only YouTube iframe lives here, mounted once in the root layout.
 * Moving an iframe in the DOM reloads it, so instead this fixed-position
 * container is *drawn over* whichever slot element is currently registered
 * (mini player thumbnail, Now Playing hero, clipper preview).
 */
export default function PlayerStage() {
  const { stageSlot, isActive } = usePlayer();
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (!stageSlot) {
      stage.style.opacity = "0";
      stage.style.pointerEvents = "none";
      stage.style.transform = "translate(-9999px, -9999px)";
      stage.style.width = "320px";
      stage.style.height = "180px";
      return;
    }

    let raf = 0;
    let last = "";
    const sync = () => {
      const r = stageSlot.el.getBoundingClientRect();
      const key = `${r.left}|${r.top}|${r.width}|${r.height}`;
      if (key !== last) {
        last = key;
        stage.style.transform = `translate(${r.left}px, ${r.top}px)`;
        stage.style.width = `${r.width}px`;
        stage.style.height = `${r.height}px`;
      }
      raf = requestAnimationFrame(sync);
    };
    stage.style.opacity = isActive ? "1" : "0";
    stage.style.pointerEvents = stageSlot.interactive ? "auto" : "none";
    stage.style.zIndex = String(stageSlot.zIndex);
    const radius = getComputedStyle(stageSlot.el).borderRadius;
    stage.style.borderRadius = radius || "0px";
    raf = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(raf);
  }, [stageSlot, isActive]);

  return (
    <div
      ref={stageRef}
      aria-hidden
      className="fixed left-0 top-0 overflow-hidden bg-black transition-opacity duration-200 will-change-transform"
      style={{
        opacity: 0,
        pointerEvents: "none",
        transform: "translate(-9999px,-9999px)",
        width: 320,
        height: 180,
        zIndex: 40,
      }}
    >
      {/* The IFrame API replaces this div with the <iframe>. */}
      <div id={PLAYER_HOST_ID} className="h-full w-full" />
    </div>
  );
}
