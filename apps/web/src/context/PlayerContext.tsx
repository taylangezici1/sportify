"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { useSession } from "next-auth/react";

import { Clip, Playlist, PlayerContextType } from "@repo/ui";

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackUri, setTrackUri] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<{ name: string; artist: string; image: string } | null>(null);
  
  // Clip State
  const [activeClip, setActiveClip] = useState<Clip | null>(null);
  const [queue, setQueue] = useState<Clip[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [mode, setMode] = useState<'workout' | 'chill'>('chill');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [chillPlaylistId, setChillPlaylistIdState] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Spotify Clipper Global',
        getOAuthToken: (cb: (token: string) => void) => { cb(session.accessToken as string); },
        volume: 0.5
      });

      setPlayer(player);

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setDeviceId(null);
      });

      player.addListener('player_state_changed', (state: any) => {
        if (!state) {
            setIsActive(false);
            return;
        }
        setIsPaused(state.paused);
        setIsActive(true);
        setCurrentPosition(state.position);
        setDuration(state.duration);
        setTrackUri(state.track_window.current_track.uri);
        
        const current = state.track_window.current_track;
        setCurrentTrack({
            name: current.name,
            artist: current.artists[0].name,
            image: current.album.images[0]?.url || ""
        });
      });

      player.connect();
    };

    return () => {
      if (player) player.disconnect();
      document.body.removeChild(script);
    };
  }, [session?.accessToken]);

  // Fetch Playlists
  useEffect(() => {
    async function fetchPlaylists() {
        if (!session?.accessToken) return;
        try {
            const res = await fetch('https://api.spotify.com/v1/me/playlists', {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPlaylists(data.items || []);
            }
        } catch (e) {
            console.error("Failed to fetch playlists", e);
        }
    }
    fetchPlaylists();
    fetchPlaylists();
  }, [session?.accessToken]);

  // Fetch User Settings
  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/me')
        .then(res => res.json())
        .then(data => {
            if (data.chillPlaylistId) setChillPlaylistIdState(data.chillPlaylistId);
        })
        .catch(err => console.error("Failed to fetch settings", err));
  }, [session?.user]);

  const setChillPlaylistId = async (id: string) => {
      try {
          const res = await fetch('/api/me', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chillPlaylistId: id })
          });
          if (res.ok) {
              setChillPlaylistIdState(id);
          }
      } catch (e) {
          console.error("Failed to update chill playlist", e);
      }
  };

  // Polling for position and Clip Boundary Check
  useEffect(() => {
    if (!isPaused && isActive && player) {
      intervalRef.current = setInterval(() => {
        player.getCurrentState().then((state: any) => {
            if (!state) return;
            const pos = state.position;
            setCurrentPosition(pos);

            // Check if we need to skip to next clip
            if (activeClip && pos >= activeClip.endTime) {
                nextClip();
            }
        });
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, isActive, player, activeClip]); // Added activeClip dependency

  const playTrack = useCallback(async (uri: string) => {
    if (!deviceId || !session?.accessToken) return;
    
    // Activate the player on mobile devices
    if (player && typeof player.activateElement === 'function') {
        try {
            await player.activateElement();
        } catch (e) {
            console.error("Failed to activate player element:", e);
        }
    }

    // Reset clip state when playing a raw track
    setActiveClip(null);

    const body = uri.startsWith('spotify:playlist:') 
        ? { context_uri: uri }
        : { uris: [uri] };

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
    });
  }, [deviceId, session?.accessToken, player]);

  const playClip = useCallback(async (clip: Clip, newQueue?: Clip[]) => {
    if (!deviceId || !session?.accessToken) return;

    // Activate the player on mobile devices (or any browser that requires user interaction)
    if (player && typeof player.activateElement === 'function') {
        try {
            await player.activateElement();
        } catch (e) {
            console.error("Failed to activate player element:", e);
        }
    }
    
    setMode('workout');
    setActiveClip(clip);
    if (newQueue) setQueue(newQueue);

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify({ 
          uris: [clip.trackUri],
          position_ms: clip.startTime 
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
    });
  }, [deviceId, session?.accessToken, player]);

  const nextClip = useCallback(() => {
    if (mode === 'chill') {
        player?.nextTrack();
        return;
    }

    if (!activeClip || queue.length === 0) return;

    const currentIndex = queue.findIndex(c => c.id === activeClip.id);
    if (currentIndex === -1) return;

    let nextIndex;
    if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
    } else {
        nextIndex = (currentIndex + 1) % queue.length;
    }

    playClip(queue[nextIndex]);
  }, [mode, player, activeClip, queue, isShuffle, playClip]);

  const previousClip = useCallback(() => {
    if (mode === 'chill') {
        player?.previousTrack();
        return;
    }

    if (!activeClip || queue.length === 0) return;

    const currentIndex = queue.findIndex(c => c.id === activeClip.id);
    if (currentIndex === -1) return;

    let prevIndex;
    if (isShuffle) {
        prevIndex = Math.floor(Math.random() * queue.length);
    } else {
        prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    }

    playClip(queue[prevIndex]);
  }, [mode, player, activeClip, queue, isShuffle, playClip]);

  const toggleShuffle = useCallback(async () => {
    const newShuffleState = !isShuffle;
    setIsShuffle(newShuffleState);

    if (mode === 'chill' && deviceId && session?.accessToken) {
        try {
            await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${newShuffleState}&device_id=${deviceId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
        } catch (e) {
            console.error("Failed to toggle shuffle on Spotify", e);
        }
    }
  }, [isShuffle, mode, deviceId, session?.accessToken]);

  const togglePlay = useCallback(() => {
    if (player) player.togglePlay();
  }, [player]);

  const seek = useCallback((position: number) => {
    if (player) player.seek(position);
  }, [player]);

  const setVolume = useCallback((volume: number) => {
    if (player) player.setVolume(volume);
  }, [player]);

  const toggleMode = useCallback(async () => {
    const newMode = mode === 'chill' ? 'workout' : 'chill';
    setMode(newMode);

    if (newMode === 'workout') {
      try {
        const res = await fetch('/api/clips');
        if (!res.ok) throw new Error('Failed to fetch clips');
        const clips: Clip[] = await res.json();
        
        if (clips.length > 0) {
          // Shuffle the clips for the queue
          const shuffled = [...clips].sort(() => Math.random() - 0.5);
          playClip(shuffled[0], shuffled);
        } else {
            console.warn("No clips found for workout mode");
        }
      } catch (e) {
        console.error("Error entering workout mode:", e);
      }
    } else {
      // Chill Mode
      // Chill Mode
      try {
        let targetPlaylist: Playlist | undefined;

        if (chillPlaylistId) {
            targetPlaylist = playlists.find(p => p.id === chillPlaylistId);
            // If not found in fetched playlists (e.g. limit issue), we might need to fetch it specifically or just try to play it
            if (!targetPlaylist) {
                // Construct a partial object if we have the ID, hoping the URI format is standard
                // Spotify URI for playlist: spotify:playlist:ID
                targetPlaylist = {
                    id: chillPlaylistId,
                    name: "Chill Playlist",
                    uri: `spotify:playlist:${chillPlaylistId}`,
                    images: [],
                    tracks: { total: 0 } // Unknown total, randomization might be tricky without it
                } as Playlist;
                
                // If we don't have the playlist object, we can't get the total tracks for randomization easily.
                // We might need to fetch the playlist details if it's not in the list.
                try {
                    const res = await fetch(`https://api.spotify.com/v1/playlists/${chillPlaylistId}`, {
                         headers: { 'Authorization': `Bearer ${session?.accessToken}` }
                    });
                     if (res.ok) {
                         const fetched = await res.json();
                         targetPlaylist = fetched;
                     }
                } catch(e) { console.error("Failed to fetch chill playlist details", e); }
            }
        } else if (playlists.length > 0) {
             targetPlaylist = playlists[0];
        }

        if (targetPlaylist) {
            const playlist = targetPlaylist;
            
            // 2. Enable Shuffle
            if (deviceId) {
                await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${deviceId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${session?.accessToken}` }
                });
            }

            // 3. Play the playlist at a random offset
            setActiveClip(null);
            
            const randomOffset = Math.floor(Math.random() * playlist.tracks.total);
            console.log(`Playing chill playlist ${playlist.name} starting at offset ${randomOffset}`);

            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
              method: 'PUT',
              body: JSON.stringify({ 
                  context_uri: playlist.uri,
                  offset: { position: randomOffset }
              }),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.accessToken}`
              },
            });

        } else {
            console.warn("No playlists found for chill mode");
            // Fallback to hardcoded if no playlists found?
            const chillPlaylistUri = "spotify:playlist:37i9dQZF1DX4WYpdgoIcn6"; 
            playTrack(chillPlaylistUri);
        }
      } catch (e) {
        console.error("Error entering chill mode:", e);
      }
    }
  }, [mode, playClip, playTrack, session?.accessToken, deviceId, playlists, chillPlaylistId]);

  return (
    <PlayerContext.Provider value={{
      player,
      deviceId,
      isPaused,
      isActive,
      currentPosition,
      duration,
      trackUri,
      currentTrack,
      activeClip,
      isShuffle,
      playTrack,
      playClip,
      togglePlay,
      seek,
      nextClip,
      previousClip,
      toggleShuffle,
      setVolume,
      mode,
      toggleMode,
      playlists,
      chillPlaylistId,
      setChillPlaylistId,
      session,
      signIn: () => { import("next-auth/react").then(({ signIn }) => signIn("spotify")); } 
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
