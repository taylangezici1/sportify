"use client";

interface Track {
  id: string;
  uri: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
}

interface SearchResultsProps {
  tracks: Track[];
  onSelect: (track: Track) => void;
}

export default function SearchResults({ tracks, onSelect }: SearchResultsProps) {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {tracks.map((track) => (
        <div 
          key={track.id}
          onClick={() => onSelect(track)}
          className="flex items-center p-3 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer group"
        >
          {/* Image */}
          <div className="relative w-12 h-12 mr-4 shrink-0">
            {track.album.images[0] ? (
              <img 
                src={track.album.images[0].url} 
                alt={track.album.name} 
                className="w-full h-full object-cover rounded shadow-md group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-full h-full bg-neutral-700 rounded flex items-center justify-center">
                <span className="text-xs text-neutral-500">No Img</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <svg role="img" height="20" width="20" viewBox="0 0 24 24" fill="white" className="drop-shadow-md">
                 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
               </svg>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 mr-4">
            <div className="text-white font-medium truncate">{track.name}</div>
            <div className="text-sm text-neutral-400 truncate">
              {track.artists.map(a => a.name).join(", ")}
            </div>
          </div>

          {/* Album (Hidden on mobile) */}
          <div className="hidden md:block w-1/3 text-sm text-neutral-500 truncate mr-4">
            {track.album.name}
          </div>

          {/* Duration */}
          <div className="text-sm text-neutral-500 font-mono">
            {formatTime(track.duration_ms)}
          </div>
        </div>
      ))}
    </div>
  );
}
