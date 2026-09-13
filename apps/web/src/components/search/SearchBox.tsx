"use client";

import { useState, type FormEvent } from "react";
import { IconLoader, IconSearch, IconX } from "@/components/ui/Icons";

interface SearchBoxProps {
  initialValue?: string;
  loading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onSearch: (query: string) => void;
}

/**
 * Explicit-submit search. YouTube's search endpoint costs 100 quota units per
 * call, so we deliberately do not search while typing.
 */
export default function SearchBox({
  initialValue = "",
  loading,
  placeholder = "Search YouTube Music, or paste a link…",
  autoFocus,
  onSearch,
}: SearchBoxProps) {
  const [value, setValue] = useState(initialValue);
  // Adopt a new initial value (e.g. from the URL) without an effect.
  const [seen, setSeen] = useState(initialValue);
  if (seen !== initialValue) {
    setSeen(initialValue);
    setValue(initialValue);
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (q) onSearch(q);
  };

  return (
    <form onSubmit={submit} role="search" className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
        {loading ? <IconLoader size={20} /> : <IconSearch size={20} />}
      </div>
      <input
        type="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label="Search"
        className="h-14 w-full rounded-2xl border border-line bg-surface pl-12 pr-24 text-base text-text placeholder:text-subtle focus:border-subtle focus:outline-none focus:ring-2 focus:ring-white/10 [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute inset-y-0 right-2 flex items-center gap-1">
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            aria-label="Clear"
            className="rounded-full p-2 text-muted hover:bg-surface-3 hover:text-text"
          >
            <IconX size={16} />
          </button>
        )}
        <button
          type="submit"
          disabled={!value.trim() || loading}
          className="h-10 rounded-full bg-text px-4 text-sm font-bold text-bg disabled:opacity-40"
        >
          Search
        </button>
      </div>
    </form>
  );
}
