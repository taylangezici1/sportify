"use client";

import { useState, useEffect, useRef } from "react";

interface SearchInputProps {
  onSearch: (query: string) => void;
}

export default function SearchInput({ onSearch }: SearchInputProps) {
  const [value, setValue] = useState("");
  const onSearchRef = useRef(onSearch);
  const lastSearchedValueRef = useRef(value);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value !== lastSearchedValueRef.current) {
        onSearchRef.current(value);
        lastSearchedValueRef.current = value;
      }
    }, 1000); // 1000ms delay

    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-4 border border-neutral-800 rounded-lg leading-5 bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:bg-neutral-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 sm:text-lg transition-colors"
        placeholder="Search for songs..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
    </div>
  );
}
