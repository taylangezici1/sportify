"use client";

import { useEffect, useRef } from "react";
import { usePlayer } from "@/context/PlayerContext";

interface SpotifyPlayerProps {
  startTime: number;
  endTime: number;
  onTimeUpdate: (start: number, end: number) => void;
}

export default function SpotifyPlayer({ startTime, endTime, onTimeUpdate }: SpotifyPlayerProps) {
  const { 
    isPaused, 
    isActive, 
    currentPosition, 
    duration, 
    togglePlay, 
    seek 
  } = usePlayer();

  // Seek to start time when it changes (if playing)
  useEffect(() => {
    if (!isPaused && isActive) {
        seek(startTime);
    }
  }, [startTime]); // Only depend on startTime

  // Handle looping logic
  useEffect(() => {
    if (!isPaused && isActive) {
        // If we are before start time, seek to start
        if (currentPosition < startTime - 200) { 
             seek(startTime);
        }
        // If we are past end time, seek to start
        if (endTime > 0 && currentPosition >= endTime) {
            seek(startTime);
        }
    }
  }, [currentPosition, endTime, startTime, isPaused, isActive, seek]);

  // Initialize end time if needed
  useEffect(() => {
    if (duration > 0 && endTime === 0) {
        onTimeUpdate(0, duration);
    }
  }, [duration, endTime, onTimeUpdate]);

  if (!isActive) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400">
        Player not active. Start a track to enable clipping.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between">
        <button 
          onClick={togglePlay}
          className="bg-white text-black rounded-full p-3 hover:scale-105 transition-transform w-12 h-12 flex items-center justify-center"
        >
          {isPaused ? "▶" : "⏸"}
        </button>
        <div className="text-sm font-mono text-neutral-400">
          {new Date(currentPosition).toISOString().slice(14, 19)} / {new Date(duration).toISOString().slice(14, 19)}
        </div>
      </div>
      
      {/* Dual Slider Simulation */}
      <div className="relative h-6 w-full bg-neutral-700 rounded-full group select-none">
        {/* Track Background */}
        <div className="absolute top-0 left-0 h-full w-full rounded-full bg-neutral-700"></div>
        
        {/* Selected Range */}
        <div 
            className="absolute top-0 h-full bg-green-500/30 rounded-full pointer-events-none"
            style={{
                left: `${(startTime / duration) * 100}%`,
                width: `${((endTime - startTime) / duration) * 100}%`
            }}
        ></div>

        {/* Current Position Indicator */}
        <div 
            className="absolute top-0 h-full w-1 bg-white z-10 pointer-events-none"
            style={{ left: `${(currentPosition / duration) * 100}%` }}
        ></div>

        {/* Custom Handles for better interaction */}
        <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full z-30 cursor-ew-resize hover:scale-125 transition-transform shadow-lg border-2 border-white"
            style={{ left: `${(startTime / duration) * 100}%` }}
            onMouseDown={(e) => {
                const slider = e.currentTarget.parentElement;
                if (!slider) return;
                const rect = slider.getBoundingClientRect();
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                    const percentage = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                    const val = Math.round(percentage * duration);
                    if (val < endTime - 1000) onTimeUpdate(val, endTime);
                };
                
                const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            }}
        ></div>

        <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full z-30 cursor-ew-resize hover:scale-125 transition-transform shadow-lg border-2 border-white"
            style={{ left: `${(endTime / duration) * 100}%` }}
            onMouseDown={(e) => {
                const slider = e.currentTarget.parentElement;
                if (!slider) return;
                const rect = slider.getBoundingClientRect();
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                    const percentage = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                    const val = Math.round(percentage * duration);
                    if (val > startTime + 1000) onTimeUpdate(startTime, val);
                };
                
                const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            }}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs text-neutral-500">
        <span>Start: {new Date(startTime).toISOString().slice(14, 19)}</span>
        <span>End: {new Date(endTime).toISOString().slice(14, 19)}</span>
      </div>
    </div>
  );
}
