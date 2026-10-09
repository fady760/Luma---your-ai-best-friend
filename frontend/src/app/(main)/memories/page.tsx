"use client";

import { useState, useEffect, useCallback } from "react";
import { BrainCircuit, Plus, Pencil, Trash2, Save, X, AlertCircle } from "lucide-react";
import api from "@/lib/api";

interface Memory {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getMemories() as Memory[];
      setMemories(data);
    } catch { setError("Could not load memories."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const created = await api.createMemory(newContent.trim()) as Memory;
      setMemories((prev) => [created, ...prev]);
      setNewContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save memory.");
    } finally { setIsSaving(false); }
  };

  const handleUpdate = async (id: number) => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    try {
      const updated = await api.updateMemory(id, editContent.trim()) as Memory;
      setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update memory.");
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this memory? Luma will no longer remember it.")) return;
    setDeletingId(id);
    try {
      await api.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch { setError("Failed to delete memory."); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <BrainCircuit size={24} className="text-[#a855f7]" />
          Memories
        </h1>
        <p className="text-[#a1a1aa] text-sm mt-1">
          Facts and preferences you&apos;ve explicitly saved for Luma to remember.
        </p>
      </div>

      {/* Info Box */}
      <div className="px-4 py-3 rounded-xl bg-[rgba(168,85,247,0.05)] border border-[rgba(168,85,247,0.15)] text-[#a1a1aa] text-sm leading-relaxed">
        <p>Luma only remembers what you explicitly save here. You can edit or delete any memory at any time. Deleted memories are never included in future conversations.</p>
      </div>

      {/* Add New */}
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <label className="input-label">Add a new memory</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. I prefer concise responses. I'm studying computer science."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            maxLength={500}
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={!newContent.trim() || isSaving}
            className="btn-primary px-4 py-2.5 flex items-center gap-2 text-sm flex-shrink-0"
          >
            {isSaving && !editingId
              ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Plus size={16} />}
            Save
          </button>
        </div>
        <p className="text-xs text-[#52525b]">{newContent.length}/500 characters</p>
      </form>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-[#f87171] text-sm">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Memories List */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-[#a1a1aa]">{memories.length} saved {memories.length === 1 ? "memory" : "memories"}</p>

        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-[rgba(255,255,255,0.03)] animate-pulse" />)
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center border border-dashed border-[rgba(255,255,255,0.08)] rounded-xl">
            <BrainCircuit size={32} className="text-[#3f3f46]" />
            <p className="text-sm text-[#52525b]">No memories saved yet</p>
          </div>
        ) : (
          memories.map((memory) => (
            <div key={memory.id} className="glass-card-static px-4 py-3.5 flex items-start gap-3 group">
              <div className="h-8 w-8 rounded-full bg-[rgba(168,85,247,0.08)] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[rgba(168,85,247,0.15)]">
                <BrainCircuit size={14} className="text-[#a855f7]" />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === memory.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      maxLength={500}
                      className="input-field text-sm flex-1 py-1.5"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdate(memory.id)}
                      disabled={isSaving}
                      className="text-[#34d399] hover:text-green-400 p-1.5"
                      title="Save"
                    >
                      <Save size={15} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-[#71717a] hover:text-white p-1.5" title="Cancel">
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{memory.content}</p>
                )}
                <p className="text-xs text-[#3f3f46] mt-1">
                  {new Date(memory.created_at).toLocaleDateString()}
                </p>
              </div>
              {editingId !== memory.id && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingId(memory.id); setEditContent(memory.content); }}
                    className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.08)] text-[#52525b] hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(memory.id)}
                    disabled={deletingId === memory.id}
                    className="p-1.5 rounded-lg hover:bg-[rgba(248,113,113,0.1)] hover:text-[#f87171] text-[#52525b] transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
