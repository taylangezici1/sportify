"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Map<string, Set<() => void>>();

function emit(key: string) {
  listeners.get(key)?.forEach((cb) => cb());
}

/**
 * A localStorage-backed value that is safe to render on the server (falls
 * back to `fallback` there) and stays in sync between components.
 */
export function useLocalStorageValue<T extends string>(key: string, fallback: T, isValid: (v: string) => v is T) {
  const subscribe = useCallback(
    (cb: () => void) => {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key)!.add(cb);
      const onStorage = (e: StorageEvent) => e.key === key && cb();
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.get(key)?.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  const getSnapshot = useCallback((): T => {
    try {
      const v = localStorage.getItem(key);
      return v !== null && isValid(v) ? v : fallback;
    } catch {
      return fallback;
    }
  }, [key, fallback, isValid]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

  const setValue = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, next);
      } catch {
        /* storage unavailable */
      }
      emit(key);
    },
    [key],
  );

  return [value, setValue] as const;
}
