"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePlayer } from "@/context/PlayerContext";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { mode, toggleMode } = usePlayer();

  const links = [
    { href: "/", label: "My Playlists" },
    { href: "/clips", label: "My Clips" },
    { href: "/search", label: "Search" },
    { href: "/example-clips", label: "Example Clips" },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-neutral-900 rounded-md text-white border border-neutral-800"
        aria-label="Open Menu"
      >
        <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-black border-r border-neutral-800 flex flex-col h-full
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-6 relative">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-green-500">Sportify</h1>
            {/* Close Button (Mobile Only) */}
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden text-neutral-400 hover:text-white"
              aria-label="Close Menu"
            >
              <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <button
              onClick={toggleMode}
              className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === 'workout' 
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-500' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-indigo-500'
              }`}
            >
              {mode === 'workout' ? (
                <>
                  <span className="text-xl">🔥</span>
                  <span>WORKOUT</span>
                </>
              ) : (
                <>
                  <span className="text-xl">🧊</span>
                  <span>CHILL</span>
                </>
              )}
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-md transition-colors font-medium ${
                    isActive
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
