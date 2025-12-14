export interface Clip {
  id: string;
  trackUri: string;
  trackName: string;
  startTime: number;
  endTime: number;
}

export interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  uri: string;
}

export interface CurrentTrack {
    name: string;
    artist: string;
    image: string;
}

export interface PlayerContextType {
  player: any; // Web SDK instance or generic object
  deviceId: string | null;
  isPaused: boolean;
  isActive: boolean;
  currentPosition: number;
  duration: number;
  trackUri: string | null;
  currentTrack: CurrentTrack | null;
  activeClip: Clip | null;
  isShuffle: boolean;
  playTrack: (uri: string) => void;
  playClip: (clip: Clip, queue?: Clip[]) => void;
  togglePlay: () => void;
  seek: (position: number) => void;
  nextClip: () => void;
  previousClip: () => void;
  toggleShuffle: () => void;
  setVolume: (volume: number) => void;
  mode: 'workout' | 'chill';
  toggleMode: () => void;
  playlists: Playlist[];
  chillPlaylistId: string | null;
  setChillPlaylistId: (id: string) => Promise<void>;
  session: any; // Using any to be flexible between NextAuth Session and Native Session for now, or define a union
  signIn: () => void;
}
