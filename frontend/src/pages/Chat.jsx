import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Chat = () => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [extractingId, setExtractingId] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/documents");
      setDocuments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm("Delete this document and all its memory?")) return;

    setDeletingId(docId);
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExtract = async (docId) => {
    setExtractingId(docId);
    try {
      const res = await api.post(`/memories/extract/${docId}`);
      const { created, updated, extended, duplicates, conflicts } = res.data.data;
      const parts = [];
      if (created) parts.push(`${created} new`);
      if (updated) parts.push(`${updated} updated`);
      if (extended) parts.push(`${extended} extended`);
      if (duplicates) parts.push(`${duplicates} duplicate`);
      if (conflicts) parts.push(`${conflicts} conflict${conflicts > 1 ? "s" : ""}`);
      alert(parts.length ? `Memory extracted: ${parts.join(", ")}` : "No memory-worthy facts found.");
    } catch (err) {
      alert(err.response?.data?.message || "Extraction failed");
    } finally {
      setExtractingId(null);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const res = await api.post("/chat", { query: userMessage.text });
      const { answer, sources } = res.data.data;
      setMessages((prev) => [...prev, { role: "assistant", text: answer, sources }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong. Please try again.", error: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-ink">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-border flex flex-col shrink-0">
        <div className="p-5 border-b border-border flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted mb-0.5">Memory OS</p>
            <p className="font-serif text-lg text-text truncate">{user?.name}</p>
          </div>
          <Link
            to="/memories"
            className="text-xs text-accent hover:underline shrink-0 mt-1"
          >
            Memory
          </Link>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted">Documents</p>
            <label className="text-xs text-accent hover:underline cursor-pointer">
              {uploading ? "Uploading..." : "+ Add"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {documents.length === 0 ? (
            <p className="text-sm text-muted/60 leading-relaxed">
              No documents yet. Add a PDF, DOCX, or TXT file to start building memory.
            </p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc._id}
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-text truncate">{doc.originalName}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {doc.status === "chunked"
                          ? `${doc.chunkCount} chunks`
                          : doc.status}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(doc._id)}
                      disabled={deletingId === doc._id}
                      title="Delete document"
                      className="text-muted hover:text-red-400 transition-colors shrink-0 opacity-60 hover:opacity-100 disabled:opacity-30"
                    >
                      {deletingId === doc._id ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {doc.status === "chunked" && (
                    <button
                      onClick={() => handleExtract(doc._id)}
                      disabled={extractingId === doc._id}
                      className="text-xs text-accent hover:underline mt-2 disabled:opacity-40"
                    >
                      {extractingId === doc._id ? "Extracting..." : "Extract memory"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-5 border-t border-border">
          <button
            onClick={logout}
            className="text-sm text-muted hover:text-text transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Chat panel */}
      <main className="flex-1 flex flex-col min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 lg:px-12">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-md text-center">
                <h2 className="font-serif text-2xl text-text mb-2">
                  Ask your memory anything
                </h2>
                <p className="text-muted text-sm leading-relaxed">
                  Upload a document on the left, then ask questions about it here.
                  Answers are grounded in what you've stored.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
                  <div
                    className={
                      msg.role === "user"
                        ? "bg-accent text-ink rounded-2xl rounded-br-sm px-4 py-2.5 max-w-lg"
                        : "max-w-lg"
                    }
                  >
                    <p
                      className={
                        msg.role === "user"
                          ? "text-sm"
                          : `text-text text-sm leading-relaxed ${msg.error ? "text-red-400" : ""}`
                      }
                    >
                      {msg.text}
                    </p>
                    {msg.sources?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.sources.map((s, j) => (
                          <span
                            key={j}
                            className="text-xs text-muted bg-surface border border-border rounded-full px-2.5 py-1"
                          >
                            Source {j + 1} · {Math.round(s.score * 100)}%
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <p className="text-sm text-muted animate-pulse">Thinking...</p>
              )}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSend}
          className="border-t border-border p-4 lg:p-6"
        >
          <div className="max-w-2xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-accent text-ink font-medium rounded-lg px-5 py-2.5 hover:bg-accent/90 transition-colors disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Chat;