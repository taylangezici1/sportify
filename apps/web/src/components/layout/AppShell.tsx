"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { usePlayer } from "@/context/PlayerContext";
import PlayerStage from "@/components/player/PlayerStage";
import MiniPlayer from "@/components/player/MiniPlayer";
import { IconAlert, LogoMark } from "@/components/ui/Icons";
import { Button } from "@/components/ui/primitives";
import Sidebar from "./Sidebar";
import MobileTabBar from "./MobileTabBar";

// Rendered without the app chrome and without the signed-in redirect.
const PUBLIC_PATHS = ["/login", "/mobile/login", "/privacy"];

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/** Global keyboard shortcuts, active anywhere except inside form fields. */
function useShortcuts() {
  const { togglePlay, next, previous, seek, position, toggleShuffle, toggleMute, isActive } = usePlayer();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isEditableTarget(e.target)) return;
      if (!isActive) return;
      switch (e.key) {
        case " ":
          if (e.target instanceof HTMLButtonElement) return;
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(position + 5000);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(position - 5000);
          break;
        case "n":
          next();
          break;
        case "p":
          previous();
          break;
        case "s":
          toggleShuffle();
          break;
        case "m":
          toggleMute();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, next, previous, seek, position, toggleShuffle, toggleMute, isActive]);
}

function Splash() {
  return (
    <div className="flex h-dvh items-center justify-center bg-bg">
      <div className="animate-pulse">
        <LogoMark size={48} />
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { status, data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(pathname);
  useShortcuts();

  useEffect(() => {
    if (status === "unauthenticated" && !isPublic) router.replace("/login");
    if (status === "authenticated" && pathname === "/login") router.replace("/");
  }, [status, isPublic, pathname, router]);

  if (isPublic) {
    return status === "authenticated" && pathname === "/login" ? <Splash /> : <>{children}</>;
  }
  if (status !== "authenticated") return <Splash />;

  const sessionExpired = session?.error === "RefreshAccessTokenError";

  return (
    <>
      <div className="flex h-dvh flex-col bg-bg">
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-y-auto">
            {sessionExpired && (
              <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2 text-sm">
                <IconAlert size={16} className="shrink-0 text-workout" />
                <span className="flex-1">Your Google session expired, so playlists cannot load.</span>
                <Button size="sm" variant="primary" onClick={() => signIn("google")}>
                  Sign in again
                </Button>
              </div>
            )}
            {children}
          </main>
        </div>
        {pathname !== "/player" && <MiniPlayer />}
        <MobileTabBar />
      </div>
      <PlayerStage />
    </>
  );
}
