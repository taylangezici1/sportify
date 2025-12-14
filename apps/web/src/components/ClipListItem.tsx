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

interface ClipListItemProps {
  clip: Clip;
  onPlay: (clip: Clip) => void;
  onDelete?: (id: string) => void;
  isActive?: boolean;
  isPlaying?: boolean;
}

export default function ClipListItem({ clip, onPlay, onDelete, isActive, isPlaying }: ClipListItemProps) {
  const duration = clip.endTime - clip.startTime;
  const seconds = Math.floor(duration / 1000);

  const formatTime = (ms: number) => new Date(ms).toISOString().slice(14, 19);

  return (
    <div 
      onClick={() => onPlay(clip)}
      className={`
        flex items-center justify-between p-4 rounded-lg transition-all duration-200 cursor-pointer group
        ${isActive 
          ? "bg-green-900/20 border border-green-500/30" 
          : "bg-neutral-900/50 border border-transparent hover:bg-neutral-800 hover:border-neutral-700"
        }
      `}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Play Icon / Status */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0
          ${isActive ? "bg-green-500 text-black" : "bg-neutral-800 text-white group-hover:bg-green-500 group-hover:text-black"}
        `}>
          {isPlaying ? (
            <svg role="img" height="16" width="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg role="img" height="16" width="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </div>

        {/* Track Info */}
        <div className="flex flex-col min-w-0">
          <span className={`font-medium truncate ${isActive ? "text-green-400" : "text-white"}`}>
            {clip.trackName}
          </span>
          <span className="text-xs text-neutral-500 font-mono">
            {new Date(clip.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Timings */}
      <div className="flex items-center gap-8 text-sm font-mono text-neutral-400 ml-4 hidden md:flex">
        <div className="flex items-center gap-2">
          <span className="bg-white/5 px-2 py-1 rounded text-xs">CLIP</span>
          <span>{formatTime(clip.startTime)} - {formatTime(clip.endTime)}</span>
        </div>
        <span className={`w-12 text-right ${isActive ? "text-green-400" : ""}`}>
          {seconds}s
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(clip.id);
          }}
          className="p-2 text-neutral-500 hover:text-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Delete Clip"
        >
          <svg role="img" height="16" width="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
