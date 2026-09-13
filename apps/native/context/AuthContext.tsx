import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { api, ApiError, configureApi, type Profile } from "@/lib/api";
import { BACKEND_URL, TOKEN_STORAGE_KEY } from "@/lib/config";

WebBrowser.maybeCompleteAuthSession();

export type AuthStatus = "loading" | "signedOut" | "signedIn";

interface AuthContextValue {
  status: AuthStatus;
  user: Profile | null;
  token: string | null;
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setChillPlaylistId: (id: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Pulls the device token out of the deep link. Uses a plain regex rather than
 * Linking.parse: the URL polyfill on Hermes rejects Expo Go's exp:// launch
 * URL, and this runs for every incoming URL.
 */
function tokenFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = /[?&]token=([^&#]+)/.exec(url);
  if (!match) return null;
  try {
    const t = decodeURIComponent(match[1]);
    return t.length > 20 ? t : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  const clearSession = useCallback(async () => {
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    setStatus("signedOut");
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY).catch(() => {});
  }, []);

  useEffect(() => {
    configureApi({
      getToken: () => tokenRef.current,
      onUnauthorized: () => {
        void clearSession();
      },
    });
  }, [clearSession]);

  const adoptToken = useCallback(
    async (t: string) => {
      tokenRef.current = t;
      setToken(t);
      try {
        const me = await api.me.get();
        setUser(me);
        setStatus("signedIn");
        await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, t);
        setError(null);
      } catch (e) {
        await clearSession();
        setError(e instanceof ApiError && e.status === 0 ? e.message : "Could not reach the Sportify backend.");
      }
    },
    [clearSession],
  );

  // Restore a stored token on launch.
  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY).catch(() => null);
      if (stored) await adoptToken(stored);
      else setStatus("signedOut");
    })();
  }, [adoptToken]);

  // Android can deliver the deep link without resolving the auth session.
  const incoming = Linking.useURL();
  useEffect(() => {
    const t = tokenFromUrl(incoming);
    if (t && t !== tokenRef.current) void adoptToken(t);
  }, [incoming, adoptToken]);

  const signIn = useCallback(async () => {
    if (!BACKEND_URL) {
      setError("Set EXPO_PUBLIC_BACKEND_URL in apps/native/.env first.");
      return;
    }
    setSigningIn(true);
    setError(null);
    try {
      const redirect = Linking.createURL("auth");
      const url = `${BACKEND_URL}/mobile/login?redirect=${encodeURIComponent(redirect)}`;
      const result = await WebBrowser.openAuthSessionAsync(url, redirect, { preferEphemeralSession: false });
      if (result.type === "success") {
        const t = tokenFromUrl(result.url);
        if (t) await adoptToken(t);
        else setError("The backend did not return a token.");
      } else if (result.type !== "cancel" && result.type !== "dismiss") {
        setError("Sign-in was interrupted.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setSigningIn(false);
    }
  }, [adoptToken]);

  const signOut = useCallback(async () => {
    try {
      await api.mobile.revokeToken();
    } catch {
      /* token may already be gone */
    }
    await clearSession();
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      setUser(await api.me.get());
    } catch {
      /* keep what we have */
    }
  }, []);

  const setChillPlaylistId = useCallback(async (id: string | null) => {
    setUser((u) => (u ? { ...u, chillPlaylistId: id } : u));
    await api.me.setChillPlaylist(id);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, token, signingIn, error, signIn, signOut, refreshProfile, setChillPlaylistId }),
    [status, user, token, signingIn, error, signIn, signOut, refreshProfile, setChillPlaylistId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
