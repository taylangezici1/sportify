
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPlaylist } from "@/lib/spotify";
import Image from "next/image";
import Link from "next/link";
import TrackList from "@/components/TrackList";

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session) {
    redirect("/api/auth/signin");
  }

  // @ts-ignore
  const playlist = await getPlaylist(session.accessToken, id);

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-8">
      <Link href="/" className="text-neutral-400 hover:text-white mb-8 inline-block">
        &larr; Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="relative w-64 h-64 shrink-0 shadow-2xl">
          {playlist.images?.[0]?.url ? (
            <Image
              src={playlist.images[0].url}
              alt={playlist.name}
              fill
              className="object-cover rounded-md"
            />
          ) : (
            <div className="w-full h-full bg-neutral-800 flex items-center justify-center rounded-md">
              <span className="text-neutral-400">No Image</span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-end">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{playlist.name}</h1>
          <p className="text-neutral-400">{playlist.description}</p>
          <p className="text-neutral-400 mt-2">
            {playlist.tracks.total} Tracks
          </p>
        </div>
      </div>

      <TrackList 
        tracks={playlist.tracks.items.map((item: any) => item.track)} 
        // @ts-ignore
        accessToken={session.accessToken}
      />
    </div>
  );
}

