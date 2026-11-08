import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity, BrainCircuit, Terminal, Shield, Cpu, Database, Globe, Settings,
  Plus, Send, Mic, ChevronRight, Zap, Radio, Power, Loader2, Trash2,
  MessageSquare, Volume2, VolumeX, Search, Bot, Monitor, ExternalLink,
  RefreshCw, X, Check, Sparkles
} from "lucide-react";
import "./App.css";
import {
  getBackendHealth, getSystemStatus, sendChatMessage, getConversations,
  getConversation, deleteConversation, getMemories, addMemory, deleteMemory,
  openApp, openUrl, getDocuments, uploadDocument, deleteDocument, askDocuments
} from "./api";

const modules = [
  { icon: Globe, name: "WEB INTELLIGENCE", key: "web_research" },
  { icon: BrainCircuit, name: "NEURAL MEMORY", key: "memory" },
  { icon: Database, name: "DOCUMENT ENGINE", key: "documents" },
  { icon: Shield, name: "SECURITY CORE", key: null },
  { icon: Cpu, name: "AI BRAIN", key: "ai_engine" },
  { icon: Bot, name: "AGENT MODE", key: "agent" }
];

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeNav, setActiveNav] = useState("Overview");
  const [backendOnline, setBackendOnline] = useState(false);
  const [systemStatus, setSystemStatus] = useState({});
  const [latency, setLatency] = useState(null);
  const [lastChecked, setLastChecked] = useState("--");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [chatError, setChatError] = useState("");
  const [mode, setMode] = useState("chat");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [memories, setMemories] = useState([]);
  const [memoryInput, setMemoryInput] = useState("");
  const [memoryQuery, setMemoryQuery] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [webQuery, setWebQuery] = useState("");
  const [documents, setDocuments] = useState([]);
  const [documentQuestion, setDocumentQuestion] = useState("");
  const [documentAnswer, setDocumentAnswer] = useState(null);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [documentMessage, setDocumentMessage] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const documentInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const refreshConversations = useCallback(async () => {
    const data = await getConversations();
    const saved = Array.isArray(data) ? data : data.conversations || [];
    setConversations(saved);
    return saved;
  }, []);

  const refreshMemories = useCallback(async (query = "") => {
    const data = await getMemories(query);
    setMemories(data.memories || []);
  }, []);

  const refreshDocuments = useCallback(async () => {
    const data = await getDocuments();
    setDocuments(data.documents || []);
  }, []);

  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setDocumentBusy(true); setDocumentMessage(""); setDocumentAnswer(null);
    try {
      const result = await uploadDocument(file);
      setDocumentMessage(`Indexed ${result.document.filename}: ${result.document.chunk_count} searchable sections.`);
      await refreshDocuments();
    } catch (error) { setDocumentMessage(error.message); }
    finally { setDocumentBusy(false); }
  };

  const removeDocument = async (id) => {
    if (!window.confirm("Delete this document and its indexed text?")) return;
    try { await deleteDocument(id); setSelectedDocumentIds((ids) => ids.filter((x) => x !== id)); await refreshDocuments(); setDocumentMessage("Document deleted."); }
    catch (error) { setDocumentMessage(error.message); }
  };

  const queryDocuments = async () => {
    if (!documentQuestion.trim() || documentBusy) return;
    setDocumentBusy(true); setDocumentMessage(""); setDocumentAnswer(null);
    try {
      const result = await askDocuments(documentQuestion.trim(), selectedDocumentIds.length ? selectedDocumentIds : null);
      setDocumentAnswer(result);
    } catch (error) { setDocumentMessage(error.message); }
    finally { setDocumentBusy(false); }
  };

  const formatMessages = (items = []) => items.map((item) => ({
    id: item.id, role: item.role, text: item.content, model: item.model || null
  }));

  const startNewConversation = () => {
    if (isLoading || isLoadingHistory) return;
    setActiveConversationId(null);
    setMessages([]);
    setPrompt("");
    setChatError("");
    setActiveNav("Overview");
    inputRef.current?.focus();
  };

  const openConversation = async (id) => {
    if (isLoading || isLoadingHistory) return;
    setIsLoadingHistory(true);
    setChatError("");
    try {
      const data = await getConversation(id);
      setActiveConversationId(id);
      setMessages(formatMessages(data.messages || []));
      setActiveNav("Overview");
    } catch (error) { setChatError(error.message); }
    finally { setIsLoadingHistory(false); }
  };

  const removeConversation = async (event, id) => {
    event.stopPropagation();
    if (!window.confirm("Delete this conversation permanently?")) return;
    try {
      await deleteConversation(id);
      setConversations((items) => items.filter((item) => item.id !== id));
      if (activeConversationId === id) startNewConversation();
    } catch (error) { setChatError(error.message); }
  };

  const speak = (text) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (overrideText) => {
    const userMessage = (overrideText ?? prompt).trim();
    if (!userMessage || isLoading || isLoadingHistory) return;
    if (!backendOnline) { setChatError("Backend is offline. Start FastAPI and try again."); return; }
    setChatError("");
    setPrompt("");
    setMessages((previous) => [...previous, { role: "user", text: userMessage }]);
    setIsLoading(true);
    try {
      const data = await sendChatMessage(userMessage, activeConversationId, mode);
      if (!data?.reply || data.status !== "success") throw new Error("Invalid response from MIKASA.");
      setActiveConversationId(data.conversation_id);
      setMessages((previous) => [...previous, { role: "assistant", text: data.reply, model: data.model }]);
      await refreshConversations();
      if (mode === "web" && data.sources?.length) {
        setMessages((previous) => [...previous, { role: "assistant", text: "Sources:\n" + data.sources.map((s, i) => `${i + 1}. ${s.title}\n${s.url}`).join("\n\n"), model: "WEB SOURCES" }]);
      }
      speak(data.reply);
    } catch (error) {
      setChatError(error.message);
      setMessages((previous) => [...previous, { role: "assistant", text: `Connection error: ${error.message}`, isError: true }]);
    } finally { setIsLoading(false); inputRef.current?.focus(); }
  };

  const startVoiceInput = () => {
    if (!SpeechRecognition) { setChatError("Speech recognition is not supported in this browser. Try Chrome or Edge."); return; }
    if (isListening) { recognitionRef.current?.stop(); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => { setIsListening(false); setChatError(`Voice input error: ${event.error}`); };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setPrompt(transcript);
      inputRef.current?.focus();
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const saveMemory = async () => {
    if (!memoryInput.trim()) return;
    try {
      await addMemory(memoryInput.trim(), "user_fact");
      setMemoryInput("");
      await refreshMemories(memoryQuery);
      setActionMessage("Memory saved successfully.");
    } catch (error) { setActionMessage(error.message); }
  };

  const removeMemory = async (id) => {
    if (!window.confirm("Delete this saved memory?")) return;
    try { await deleteMemory(id); await refreshMemories(memoryQuery); }
    catch (error) { setActionMessage(error.message); }
  };

  const launchApp = async (app) => {
    if (!window.confirm(`Allow MIKASA to open ${app}?`)) return;
    try { const result = await openApp(app); setActionMessage(result.message); }
    catch (error) { setActionMessage(error.message); }
  };

  const launchUrl = async () => {
    if (!webQuery.trim()) return;
    if (!window.confirm(`Open this website on your computer?\n${webQuery}`)) return;
    try { const result = await openUrl(webQuery.trim()); setActionMessage(result.message); setWebQuery(""); }
    catch (error) { setActionMessage(error.message); }
  };

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const start = Date.now();
      try {
        const [health, status] = await Promise.all([getBackendHealth(), getSystemStatus()]);
        if (!mounted) return;
        setBackendOnline(health.status === "online");
        setSystemStatus(status);
        setLatency(Date.now() - start);
        setLastChecked(new Date().toLocaleTimeString());
      } catch {
        if (!mounted) return;
        setBackendOnline(false); setSystemStatus({}); setLatency(null);
      }
    };
    check();
    const timer = window.setInterval(check, 7000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getConversations();
        const saved = data.conversations || [];
        if (!mounted) return;
        setConversations(saved);
        if (saved.length) {
          const detail = await getConversation(saved[0].id);
          if (!mounted) return;
          setActiveConversationId(saved[0].id);
          setMessages(formatMessages(detail.messages || []));
        }
      } catch (error) { console.error("History initialization failed", error); }
    })();
    refreshMemories().catch(() => {});
    refreshDocuments().catch(() => {});
    return () => { mounted = false; };
  }, [refreshMemories]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, isLoading]);
  useEffect(() => () => { recognitionRef.current?.stop(); window.speechSynthesis?.cancel(); }, []);

  const moduleStatus = (key) => {
    if (!backendOnline) return "OFFLINE";
    if (!key) return "PROTECTED";
    return String(systemStatus[key] || "UNKNOWN").replaceAll("_", " ").toUpperCase();
  };

  return (
    <div className="interface">
      <div className="background-grid" /><div className="scanlines" />
      <aside className="sidebar">
        <div className="brand"><div className="brand-symbol">M</div><div><h2>MIKASA<span>_</span></h2><small>PERSONAL AI SYSTEM</small></div></div>
        <div className="side-label">MAINFRAME</div>
        {[["Overview", Activity], ["New Conversation", Plus], ["Memory Core", BrainCircuit], ["Document Intelligence", Database], ["Command Terminal", Terminal], ["Security", Shield], ["Configuration", Settings]].map(([name, Icon]) => (
          <button key={name} className={`nav-link ${activeNav === name ? "selected" : ""}`} onClick={() => name === "New Conversation" ? startNewConversation() : setActiveNav(name)}>
            <Icon size={17} /><span>{name}</span>{activeNav === name && <ChevronRight size={15} />}
          </button>
        ))}
        <div className="side-label archive-label"><span>MEMORY ARCHIVE</span><span>{conversations.length}</span></div>
        <div className="conversation-list">
          {conversations.length === 0 ? <div className="empty-archive">No saved conversations yet.</div> : conversations.map((c) => (
            <div key={c.id} className={`conversation-item ${activeConversationId === c.id ? "active" : ""}`} onClick={() => openConversation(c.id)}>
              <MessageSquare size={14} /><span title={c.title}>{c.title || "New Conversation"}</span>
              <button title="Delete conversation" onClick={(event) => removeConversation(event, c.id)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <div className="sidebar-bottom"><div className="connection-line" /><div className="connection-status"><span className="live-dot" style={{ background: backendOnline ? "#00e5a0" : "#ff526f" }} />{backendOnline ? "BACKEND CONNECTED" : "BACKEND DISCONNECTED"}</div><small>MIKASA OS // BUILD 04.0</small></div>
      </aside>

      <main className="workspace">
        <header className="topbar"><div className="breadcrumb"><span>MIKASA</span><span className="slash">/</span><span className="muted">{activeNav.toUpperCase()}</span></div><div className="top-status"><span><Radio size={14} />{backendOnline ? "BACKEND LINK ACTIVE" : "BACKEND LINK OFFLINE"}</span><span className="top-online" style={{ color: backendOnline ? "#00e5a0" : "#ff526f" }}><i />{backendOnline ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}</span><button className="power-button" title="Connection status"><Power size={17} /></button></div></header>

        <div className="dashboard">
          <section className="main-column">
            <div className="section-heading"><div><div className="eyebrow">AUTONOMOUS INTELLIGENCE PLATFORM</div><h1>COMMAND <span>CENTER</span></h1></div><div className="session-tag">{activeConversationId ? `SESSION // ${activeConversationId}` : "NEW SESSION"}</div></div>
            <section className="core-panel">
              <div className="core-topline"><span><span className="live-dot" />{backendOnline ? "BACKEND CONNECTED" : "WAITING FOR BACKEND"}</span><span>MK-01 / {backendOnline ? "ONLINE" : "OFFLINE"}</span></div>
              <div className="core-stage"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" /><div className="core-glow" /><div className="core"><div className="core-inner"><span>M</span></div></div><div className="core-caption">MIKASA</div><div className="core-subcaption">ARTIFICIAL INTELLIGENCE</div><div className="orbit-label label-left">BACKEND LINK<b>{backendOnline ? "ACTIVE" : "OFFLINE"}</b></div><div className="orbit-label label-right">API LATENCY<b>{latency === null ? "--" : `${latency} MS`}</b></div></div>
              <div className="core-footer"><div><small>CONNECTION STATE</small><strong>{backendOnline ? "ONLINE" : "OFFLINE"}</strong></div><div><small>PROCESSING</small><strong>{isLoading ? "THINKING" : backendOnline ? "READY" : "WAITING"}</strong></div><div><small>LAST CHECK</small><strong>{lastChecked}</strong></div></div>
            </section>

            <section className="tools-section"><div className="block-heading"><span>01 / SYSTEM MODULES</span><span className="muted">LIVE BACKEND STATUS</span></div><div className="module-grid">{modules.map(({ icon: Icon, name, key }) => { const status = moduleStatus(key); return <div className="module-card" key={name}><div className="module-icon"><Icon size={19} /></div><div className="module-info"><strong>{name}</strong><small>{status}</small></div><ChevronRight size={15} className="module-arrow" /></div>; })}</div></section>

            <section className="chat-section"><div className="block-heading"><span>02 / COMMAND INTERFACE</span><span className="muted">{mode.toUpperCase()} MODE // {isLoading ? "THINKING" : "READY"}</span></div>
              <div className="mode-toolbar"><div className="mode-switches"><button className={mode === "chat" ? "mode-active" : ""} onClick={() => setMode("chat")}>CHAT</button><button className={mode === "web" ? "mode-active" : ""} onClick={() => setMode("web")}><Search size={13} /> WEB</button><button className={mode === "agent" ? "mode-active" : ""} onClick={() => setMode("agent")}><Bot size={13} /> AGENT</button></div><button className={`voice-toggle ${voiceEnabled ? "enabled" : ""}`} onClick={() => setVoiceEnabled((v) => !v)} title="Toggle spoken AI responses">{voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />} SPEAK {voiceEnabled ? "ON" : "OFF"}</button></div>
              <div className="chat-window">
                {isLoadingHistory ? <div className="terminal-welcome"><Loader2 className="thinking-spinner" size={18} /><p>Restoring conversation from memory...</p></div> : messages.length === 0 ? <div className="terminal-welcome"><span className="terminal-prompt">root@mikasa:~$</span><span> Neural connection established.</span><span className="cursor">_</span><p>{backendOnline ? "MIKASA is ready. Ask a question or select a mode." : "Waiting for backend connection..."}</p></div> : messages.map((m, i) => <div className={`chat-message ${m.role === "assistant" ? "ai-message" : "user-message"} ${m.isError ? "error-message" : ""}`} key={m.id || i}><span>{m.role === "user" ? "YOU" : "MIKASA"}{m.model ? ` // ${m.model}` : ""}</span><p>{m.text}</p></div>)}
                {isLoading && <div className="chat-message ai-message"><span>MIKASA // PROCESSING</span><p><Loader2 size={15} className="thinking-spinner" /> Generating response and running approved tools...</p></div>}<div ref={chatEndRef} />
              </div>
              {chatError && <div className="chat-error">{chatError}</div>}
              <div className="command-input"><span className="input-prefix">❯</span><input ref={inputRef} value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={mode === "web" ? "Search the web or ask a current question..." : mode === "agent" ? "Describe a multi-step task for MIKASA..." : "Enter a command or ask MIKASA..."} disabled={isLoading || isLoadingHistory} /><button className={`mic-button ${isListening ? "listening" : ""}`} onClick={startVoiceInput} title="Voice input"><Mic size={17} /></button><button className="send-button" onClick={() => sendMessage()} disabled={isLoading || !prompt.trim() || !backendOnline}>{isLoading ? <>THINKING <Loader2 size={15} className="thinking-spinner" /></> : <>EXECUTE <Send size={15} /></>}</button></div>
              <div className="input-hint">PRESS ENTER TO TRANSMIT <span>///</span> {SpeechRecognition ? "VOICE INPUT AVAILABLE" : "VOICE INPUT NOT SUPPORTED IN THIS BROWSER"}</div>
              {messages.length > 0 && <button className="clear-chat-button" onClick={startNewConversation}><Plus size={13} /> NEW CONVERSATION</button>}
            </section>

            {activeNav === "Memory Core" && <section className="feature-panel"><div className="block-heading"><span>03 / LONG-TERM MEMORY</span><span className="muted">PERSISTENT SQLITE FACTS</span></div><div className="memory-entry"><input value={memoryInput} onChange={(e) => setMemoryInput(e.target.value)} placeholder="Save a fact MIKASA should remember..." /><button onClick={saveMemory} disabled={!memoryInput.trim()}><Check size={14} /> SAVE MEMORY</button></div><div className="memory-search"><input value={memoryQuery} onChange={(e) => setMemoryQuery(e.target.value)} placeholder="Filter saved memories..." /><button onClick={() => refreshMemories(memoryQuery)}><Search size={14} /></button></div><div className="memory-list">{memories.map((m) => <div className="memory-row" key={m.id}><div><strong>{m.content}</strong><small>{m.category} // {new Date(m.created_at).toLocaleString()}</small></div><button onClick={() => removeMemory(m.id)} title="Delete memory"><Trash2 size={14} /></button></div>)}{memories.length === 0 && <p className="empty-archive">No saved facts yet. You can also tell MIKASA: “Remember that ...”</p>}</div></section>}

            {activeNav === "Document Intelligence" && <section className="feature-panel document-panel">
              <div className="block-heading"><span>03 / DOCUMENT INTELLIGENCE</span><span className="muted">LOCAL SQLITE KNOWLEDGE BASE</span></div>
              <p className="feature-description">Upload PDF, Word or text files. MIKASA extracts readable text, indexes sections locally and answers questions using matching excerpts from your documents.</p>
              <div className="document-upload">
                <input ref={documentInputRef} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={handleDocumentUpload} hidden />
                <button onClick={() => documentInputRef.current?.click()} disabled={documentBusy}><Plus size={15} /> {documentBusy ? "PROCESSING..." : "UPLOAD DOCUMENT"}</button>
                <span>PDF / DOCX / TXT · MAX 15 MB</span>
              </div>
              <div className="document-list">
                <div className="document-list-heading"><strong>KNOWLEDGE BASE</strong><small>{documents.length} DOCUMENT{documents.length === 1 ? "" : "S"}</small></div>
                {documents.map((doc) => <div className="document-row" key={doc.id}>
                  <label><input type="checkbox" checked={selectedDocumentIds.includes(doc.id)} onChange={(e) => setSelectedDocumentIds((ids) => e.target.checked ? [...ids, doc.id] : ids.filter((x) => x !== doc.id))} /><span><strong>{doc.filename}</strong><small>{doc.file_type} · {(doc.file_size / 1024).toFixed(1)} KB · {doc.chunk_count} sections · {new Date(doc.created_at).toLocaleDateString()}</small></span></label>
                  <button onClick={() => removeDocument(doc.id)} title="Delete document"><Trash2 size={14} /></button>
                </div>)}
                {documents.length === 0 && <p className="empty-archive">No documents indexed yet. Upload a PDF, DOCX or TXT file to begin.</p>}
              </div>
              <div className="document-question">
                <div className="document-list-heading"><strong>ASK YOUR DOCUMENTS</strong><small>{selectedDocumentIds.length ? `${selectedDocumentIds.length} SELECTED` : "SEARCH ALL DOCUMENTS"}</small></div>
                <textarea value={documentQuestion} onChange={(e) => setDocumentQuestion(e.target.value)} placeholder="Ask a question or request a summary of your uploaded documents..." rows={3} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); queryDocuments(); } }} />
                <button onClick={queryDocuments} disabled={documentBusy || !documentQuestion.trim() || documents.length === 0}>{documentBusy ? <><Loader2 size={14} className="thinking-spinner" /> ANALYZING...</> : <><Search size={14} /> ASK MIKASA</>}</button>
              </div>
              {documentMessage && <p className="action-message">{documentMessage}</p>}
              {documentAnswer && <div className="document-answer"><div className="document-list-heading"><strong>MIKASA ANALYSIS</strong><small>{documentAnswer.model}</small></div><p>{documentAnswer.answer}</p><div className="document-sources"><strong>SOURCE EXCERPTS</strong>{documentAnswer.sources.map((source, index) => <small key={`${source.document_id}-${source.location}-${index}`}>[{index + 1}] {source.filename} — {source.location}</small>)}</div></div>}
            </section>}

            {activeNav === "Command Terminal" && <section className="feature-panel"><div className="block-heading"><span>03 / APPROVED LOCAL ACTIONS</span><span className="muted">CONFIRMATION REQUIRED</span></div><p className="feature-description">MIKASA can launch a small allowlist of Windows applications. Each action asks for confirmation before it runs.</p><div className="action-grid">{[["vscode", "Visual Studio Code"], ["notepad", "Notepad"], ["calculator", "Calculator"], ["explorer", "File Explorer"], ["paint", "Paint"]].map(([id, label]) => <button key={id} onClick={() => launchApp(id)}><Monitor size={16} />{label}<ExternalLink size={13} /></button>)}</div><div className="memory-entry"><input value={webQuery} onChange={(e) => setWebQuery(e.target.value)} placeholder="https://example.com" /><button onClick={launchUrl} disabled={!webQuery.trim()}><ExternalLink size={14} /> OPEN URL</button></div>{actionMessage && <p className="action-message">{actionMessage}</p>}</section>}

            {activeNav === "Security" && <section className="feature-panel"><div className="block-heading"><span>03 / SECURITY PROTOCOL</span><span className="muted">LOCAL-FIRST CONTROLS</span></div><ul className="security-list"><li>Windows actions are limited to an explicit application allowlist.</li><li>Launching an app or opening a URL requires a confirmation prompt.</li><li>Agent mode only runs read-only web search, memory search and arithmetic tools.</li><li>No unrestricted shell, arbitrary file deletion or background surveillance is exposed.</li><li>Voice recognition is handled by your browser after you press the microphone button.</li></ul></section>}

            {activeNav === "Configuration" && <section className="feature-panel"><div className="block-heading"><span>03 / CONFIGURATION</span><span className="muted">LOCAL MODEL</span></div><div className="config-row"><span>OLLAMA MODEL</span><strong>{systemStatus.model || "qwen2.5:3b"}</strong></div><div className="config-row"><span>BACKEND</span><strong>http://127.0.0.1:8000</strong></div><div className="config-row"><span>VOICE OUTPUT</span><strong>{voiceEnabled ? "ENABLED" : "DISABLED"}</strong></div><div className="config-row"><span>WEB SEARCH</span><strong>{moduleStatus("web_research")}</strong></div></section>}
          </section>

          <aside className="right-panel"><div className="panel-title"><span>LIVE TELEMETRY</span><Activity size={16} /></div><div className="telemetry-card"><small><Cpu size={14} /> PROCESSOR LOAD</small><div className="metric">--<span>%</span></div><div className="meter"><i style={{ width: "0%" }} /></div><small className="metric-note">HARDWARE TELEMETRY NOT CONNECTED</small></div><div className="telemetry-card"><small><Database size={14} /> MEMORY ARCHIVE</small><div className="metric">{memories.length}<span> facts</span></div><div className="meter blue"><i style={{ width: `${Math.min(memories.length * 5, 100)}%` }} /></div><small className="metric-note">LONG-TERM FACTS STORED</small></div><div className="telemetry-card"><small><Zap size={14} /> API RESPONSE TIME</small><div className="metric">{latency ?? "--"}<span> ms</span></div><div className="metric-note">BACKEND HEALTH CHECK</div></div><div className="activity-card"><div className="panel-title">SYSTEM LOG<Terminal size={15} /></div><div className="log-line"><span>MIKASA</span> FRONTEND INITIALIZED</div><div className="log-line"><span>API</span> CONNECTION MONITOR ACTIVE</div><div className="log-line"><span>MEMORY</span> SQLITE LONG-TERM STORE</div><div className="log-line"><span>WEB</span> {moduleStatus("web_research")}</div><div className={`log-line ${backendOnline ? "log-success" : ""}`}><span>STATUS</span> {backendOnline ? "BACKEND CONNECTED" : "BACKEND OFFLINE"}</div><div className="log-line"><span>CHECK</span> {lastChecked}</div></div><div className="security-card"><Shield size={19} /><div><strong>SECURITY PROTOCOL</strong><small>CONFIRMATION-GATED ACTIONS</small></div><span className="live-dot" /></div></aside>
        </div>
        <footer className="footer"><span>MIKASA INTELLIGENCE SYSTEMS</span><span>THINK. UNDERSTAND. PLAN. EXECUTE.</span><span>{backendOnline ? "BACKEND CONNECTED" : "BACKEND DISCONNECTED"}<i /></span></footer>
      </main>
    </div>
  );
}

export default App;
