"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { PlayerProvider } from "@/context/PlayerContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PlayerProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#262629",
              color: "#f3f3f4",
              border: "1px solid #2b2b30",
              borderRadius: 12,
              fontSize: 14,
            },
            success: { iconTheme: { primary: "#4cc9ff", secondary: "#0b0b0c" } },
            error: { iconTheme: { primary: "#ff4d4f", secondary: "#0b0b0c" } },
          }}
        />
      </PlayerProvider>
    </SessionProvider>
  );
}
