import mongoose from "mongoose";
import Chunk from "../models/Chunk.js";
import { generateEmbedding } from "../services/embedding.service.js";
import { generateAnswer } from "../services/llm.service.js";
import { getGraphContext } from "../services/graph.retrieval.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @route POST /api/chat
export const chatWithMemory = asyncHandler(async (req, res) => {
  const { query, limit = 5 } = req.body;

  if (!query) {
    res.status(400);
    throw new Error("Query text is required");
  }

  const queryEmbedding = await generateEmbedding(query);

  // Run vector retrieval and graph traversal in parallel
  const [retrievedChunks, graphContext] = await Promise.all([
    Chunk.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: Number(limit),
          filter: { user: new mongoose.Types.ObjectId(req.user._id) },
        },
      },
      {
        $project: {
          text: 1,
          document: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]),
    getGraphContext(req.user._id, query),
  ]);

  if (retrievedChunks.length === 0 && graphContext.facts.length === 0) {
    return res.json({
      success: true,
      data: {
        answer: "I don't have any relevant memories stored yet to answer this.",
        sources: [],
        graph: { entities: [], facts: [] },
      },
    });
  }

  const answer = await generateAnswer(query, retrievedChunks, graphContext.facts);

  res.json({
    success: true,
    data: {
      answer,
      sources: retrievedChunks.map((c) => ({
        document: c.document,
        text: c.text,
        score: c.score,
      })),
      graph: {
        entities: graphContext.matchedEntities,
        facts: graphContext.facts,
      },
    },
  });
});