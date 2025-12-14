import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { useSession } from "../hooks/useSession";
import { Clip, Playlist, PlayerContextType, CurrentTrack } from "@repo/ui";
import { BACKEND_URL } from "../constants";

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { data: session, signIn } = useSession(); // Destructure signIn here
  const [player, setPlayer] = useState<any>(null); // Remote control doesn't have a local player instance
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackUri, setTrackUri] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  
  // Clip State
  const [activeClip, setActiveClip] = useState<Clip | null>(null);
  const [queue, setQueue] = useState<Clip[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [mode, setMode] = useState<'workout' | 'chill'>('chill');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [chillPlaylistId, setChillPlaylistIdState] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for Player State (Remote Control)
  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchState = async () => {
        try {
            const res = await fetch('https://api.spotify.com/v1/me/player', {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            if (res.status === 204) {
                setIsActive(false);
                return;
            }
            if (res.ok) {
                const state = await res.json();
                setIsPaused(!state.is_playing);
                setIsActive(true);
                setCurrentPosition(state.progress_ms);
                setDuration(state.item?.duration_ms || 0);
                setTrackUri(state.item?.uri);
                setDeviceId(state.device?.id);
                setIsShuffle(state.shuffle_state);
                
                if (state.item) {
                     setCurrentTrack({
                        name: state.item.name,
                        artist: state.item.artists[0].name,
                        image: state.item.album.images[0]?.url || ""
                    });
                }
                
                // Clip Boundary Check
                 if (activeClip && state.progress_ms >= activeClip.endTime) {
                    nextClip();
                }
            }
        } catch (e: any) {
            // Silence network errors to avoid console spam
            if (e.message !== 'Network request failed') {
                console.log("Player polling error:", e.message);
            }
        }
    };

    // Poll frequently
    intervalRef.current = setInterval(fetchState, 1000); // 1s polling for Native remote
    fetchState();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session?.accessToken, activeClip]); 

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
  }, [session?.accessToken]);

  // Fetch User Settings from Backend (Hybrid Auth)
  useEffect(() => {
    if (!session?.accessToken) return;
    fetch(`${BACKEND_URL}/api/me`, {
        headers: { 'Authorization': `Bearer ${session.accessToken}` }
    })
        .then(res => {
            if (res.ok) return res.json();
            throw new Error('Failed to fetch settings');
        })
        .then(data => {
            if (data.chillPlaylistId) setChillPlaylistIdState(data.chillPlaylistId);
        })
        .catch(err => console.log("Failed to fetch settings (Ensure Backend is running):", err.message));
  }, [session?.accessToken]);

  const setChillPlaylistId = async (id: string) => {
      if (!session?.accessToken) return;
      try {
          const res = await fetch(`${BACKEND_URL}/api/me`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.accessToken}`
              },
              body: JSON.stringify({ chillPlaylistId: id })
          });
          if (res.ok) {
              setChillPlaylistIdState(id);
          }
      } catch (e) {
          console.error("Failed to update chill playlist", e);
      }
  };

  const playTrack = useCallback(async (uri: string) => {
    if (!session?.accessToken) return;
    
    // We rely on active device or we alert logic
    const deviceQuery = deviceId ? `?device_id=${deviceId}` : '';

    const body = uri.startsWith('spotify:playlist:') 
        ? { context_uri: uri }
        : { uris: [uri] };

    await fetch(`https://api.spotify.com/v1/me/player/play${deviceQuery}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
    });
  }, [deviceId, session?.accessToken]);

  const playClip = useCallback(async (clip: Clip, newQueue?: Clip[]) => {
    if (!session?.accessToken) return;

    setMode('workout');
    setActiveClip(clip);
    if (newQueue) setQueue(newQueue);

    const deviceQuery = deviceId ? `?device_id=${deviceId}` : '';

    await fetch(`https://api.spotify.com/v1/me/player/play${deviceQuery}`, {
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
  }, [deviceId, session?.accessToken]);

  const nextClip = useCallback(() => {
    if (mode === 'chill') {
        // Next Track Remote
        fetch(`https://api.spotify.com/v1/me/player/next`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session?.accessToken}` }
        });
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
  }, [mode, activeClip, queue, isShuffle, playClip, session?.accessToken]);

  const previousClip = useCallback(() => {
    if (mode === 'chill') {
         fetch(`https://api.spotify.com/v1/me/player/previous`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session?.accessToken}` }
        });
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
  }, [mode, activeClip, queue, isShuffle, playClip, session?.accessToken]);

  const toggleShuffle = useCallback(async () => {
    const newShuffleState = !isShuffle;
    setIsShuffle(newShuffleState);

    if (mode === 'chill' && session?.accessToken) {
        try {
            await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${newShuffleState}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
        } catch (e) {
            console.error("Failed to toggle shuffle on Spotify", e);
        }
    }
  }, [isShuffle, mode, session?.accessToken]);

  const togglePlay = useCallback(() => {
    if (!session?.accessToken) {
        console.log("togglePlay: No access token");
        return;
    }
    const endpoint = isPaused ? 'play' : 'pause';
    console.log(`togglePlay: Sending ${endpoint} command. Device ID: ${deviceId}`);

    const options: any = {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${session.accessToken}` }
    };

    if (!isPaused && deviceId) {
        // When playing, we might just call play without params to resume, but sometimes explicit device helps
        // But for 'play' endpoint, we might want to ensure we target the device if known
    }

    fetch(`https://api.spotify.com/v1/me/player/${endpoint}${deviceId ? `?device_id=${deviceId}` : ''}`, options)
    .then(res => {
        console.log(`togglePlay response: ${res.status}`);
        if (res.status === 404) {
            alert("No active Spotify device found. Open Spotify on a device!");
        }
    })
    .catch(err => console.error("togglePlay error:", err));
    
    setIsPaused(!isPaused);
  }, [isPaused, session?.accessToken, deviceId]);

  const seek = useCallback((position: number) => {
     if (!session?.accessToken) return;
     fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${position}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${session.accessToken}` }
    });
  }, [session?.accessToken]);

  const setVolume = useCallback((volume: number) => {
    // Volume API requires typical 0-100 range, context uses 0-1 usually?
    // Web SDK uses 0-1, API uses 0-100.
    const volPercent = Math.floor(volume * 100);
     if (!session?.accessToken) return;
     fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volPercent}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${session.accessToken}` }
    });
  }, [session?.accessToken]);

  const toggleMode = useCallback(async () => {
    const newMode = mode === 'chill' ? 'workout' : 'chill';
    setMode(newMode);

    if (newMode === 'workout') {
      try {
        // Fetch clips from Backend (Hybrid Auth)
        const res = await fetch(`${BACKEND_URL}/api/clips`, {
            headers: { 'Authorization': `Bearer ${session?.accessToken}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch clips');
        const clips: Clip[] = await res.json();
        
        if (clips.length > 0) {
          // Shuffle the clips for the queue
          const shuffled = [...clips].sort(() => Math.random() - 0.5);
          playClip(shuffled[0], shuffled);
        } else {
            console.warn("No clips found for workout mode");
            alert("No clips found! Create some on the web app first.");
        }
      } catch (e) {
        console.error("Error entering workout mode:", e);
        alert("Failed to load clips. Is the backend running?");
      }
    } else {
      // Chill Mode Logic (Keep existing logic but ensure variables are valid)
      try {
        let targetPlaylist: Playlist | undefined;

        if (chillPlaylistId) {
            targetPlaylist = playlists.find(p => p.id === chillPlaylistId);
            if (!targetPlaylist) {
                // If not in fetch list, verify via API
                 try {
                    const res = await fetch(`https://api.spotify.com/v1/playlists/${chillPlaylistId}`, {
                         headers: { 'Authorization': `Bearer ${session?.accessToken}` }
                    });
                     if (res.ok) {
                         targetPlaylist = await res.json();
                     }
                } catch(e) { console.error("Failed to fetch chill playlist details", e); }
            }
        } else if (playlists.length > 0) {
             targetPlaylist = playlists[0];
        }

        if (targetPlaylist && deviceId && session?.accessToken) {
             // ... Play Logic ...
             // Same logic as before, just ensuring variables are in scope
            await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${deviceId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            
            const randomOffset = Math.floor(Math.random() * (targetPlaylist.tracks.total || 10)); // Default fallback
            
             await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
              method: 'PUT',
              body: JSON.stringify({ 
                  context_uri: targetPlaylist.uri,
                  offset: { position: randomOffset }
              }),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`
              },
            });
        }
      } catch (e) {
        console.error("Error entering chill mode:", e);
      }
    }
  }, [mode, playClip, session?.accessToken, deviceId, playlists, chillPlaylistId]);

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
      session: session,
      signIn: signIn
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
