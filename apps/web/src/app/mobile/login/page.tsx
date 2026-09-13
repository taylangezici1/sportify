"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { IconAlert, IconCheck, IconLoader, LogoMark } from "@/components/ui/Icons";
import { Button } from "@/components/ui/primitives";

const ALLOWED = /^(sportify|exp|exps):\/\//i;

/**
 * Hand-off page for the phone app. The app opens this in the system browser;
 * once the user is signed in we mint a device token and bounce back into the
 * app through its deep link with `?token=…`.
 */
function MobileLoginContent() {
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "";
  const { status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);

  const validRedirect = ALLOWED.test(redirect);

  useEffect(() => {
    if (!validRedirect) return;
    if (status === "unauthenticated") {
      void signIn("google", { callbackUrl: window.location.href });
      return;
    }
    if (status !== "authenticated" || target) return;

    (async () => {
      try {
        const res = await fetch("/api/mobile/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: navigator.userAgent.slice(0, 80) }),
        });
        if (!res.ok) throw new Error((await res.json())?.error ?? "Could not create a device token");
        const { token } = await res.json();
        const url = `${redirect}${redirect.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
        setTarget(url);
        window.location.replace(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    })();
  }, [status, validRedirect, redirect, target]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <LogoMark size={48} />
      <h1 className="mt-6 text-2xl font-black">Connecting Sportify on your phone</h1>
      {!validRedirect ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-danger">
          <IconAlert size={16} /> This page must be opened from the Sportify app.
        </p>
      ) : error ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-danger">
          <IconAlert size={16} /> {error}
        </p>
      ) : target ? (
        <>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <IconCheck size={16} className="text-chill" /> Signed in. Returning to the app…
          </p>
          <a href={target} className="mt-6">
            <Button variant="primary">Open Sportify</Button>
          </a>
        </>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <IconLoader size={16} /> {status === "authenticated" ? "Creating a device token…" : "Signing in with Google…"}
        </p>
      )}
    </main>
  );
}

export default function MobileLoginPage() {
  return (
    <Suspense>
      <MobileLoginContent />
    </Suspense>
  );
}
