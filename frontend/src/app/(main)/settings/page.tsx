"use client";


import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Settings, User, Shield, Info, LogOut, ExternalLink } from "lucide-react";
import api from "@/lib/api";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkAiStatus = async () => {
    setIsChecking(true);
    try {
      const status = await api.request<any>("/api/conversations/status/ai");
      setAiStatus(status);
    } catch {
      setAiStatus({ ollama_running: false, model_ready: false });
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Settings size={22} className="text-[#a855f7]" />
          Settings
        </h1>
        <p className="text-[#a1a1aa] text-sm mt-1">Manage your account and application settings.</p>
      </div>

      {/* Account */}
      <section className="glass-card-static p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider flex items-center gap-2">
          <User size={14} /> Account
        </h2>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[rgba(124,58,237,0.3)] to-[rgba(168,85,247,0.15)] flex items-center justify-center text-lg font-bold border border-[rgba(168,85,247,0.2)]">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{user?.username}</p>
            <p className="text-sm text-[#71717a]">{user?.email}</p>
            <p className="text-xs text-[#3f3f46] mt-0.5">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-[#f87171] hover:bg-[rgba(248,113,113,0.1)] px-3 py-2 rounded-lg transition-colors w-fit"
        >
          <LogOut size={15} /> Log out
        </button>
      </section>

      {/* AI Status */}
      <section className="glass-card-static p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider flex items-center gap-2">
          <Info size={14} /> AI Status
        </h2>
        <p className="text-sm text-[#a1a1aa]">
          Luma uses a local AI model via Ollama. No data is sent to the internet.
        </p>
        <button
          onClick={checkAiStatus}
          disabled={isChecking}
          className="btn-secondary text-sm px-4 py-2 w-fit flex items-center gap-2"
        >
          {isChecking
            ? <span className="h-4 w-4 border-2 border-[#a855f7]/30 border-t-[#a855f7] rounded-full animate-spin" />
            : null}
          Check AI Status
        </button>
        {aiStatus && (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${aiStatus.ollama_running ? "bg-[#34d399]" : "bg-[#f87171]"}`} />
              <span>{aiStatus.ollama_running ? "Ollama is running" : "Ollama is not running"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${aiStatus.model_ready ? "bg-[#34d399]" : "bg-[#fbbf24]"}`} />
              <span>{aiStatus.model_ready
                ? `Model '${aiStatus.required_model}' is ready`
                : `Model '${aiStatus.required_model}' is not downloaded`}</span>
            </div>
            {!aiStatus.ollama_running && (
              <p className="text-xs text-[#71717a] mt-1">
                To enable AI: install Ollama from <span className="text-[#a855f7]">ollama.com</span>, then run: <code className="bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 rounded text-xs">ollama pull phi3.5</code>
              </p>
            )}
          </div>
        )}
      </section>

      {/* Privacy */}
      <section className="glass-card-static p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider flex items-center gap-2">
          <Shield size={14} /> Privacy
        </h2>
        <div className="flex flex-col gap-2 text-sm text-[#a1a1aa]">
          <p>All your conversations, journal entries, and memories are stored <strong className="text-white">locally on this computer</strong> in a SQLite database.</p>
          <p>No conversation content is sent to external services unless you configure an external LLM (not enabled by default).</p>
          <p>Luma is an AI companion — <strong className="text-white">not a therapist, doctor, or professional advisor.</strong></p>
        </div>
      </section>

      {/* About */}
      <section className="glass-card-static p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider">About</h2>
        <div className="flex flex-col gap-1 text-sm text-[#71717a]">
          <p><span className="text-white font-medium">Luma</span> — AI Voice Companion & Personal Journal</p>
          <p>Version 0.2.0 (Phase 2 complete)</p>
          <p>Stack: Next.js · FastAPI · SQLite · Ollama · Python NLP</p>
        </div>
      </section>
    </div>
  );
}
