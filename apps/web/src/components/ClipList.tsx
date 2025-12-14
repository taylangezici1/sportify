"use client";

import ClipCard from "@/components/ClipCard";
import { usePlayer } from "@/context/PlayerContext";
import ClipListItem from "@/components/ClipListItem";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Clip {
  id: string;
  trackUri: string;
  trackName: string;
  startTime: number;
  endTime: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export default function ClipList({ clips }: { clips: Clip[] }) {
  const { playClip, activeClip, isPaused } = usePlayer();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const router = useRouter();

  const handlePlay = (clip: Clip) => {
    playClip(clip, clips);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/clips/delete?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Clip deleted");
        router.refresh();
      } else {
        toast.error("Failed to delete clip");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting clip");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">My Clips</h2>
        <div className="flex bg-neutral-800 rounded-lg p-1 gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"}`}
            aria-label="Grid View"
          >
            <svg role="img" height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 10H4v6h6v-6zm0-8H4v6h6V2zm8 8h-6v6h6v-6zm0-8h-6v6h6V2zM4 18h6v4H4v-4zm10 0h6v4h-6v-4z"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"}`}
            aria-label="List View"
          >
            <svg role="img" height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/>
            </svg>
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clips.map((clip) => {
            const isActive = activeClip?.id === clip.id;
            return (
              <ClipCard 
                key={clip.id} 
                clip={clip} 
                onPlay={handlePlay} 
                onDelete={handleDelete}
                isActive={isActive}
                isPlaying={isActive && !isPaused}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {clips.map((clip) => {
            const isActive = activeClip?.id === clip.id;
            return (
              <ClipListItem 
                key={clip.id} 
                clip={clip} 
                onPlay={handlePlay} 
                onDelete={handleDelete}
                isActive={isActive}
                isPlaying={isActive && !isPaused}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
