"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Book, Plus, Search, Trash2, Edit3, Save, X,
  Sparkles, AlertCircle, ChevronRight, MessageSquare,
} from "lucide-react";
import api from "@/lib/api";

interface JournalEntry {
  id: number;
  title: string;
  content: string;
  conversation_id: number | null;
  created_at: string;
  updated_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ─── Editor Modal ─────────────────────────────────────────────────

function EntryEditor({
  entry,
  onSave,
  onClose,
}: {
  entry: Partial<JournalEntry> | null;
  onSave: (title: string, content: string, id?: number) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(entry?.title || "");
  const [content, setContent] = useState(entry?.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!content.trim()) { setError("Content is required"); return; }
    setIsSaving(true);
    try {
      await onSave(title.trim(), content.trim(), entry?.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl glass-card-static p-6 flex flex-col gap-4 max-h-[90vh]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{entry?.id ? "Edit Entry" : "New Journal Entry"}</h2>
          <button onClick={onClose} className="text-[#71717a] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-[#f87171] text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Entry title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field text-base font-medium"
        />

        <textarea
          placeholder="Write your thoughts here…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input-field flex-1 resize-none text-sm leading-relaxed min-h-[280px]"
        />

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
            {isSaving ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Draft Review Modal ───────────────────────────────────────────

function DraftReview({
  draft,
  title,
  conversationId,
  isFallback,
  onSave,
  onClose,
}: {
  draft: string;
  title: string;
  conversationId: number;
  isFallback: boolean;
  onSave: (title: string, content: string) => Promise<void>;
  onClose: () => void;
}) {
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(draft);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editTitle.trim(), editContent.trim());
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl glass-card-static p-6 flex flex-col gap-4 max-h-[90vh]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles size={18} className="text-[#a855f7]" />
            Review AI Draft
          </h2>
          <button onClick={onClose} className="text-[#71717a] hover:text-white transition-colors"><X size={20} /></button>
        </div>

        {isFallback && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] text-[#fbbf24] text-xs">
            <AlertCircle size={13} /> AI was offline — this is an extractive draft. Please review and edit carefully.
          </div>
        )}

        <p className="text-xs text-[#71717a]">Review and edit before saving. This is a suggested draft — you are in full control.</p>

        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="input-field font-medium"
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="input-field resize-none text-sm leading-relaxed min-h-[280px]"
        />

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary px-5 py-2.5 text-sm">Discard</button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
            {isSaving ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
            Save to Journal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Generate From Conversation Picker ───────────────────────────

function ConversationPicker({
  onSelect,
  onClose,
}: {
  onSelect: (id: number) => void;
  onClose: () => void;
}) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getConversations(30, 0).then((data) => setConversations(data as any[])).finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md glass-card-static p-6 flex flex-col gap-4 max-h-[80vh]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Choose a Conversation</h2>
          <button onClick={onClose} className="text-[#71717a] hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-xs text-[#71717a]">Select a conversation to generate a journal draft from.</p>
        <div className="flex flex-col gap-2 overflow-y-auto">
          {isLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-[rgba(255,255,255,0.03)] animate-pulse" />)
          ) : conversations.length === 0 ? (
            <p className="text-sm text-[#52525b] text-center py-8">No conversations yet.</p>
          ) : conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => { onSelect(conv.id); onClose(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl glass-card-static hover:bg-[rgba(255,255,255,0.07)] text-left transition-colors"
            >
              <MessageSquare size={15} className="text-[#a855f7] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <p className="text-xs text-[#52525b]">{conv.message_count} messages</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingEntry, setEditingEntry] = useState<Partial<JournalEntry> | null | "new">(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [draft, setDraft] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getJournalEntries(50, 0) as JournalEntry[];
      setEntries(data);
    } catch { setError("Could not load journal entries."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (title: string, content: string, id?: number) => {
    if (id) {
      const updated = await api.updateJournalEntry(id, title, content) as JournalEntry;
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } else {
      const created = await api.createJournalEntry(title, content, draft?.conversation_id) as JournalEntry;
      setEntries((prev) => [created, ...prev]);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this journal entry? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.deleteJournalEntry(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch { setError("Failed to delete entry."); }
    finally { setDeletingId(null); }
  };

  const handleGenerateDraft = async (conversationId: number) => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await api.generateJournalDraft(conversationId) as any;
      setDraft(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate draft.");
    } finally { setIsGenerating(false); }
  };

  const handleDraftSave = async (title: string, content: string) => {
    const created = await api.createJournalEntry(title, content, draft?.conversation_id) as JournalEntry;
    setEntries((prev) => [created, ...prev]);
    setDraft(null);
  };

  const filtered = entries.filter((e) =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Modals */}
      {(editingEntry !== null) && (
        <EntryEditor
          entry={editingEntry === "new" ? {} : editingEntry}
          onSave={handleSave}
          onClose={() => setEditingEntry(null)}
        />
      )}
      {draft && (
        <DraftReview
          draft={draft.draft}
          title={draft.suggested_title}
          conversationId={draft.conversation_id}
          isFallback={draft.is_fallback}
          onSave={handleDraftSave}
          onClose={() => setDraft(null)}
        />
      )}
      {showPicker && (
        <ConversationPicker
          onSelect={handleGenerateDraft}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Journal</h1>
          <p className="text-[#a1a1aa] text-sm mt-1">{entries.length} {entries.length === 1 ? "entry" : "entries"}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPicker(true)}
            disabled={isGenerating}
            className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
          >
            {isGenerating
              ? <span className="h-4 w-4 border-2 border-[#a855f7]/30 border-t-[#a855f7] rounded-full animate-spin" />
              : <Sparkles size={15} className="text-[#a855f7]" />}
            Generate Draft
          </button>
          <button onClick={() => setEditingEntry("new")} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
            <Plus size={15} /> New Entry
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525b]" />
        <input
          type="text"
          placeholder="Search journal…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-[#f87171] text-sm">{error}</div>
      )}

      {/* Entries */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-[rgba(255,255,255,0.03)] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Book size={40} className="text-[#3f3f46]" />
          <div>
            <p className="font-medium text-[#a1a1aa]">{search ? "No matching entries" : "Your journal is empty"}</p>
            <p className="text-sm text-[#52525b] mt-1">{search ? "Try a different search" : "Start writing or generate a draft from a conversation"}</p>
          </div>
          {!search && (
            <button onClick={() => setEditingEntry("new")} className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2">
              <Plus size={14} /> Write First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="glass-card px-5 py-4 flex gap-4 group cursor-pointer"
              onClick={() => setEditingEntry(entry)}
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[rgba(168,85,247,0.08)] flex items-center justify-center border border-[rgba(168,85,247,0.15)]">
                <Book size={16} className="text-[#a855f7]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm mb-1 truncate">{entry.title}</p>
                <p className="text-xs text-[#71717a] line-clamp-2 leading-relaxed">{entry.content.replace(/\*\*/g, "")}</p>
                <p className="text-xs text-[#3f3f46] mt-2">{formatDate(entry.updated_at)}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingEntry(entry); }}
                  className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.08)] text-[#52525b] hover:text-white transition-colors"
                  title="Edit"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={(e) => handleDelete(entry.id, e)}
                  disabled={deletingId === entry.id}
                  className="p-2 rounded-lg hover:bg-[rgba(248,113,113,0.1)] hover:text-[#f87171] text-[#52525b] transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
