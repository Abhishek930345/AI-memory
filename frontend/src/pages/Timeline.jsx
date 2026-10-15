import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const Timeline = () => {
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/memories/timeline")
      .then((res) => setChains(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted mb-0.5">Memory OS</p>
          <h1 className="font-serif text-xl text-text">How your memory changed</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/memories" className="text-sm text-accent hover:underline">
            Memory
          </Link>
          <Link to="/chat" className="text-sm text-accent hover:underline">
            Back to chat
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-muted text-sm">Loading...</p>
        ) : chains.length === 0 ? (
          <p className="text-muted text-sm leading-relaxed">
            Nothing has changed yet. When a stored fact is updated or replaced,
            its history appears here.
          </p>
        ) : (
          <div className="space-y-10">
            {chains.map((chain, i) => (
              <section key={i}>
                <ol className="relative border-l border-border ml-2 space-y-6">
                  {chain.map((m, j) => {
                    const isCurrent = m.status === "active";
                    return (
                      <li key={m.id} className="pl-6 relative">
                        <span
                          className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${
                            isCurrent ? "bg-accent" : "bg-border"
                          }`}
                        />
                        <p className="text-xs text-muted mb-1">
                          {formatDate(m.createdAt)}
                          {isCurrent
                            ? " · current"
                            : j === 0
                            ? " · first stored"
                            : ""}
                        </p>
                        <p
                          className={`text-sm leading-relaxed ${
                            isCurrent ? "text-text" : "text-muted line-through decoration-border"
                          }`}
                        >
                          {m.text}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;