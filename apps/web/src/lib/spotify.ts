
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export async function getUserPlaylists(accessToken: string) {
  const res = await fetch(`${SPOTIFY_API_BASE}/me/playlists`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch playlists");
  }

  return res.json();
}

export async function getPlaylist(accessToken: string, playlistId: string) {
  const res = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch playlist");
  }

  return res.json();
}

export async function searchTracks(accessToken: string, query: string) {
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: "20",
  });

  const res = await fetch(`${SPOTIFY_API_BASE}/search?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to search tracks");
  }

  return res.json();
}
