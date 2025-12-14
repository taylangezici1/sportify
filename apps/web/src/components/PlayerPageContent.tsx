"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function PlayerPageContent() {
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

  if (!isActive || !currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-400">
        <p className="text-xl mb-4">No track playing</p>
        <Link href="/clips" className="text-white hover:underline">
          Go to Clips
        </Link>
      </div>
    );
  }

  // Calculate progress percentage relative to the clip range
  const range = maxTime - minTime;
  const progressPercent = range > 0 ? ((localProgress - minTime) / range) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 bg-gradient-to-b from-neutral-800 to-black">
      {/* Album Art */}
      <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 mb-6 md:mb-8 shadow-2xl">
        {currentTrack.image ? (
          <img 
            src={currentTrack.image} 
            alt={currentTrack.name} 
            className="w-full h-full object-cover rounded-lg shadow-2xl"
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center rounded-lg">
            <span className="text-neutral-500">No Image</span>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="text-center mb-6 md:mb-8 px-4">
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 line-clamp-1">{currentTrack.name}</h1>
        <p className="text-lg md:text-xl text-neutral-400 line-clamp-1">{currentTrack.artist}</p>
        <span className={`inline-block mt-2 px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-bold uppercase tracking-wider transition-opacity ${activeClip ? 'opacity-100' : 'opacity-0'}`}>
          Clip Mode
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-6 md:mb-8 px-2">
        <div className="flex justify-between text-xs md:text-sm text-neutral-400 font-mono mb-2">
          <span>{formatTime(localProgress)}</span>
          <span>{formatTime(maxTime)}</span>
        </div>
        <div className="relative h-2 bg-neutral-700 rounded-full w-full group">
          <div 
            className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-green-500 transition-colors"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          ></div>
          <input 
            type="range" 
            min={minTime} 
            max={maxTime} 
            value={localProgress}
            onChange={(e) => {
              const newPos = Number(e.target.value);
              setLocalProgress(newPos);
              setIsDragging(true);
            }}
            onMouseUp={(e) => {
              const newPos = Number(e.currentTarget.value);
              seek(newPos);
              // Keep dragging true for a bit to prevent jump back
              setTimeout(() => setIsDragging(false), 1000);
            }}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full">
        <div className="flex justify-start gap-4 items-center">

          <button 
            onClick={toggleShuffle}
            className={`transition-colors p-2 ${isShuffle ? "text-green-500" : "text-neutral-400 hover:text-white"}`}
            aria-label="Shuffle"
          >
             <svg role="img" height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
               <path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z"></path>
               <path d="m7.5 10.723.98-1.167.957 1.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 1 1-1.06-1.06L13.109 13H11.16a3.75 3.75 0 0 1-2.873-1.34L7.5 10.723z"></path>
             </svg>
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12">
          <button 
            onClick={previousClip}
            className="text-neutral-400 hover:text-white transition-colors p-2"
            aria-label="Previous"
            disabled={mode === 'workout' && !activeClip}
          >
            <svg role="img" height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"></path>
            </svg>
          </button>
          
          <button 
            onClick={togglePlay}
            className="bg-white rounded-full p-4 text-black hover:scale-105 transition-transform shadow-lg"
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? (
              <svg role="img" height="32" width="32" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"></path>
              </svg>
            ) : (
              <svg role="img" height="32" width="32" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"></path>
              </svg>
            )}
          </button>

          <button 
            onClick={nextClip}
            className="text-neutral-400 hover:text-white transition-colors p-2"
            aria-label="Next"
            disabled={mode === 'workout' && !activeClip}
          >
            <svg role="img" height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"></path>
            </svg>
          </button>
        </div>

        <div className="flex justify-end">
          {/* Volume Control - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 group">
              <button 
                onClick={() => {
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
                className="text-neutral-400 hover:text-white cursor-pointer p-2 transition-colors"
                aria-label={volume === 0 ? "Unmute" : "Mute"}
              >
                {volume === 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                ) : volume < 0.5 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
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
                    const newVol = Number(e.target.value);
                    setLocalVolume(newVol);
                    setVolume(newVol);
                  }}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
          </div>
        </div>
      </div>

      {/* Mobile Mode Toggle (Bottom) */}
      <div className="mt-8 w-full md:hidden">
        <button
          onClick={toggleMode}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
            mode === 'workout' 
              ? 'bg-red-600 text-white shadow-red-900/20' 
              : 'bg-indigo-600 text-white shadow-indigo-900/20'
          }`}
        >
          <span className="text-2xl">{mode === 'workout' ? '🔥' : '🧊'}</span>
          <span>{mode === 'workout' ? 'WORKOUT MODE' : 'CHILL MODE'}</span>
        </button>
      </div>
    </div>
  );
}
