import mongoose from "mongoose";
import Memory from "../models/Memory.js";
import MemoryConflict from "../models/MemoryConflict.js";
import { generateEmbedding } from "./embedding.service.js";
import { classifyRelationship } from "./contradiction.llm.service.js";

const SIMILARITY_THRESHOLD = 0.75; // only compare facts that are already semantically close

// Finds the closest existing active memory for this user, if similar enough
const findSimilarMemory = async (userId, factEmbedding) => {
  const results = await Memory.aggregate([
    {
      $vectorSearch: {
        index: "memory_vector_index",
        path: "embedding",
        queryVector: factEmbedding,
        numCandidates: 50,
        limit: 1,
        filter: {
          user: new mongoose.Types.ObjectId(userId),
          status: "active",
        },
      },
    },
    {
      $project: {
        text: 1,
        category: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  if (results.length === 0 || results[0].score < SIMILARITY_THRESHOLD) return null;
  return results[0];
};

// Processes one extracted fact: decides whether to create, update, merge, or flag conflict
export const processFact = async ({ userId, projectId, documentId, fact }) => {
  const embedding = await generateEmbedding(fact.text);
  const similar = await findSimilarMemory(userId, embedding);

  // No similar memory exists — just create a new one
  if (!similar) {
    const memory = await Memory.create({
      user: userId,
      project: projectId,
      text: fact.text,
      category: fact.category || "raw",
      confidence: fact.confidence ?? 1,
      sourceSpan: documentId ? String(documentId) : "",
      embedding,
    });
    return { action: "created", memory };
  }

  // Similar memory found — classify the relationship
  const classification = await classifyRelationship(similar.text, fact.text);

  switch (classification.relationship) {
    case "duplicate":
      return { action: "duplicate_skipped", existingId: similar._id };

    case "extension":
    case "update": {
      const mergedText = classification.merged_fact || fact.text;
      const mergedEmbedding = await generateEmbedding(mergedText);

      const oldMemory = await Memory.findById(similar._id);
      oldMemory.status = "superseded";
      await oldMemory.save();

      const newMemory = await Memory.create({
        user: userId,
        project: projectId,
        text: mergedText,
        category: fact.category || oldMemory.category,
        confidence: fact.confidence ?? 1,
        sourceSpan: documentId ? String(documentId) : "",
        embedding: mergedEmbedding,
      });

      oldMemory.supersededBy = newMemory._id;
      await oldMemory.save();

      return { action: classification.relationship, memory: newMemory, supersededId: oldMemory._id };
    }

    case "contradiction": {
      const conflict = await MemoryConflict.create({
        user: userId,
        existingMemory: similar._id,
        newFactText: fact.text,
        newFactCategory: fact.category || "raw",
        newFactConfidence: fact.confidence ?? 1,
        sourceDocument: documentId,
        reasoning: classification.reasoning,
      });
      return { action: "conflict_flagged", conflict };
    }

    default: // unrelated — treat as new
      const memory = await Memory.create({
        user: userId,
        project: projectId,
        text: fact.text,
        category: fact.category || "raw",
        confidence: fact.confidence ?? 1,
        sourceSpan: documentId ? String(documentId) : "",
        embedding,
      });
      return { action: "created", memory };
  }
};