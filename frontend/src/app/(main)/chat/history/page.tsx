"use client";


/**
 * Conversation History Page
 *
 * Lists all past conversations with options to reopen or delete.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Brain,
  ListTodo,
  Target,
  Trash2,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import api from "@/lib/api";

type Mode = "talk_reflect" | "problem_solver" | "goal_planner";

interface Conversation {
  id: number;
  title: string;
  mode: Mode;
  created_at: string;
  updated_at: string;
  message_count: number;
}

const MODE_META: Record<Mode, { icon: typeof Brain; color: string; label: string }> = {
  talk_reflect:   { icon: Brain,    color: "text-[#a855f7]", label: "Talk & Reflect" },
  problem_solver: { icon: ListTodo, color: "text-[#34d399]", label: "Problem Solver" },
  goal_planner:   { icon: Target,   color: "text-[#60a5fa]", label: "Goal Planner" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getConversations(50, 0) as Conversation[];
      setConversations(data);
    } catch {
      setError("Could not load conversations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Failed to delete conversation.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conversations</h1>
          <p className="text-[#a1a1aa] text-sm mt-1">{conversations.length} total</p>
        </div>
        <Link href="/chat" className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus size={16} />
          New Chat
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525b]" />
        <input
          type="text"
          placeholder="Search conversations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-[#f87171] text-sm">
          {error}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-[rgba(255,255,255,0.03)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <MessageSquare size={40} className="text-[#3f3f46]" />
          <div>
            <p className="font-medium text-[#a1a1aa]">
              {search ? "No matching conversations" : "No conversations yet"}
            </p>
            <p className="text-sm text-[#52525b] mt-1">
              {search ? "Try a different search term" : "Start chatting with Luma to see your history here"}
            </p>
          </div>
          {!search && (
            <Link href="/chat" className="btn-primary text-sm px-6 py-2.5">
              Start First Conversation
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((conv) => {
            const meta = MODE_META[conv.mode] || MODE_META.talk_reflect;
            const ModeIcon = meta.icon;
            return (
              <Link
                key={conv.id}
                href={`/chat?id=${conv.id}`}
                className="glass-card px-5 py-4 flex items-center gap-4 group"
              >
                {/* Mode icon */}
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center border border-[rgba(255,255,255,0.07)]">
                  <ModeIcon size={18} className={meta.color} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{conv.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs ${meta.color} opacity-80`}>{meta.label}</span>
                    <span className="text-[#3f3f46] text-xs">·</span>
                    <span className="text-xs text-[#52525b]">{formatDate(conv.updated_at)}</span>
                    <span className="text-[#3f3f46] text-xs">·</span>
                    <span className="text-xs text-[#52525b]">{conv.message_count} msg{conv.message_count !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDelete(conv.id, e)}
                    disabled={deletingId === conv.id}
                    className="p-2 rounded-lg hover:bg-[rgba(248,113,113,0.1)] hover:text-[#f87171] text-[#52525b] transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                  <ChevronRight size={16} className="text-[#52525b]" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
