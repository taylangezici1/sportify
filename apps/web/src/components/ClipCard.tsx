"use client";

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

interface ClipCardProps {
  clip: Clip;
  onPlay: (clip: Clip) => void;
  onDelete?: (id: string) => void;
  isActive?: boolean;
  isPlaying?: boolean;
}

export default function ClipCard({ clip, onPlay, onDelete, isActive, isPlaying }: ClipCardProps) {
  const duration = clip.endTime - clip.startTime;
  const seconds = Math.floor(duration / 1000);

  const formatTime = (ms: number) => new Date(ms).toISOString().slice(14, 19);

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl p-6 transition-all duration-300 group
        ${isActive 
          ? "bg-gradient-to-br from-green-900/40 to-neutral-900 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]" 
          : "bg-gradient-to-br from-neutral-800 to-neutral-900 border-neutral-800 hover:border-neutral-700 hover:shadow-xl hover:-translate-y-1"
        }
        border
      `}
    >
      {/* Decorative Background Element */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-green-500/10 transition-colors"></div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className={`text-lg font-bold truncate transition-colors ${isActive ? "text-green-400" : "text-white group-hover:text-green-400"}`} title={clip.trackName}>
              {clip.trackName}
            </h3>
            <p className="text-xs text-neutral-500 font-mono mt-1">
              Created {new Date(clip.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(clip.id);
              }}
              className="rounded-full p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-100 scale-100 md:opacity-0 md:scale-90 md:group-hover:opacity-100 md:group-hover:scale-100"
              aria-label="Delete Clip"
            >
              <svg role="img" height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
            <button 
              onClick={() => onPlay(clip)}
              className={`
                rounded-full p-3 transition-all duration-300 shadow-lg flex items-center justify-center
                ${isActive 
                  ? "bg-green-500 text-black scale-100" 
                  : "bg-green-500 text-black opacity-100 scale-100 md:opacity-0 md:scale-90 md:group-hover:opacity-100 md:group-hover:scale-100 translate-x-0 md:translate-x-2 md:group-hover:translate-x-0"
                }
              `}
              aria-label={isPlaying ? "Pause Clip" : "Play Clip"}
            >
              {isPlaying ? (
                <svg role="img" height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg role="img" height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="mt-auto">
          {/* Waveform-like visual placeholder */}
          {isActive &&<div className="flex items-end gap-1 h-8 mb-3 opacity-30">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 bg-white rounded-t-sm transition-all duration-500 ${isPlaying ? "animate-pulse" : ""}`}
                style={{ 
                  height: `${Math.max(20, Math.random() * 100)}%`,
                  animationDelay: `${i * 0.05}s`
                }}
              ></div>
            ))}
          </div>}

          <div className="flex justify-between items-center text-xs font-mono border-t border-white/10 pt-3">
            <div className="flex items-center gap-2 text-neutral-400">
              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px]">CLIP</span>
              <span>{formatTime(clip.startTime)} - {formatTime(clip.endTime)}</span>
            </div>
            <span className={`${isActive ? "text-green-400" : "text-neutral-500"}`}>
              {seconds}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
