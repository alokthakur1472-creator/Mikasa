const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || `API Error: ${response.status}`);
  }
  return data;
}

export const getBackendHealth = () => apiRequest("/api/health");
export const getSystemStatus = () => apiRequest("/api/system");
export const getConversations = () => apiRequest("/api/conversations");
export const createConversation = (title = "New Conversation") =>
  apiRequest("/api/conversations", { method: "POST", body: JSON.stringify({ title }) });
export const getConversation = (id) => apiRequest(`/api/conversations/${id}`);
export const deleteConversation = (id) => apiRequest(`/api/conversations/${id}`, { method: "DELETE" });

export function sendChatMessage(message, conversationId = null, mode = "chat") {
  if (!message?.trim()) throw new Error("Message cannot be empty.");
  return apiRequest(mode === "agent" ? "/api/agent" : "/api/chat", {
    method: "POST",
    body: JSON.stringify({ message: message.trim(), conversation_id: conversationId, mode })
  });
}

export const getMemories = (query = "") =>
  apiRequest(`/api/memory${query ? `?q=${encodeURIComponent(query)}` : ""}`);
export const addMemory = (content, category = "general") =>
  apiRequest("/api/memory", { method: "POST", body: JSON.stringify({ content, category }) });
export const deleteMemory = (id) => apiRequest(`/api/memory/${id}`, { method: "DELETE" });
export const openApp = (app) =>
  apiRequest("/api/actions/open-app", { method: "POST", body: JSON.stringify({ app, confirmed: true }) });
export const openUrl = (url) =>
  apiRequest("/api/actions/open-url", { method: "POST", body: JSON.stringify({ url, confirmed: true }) });

export const getDocuments = () => apiRequest("/api/documents");
export const uploadDocument = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_BASE_URL}/api/documents/upload`, { method: "POST", body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Upload failed: ${response.status}`);
  return data;
};
export const deleteDocument = (id) => apiRequest(`/api/documents/${id}`, { method: "DELETE" });
export const askDocuments = (question, documentIds = null) =>
  apiRequest("/api/documents/ask", { method: "POST", body: JSON.stringify({ question, document_ids: documentIds }) });
