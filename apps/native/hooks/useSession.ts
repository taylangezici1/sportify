import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest, ResponseType, exchangeCodeAsync, TokenResponse } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;

export interface Session {
    user: {
        name?: string;
        email?: string;
        image?: string;
        id?: string;
    };
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
}

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  
  const redirectUri = makeRedirectUri({
    scheme: 'spotify-clipper'
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID || '',
      scopes: [
        "user-read-email",
        "user-read-private", 
        "playlist-read-private", 
        "playlist-modify-public", 
        "playlist-modify-private", 
        "user-read-playback-state", 
        "user-modify-playback-state", 
        "streaming", 
        "user-library-read", 
        "user-library-modify"
      ],
      usePKCE: true,
      responseType: ResponseType.Code,
      redirectUri: redirectUri,
    },
    discovery
  );

  useEffect(() => {
    if (request) {
      console.log('Redirect URI:', redirectUri);
    }
  }, [request, redirectUri]);

  useEffect(() => {
    console.log('Auth Response:', response);
    if (response?.type === 'success') {
      const { code } = response.params;
      console.log('Auth Code retrieved:', code);
      
      if (request?.codeVerifier) {
          // Exchange code for token
          exchangeCodeAsync({
              clientId: CLIENT_ID || '',
              code,
              redirectUri,
              extraParams: {
                  code_verifier: request.codeVerifier
              }
          }, discovery).then(tokenResponse => {
              console.log('Token Exchange Success');
              const { accessToken, refreshToken, expiresIn } = tokenResponse;

              // Fetch user data
              fetch('https://api.spotify.com/v1/me', {
                  headers: { Authorization: `Bearer ${accessToken}` }
              }).then(res => res.json()).then(data => {
                  console.log('User Data:', data);
                  setSession({
                      user: {
                          name: data.display_name,
                          email: data.email,
                          image: data.images?.[0]?.url,
                          id: data.id
                      },
                      accessToken,
                      refreshToken,
                      expiresIn
                  });
                  // Persist
                  SecureStore.setItemAsync('spotify_token', accessToken);
                  if (refreshToken) SecureStore.setItemAsync('spotify_refresh_token', refreshToken);
              }).catch(e => console.error("Fetch Me Error:", e));

          }).catch(e => {
              console.error("Token Exchange Error:", e);
          });
      }
    } else if (response?.type === 'error') {
        console.error("Auth Error:", response.error);
    }
  }, [response]);

  // Load from storage on mount
  useEffect(() => {
      SecureStore.getItemAsync('spotify_token').then(token => {
          if (token) {
               fetch('https://api.spotify.com/v1/me', {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                if (res.ok) return res.json();
                throw new Error('Token expired');
            }).then(data => {
                setSession({
                    user: {
                        name: data.display_name,
                        email: data.email,
                        image: data.images?.[0]?.url,
                        id: data.id
                    },
                    accessToken: token
                });
            }).catch(() => {
                SecureStore.deleteItemAsync('spotify_token');
            });
          }
      });
  }, []);

  return { 
      data: session, 
      status: session ? 'authenticated' : 'unauthenticated', 
      signIn: () => promptAsync() 
  };
};
