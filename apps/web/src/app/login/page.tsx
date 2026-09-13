"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { IconFlame, IconGoogle, IconScissors, IconSnowflake, LogoMark } from "@/components/ui/Icons";
import { Button } from "@/components/ui/primitives";

const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "That e-mail is already linked to another sign-in method.",
  AccessDenied: "Google sign-in was cancelled or access was denied.",
  Configuration: "Google sign-in is not configured. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
  RefreshAccessTokenError: "Your Google session expired. Please sign in again.",
};

function LoginContent() {
  const params = useSearchParams();
  const error = params.get("error");
  const [loading, setLoading] = useState(false);

  return (
    <main className="flex min-h-dvh flex-col bg-bg">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-12 px-6 py-16 md:flex-row md:items-center md:gap-20">
        <section className="flex-1">
          <div className="mb-6 flex items-center gap-3">
            <LogoMark size={44} />
            <span className="text-3xl font-black tracking-tight">Sportify</span>
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
            The best 30 seconds
            <br />
            of every song.
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted">
            Clip the drops, the riffs and the choruses from YouTube Music, then let them run back to back
            while you lift. Switch to chill mode and it shuffles a full playlist instead.
          </p>
          <ul className="mt-8 flex flex-col gap-3 text-sm text-muted">
            <li className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-3 text-text">
                <IconScissors size={16} />
              </span>
              Clip any track with a two-handle range slider and 0.1s nudges.
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-workout/15 text-workout">
                <IconFlame size={16} />
              </span>
              Workout mode shuffles your clips and never stops between sets.
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-chill/15 text-chill">
                <IconSnowflake size={16} />
              </span>
              Chill mode shuffles any of your YouTube Music playlists.
            </li>
          </ul>
        </section>

        <section className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-2xl md:p-8">
          <h2 className="text-xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-muted">Your clips are saved to your Google account.</p>
          {error && (
            <p className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {ERRORS[error] ?? `Sign-in failed (${error}).`}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            className="mt-6 w-full"
            loading={loading}
            icon={<IconGoogle size={18} />}
            onClick={() => {
              setLoading(true);
              void signIn("google", { callbackUrl: "/" });
            }}
          >
            Continue with Google
          </Button>
          <p className="mt-4 text-xs leading-relaxed text-subtle">
            We ask for read-only access to YouTube so we can list your playlists and Liked Music. Nothing is
            ever written to your YouTube account.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
