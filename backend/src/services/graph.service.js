import Entity from "../models/Entity.js";
import Relationship from "../models/Relationship.js";
import { extractGraph } from "./graph.llm.service.js";

// Finds or creates an entity by name+type for this user (case-insensitive match)
const findOrCreateEntity = async (userId, name, type, memoryId) => {
  const normalizedName = name.trim();

  let entity = await Entity.findOne({
    user: userId,
    name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });

  if (!entity) {
    entity = await Entity.create({
      user: userId,
      name: normalizedName,
      type: type || "other",
      sourceMemory: memoryId,
    });
  }

  return entity;
};

// Processes one memory's text: extracts entities/relationships and stores the graph
export const processGraphForMemory = async (memory) => {
  const { entities, relationships } = await extractGraph(memory.text);

  const entityMap = {}; // name -> Entity doc, for linking relationships

  for (const e of entities) {
    const entity = await findOrCreateEntity(memory.user, e.name, e.type, memory._id);
    entityMap[e.name.toLowerCase()] = entity;
  }

  let relationshipCount = 0;

  for (const r of relationships) {
    const source = entityMap[r.source.toLowerCase()] || (await findOrCreateEntity(memory.user, r.source, "other", memory._id));
    const target = entityMap[r.target.toLowerCase()] || (await findOrCreateEntity(memory.user, r.target, "other", memory._id));

    try {
      await Relationship.create({
        user: memory.user,
        source: source._id,
        target: target._id,
        label: r.label,
        sourceMemory: memory._id,
      });
      relationshipCount++;
    } catch (err) {
      // Duplicate relationship (unique index) — skip silently
      if (err.code !== 11000) throw err;
    }
  }

  return { entitiesCreated: entities.length, relationshipsCreated: relationshipCount };
};