"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import SearchInput from "@/components/SearchInput";
import SearchResults from "@/components/SearchResults";
import ClipperModal from "@/components/ClipperModal";

export default function SearchPage() {
  const { data: session } = useSession();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.tracks.items);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectTrack = (track: any) => {
    setSelectedTrack(track);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">Search</h1>
      
      <div className="mb-8">
        <SearchInput onSearch={handleSearch} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <SearchResults tracks={results} onSelect={handleSelectTrack} />
      )}

      {selectedTrack && session && (
        <ClipperModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          // @ts-ignore
          accessToken={session.accessToken}
          trackUri={selectedTrack.uri}
          trackName={selectedTrack.name}
        />
      )}
    </div>
  );
}
