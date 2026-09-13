"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, isNavActive } from "./Sidebar";

export default function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="pb-safe z-30 flex shrink-0 border-t border-line bg-surface md:hidden" aria-label="Primary">
      {NAV.map(({ href, label, Icon }) => {
        const active = isNavActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              active ? "text-text" : "text-subtle hover:text-muted"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
