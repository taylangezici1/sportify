
"use client";

import { useState } from "react";
import ClipperModal from "./ClipperModal";

interface Track {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: { name: string }[];
  album: { name: string };
}

interface TrackListProps {
  tracks: Track[];
  accessToken: string;
}

export default function TrackList({ tracks, accessToken }: TrackListProps) {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  return (
    <>
      <div className="bg-neutral-800/50 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-800 text-neutral-400 border-b border-neutral-700">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">Title</th>
              <th className="p-4 hidden md:table-cell">Album</th>
              <th className="p-4 hidden md:table-cell">Duration</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, index) => {
              if (!track) return null;
              const duration = new Date(track.duration_ms).toISOString().slice(14, 19);

              return (
                <tr key={track.id + index} className="hover:bg-neutral-800/50 border-b border-neutral-800 last:border-0">
                  <td className="p-4 text-neutral-400 w-12">{index + 1}</td>
                  <td className="p-4">
                    <div className="font-medium">{track.name}</div>
                    <div className="text-sm text-neutral-400">
                      {track.artists.map((a) => a.name).join(", ")}
                    </div>
                  </td>
                  <td className="p-4 text-neutral-400 hidden md:table-cell">{track.album.name}</td>
                  <td className="p-4 text-neutral-400 font-mono hidden md:table-cell">{duration}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => setSelectedTrack(track)}
                      className="bg-green-500 text-black px-4 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform"
                    >
                      Clip
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedTrack && (
        <ClipperModal
          isOpen={!!selectedTrack}
          onClose={() => setSelectedTrack(null)}
          accessToken={accessToken}
          trackUri={selectedTrack.uri}
          trackName={selectedTrack.name}
        />
      )}
    </>
  );
}
