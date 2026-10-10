"use client";



import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Mic,
  ListTodo,
  Brain,
  Target,
  Clock,
  ChevronRight,
  Plus,
} from "lucide-react";
import api from "@/lib/api";

type Mode = "talk_reflect" | "problem_solver" | "goal_planner";

interface Conversation {
  id: number;
  title: string;
  mode: Mode;
  updated_at: string;
  message_count: number;
}

const MODE_META: Record<Mode, { icon: typeof Brain; color: string; bgColor: string; label: string }> = {
  talk_reflect:   { icon: Brain,    color: "text-[#a855f7]", bgColor: "bg-[rgba(168,85,247,0.1)] border-[rgba(168,85,247,0.2)]", label: "Talk & Reflect" },
  problem_solver: { icon: ListTodo, color: "text-[#34d399]", bgColor: "bg-[rgba(52,211,153,0.1)] border-[rgba(52,211,153,0.2)]",   label: "Problem Solver" },
  goal_planner:   { icon: Target,   color: "text-[#60a5fa]", bgColor: "bg-[rgba(96,165,250,0.1)] border-[rgba(96,165,250,0.2)]",   label: "Goal Planner" },
};

function formatRelative(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentConvs, setRecentConvs] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getConversations(5, 0)
      .then((data) => setRecentConvs(data as Conversation[]))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header */}
      <header>
        <p className="text-[#a1a1aa] text-sm">{greeting}</p>
        <h1 className="text-3xl font-bold tracking-tight">{user?.username}</h1>
      </header>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/chat"
          className="glass-card p-6 flex flex-col items-center justify-center gap-4 h-44 group cursor-pointer"
        >
          <div className="h-14 w-14 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#71717a] group-hover:bg-[rgba(168,85,247,0.12)] group-hover:text-[#c084fc] transition-all">
            <MessageSquare size={26} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold group-hover:text-white transition-colors">Chat with Luma</h3>
            <p className="text-sm text-[#71717a]">Start a text conversation</p>
          </div>
        </Link>

        <Link
          href="/chat"
          className="glass-card p-6 flex flex-col items-center justify-center gap-4 h-44 group cursor-pointer border-[rgba(168,85,247,0.15)]"
        >
          <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-[rgba(124,58,237,0.4)] to-[rgba(168,85,247,0.15)] flex items-center justify-center text-[#c084fc] shadow-[0_0_28px_rgba(168,85,247,0.25)]">
            <div className="absolute inset-0 rounded-full border border-[rgba(168,85,247,0.4)] animate-pulse" />
            <Mic size={26} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-white">Speak with Luma</h3>
            <p className="text-sm text-[#a1a1aa]">Voice conversation (Phase 4)</p>
          </div>
        </Link>
      </div>

      {/* Conversation Modes */}
      <section>
        <h2 className="text-base font-semibold mb-3">Start a Mode</h2>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(MODE_META) as [Mode, typeof MODE_META[Mode]][]).map(([key, cfg]) => (
            <Link
              key={key}
              href={`/chat?mode=${key}`}
              className={`glass-card-static p-4 flex flex-col items-center gap-2.5 hover:bg-[rgba(255,255,255,0.06)] transition-colors border`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${cfg.bgColor}`}>
                <cfg.icon size={18} className={cfg.color} />
              </div>
              <span className="text-xs font-medium text-center leading-tight">{cfg.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Recent Conversations</h2>
          <Link href="/chat/history" className="flex items-center gap-1 text-xs text-[#71717a] hover:text-white transition-colors">
            See All <ChevronRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-[rgba(255,255,255,0.03)] animate-pulse" />
            ))}
          </div>
        ) : recentConvs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center border border-dashed border-[rgba(255,255,255,0.08)] rounded-xl">
            <Clock size={28} className="text-[#3f3f46]" />
            <p className="text-sm text-[#52525b]">Your recent conversations will appear here</p>
            <Link href="/chat" className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5">
              <Plus size={14} />
              Start Chatting
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentConvs.map((conv) => {
              const meta = MODE_META[conv.mode] || MODE_META.talk_reflect;
              const ModeIcon = meta.icon;
              return (
                <Link
                  key={conv.id}
                  href={`/chat?id=${conv.id}`}
                  className="glass-card px-4 py-3.5 flex items-center gap-3 group"
                >
                  <div className="h-9 w-9 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center flex-shrink-0 border border-[rgba(255,255,255,0.07)]">
                    <ModeIcon size={15} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-[#52525b]">
                      {meta.label} · {formatRelative(conv.updated_at)}
                    </p>
                  </div>
                  <ChevronRight size={15} className="text-[#3f3f46] group-hover:text-[#a1a1aa] transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
