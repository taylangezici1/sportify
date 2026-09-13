"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { IconHome, IconListMusic, IconLogout, IconScissors, IconSearch, LogoMark } from "@/components/ui/Icons";
import ModeSwitch from "./ModeSwitch";

export const NAV = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/search", label: "Search", Icon: IconSearch },
  { href: "/clips", label: "Clips", Icon: IconScissors },
  { href: "/playlists", label: "Playlists", Icon: IconListMusic },
] as const;

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/playlists") return pathname.startsWith("/playlist");
  return pathname.startsWith(href);
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface md:flex">
      <Link href="/" className="flex items-center gap-2.5 px-5 pb-4 pt-6">
        <LogoMark size={30} />
        <span className="text-xl font-black tracking-tight">Sportify</span>
      </Link>

      <nav className="flex flex-col gap-1 px-3">
        {NAV.map(({ href, label, Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                active ? "bg-surface-3 text-text" : "text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 p-4">
        <div className="rounded-2xl border border-line bg-surface-2 p-3">
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-subtle">Mode</p>
          <ModeSwitch />
        </div>

        {session?.user && (
          <div className="flex items-center gap-3 rounded-2xl px-2 py-1.5">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full bg-surface-3"
                referrerPolicy="no-referrer"
                onError={(e) => (e.currentTarget.style.visibility = "hidden")}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-surface-3" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{session.user.name ?? "You"}</p>
              <p className="truncate text-[11px] text-subtle">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-full p-2 text-muted hover:bg-surface-3 hover:text-text"
              aria-label="Sign out"
              title="Sign out"
            >
              <IconLogout size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
