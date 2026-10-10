/**
 * Luma API Client
 *
 * Centralized HTTP client for communicating with the FastAPI backend.
 * Handles authentication headers, error responses, and token management.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiError {
  detail: string;
}

class LumaApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get the stored auth token from localStorage.
   */
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("luma_token");
  }

  /**
   * Store the auth token in localStorage.
   */
  setToken(token: string): void {
    localStorage.setItem("luma_token", token);
  }

  /**
   * Remove the stored auth token (logout).
   */
  clearToken(): void {
    localStorage.removeItem("luma_token");
  }

  /**
   * Check if user is authenticated (has a token).
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Make an authenticated API request.
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // Response body was not JSON
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // ─── Auth Endpoints ─────────────────────────────────────────────

  async register(username: string, email: string, password: string) {
    return this.request<{
      id: number;
      username: string;
      email: string;
      created_at: string;
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(username: string, password: string) {
    const data = await this.request<{
      access_token: string;
      token_type: string;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return this.request<{
      id: number;
      username: string;
      email: string;
      created_at: string;
    }>("/api/auth/me");
  }

  logout(): void {
    this.clearToken();
  }

  // ─── Conversation Endpoints (Phase 2) ──────────────────────────

  async getConversations(limit = 20, offset = 0) {
    return this.request<any[]>(
      `/api/conversations?limit=${limit}&offset=${offset}`
    );
  }

  async getConversation(id: number) {
    return this.request<any>(`/api/conversations/${id}`);
  }

  async createConversation(mode: string, title?: string) {
    return this.request<any>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ mode, title }),
    });
  }

  async deleteConversation(id: number) {
    return this.request<void>(`/api/conversations/${id}`, {
      method: "DELETE",
    });
  }

  async sendMessage(conversationId: number, content: string) {
    return this.request<any>(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  // ─── Journal Endpoints (Phase 3) ──────────────────────────────

  async getJournalEntries(limit = 20, offset = 0) {
    return this.request<any[]>(
      `/api/journal?limit=${limit}&offset=${offset}`
    );
  }

  async createJournalEntry(title: string, content: string, conversationId?: number) {
    return this.request<any>("/api/journal", {
      method: "POST",
      body: JSON.stringify({ title, content, conversation_id: conversationId }),
    });
  }

  async updateJournalEntry(id: number, title: string, content: string) {
    return this.request<any>(`/api/journal/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title, content }),
    });
  }

  async deleteJournalEntry(id: number) {
    return this.request<void>(`/api/journal/${id}`, {
      method: "DELETE",
    });
  }

  async generateJournalDraft(conversationId: number) {
    return this.request<any>(
      `/api/journal/generate/${conversationId}`,
      { method: "POST" }
    );
  }

  // ─── Search Endpoints (Phase 5) ───────────────────────────────

  async semanticSearch(query: string, limit = 10) {
    return this.request<any[]>(
      `/api/memories/search?query=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  // ─── Memory Endpoints (Phase 5) ───────────────────────────────

  async getMemories() {
    return this.request<any[]>("/api/memories");
  }

  async createMemory(content: string) {
    return this.request<any>("/api/memories", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  async updateMemory(id: number, content: string) {
    return this.request<any>(`/api/memories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  }

  async deleteMemory(id: number) {
    return this.request<void>(`/api/memories/${id}`, {
      method: "DELETE",
    });
  }

  // ─── Voice Endpoints (Phase 4) ───────────────────────────────

  async getVoiceStatus() {
    return this.request<any>("/api/voice/status");
  }

  async transcribeAudio(audioBlob: Blob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");

    // We can't use this.request directly because it sets Content-Type to application/json by default
    // and fetch needs to set the multipart/form-data boundary automatically.
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/voice/transcribe`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Transcription failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorMessage;
      } catch {
        // Response body was not JSON
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // ─── Health Check ─────────────────────────────────────────────

  async healthCheck() {
    return this.request<{ status: string; service: string }>("/api/health");
  }
}

// Singleton instance
export const api = new LumaApiClient(API_BASE_URL);
export default api;
