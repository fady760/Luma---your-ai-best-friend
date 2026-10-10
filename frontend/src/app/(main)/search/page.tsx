"use client";


import { useState } from "react";
import Link from "next/link";
import { Search, Lightbulb, Clock, ChevronRight } from "lucide-react";
import api from "@/lib/api";

interface MemorySearchResult {
  id: number;
  content: string;
  score: number;
  updated_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemorySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    try {
      const data = await api.semanticSearch(query.trim()) as MemorySearchResult[];
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Semantic Search</h1>
        <p className="text-[#a1a1aa] text-sm mt-1">Find your saved memories by meaning, not just keywords.</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525b]" />
          <input
            type="text"
            placeholder='e.g. "times I felt overwhelmed" or "my career goals"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 flex-shrink-0"
        >
          {isSearching
            ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Search size={15} />}
          Search
        </button>
      </form>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.2)] text-[#fbbf24] text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {hasSearched && !isSearching && (
        results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Search size={36} className="text-[#3f3f46]" />
            <p className="font-medium text-[#a1a1aa]">No results found</p>
            <p className="text-sm text-[#52525b]">Try a different search to find matching memories.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#71717a]">{results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;</p>
            {results.map((r) => (
              <Link
                key={r.id}
                href="/memories"
                className="glass-card px-5 py-4 flex items-start gap-4 group hover:bg-[rgba(255,255,255,0.03)] transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-[rgba(168,85,247,0.1)] flex items-center justify-center flex-shrink-0 border border-[rgba(168,85,247,0.2)] mt-0.5">
                  <Lightbulb size={16} className="text-[#a855f7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">Saved Memory</p>
                    <span className="text-xs text-[#a855f7] bg-[rgba(168,85,247,0.1)] px-2 py-0.5 rounded-full flex-shrink-0">
                      {Math.round(r.score * 100)}% match
                    </span>
                  </div>
                  <p className="text-sm text-[#d4d4d8] line-clamp-3 leading-relaxed mt-1">{r.content}</p>
                  <p className="text-xs text-[#52525b] mt-3 flex items-center gap-1">
                    <Clock size={12} /> {formatDate(r.updated_at)}
                  </p>
                </div>
                <ChevronRight size={16} className="text-[#3f3f46] group-hover:text-[#a1a1aa] transition-colors flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
