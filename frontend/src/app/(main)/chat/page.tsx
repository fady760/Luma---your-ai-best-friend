"use client";

/**
 * Chat Page
 *
 * Full-featured chat interface with:
 * - Mode selection (Talk & Reflect, Problem Solver, Goal Planner)
 * - Message bubbles with timestamps
 * - Typing / thinking indicator
 * - Auto-scroll to latest message
 * - Fallback notice when AI is offline
 * - New conversation button
 */

import { useState, useEffect, useRef, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Send,
  Plus,
  Brain,
  ListTodo,
  Target,
  AlertCircle,
  ChevronDown,
  Mic,
  Bot,
} from "lucide-react";
import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────

type Mode = "talk_reflect" | "problem_solver" | "goal_planner";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  is_fallback?: boolean;
}

interface Conversation {
  id: number;
  title: string;
  mode: Mode;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

// ─── Mode Config ─────────────────────────────────────────────────

const MODES: Record<Mode, { label: string; icon: typeof Brain; color: string; desc: string }> = {
  talk_reflect: {
    label: "Talk & Reflect",
    icon: Brain,
    color: "text-[#a855f7]",
    desc: "Express thoughts, reflect on experiences",
  },
  problem_solver: {
    label: "Problem Solver",
    icon: ListTodo,
    color: "text-[#34d399]",
    desc: "Break down challenges, find solutions",
  },
  goal_planner: {
    label: "Goal Planner",
    icon: Target,
    color: "text-[#60a5fa]",
    desc: "Define goals, build action plans",
  },
};

// ─── Helper: format timestamp ─────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Typing Indicator ─────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[rgba(124,58,237,0.4)] to-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.3)] flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-[#c084fc]" />
      </div>
      <div className="glass-card-static rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-5">
          <span className="h-2 w-2 rounded-full bg-[#a855f7] animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-[#a855f7] animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-[#a855f7] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-3 mb-4 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[rgba(124,58,237,0.4)] to-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.3)] flex items-center justify-center flex-shrink-0">
          <Bot size={14} className="text-[#c084fc]" />
        </div>
      )}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Fallback warning */}
        {msg.is_fallback && (
          <div className="flex items-center gap-1.5 text-xs text-[#fbbf24] mb-1">
            <AlertCircle size={12} />
            AI offline — using scripted response
          </div>
        )}
        {/* Bubble */}
        <div
          className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white rounded-2xl rounded-br-sm shadow-[0_4px_20px_rgba(168,85,247,0.3)]"
              : "glass-card-static rounded-2xl rounded-bl-sm text-[#f5f5f5]"
          }`}
        >
          {msg.content}
        </div>
        {/* Timestamp */}
        <span className="text-[11px] text-[#52525b] px-1">{formatTime(msg.created_at)}</span>
      </div>
    </div>
  );
}

// ─── Mode Selector Modal ──────────────────────────────────────────

function ModeSelector({
  current,
  onSelect,
  onClose,
}: {
  current: Mode;
  onSelect: (m: Mode) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute top-14 left-0 right-0 z-20 px-4">
      <div className="glass-card-static p-2 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
        {(Object.entries(MODES) as [Mode, (typeof MODES)[Mode]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { onSelect(key); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
              current === key
                ? "bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.25)]"
                : "hover:bg-[rgba(255,255,255,0.05)]"
            }`}
          >
            <cfg.icon size={18} className={cfg.color} />
            <div>
              <p className="text-sm font-medium">{cfg.label}</p>
              <p className="text-xs text-[#71717a]">{cfg.desc}</p>
            </div>
            {current === key && (
              <div className="ml-auto h-2 w-2 rounded-full bg-[#a855f7]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Welcome Screen ───────────────────────────────────────────────

function WelcomeScreen({ mode, onStart }: { mode: Mode; onStart: () => void }) {
  const cfg = MODES[mode];
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-2xl opacity-30 bg-[#a855f7]" />
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-[rgba(124,58,237,0.4)] to-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.3)] flex items-center justify-center animate-pulse-glow">
          <cfg.icon size={32} className={cfg.color} />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">{cfg.label}</h2>
        <p className="text-[#a1a1aa] text-sm max-w-xs">{cfg.desc}</p>
      </div>
      <button onClick={onStart} className="btn-primary px-8">
        Start Conversation
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawMode = searchParams.get("mode") as Mode;
  const [mode, setMode] = useState<Mode>(
    rawMode && rawMode in MODES ? rawMode : "talk_reflect"
  );
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const ModeIcon = MODES[mode].icon;

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, isSending]);

  // Close mode selector on outside click
  useEffect(() => {
    if (!showModeSelector) return;
    const handler = () => setShowModeSelector(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [showModeSelector]);

  // Load existing conversation from URL
  useEffect(() => {
    const convId = searchParams.get("id");
    if (!convId) return;
    api.getConversation(Number(convId)).then((conv) => {
      setConversation(conv as Conversation);
      setMode(conv.mode as Mode);
    }).catch(() => setError("Could not load conversation."));
  }, [searchParams]);

  const startConversation = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const conv = await api.createConversation(mode) as Conversation;
      conv.messages = [];
      setConversation(conv);
      router.replace(`/chat?id=${conv.id}`);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      setError("Could not start a new conversation. Is the backend running?");
    } finally {
      setIsStarting(false);
    }
  };

  const startNew = async () => {
    setConversation(null);
    router.push(`/chat?mode=${mode}`);
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversation || isSending) return;

    const text = input.trim();
    setInput("");
    setIsSending(true);
    setError(null);

    // Optimistically add the user message
    const optimisticUser: Message = {
      id: Date.now(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setConversation((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimisticUser] } : prev
    );

    try {
      const result = await api.sendMessage(conversation.id, text) as Message[];
      // Replace optimistic message with real messages from server
      setConversation((prev) => {
        if (!prev) return prev;
        const withoutOptimistic = prev.messages.filter((m) => m.id !== optimisticUser.id);
        return { ...prev, messages: [...withoutOptimistic, ...result] };
      });
    } catch (err) {
      setConversation((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimisticUser.id) } : prev
      );
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as unknown as FormEvent);
    }
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (!conversation) {
      router.replace(`/chat?mode=${newMode}`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] -m-6 lg:-m-8">

      {/* ─── Top Bar ─────────────────────────────────────────── */}
      <div className="relative flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(13,11,28,0.6)] backdrop-blur-md flex-shrink-0 z-10">
        {/* Mode selector button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowModeSelector((v) => !v); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card-static hover:bg-[rgba(255,255,255,0.08)] transition-colors text-sm"
        >
          <ModeIcon size={15} className={MODES[mode].color} />
          <span className="font-medium">{MODES[mode].label}</span>
          <ChevronDown size={14} className="text-[#71717a]" />
        </button>

        {/* Conversation title */}
        {conversation && (
          <p className="text-sm text-[#71717a] truncate flex-1">{conversation.title}</p>
        )}

        {/* New conversation */}
        <button
          onClick={startNew}
          title="New conversation"
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#a1a1aa] hover:text-white hover:bg-[rgba(255,255,255,0.07)] transition-colors"
        >
          <Plus size={14} />
          New
        </button>

        {showModeSelector && (
          <ModeSelector
            current={mode}
            onSelect={handleModeChange}
            onClose={() => setShowModeSelector(false)}
          />
        )}
      </div>

      {/* ─── Messages Area ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-0">
        {!conversation ? (
          <WelcomeScreen
            mode={mode}
            onStart={isStarting ? () => {} : startConversation}
          />
        ) : conversation.messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center pt-20">
            <ModeIcon size={32} className={`${MODES[mode].color} mb-3 opacity-50`} />
            <p className="text-[#71717a] text-sm">Say something to start the conversation</p>
          </div>
        ) : (
          <>
            {conversation.messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isSending && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Error Banner ────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-[#f87171] text-sm">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* ─── Input Bar ───────────────────────────────────────── */}
      {conversation && (
        <div className="px-4 pb-4 pt-2 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(13,11,28,0.4)] backdrop-blur-md flex-shrink-0">
          <form onSubmit={sendMessage} className="flex items-end gap-3">
            {/* Voice button placeholder (Phase 4) */}
            <button
              type="button"
              title="Voice input (coming soon)"
              className="flex-shrink-0 h-11 w-11 rounded-full border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#52525b] hover:text-[#a1a1aa] transition-colors"
            >
              <Mic size={18} />
            </button>

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                id="chat-input"
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                className="w-full resize-none rounded-2xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.09)] px-4 py-3 text-sm text-[#f5f5f5] placeholder-[#52525b] outline-none focus:border-[rgba(168,85,247,0.4)] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] transition-all leading-relaxed"
                style={{ minHeight: "44px", maxHeight: "160px" }}
                disabled={isSending}
              />
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="flex-shrink-0 h-11 w-11 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-white shadow-[0_4px_20px_rgba(168,85,247,0.35)] hover:shadow-[0_4px_28px_rgba(168,85,247,0.5)] transition-shadow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="text-center text-[10px] text-[#3f3f46] mt-2">
            Luma is an AI companion — not a therapist or medical professional.
          </p>
        </div>
      )}
    </div>
  );
}
