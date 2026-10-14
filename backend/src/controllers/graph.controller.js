import Entity from "../models/Entity.js";
import Relationship from "../models/Relationship.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @route GET /api/graph
// Returns the full graph (nodes + edges) for this user, ready for visualization
export const getGraph = asyncHandler(async (req, res) => {
  const entities = await Entity.find({ user: req.user._id });
  const relationships = await Relationship.find({ user: req.user._id })
    .populate("source", "name type")
    .populate("target", "name type");

  const nodes = entities.map((e) => ({
    id: e._id,
    name: e.name,
    type: e.type,
  }));

  const edges = relationships
    .filter((r) => r.source && r.target) // guard against orphaned refs
    .map((r) => ({
      id: r._id,
      source: r.source._id,
      target: r.target._id,
      label: r.label,
    }));

  res.json({ success: true, data: { nodes, edges } });
});

// @route GET /api/graph/entity/:id
// Returns one entity with all its direct relationships (1-hop neighborhood)
export const getEntityNeighborhood = asyncHandler(async (req, res) => {
  const entity = await Entity.findOne({ _id: req.params.id, user: req.user._id });
  if (!entity) {
    res.status(404);
    throw new Error("Entity not found");
  }

  const outgoing = await Relationship.find({ user: req.user._id, source: entity._id }).populate(
    "target",
    "name type"
  );
  const incoming = await Relationship.find({ user: req.user._id, target: entity._id }).populate(
    "source",
    "name type"
  );

  res.json({
    success: true,
    data: {
      entity,
      outgoing: outgoing.map((r) => ({ label: r.label, entity: r.target })),
      incoming: incoming.map((r) => ({ label: r.label, entity: r.source })),
    },
  });
});