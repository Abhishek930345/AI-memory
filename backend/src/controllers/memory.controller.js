import Document from "../models/Document.js";
import Chunk from "../models/Chunk.js";
import Memory from "../models/Memory.js";
import MemoryConflict from "../models/MemoryConflict.js";
import { extractFacts } from "../services/extraction.llm.service.js";
import { processFact } from "../services/memory.service.js";
import { processGraphForMemory } from "../services/graph.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @route POST /api/memories/extract/:documentId
// Runs extraction on all chunks of a document, processes each fact, and builds the knowledge graph
export const extractFromDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOne({ _id: req.params.documentId, user: req.user._id });
  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  const chunks = await Chunk.find({ document: document._id }).sort({ chunkIndex: 1 });

  const summary = {
    created: 0,
    updated: 0,
    extended: 0,
    duplicates: 0,
    conflicts: 0,
    entities: 0,
    relationships: 0,
  };

  for (const chunk of chunks) {
    const facts = await extractFacts(chunk.text);

    for (const fact of facts) {
      if (fact.confidence < 0.5) continue; // filter low-confidence noise early

      const result = await processFact({
        userId: req.user._id,
        projectId: document.project,
        documentId: document._id,
        fact,
      });

      if (result.action === "created") {
        summary.created++;
        const graphResult = await processGraphForMemory(result.memory);
        summary.entities += graphResult.entitiesCreated;
        summary.relationships += graphResult.relationshipsCreated;
      } else if (result.action === "update") {
        summary.updated++;
        const graphResult = await processGraphForMemory(result.memory);
        summary.entities += graphResult.entitiesCreated;
        summary.relationships += graphResult.relationshipsCreated;
      } else if (result.action === "extension") {
        summary.extended++;
        const graphResult = await processGraphForMemory(result.memory);
        summary.entities += graphResult.entitiesCreated;
        summary.relationships += graphResult.relationshipsCreated;
      } else if (result.action === "duplicate_skipped") {
        summary.duplicates++;
      } else if (result.action === "conflict_flagged") {
        summary.conflicts++;
      }
    }
  }

  res.json({ success: true, data: summary });
});

// @route GET /api/memories
export const listMemories = asyncHandler(async (req, res) => {
  const memories = await Memory.find({ user: req.user._id, status: "active" })
    .sort({ createdAt: -1 })
    .select("-embedding");
  res.json({ success: true, data: memories });
});

// @route GET /api/memories/conflicts
export const listConflicts = asyncHandler(async (req, res) => {
  const conflicts = await MemoryConflict.find({ user: req.user._id, status: "pending" })
    .populate("existingMemory", "text category")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: conflicts });
});

// @route POST /api/memories/conflicts/:id/resolve
export const resolveConflict = asyncHandler(async (req, res) => {
  const { resolution } = req.body; // "kept_old" | "kept_new" | "kept_both"

  if (!["kept_old", "kept_new", "kept_both"].includes(resolution)) {
    res.status(400);
    throw new Error("Invalid resolution value");
  }

  const conflict = await MemoryConflict.findOne({ _id: req.params.id, user: req.user._id });
  if (!conflict) {
    res.status(404);
    throw new Error("Conflict not found");
  }

  if (resolution === "kept_new" || resolution === "kept_both") {
    const { generateEmbedding } = await import("../services/embedding.service.js");
    const embedding = await generateEmbedding(conflict.newFactText);

    const newMemory = await Memory.create({
      user: req.user._id,
      project: (await Memory.findById(conflict.existingMemory)).project,
      text: conflict.newFactText,
      category: conflict.newFactCategory,
      confidence: conflict.newFactConfidence,
      embedding,
    });

    await processGraphForMemory(newMemory);

    if (resolution === "kept_new") {
      const oldMemory = await Memory.findById(conflict.existingMemory);
      if (oldMemory) {
        oldMemory.status = "superseded";
        await oldMemory.save();
      }
    }
  }
  // "kept_old" — do nothing to existing memory, just resolve the conflict

  conflict.status = "resolved";
  conflict.resolution = resolution;
  await conflict.save();

  res.json({ success: true, data: conflict });
});