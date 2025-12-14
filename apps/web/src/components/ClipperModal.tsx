"use client";

import { useState, useEffect, useRef } from "react";
import SpotifyPlayer from "./SpotifyPlayer";
import { usePlayer } from "@/context/PlayerContext";
import toast from "react-hot-toast";

interface ClipperModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  trackUri: string;
  trackName: string;
}

export default function ClipperModal({ isOpen, onClose, trackUri, trackName }: ClipperModalProps) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const { playTrack, togglePlay, currentPosition, seek, player } = usePlayer();
  const hasStartedRef = useRef(false);

  // Reset hasStarted when modal opens/closes or track changes
  useEffect(() => {
    hasStartedRef.current = false;
  }, [isOpen, trackUri]);

  useEffect(() => {
    if (isOpen && trackUri && !hasStartedRef.current) {
        playTrack(trackUri);
        hasStartedRef.current = true;
    }

    // Cleanup function runs when component unmounts (modal closes)
    return () => {
        console.log("Modal unmounting, pausing player...");
        // We use the global player instance directly if possible, or the function
        // Note: 'player' from context might be null if context was torn down, but usually it's fine.
        // We can also try to use the SDK's pause if we have a reference, but we rely on context here.
        if (player) {
            player.pause().then(() => console.log("Player paused"));
        }
    };
  }, [isOpen, trackUri, playTrack, player]);

  // Remove the separate pause effect as it's now handled in cleanup

  if (!isOpen) return null;

  const formatTime = (ms: number) => new Date(ms).toISOString().slice(14, 19);

  const handleSave = async () => {
    if (startTime >= endTime) {
        toast.error("End time must be greater than start time");
        return;
    }
    if (endTime === 0) {
        toast.error("Please set an end time");
        return;
    }

    console.log("Saving clip:", { trackUri, trackName, startTime, endTime });

    try {
      const res = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackUri,
          trackName,
          startTime,
          endTime,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save clip");
      }

      const data = await res.json();
      console.log("Clip saved:", data);
      onClose();
      toast.success("Clip saved successfully!");
    } catch (error) {
      console.error("Error saving clip:", error);
      toast.error(`Failed to save clip: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-2xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create Clip</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-neutral-200 mb-1">{trackName}</h3>
          <p className="text-sm text-neutral-500 font-mono">{trackUri}</p>
        </div>

        <div className="mb-8 bg-neutral-800 rounded-md p-4">
          <SpotifyPlayer 
            startTime={startTime}
            endTime={endTime}
            onTimeUpdate={(s, e) => {
                setStartTime(s);
                setEndTime(e);
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Start Time</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={formatTime(startTime)} 
                readOnly
                className="bg-neutral-800 border border-neutral-700 rounded px-3 py-2 w-full text-center font-mono"
              />
              <button 
                onClick={() => setStartTime(currentPosition)}
                className="bg-neutral-700 hover:bg-neutral-600 px-3 py-2 rounded text-sm"
              >
                Set Current
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-2">End Time</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={formatTime(endTime)} 
                readOnly
                className="bg-neutral-800 border border-neutral-700 rounded px-3 py-2 w-full text-center font-mono"
              />
              <button 
                onClick={() => setEndTime(currentPosition)}
                className="bg-neutral-700 hover:bg-neutral-600 px-3 py-2 rounded text-sm"
              >
                Set Current
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 text-neutral-400 hover:text-white">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="bg-green-500 text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
          >
            Save Clip
          </button>
        </div>
      </div>
    </div>
  );
}
