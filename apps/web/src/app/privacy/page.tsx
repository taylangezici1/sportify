import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/ui/Icons";

export const metadata: Metadata = { title: "Privacy" };

/** Public page; linked from the Google OAuth consent screen. */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-text">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <LogoMark size={28} />
        <span className="text-lg font-black">Sportify</span>
      </Link>
      <h1 className="text-3xl font-black">Privacy</h1>
      <p className="mt-2 text-sm text-muted">Last updated 14 September 2026</p>

      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted">
        <p>
          Sportify is a personal music-clip player. It is operated by its author for their own use and that
          of people they invite. It is not a commercial service.
        </p>
        <p>
          <span className="font-semibold text-text">What we store.</span> When you sign in with Google we keep
          your name, e-mail address and profile picture so we can recognise you, plus the tokens Google issues
          so the app can read your YouTube playlists on your behalf. We store the clips you create (a YouTube
          video id, a title, and start and end times) and which playlist you chose for chill mode. If you use
          the phone app, a device token is stored so you stay signed in.
        </p>
        <p>
          <span className="font-semibold text-text">What we read from YouTube.</span> With your permission the
          app lists your YouTube playlists and Liked Music, and searches YouTube for tracks. It never writes to
          your YouTube account and never changes your playlists.
        </p>
        <p>
          <span className="font-semibold text-text">What we share.</span> Nothing. Your data is not sold,
          shared with third parties or used for advertising. Playback goes through YouTube&apos;s embedded
          player, which is subject to{" "}
          <a href="https://policies.google.com/privacy" className="text-text underline underline-offset-4">
            Google&apos;s privacy policy
          </a>
          .
        </p>
        <p>
          <span className="font-semibold text-text">Deleting your data.</span> Delete clips from the Clips page
          at any time. To remove your account entirely, revoke Sportify&apos;s access at{" "}
          <a href="https://myaccount.google.com/permissions" className="text-text underline underline-offset-4">
            myaccount.google.com/permissions
          </a>{" "}
          and contact the author to have the stored records deleted.
        </p>
      </div>
    </main>
  );
}
