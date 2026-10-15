import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const categoryColors = {
  identity: "bg-blue-400/10 text-blue-300 border-blue-400/20",
  skill: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  project: "bg-purple-400/10 text-purple-300 border-purple-400/20",
  preference: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  relationship: "bg-pink-400/10 text-pink-300 border-pink-400/20",
  goal: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  event: "bg-orange-400/10 text-orange-300 border-orange-400/20",
  raw: "bg-surface text-muted border-border",
};

const Memories = () => {
  const [memories, setMemories] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const fetchData = async () => {
    try {
      const [memRes, confRes] = await Promise.all([
        api.get("/memories"),
        api.get("/memories/conflicts"),
      ]);
      setMemories(memRes.data.data);
      setConflicts(confRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async (conflictId, resolution) => {
    setResolvingId(conflictId);
    try {
      await api.post(`/memories/conflicts/${conflictId}/resolve`, { resolution });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resolve conflict");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted mb-0.5">Memory OS</p>
          <h1 className="font-serif text-xl text-text">Your memory</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/timeline" className="text-sm text-accent hover:underline">
            History
          </Link>
          <Link to="/graph" className="text-sm text-accent hover:underline">
            Knowledge graph
          </Link>
          <Link to="/chat" className="text-sm text-accent hover:underline">
            Back to chat
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-muted text-sm">Loading...</p>
        ) : (
          <>
            {conflicts.length > 0 && (
              <section className="mb-10">
                <h2 className="font-serif text-lg text-text mb-1">
                  Needs your review
                </h2>
                <p className="text-sm text-muted mb-4">
                  These new facts conflict with something already stored. Choose which to keep.
                </p>
                <div className="space-y-3">
                  {conflicts.map((c) => (
                    <div
                      key={c._id}
                      className="bg-surface border border-amber-400/30 rounded-lg p-4"
                    >
                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div className="bg-ink/50 border border-border rounded-md p-3">
                          <p className="text-xs text-muted mb-1">Existing</p>
                          <p className="text-sm text-text">{c.existingMemory?.text}</p>
                        </div>
                        <div className="bg-ink/50 border border-border rounded-md p-3">
                          <p className="text-xs text-muted mb-1">New</p>
                          <p className="text-sm text-text">{c.newFactText}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted/80 italic mb-3">{c.reasoning}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleResolve(c._id, "kept_old")}
                          disabled={resolvingId === c._id}
                          className="text-xs border border-border rounded-full px-3 py-1.5 text-text hover:border-accent transition-colors disabled:opacity-40"
                        >
                          Keep existing
                        </button>
                        <button
                          onClick={() => handleResolve(c._id, "kept_new")}
                          disabled={resolvingId === c._id}
                          className="text-xs border border-border rounded-full px-3 py-1.5 text-text hover:border-accent transition-colors disabled:opacity-40"
                        >
                          Keep new
                        </button>
                        <button
                          onClick={() => handleResolve(c._id, "kept_both")}
                          disabled={resolvingId === c._id}
                          className="text-xs border border-border rounded-full px-3 py-1.5 text-text hover:border-accent transition-colors disabled:opacity-40"
                        >
                          Keep both
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="font-serif text-lg text-text mb-4">
                Stored memory ({memories.length})
              </h2>
              {memories.length === 0 ? (
                <p className="text-sm text-muted">
                  No memories extracted yet. Upload a document and extract memory from it.
                </p>
              ) : (
                <div className="space-y-2">
                  {memories.map((m) => (
                    <div
                      key={m._id}
                      className="bg-surface border border-border rounded-lg px-4 py-3 flex items-start justify-between gap-3"
                    >
                      <p className="text-sm text-text">{m.text}</p>
                      <span
                        className={`text-xs border rounded-full px-2.5 py-1 shrink-0 ${
                          categoryColors[m.category] || categoryColors.raw
                        }`}
                      >
                        {m.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Memories;