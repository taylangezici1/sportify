"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import PlaylistGrid from "@/components/PlaylistGrid";
import { usePlayer } from "@/context/PlayerContext";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const { playlists } = usePlayer();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/api/auth/signin");
    }
  }, [status]);

  if (status === "loading") {
    return <div className="p-8 text-white">Loading...</div>;
  }

  if (!session) return null;

  return (
    <main className="min-h-screen bg-neutral-900 text-white p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Playlists</h1>
        <div className="flex items-center gap-4">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-10 h-10 rounded-full border-2 border-green-500"
            />
          )}
        </div>
      </header>
      
      <PlaylistGrid playlists={playlists} />
    </main>
  );
}
