
import Link from "next/link";
import Image from "next/image";

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
}

import { usePlayer } from "@/context/PlayerContext";
import toast from "react-hot-toast";

export default function PlaylistGrid({ playlists }: { playlists: Playlist[] }) {
  const { chillPlaylistId, setChillPlaylistId } = usePlayer();

  const handleSetChill = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    await setChillPlaylistId(id);
    toast.success(`Set ${name} as Chill Playlist`);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {playlists.map((playlist) => (
        <Link
          key={playlist.id}
          href={`/playlist/${playlist.id}`}
        >
          <div className="relative aspect-square mb-4 shadow-lg rounded-md overflow-hidden group">
            {playlist.images?.[0]?.url ? (
              <Image
                src={playlist.images[0].url}
                alt={playlist.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-neutral-600 flex items-center justify-center">
                <span className="text-neutral-400">No Image</span>
              </div>
            )}
            
            {/* Chill Playlist Toggle */}
            <button
              onClick={(e) => handleSetChill(e, playlist.id, playlist.name)}
              className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-transform hover:scale-110 z-10 ${
                chillPlaylistId === playlist.id
                  ? "bg-indigo-600 text-white"
                  : "bg-black/50 text-white hover:bg-indigo-600"
              }`}
              title="Set as Chill Playlist"
            >
              <span className="text-lg leading-none">🧊</span>
            </button>
          </div>
          <h3 className="font-bold text-white truncate" title={playlist.name}>
            {playlist.name}
          </h3>
          <p className="text-sm text-neutral-400">
            {playlist.tracks.total} Tracks
          </p>
        </Link>
      ))}
    </div>
  );
}
