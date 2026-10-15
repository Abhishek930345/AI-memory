import Entity from "../models/Entity.js";
import Relationship from "../models/Relationship.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Finds entities mentioned in the query, then walks the graph up to maxHops away
// and returns the relationships found as readable fact strings.
export const getGraphContext = async (userId, query, maxHops = 2) => {
  const entities = await Entity.find({ user: userId }).select("name type");

  // Whole-word, case-insensitive match so "Git" doesn't match "digital"
  const matched = entities.filter((e) =>
    new RegExp(`(^|\\W)${escapeRegex(e.name)}(\\W|$)`, "i").test(query)
  );

  if (matched.length === 0) return { facts: [], matchedEntities: [] };

  const visited = new Set(matched.map((e) => String(e._id)));
  let frontier = matched.map((e) => e._id);
  const facts = new Set();

  for (let hop = 0; hop < maxHops && frontier.length > 0; hop++) {
    const relationships = await Relationship.find({
      user: userId,
      $or: [{ source: { $in: frontier } }, { target: { $in: frontier } }],
    })
      .populate("source", "name")
      .populate("target", "name");

    const next = [];

    for (const r of relationships) {
      if (!r.source || !r.target) continue;
      facts.add(`${r.source.name} --${r.label}--> ${r.target.name}`);

      for (const node of [r.source, r.target]) {
        const id = String(node._id);
        if (!visited.has(id)) {
          visited.add(id);
          next.push(node._id);
        }
      }
    }

    frontier = next;
  }

  return {
    facts: Array.from(facts).slice(0, 40), // cap so the prompt stays small
    matchedEntities: matched.map((e) => e.name),
  };
};