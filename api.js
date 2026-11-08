
const API_BASE_URL = "http://127.0.0.1:8000";

// COMMON API REQUEST HANDLER
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || data.message || `API Error: ${response.status}`
    );
  }

  return data;
}

// BACKEND HEALTH
export async function getBackendHealth() {
  return apiRequest("/api/health");
}

// SYSTEM STATUS
export async function getSystemStatus() {
  return apiRequest("/api/system");
}

// GET ALL CONVERSATIONS
export async function getConversations() {
  return apiRequest("/api/conversations");
}

// CREATE CONVERSATION
export async function createConversation(title = "New Conversation") {
  return apiRequest("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ title })
  });
}

// GET CONVERSATION MESSAGES
export async function getConversation(conversationId) {
  return apiRequest(`/api/conversations/${conversationId}`);
}

// DELETE CONVERSATION
export async function deleteConversation(conversationId) {
  return apiRequest(`/api/conversations/${conversationId}`, {
    method: "DELETE"
  });
}

// SEND CHAT MESSAGE
export async function sendChatMessage(message, conversationId = null) {
  if (!message || !message.trim()) {
    throw new Error("Message cannot be empty.");
  }

  return apiRequest("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      message: message.trim(),
      conversation_id: conversationId
    })
  });
}
