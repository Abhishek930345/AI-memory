import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const typeColors = {
  person: "#E8B84B",
  project: "#8B90A0",
  technology: "#6EA8DE",
  organization: "#7CC68F",
  skill: "#D98B6E",
  concept: "#B88BD9",
  other: "#8B90A0",
};

const Graph = () => {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    api
      .get("/graph")
      .then((res) => {
        const data = res.data.data;
        setGraph(data);
        // Simple circular initial layout, then relax with basic force simulation
        const width = 800;
        const height = 600;
        const initial = {};
        data.nodes.forEach((n, i) => {
          const angle = (i / data.nodes.length) * 2 * Math.PI;
          initial[n.id] = {
            x: width / 2 + Math.cos(angle) * 220,
            y: height / 2 + Math.sin(angle) * 220,
          };
        });
        setPositions(runForceLayout(data.nodes, data.edges, initial));
      })
      .finally(() => setLoading(false));
  }, []);

  // Basic force-directed layout: repel all nodes, attract connected ones, run N iterations
  const runForceLayout = (nodes, edges, initial) => {
    const pos = { ...initial };
    const width = 800;
    const height = 600;

    for (let iter = 0; iter < 300; iter++) {
      const forces = {};
      nodes.forEach((n) => (forces[n.id] = { x: 0, y: 0 }));

      // Repulsion between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i].id;
          const b = nodes[j].id;
          const dx = pos[a].x - pos[b].x;
          const dy = pos[a].y - pos[b].y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 2000 / (dist * dist);
          forces[a].x += (dx / dist) * force;
          forces[a].y += (dy / dist) * force;
          forces[b].x -= (dx / dist) * force;
          forces[b].y -= (dy / dist) * force;
        }
      }

      // Attraction along edges
      edges.forEach((e) => {
        const dx = pos[e.target].x - pos[e.source].x;
        const dy = pos[e.target].y - pos[e.source].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = dist * 0.01;
        forces[e.source].x += (dx / dist) * force;
        forces[e.source].y += (dy / dist) * force;
        forces[e.target].x -= (dx / dist) * force;
        forces[e.target].y -= (dy / dist) * force;
      });

      nodes.forEach((n) => {
        pos[n.id].x += forces[n.id].x * 0.1;
        pos[n.id].y += forces[n.id].y * 0.1;
        pos[n.id].x = Math.max(40, Math.min(width - 40, pos[n.id].x));
        pos[n.id].y = Math.max(40, Math.min(height - 40, pos[n.id].y));
      });
    }

    return pos;
  };

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted mb-0.5">Memory OS</p>
          <h1 className="font-serif text-xl text-text">Knowledge graph</h1>
        </div>
        <Link to="/chat" className="text-sm text-accent hover:underline">
          Back to chat
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-muted text-sm">Loading...</p>
        ) : graph.nodes.length === 0 ? (
          <p className="text-muted text-sm">
            No graph data yet. Extract memory from a document first.
          </p>
        ) : (
          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <svg ref={svgRef} viewBox="0 0 800 600" className="w-full h-auto">
                {graph.edges.map((e) => {
                  const s = positions[e.source];
                  const t = positions[e.target];
                  if (!s || !t) return null;
                  const midX = (s.x + t.x) / 2;
                  const midY = (s.y + t.y) / 2;
                  return (
                    <g key={e.id}>
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke="#262B36"
                        strokeWidth="1.5"
                      />
                      <text
                        x={midX}
                        y={midY}
                        fill="#8B90A0"
                        fontSize="9"
                        textAnchor="middle"
                        className="pointer-events-none"
                      >
                        {e.label}
                      </text>
                    </g>
                  );
                })}
                {graph.nodes.map((n) => {
                  const p = positions[n.id];
                  if (!p) return null;
                  return (
                    <g
                      key={n.id}
                      onClick={() => setSelected(n)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={selected?.id === n.id ? 10 : 7}
                        fill={typeColors[n.type] || typeColors.other}
                        stroke={selected?.id === n.id ? "#EDEEF0" : "none"}
                        strokeWidth="2"
                      />
                      <text
                        x={p.x}
                        y={p.y - 14}
                        fill="#EDEEF0"
                        fontSize="11"
                        textAnchor="middle"
                      >
                        {n.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div>
              <p className="text-sm text-muted mb-3">
                {graph.nodes.length} entities · {graph.edges.length} relationships
              </p>
              {selected ? (
                <div className="bg-surface border border-border rounded-lg p-4">
                  <p
                    className="text-xs uppercase tracking-wide mb-1"
                    style={{ color: typeColors[selected.type] }}
                  >
                    {selected.type}
                  </p>
                  <p className="font-serif text-lg text-text mb-3">{selected.name}</p>
                  <p className="text-xs text-muted mb-2">Connections</p>
                  <ul className="space-y-1">
                    {graph.edges
                      .filter((e) => e.source === selected.id || e.target === selected.id)
                      .map((e) => {
                        const isSource = e.source === selected.id;
                        const otherId = isSource ? e.target : e.source;
                        const other = graph.nodes.find((n) => n.id === otherId);
                        return (
                          <li key={e.id} className="text-sm text-text">
                            <span className="text-muted">{e.label}</span>{" "}
                            {other?.name || "?"}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted/60">
                  Click a node to see its connections.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Graph;