"use client";

import { usePlayer } from "@/context/PlayerContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MiniPlayer() {
  const { 
    currentTrack, 
    isPaused, 
    togglePlay, 
    currentPosition, 
    duration, 
    seek,
    isActive,
    activeClip,
    nextClip,
    previousClip,
    isShuffle,
    toggleShuffle,
    setVolume,
    mode,
    toggleMode
  } = usePlayer();

  const pathname = usePathname();
  const router = useRouter();
  const [localProgress, setLocalProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setLocalVolume] = useState(0.5);
  const [prevVolume, setPrevVolume] = useState(0.5);

  // Determine slider bounds
  const minTime = activeClip ? activeClip.startTime : 0;
  const maxTime = activeClip ? activeClip.endTime : duration;

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(currentPosition);
    }
  }, [currentPosition, isDragging]);

  const formatTime = (ms: number) => {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!isActive || !currentTrack || pathname === "/player") {
    return null;
  }

  // Calculate progress percentage relative to the clip range
  const range = maxTime - minTime;
  const progressPercent = range > 0 ? ((localProgress - minTime) / range) * 100 : 0;

  const handlePlayerClick = () => {
    router.push("/player");
  };

  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      onClick={handlePlayerClick}
      className="h-14 md:h-24 bg-neutral-900 border-t border-neutral-800 px-4 flex items-center justify-between z-50 cursor-pointer hover:bg-neutral-800/50 transition-colors relative"
    >
      {/* Track Info */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 overflow-hidden relative z-30 pointer-events-none">
        {currentTrack.image && (
          <div className="relative shrink-0">
            <img 
              src={currentTrack.image} 
              alt={currentTrack.name} 
              className="w-10 h-10 md:w-14 md:h-14 rounded shadow-lg group-hover:opacity-80 transition-opacity"
            />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-white font-medium truncate text-sm md:text-base">
            {currentTrack.name}
          </span>
          <span className="text-xs text-neutral-400 truncate">
            {currentTrack.artist}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center justify-center md:w-1/3 gap-1 md:gap-2 z-30" onClick={stopPropagation}>
        {/* Buttons */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Mobile Mode Toggle */}
          <button
              onClick={(e) => { stopPropagation(e); toggleMode(); }}
              className={`md:hidden p-2 rounded-full transition-colors ${mode === 'workout' ? 'bg-red-600/20 text-red-500' : 'bg-indigo-600/20 text-indigo-400'}`}
              aria-label="Toggle Mode"
          >
              {mode === 'workout' ? '🔥' : '🧊'}
          </button>

          <button 
            onClick={(e) => { stopPropagation(e); toggleShuffle(); }}
            className={`hidden md:block transition-colors ${isShuffle ? "text-green-500" : "text-neutral-400 hover:text-white"}`}
            aria-label="Shuffle"
          >
             <svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
               <path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z"></path>
               <path d="m7.5 10.723.98-1.167.957 1.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 1 1-1.06-1.06L13.109 13H11.16a3.75 3.75 0 0 1-2.873-1.34L7.5 10.723z"></path>
             </svg>
          </button>

          <button 
            onClick={(e) => { stopPropagation(e); previousClip(); }}
            className="hidden md:block text-neutral-400 hover:text-white transition-colors"
            aria-label="Previous"
            disabled={mode === 'workout' && !activeClip}
          >
            <svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"></path>
            </svg>
          </button>
          
          <button 
            onClick={(e) => { stopPropagation(e); togglePlay(); }}
            className="bg-white rounded-full p-2 text-black hover:scale-105 transition-transform"
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? (
              <svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"></path>
              </svg>
            ) : (
              <svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"></path>
                <path d="M10.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"></path>
              </svg>
            )}
          </button>

          <button 
            onClick={(e) => { stopPropagation(e); nextClip(); }}
            className="hidden md:block text-neutral-400 hover:text-white transition-colors"
            aria-label="Next"
            disabled={mode === 'workout' && !activeClip}
          >
            <svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"></path>
            </svg>
          </button>
        </div>

        {/* Desktop Progress Bar (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-2 w-full max-w-md text-xs text-neutral-400 font-mono group">
          <span>{formatTime(localProgress)}</span>
          <div className="relative h-1 bg-neutral-600 rounded-full w-full">
            <div 
              className="absolute top-0 left-0 h-full bg-white group-hover:bg-green-500 rounded-full transition-colors"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            ></div>
            <input 
              type="range" 
              min={minTime} 
              max={maxTime} 
              value={localProgress}
              onChange={(e) => {
                stopPropagation(e);
                const newPos = Number(e.target.value);
                setLocalProgress(newPos);
                setIsDragging(true);
              }}
              onClick={stopPropagation}
              onMouseUp={(e) => {
                stopPropagation(e);
                const newPos = Number(e.currentTarget.value);
                seek(newPos);
                setTimeout(() => setIsDragging(false), 1000);
              }}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <span>{formatTime(maxTime)}</span>
        </div>
      </div>

      {/* Mobile Progress Bar (Absolute Bottom, Outside Controls Flow) */}
      <div 
        className="absolute bottom-0 left-0 w-full h-1 bg-neutral-800 md:hidden z-20"
        onClick={stopPropagation}
      >
         <div 
            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-100"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
         ></div>
          <input 
            type="range" 
            min={minTime} 
            max={maxTime} 
            value={localProgress}
            onChange={(e) => {
                stopPropagation(e);
                const newPos = Number(e.target.value);
                setLocalProgress(newPos);
                setIsDragging(true);
            }}
            onTouchEnd={(e) => {
                stopPropagation(e);
                seek(localProgress);
                setTimeout(() => setIsDragging(false), 1000);
            }}
            onMouseUp={(e) => {
                stopPropagation(e);
                const newPos = Number(e.currentTarget.value);
                seek(newPos);
                setTimeout(() => setIsDragging(false), 1000);
            }}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer appearance-none"
        />
      </div>

      {/* Volume Control - Hidden on Mobile */}
      <div className="hidden md:flex w-1/3 justify-end items-center gap-2 group" onClick={stopPropagation}>
        <button 
          onClick={(e) => {
            stopPropagation(e);
            if (volume > 0) {
              setPrevVolume(volume);
              setLocalVolume(0);
              setVolume(0);
            } else {
              const newVol = prevVolume || 0.5;
              setLocalVolume(newVol);
              setVolume(newVol);
            }
          }}
          className="text-neutral-400 hover:text-white"
          aria-label={volume === 0 ? "Unmute" : "Mute"}
        >
          {volume === 0 ? (
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : volume < 0.5 ? (
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
        <div className="relative w-24 h-1 bg-neutral-600 rounded-full group/vol">
          <div 
            className="absolute top-0 left-0 h-full bg-white rounded-full group-hover/vol:bg-green-500"
            style={{ width: `${volume * 100}%` }}
          ></div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume}
            onChange={(e) => {
              stopPropagation(e);
              const newVol = Number(e.target.value);
              setLocalVolume(newVol);
              setVolume(newVol);
            }}
            onClick={stopPropagation}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
