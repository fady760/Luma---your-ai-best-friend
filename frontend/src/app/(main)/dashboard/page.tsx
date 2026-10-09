"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { MessageSquare, Mic, ListTodo, Brain, Clock, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header Section */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Good day, {user?.username}</h1>
        <p className="text-[#a1a1aa]">How can Luma assist you today?</p>
      </header>

      {/* Main Action Cards (Similar to Orby design) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/chat?mode=text" className="glass-card p-6 flex flex-col items-center justify-center gap-4 group h-48 cursor-pointer">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-[#a1a1aa] group-hover:bg-[rgba(168,85,247,0.1)] group-hover:text-[#c084fc] transition-colors shadow-inner">
            <MessageSquare size={28} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold group-hover:text-white transition-colors">Chat with Luma</h3>
            <p className="text-sm text-[#71717a]">Start a text conversation</p>
          </div>
        </Link>

        <Link href="/chat?mode=voice" className="glass-card p-6 flex flex-col items-center justify-center gap-4 group h-48 cursor-pointer border-[rgba(168,85,247,0.2)] hover:border-[#a855f7]">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(124,58,237,0.4)] to-[rgba(168,85,247,0.2)] text-[#c084fc] shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <div className="absolute inset-0 rounded-full border border-[rgba(168,85,247,0.5)] animate-pulse-glow" />
            <Mic size={28} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">Speak with Luma</h3>
            <p className="text-sm text-[#a1a1aa]">Start a voice conversation</p>
          </div>
        </Link>
      </div>

      {/* Conversation Modes Categories */}
      <section className="flex flex-col gap-4 mt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#f5f5f5]">Modes</h2>
          <span className="text-xs text-[#71717a] cursor-pointer hover:text-white">Learn more</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <button className="glass-card-static p-4 flex flex-col items-center gap-3 hover:bg-[rgba(255,255,255,0.06)] transition-colors">
            <div className="h-10 w-10 rounded-full bg-[rgba(168,85,247,0.1)] text-[#c084fc] flex items-center justify-center border border-[rgba(168,85,247,0.2)]">
              <Brain size={18} />
            </div>
            <span className="text-xs font-medium text-center">Talk & Reflect</span>
          </button>
          
          <button className="glass-card-static p-4 flex flex-col items-center gap-3 hover:bg-[rgba(255,255,255,0.06)] transition-colors">
            <div className="h-10 w-10 rounded-full bg-[rgba(52,211,153,0.1)] text-[#34d399] flex items-center justify-center border border-[rgba(52,211,153,0.2)]">
              <ListTodo size={18} />
            </div>
            <span className="text-xs font-medium text-center">Problem Solver</span>
          </button>

          <button className="glass-card-static p-4 flex flex-col items-center gap-3 hover:bg-[rgba(255,255,255,0.06)] transition-colors">
            <div className="h-10 w-10 rounded-full bg-[rgba(96,165,250,0.1)] text-[#60a5fa] flex items-center justify-center border border-[rgba(96,165,250,0.2)]">
              <Clock size={18} />
            </div>
            <span className="text-xs font-medium text-center">Goal Planner</span>
          </button>
        </div>
      </section>

      {/* Recent Activity (Placeholder for Phase 1) */}
      <section className="flex flex-col gap-4 mt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#f5f5f5]">Recent Activity</h2>
          <Link href="/chat" className="text-xs text-[#71717a] hover:text-white flex items-center">
            See All <ChevronRight size={14} />
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <div className="glass-card-static p-4 flex items-center gap-4 cursor-pointer hover:bg-[rgba(255,255,255,0.06)] transition-colors">
             <div className="h-10 w-10 rounded-full bg-[rgba(255,255,255,0.05)] text-[#a1a1aa] flex items-center justify-center flex-shrink-0">
               <MessageSquare size={18} />
             </div>
             <div className="flex-1 overflow-hidden">
               <h4 className="text-sm font-medium text-[#e4e4e7] truncate">Welcome to Luma</h4>
               <p className="text-xs text-[#71717a] truncate">Just now • Setup completed</p>
             </div>
          </div>
          
          <div className="p-4 text-center text-sm text-[#71717a] border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl">
            More recent activity will appear here as you use Luma.
          </div>
        </div>
      </section>
    </div>
  );
}
